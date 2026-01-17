-- Add organizational hierarchy support to accounts table
-- Migration: 20240101000006_add_organizational_hierarchy_to_accounts.sql

-- Add admin_user_id column to link customer accounts to their admin
ALTER TABLE accounts
ADD COLUMN admin_user_id UUID,
ADD COLUMN user_role VARCHAR(20) DEFAULT 'CUSTOMER';

-- Add foreign key constraint (self-referencing to users table would be ideal, but we're in accounts service)
-- We'll rely on application-level validation for referential integrity

-- Add constraint to ensure customer accounts have an admin_user_id
ALTER TABLE accounts
ADD CONSTRAINT chk_customer_has_admin
CHECK (
    (user_role = 'ADMIN' AND admin_user_id IS NULL) OR
    (user_role = 'CUSTOMER' AND admin_user_id IS NOT NULL) OR
    (user_role = 'SERVICE')
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_accounts_admin_user ON accounts(admin_user_id)
WHERE admin_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_accounts_user_role ON accounts(user_role);

CREATE INDEX CONCURRENTLY idx_accounts_org_env_admin ON accounts(organization_id, environment, admin_user_id)
WHERE user_role = 'CUSTOMER';

CREATE INDEX CONCURRENTLY idx_accounts_hierarchy ON accounts(user_id, admin_user_id, user_role);

-- Update existing accounts to set appropriate roles
-- All existing accounts will be treated as customer accounts initially
UPDATE accounts
SET user_role = 'CUSTOMER'
WHERE user_role IS NULL;

-- Add comment explaining the hierarchy
COMMENT ON COLUMN accounts.admin_user_id IS 'UUID of the admin user who manages this customer account. NULL for admin and service accounts.';
COMMENT ON COLUMN accounts.user_role IS 'Role of the account owner: ADMIN, CUSTOMER, or SERVICE. Determines account permissions and hierarchy.';

-- Create function to validate organizational hierarchy constraints
CREATE OR REPLACE FUNCTION validate_account_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure admin_user_id is consistent with user_role
    IF NEW.user_role = 'CUSTOMER' AND NEW.admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Customer accounts must have an admin_user_id';
    END IF;

    IF NEW.user_role = 'ADMIN' AND NEW.admin_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Admin accounts cannot have an admin_user_id';
    END IF;

    -- Prevent self-referencing admin relationships
    IF NEW.user_id = NEW.admin_user_id THEN
        RAISE EXCEPTION 'Account cannot be its own admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hierarchy validation
CREATE TRIGGER trg_validate_account_hierarchy
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION validate_account_hierarchy();

-- Add organizational context tracking
ALTER TABLE accounts
ADD COLUMN organizational_metadata JSONB DEFAULT '{}';

CREATE INDEX CONCURRENTLY idx_accounts_org_metadata_gin ON accounts
USING GIN (organizational_metadata);

-- Create view for organizational account analytics
CREATE OR REPLACE VIEW account_organizational_analytics AS
SELECT
    organization_id,
    environment,
    user_role,
    COUNT(*) as account_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT admin_user_id) as unique_admins,
    SUM(balance) as total_balance,
    AVG(balance) as average_balance,
    MIN(created_at) as earliest_account,
    MAX(created_at) as latest_account
FROM accounts
WHERE status = 'active'
GROUP BY organization_id, environment, user_role;

COMMENT ON VIEW account_organizational_analytics IS 'Organizational analytics for account hierarchy and balances';
