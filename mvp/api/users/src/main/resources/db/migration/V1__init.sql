CREATE TYPE rails_environment AS ENUM ('SANDBOX', 'PRODUCTION');
CREATE TYPE rails_user_role AS ENUM ('ADMIN', 'CUSTOMER', 'SERVICE');
CREATE TYPE rails_user_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE rails_kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    webhook_url TEXT,
    kyc_status rails_kyc_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX organizations_email_uq ON organizations (lower(email));

CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    environment rails_environment NOT NULL,
    prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX api_keys_org_env_prefix_uq ON api_keys (organization_id, environment, prefix);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    environment rails_environment NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role rails_user_role NOT NULL,
    status rails_user_status NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deactivated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX users_org_env_email_uq ON users (organization_id, environment, lower(email));
CREATE INDEX users_org_env_role_idx ON users (organization_id, environment, role);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    environment rails_environment NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_expiry_idx ON refresh_tokens (expires_at);

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY,
    organization_id UUID,
    environment rails_environment,
    idempotency_key TEXT NOT NULL,
    request_method TEXT NOT NULL,
    request_path TEXT NOT NULL,
    request_hash TEXT,
    response_status INT,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idempotency_unique_idx ON idempotency_keys (idempotency_key, request_method, request_path, environment, organization_id);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    organization_id UUID,
    environment rails_environment,
    event_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX outbox_events_unpublished_idx ON outbox_events (published_at) WHERE published_at IS NULL;
