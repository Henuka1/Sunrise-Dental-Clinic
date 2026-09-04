-- ============================================================
-- Sunrise Dental Clinic - Safe Migration for OLDER MySQL/MariaDB
-- ============================================================
-- Problem: "ALTER TABLE users ADD COLUMN IF NOT EXISTS ..."
-- throws Error 1064 because `ADD COLUMN IF NOT EXISTS` is only
-- supported in MySQL 8.0.29+ (and varies on MariaDB / older MySQL).
--
-- This script uses INFORMATION_SCHEMA to check the column first,
-- which works on MySQL 5.7+, 8.0 (any patch) and MariaDB.
--
-- RUN THIS IN: your Railway MySQL -> sunrise_dental2 database
-- ============================================================

-- ------------------------------------------------------------------
-- 1) HELPER PROCEDURE (runs once, only tests column existence)
--    Drops any existing one first so re-running is clean.
-- ------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sunrise_add_column_if_missing;

DELIMITER //

CREATE PROCEDURE sunrise_add_column_if_missing(
    IN tbl VARCHAR(64),
    IN col VARCHAR(64),
    IN col_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_NAME  = col
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- ------------------------------------------------------------------
-- 2. APPLY THE MISSING COLUMNS
-- ------------------------------------------------------------------
CALL sunrise_add_column_if_missing('users', 'permissions',
    'VARCHAR(255) DEFAULT NULL AFTER role');

CALL sunrise_add_column_if_missing('users', 'is_active',
    'BOOLEAN NOT NULL DEFAULT TRUE');

CALL sunrise_add_column_if_missing('users', 'contact_number',
    'VARCHAR(20) DEFAULT NULL');

CALL sunrise_add_column_if_missing('users', 'email',
    'VARCHAR(100) DEFAULT NULL');

CALL sunrise_add_column_if_missing('dentist_availability', 'is_available',
    'BOOLEAN NOT NULL DEFAULT TRUE');

CALL sunrise_add_column_if_missing('dentist_date_availability', 'slot_minutes',
    'INT NOT NULL DEFAULT 30');

-- ------------------------------------------------------------------
-- 3) CLEANUP: drop the helper procedure (optional, but tidy)
-- ------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sunrise_add_column_if_missing;

-- ------------------------------------------------------------------
-- 4) VERIFY the users table now has the expected columns
-- ------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
ORDER BY ordinal_position;