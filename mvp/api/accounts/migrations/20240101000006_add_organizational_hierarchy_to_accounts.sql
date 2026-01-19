-- V2__organizational_hierarchy.sql
-- Organizational hierarchy migration with ACID principles and row-level security

-- Add admin_user_id column to establish customer-admin relationships
ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES users(id);

-- Add constraints to ensure proper admin-customer relationships

-- Admin users should not have an admin
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS chk_admin_no_admin_user
CHECK (role <> 'ADMIN' OR admin_user_id IS NULL);

-- Customer users must have an admin
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS chk_customer_has_admin
CHECK (role <> 'CUSTOMER' OR admin_user_id IS NOT NULL);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_admin_customer ON users(admin_user_id)
WHERE admin_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_users_org_env_admin ON users(organization_id, environment, admin_user_id)
WHERE role = 'CUSTOMER';

-- Add organizational context column for better multi-tenancy
ALTER TABLE users
ADD COLUMN IF NOT EXISTS organizational_context JSONB DEFAULT '{}';

-- Create index on organizational context for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_org_context_gin ON users
USING GIN (organizational_context);

-- Enable Row Level Security for multi-tenant data isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins to see their own organization and customers
DROP POLICY IF EXISTS admin_access ON users;
CREATE POLICY admin_access ON users
    FOR ALL
    USING (
        (role = 'ADMIN' AND id::text = current_user) OR
        (role = 'CUSTOMER' AND admin_user_id::text = current_user) OR
        (role = 'SERVICE' AND id::text = current_user)
    );

-- Create function to get current authenticated user ID (placeholder for JWT integration)
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
BEGIN
    -- This will be replaced with actual JWT token parsing in application layer
    -- For now, return current_setting if available
    RETURN COALESCE(
        NULLIF(current_setting('app.current_user_id', TRUE), ''),
        '00000000-0000-0000-0000-000000000000'
    )::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for organizational changes
CREATE OR REPLACE FUNCTION audit_organizational_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log organizational relationship changes
    IF TG_OP = 'UPDATE' AND (
        OLD.admin_user_id IS DISTINCT FROM NEW.admin_user_id OR
        OLD.role IS DISTINCT FROM NEW.role OR
        OLD.organization_id IS DISTINCT FROM NEW.organization_id
    ) THEN
        INSERT INTO outbox_events (
            id,
            organization_id,
            environment,
            event_type,
            subject,
            payload,
            created_at
        ) VALUES (
            gen_random_uuid(),
            NEW.organization_id,
            NEW.environment,
            'USER_ORGANIZATIONAL_CHANGE',
            'users.organizational.changed',
            jsonb_build_object(
                'user_id', NEW.id,
                'old_admin_id', OLD.admin_user_id,
                'new_admin_id', NEW.admin_user_id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'organization_id', NEW.organization_id,
                'environment', NEW.environment,
                'changed_at', NOW()
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizational changes audit
DROP TRIGGER IF EXISTS trg_audit_organizational_changes ON users;
CREATE TRIGGER trg_audit_organizational_changes
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_organizational_changes();

-- Create function to validate organizational hierarchy integrity
CREATE OR REPLACE FUNCTION validate_organizational_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure admin users belong to the same organization as their customers
    IF NEW.role = 'CUSTOMER' AND NEW.admin_user_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM users
            WHERE id = NEW.admin_user_id
            AND role = 'ADMIN'
            AND organization_id = NEW.organization_id
            AND environment = NEW.environment
        ) THEN
            RAISE EXCEPTION 'Customer admin must belong to same organization and environment';
        END IF;
    END IF;

    -- Prevent circular admin relationships
    IF NEW.admin_user_id IS NOT NULL THEN
        IF EXISTS (
            WITH RECURSIVE admin_hierarchy AS (
                SELECT id, admin_user_id, 1 as level
                FROM users
                WHERE id = NEW.admin_user_id

                UNION ALL

                SELECT u.id, u.admin_user_id, ah.level + 1
                FROM users u
                INNER JOIN admin_hierarchy ah ON u.id = ah.admin_user_id
                WHERE ah.level < 10 -- Prevent infinite recursion
            )
            SELECT 1 FROM admin_hierarchy WHERE id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Circular admin relationship detected';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create constraint trigger for organizational hierarchy validation
DROP TRIGGER IF EXISTS trg_validate_organizational_hierarchy ON users;
CREATE CONSTRAINT TRIGGER trg_validate_organizational_hierarchy
    AFTER INSERT OR UPDATE ON users
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_organizational_hierarchy();

-- Add organizational metadata to existing admin users
UPDATE users
SET organizational_context = jsonb_build_object(
    'is_primary_admin', true,
    'customer_count', 0,
    'created_via', 'migration',
    'hierarchy_level', 0
)
WHERE role = 'ADMIN';

-- Update organizational context for service users
UPDATE users
SET organizational_context = jsonb_build_object(
    'service_type', 'system',
    'access_level', 'service',
    'created_via', 'migration'
)
WHERE role = 'SERVICE';

-- Create materialized view for organizational analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_organizational_analytics AS
SELECT
    organization_id,
    environment,
    COUNT(*) FILTER (WHERE role = 'ADMIN') as admin_count,
    COUNT(*) FILTER (WHERE role = 'CUSTOMER') as customer_count,
    COUNT(*) FILTER (WHERE role = 'SERVICE') as service_count,
    COUNT(*) FILTER (WHERE role = 'CUSTOMER' AND admin_user_id IS NOT NULL) as customers_with_admin,
    COUNT(*) FILTER (WHERE role = 'CUSTOMER' AND admin_user_id IS NULL) as orphaned_customers,
    MAX(created_at) as last_user_created,
    MIN(created_at) as first_user_created
FROM users
WHERE deactivated_at IS NULL
GROUP BY organization_id, environment;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_org_analytics_pk ON user_organizational_analytics(organization_id, environment);

-- Set up refresh schedule comment (to be implemented in application)
COMMENT ON MATERIALIZED VIEW user_organizational_analytics IS
'Organizational analytics view - refresh every 15 minutes via scheduled job';

-- Grant appropriate permissions for application user
GRANT SELECT, INSERT, UPDATE ON users TO PUBLIC;
GRANT SELECT ON user_organizational_analytics TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;
