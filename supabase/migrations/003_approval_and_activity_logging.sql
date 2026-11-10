-- Add approval status to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

-- Row Level Security for activity logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Only system can insert activity logs (via triggers or server-side)
CREATE POLICY "Only system can insert activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (false);

-- Update users table RLS to allow admins to approve users
CREATE POLICY "Admins can approve users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id VARCHAR(100) DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;

-- Trigger to automatically log user creation
CREATE OR REPLACE FUNCTION log_user_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        NEW.id,
        'user_created',
        'user',
        NEW.id::text,
        jsonb_build_object(
            'username', NEW.username,
            'email', NEW.email,
            'role', NEW.role,
            'approval_status', NEW.approval_status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_user_creation
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_creation();

-- Trigger to log user approval
CREATE OR REPLACE FUNCTION log_user_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.approval_status != NEW.approval_status THEN
        PERFORM log_activity(
            NEW.approved_by,
            'user_approved',
            'user',
            NEW.id::text,
            jsonb_build_object(
                'username', NEW.username,
                'previous_status', OLD.approval_status,
                'new_status', NEW.approval_status,
                'rejection_reason', NEW.rejection_reason
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_user_approval
    AFTER UPDATE OF approval_status ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_approval();
