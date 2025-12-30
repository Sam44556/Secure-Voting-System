CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS backups CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS security_labels CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS election_options CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS backup_status CASCADE;
DROP TYPE IF EXISTS alert_severity CASCADE;
DROP TYPE IF EXISTS security_label_type CASCADE;
DROP TYPE IF EXISTS election_status CASCADE;
DROP TYPE IF EXISTS otp_purpose CASCADE;

CREATE TYPE otp_purpose AS ENUM ('verification', 'mfa', 'password_reset');
CREATE TYPE election_status AS ENUM ('pending', 'active', 'closed');
CREATE TYPE security_label_type AS ENUM ('public', 'internal', 'confidential');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE backup_status AS ENUM ('success', 'failure');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,      -- login
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,        -- verification
    password_hash TEXT NOT NULL,
    date_of_birth DATE NOT NULL,               -- ABAC: age >= 18
    region VARCHAR(50) NOT NULL,               -- ABAC: region-based voting
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    purpose otp_purpose NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    failure_reason VARCHAR(100)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    election_type VARCHAR(50) NOT NULL,
    region VARCHAR(50), -- NULL for national elections
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status election_status DEFAULT 'pending',
    sensitivity_level security_label_type DEFAULT 'internal', -- MAC: internal until published
    results_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE election_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    option_text VARCHAR(200) NOT NULL,
    description TEXT,
    position INT
);

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    option_id UUID REFERENCES election_options(id) ON DELETE CASCADE,
    classification security_label_type DEFAULT 'confidential', -- MAC: votes are always confidential
    vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    UNIQUE (election_id, user_id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    UNIQUE (resource_type, resource_id, user_id, permission_type)
);

CREATE TABLE security_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    label security_label_type NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (resource_type, resource_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN,
    details JSONB
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id UUID REFERENCES audit_logs(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity alert_severity NOT NULL,
    description TEXT NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_path TEXT NOT NULL,
    status backup_status NOT NULL,
    checksum TEXT,
    details TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed basic roles
INSERT INTO roles (name, description) VALUES 
('Admin', 'Full system access'),
('Election Officer', 'Manage elections and polls'),
('Voter', 'Cast votes in eligible elections'),
('Auditor', 'Review system logs and integrity');
