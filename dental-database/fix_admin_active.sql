-- ============================================================
-- FIX: Ensure admin user is active
-- Run this against your Railway database to fix the isActive = false issue
-- ============================================================

-- Update admin user to be active
UPDATE users SET is_active = TRUE WHERE username = 'admin';

-- Verify the fix
SELECT user_id, username, full_name, role, is_active FROM users WHERE username = 'admin';

-- Also ensure all users are active by default (optional)
-- UPDATE users SET is_active = TRUE WHERE is_active = FALSE;
