-- ============================================================
-- Sunrise Dental Clinic
-- Complete Database Schema + Sample Data
-- MySQL 8.0 / MariaDB 10.4+
-- ============================================================


-- ============================================================
-- STEP 1: CREATE DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS sunrise_dental
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sunrise_dental2;


-- ============================================================
-- STEP 2: USERS TABLE
-- Authentication / Login Users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    role ENUM(
        'ADMIN',
        'RECEPTIONIST',
        'DENTIST'
    ) NOT NULL DEFAULT 'RECEPTIONIST',

    -- Comma-separated module keys this user is allowed to access.
    -- NULL = use role defaults (see DEFAULT_PERMISSIONS in backend).
    permissions VARCHAR(255) DEFAULT NULL,

    -- Soft-delete / account status flag (TRUE = active, FALSE = suspended).
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    contact_number VARCHAR(20) DEFAULT NULL,

    email VARCHAR(100) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- STEP 3: DENTISTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS dentists (
    dentist_id INT PRIMARY KEY AUTO_INCREMENT,

    dentist_name VARCHAR(100) NOT NULL,

    specialization VARCHAR(100),

    contact_number VARCHAR(20),

    email VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- STEP 4: PATIENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,

    patient_name VARCHAR(100) NOT NULL,

    address VARCHAR(255),

    contact_number VARCHAR(20) NOT NULL,

    email VARCHAR(100),

    date_of_birth DATE,

    gender ENUM(
        'MALE',
        'FEMALE',
        'OTHER'
    ),

    registered_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- STEP 5: TREATMENTS TABLE
-- Master Treatment Data
-- ============================================================

CREATE TABLE IF NOT EXISTS treatments (
    treatment_id INT PRIMARY KEY AUTO_INCREMENT,

    treatment_name VARCHAR(100) NOT NULL,

    treatment_code VARCHAR(20) NOT NULL UNIQUE,

    base_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 1500.00,

    description TEXT
) ENGINE=InnoDB;


-- ============================================================
-- STEP 6: APPOINTMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,

    appointment_number VARCHAR(20) NOT NULL UNIQUE,

    patient_id INT NOT NULL,

    dentist_id INT NOT NULL,

    treatment_id INT NOT NULL,

    appointment_date DATE NOT NULL,

    appointment_time TIME NOT NULL,

    status ENUM(
        'SCHEDULED',
        'CHECKED_IN',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW'
    ) NOT NULL DEFAULT 'SCHEDULED',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_dentist
        FOREIGN KEY (dentist_id)
        REFERENCES dentists(dentist_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_treatment
        FOREIGN KEY (treatment_id)
        REFERENCES treatments(treatment_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_appointment_date (appointment_date),

    INDEX idx_appointment_dentist_date (
        dentist_id,
        appointment_date
    ),

    INDEX idx_appointment_patient (
        patient_id
    ),

    INDEX idx_appointment_status (
        status
    )
) ENGINE=InnoDB;


-- ============================================================
-- STEP 7: BILLS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bills (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,

    appointment_id INT NOT NULL UNIQUE,

    bill_number VARCHAR(20) NOT NULL UNIQUE,

    treatment_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    additional_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    payment_status ENUM(
        'PENDING',
        'PAID',
        'PARTIAL'
    ) NOT NULL DEFAULT 'PENDING',

    payment_method ENUM(
        'CASH',
        'CARD',
        'ONLINE'
    ) NOT NULL DEFAULT 'CASH',

    billed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bill_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_bill_payment_status (
        payment_status
    ),

    INDEX idx_bill_billed_at (
        billed_at
    )
) ENGINE=InnoDB;


-- ============================================================
-- STEP 8: INSERT USERS
-- ============================================================

INSERT INTO users (
    username,
    password,
    full_name,
    role
)
VALUES
(
    'admin',
    'admin123',
    'System Administrator',
    'ADMIN'
),
(
    'recep',
    'recep123',
    'Reception Staff',
    'RECEPTIONIST'
),
(
    'dentist',
    'dentist123',
    'Dr. Sunil Perera',
    'DENTIST'
);


-- ============================================================
-- STEP 9: INSERT DENTISTS
-- ============================================================

INSERT INTO dentists (
    dentist_name,
    specialization,
    contact_number,
    email
)
VALUES
(
    'Dr. Sunil Perera',
    'Orthodontics',
    '0771234567',
    'sunil@sunrisedental.lk'
),
(
    'Dr. Nimali Fernando',
    'Endodontics',
    '0772345678',
    'nimali@sunrisedental.lk'
),
(
    'Dr. Kasun Silva',
    'Periodontics',
    '0773456789',
    'kasun@sunrisedental.lk'
),
(
    'Dr. Amara Jayawardena',
    'Pediatric Dentistry',
    '0774567890',
    'amara@sunrisedental.lk'
);


-- ============================================================
-- STEP 10: INSERT TREATMENTS
-- ============================================================

INSERT INTO treatments (
    treatment_name,
    treatment_code,
    base_cost,
    consultation_fee,
    description
)
VALUES
(
    'General Checkup',
    'CHK001',
    1500.00,
    1500.00,
    'Routine dental examination and oral health assessment'
),
(
    'Teeth Cleaning',
    'CLN001',
    3000.00,
    1500.00,
    'Professional scaling and polishing'
),
(
    'Tooth Extraction',
    'EXT001',
    5000.00,
    1500.00,
    'Simple tooth extraction procedure'
),
(
    'Root Canal Treatment',
    'RCT001',
    15000.00,
    1500.00,
    'Complete root canal therapy with filling'
),
(
    'Dental Filling',
    'FIL001',
    4000.00,
    1500.00,
    'Composite or amalgam cavity filling'
),
(
    'Teeth Whitening',
    'WHT001',
    20000.00,
    1500.00,
    'Professional in-office teeth whitening'
),
(
    'Dental Crown',
    'CRW001',
    25000.00,
    1500.00,
    'Porcelain or ceramic crown placement'
),
(
    'Braces Consultation',
    'BRC001',
    5000.00,
    1500.00,
    'Orthodontic consultation and treatment planning'
),
(
    'Dental Implant',
    'IMP001',
    75000.00,
    1500.00,
    'Single tooth dental implant procedure'
),
(
    'Wisdom Tooth Removal',
    'WIS001',
    8000.00,
    1500.00,
    'Surgical wisdom tooth extraction'
);


-- ============================================================
-- STEP 11: INSERT PATIENTS
-- ============================================================

INSERT INTO patients (
    patient_name,
    address,
    contact_number,
    email,
    date_of_birth,
    gender
)
VALUES
(
    'Kamal Silva',
    '123 Galle Road, Colombo 03',
    '0771112223',
    'kamal@email.com',
    '1990-05-15',
    'MALE'
),
(
    'Nayana Perera',
    '45 Kandy Road, Colombo 07',
    '0772223334',
    'nayana@email.com',
    '1985-08-20',
    'FEMALE'
),
(
    'Rohan Fernando',
    '78 Bambalapitiya, Colombo 04',
    '0773334445',
    'rohan@email.com',
    '1992-12-10',
    'MALE'
),
(
    'Samanthi Wijesinghe',
    '12 Nawala Road, Nugegoda',
    '0774445556',
    'samanthi@email.com',
    '1988-03-25',
    'FEMALE'
),
(
    'Dilan Bandara',
    '89 High Level Road, Maharagama',
    '0775556667',
    'dilan@email.com',
    '1995-07-18',
    'MALE'
),
(
    'Tharushi Gunasekara',
    '34 Duplication Road, Colombo 05',
    '0776667778',
    'tharushi@email.com',
    '1993-11-02',
    'FEMALE'
);


-- ============================================================
-- STEP 12: INSERT APPOINTMENTS
-- ============================================================

INSERT INTO appointments (
    appointment_number,
    patient_id,
    dentist_id,
    treatment_id,
    appointment_date,
    appointment_time,
    status,
    notes
)
VALUES
(
    'APT-00001',
    1,
    1,
    1,
    '2026-08-20',
    '09:00:00',
    'SCHEDULED',
    'First visit - general checkup'
),
(
    'APT-00002',
    2,
    2,
    4,
    '2026-08-21',
    '10:30:00',
    'SCHEDULED',
    'Follow-up for root canal'
),
(
    'APT-00003',
    3,
    1,
    2,
    '2026-08-22',
    '14:00:00',
    'SCHEDULED',
    'Routine cleaning'
),
(
    'APT-00004',
    4,
    3,
    5,
    '2026-08-20',
    '11:00:00',
    'SCHEDULED',
    'Cavity filling - upper left molar'
),
(
    'APT-00005',
    5,
    2,
    3,
    '2026-08-23',
    '09:30:00',
    'SCHEDULED',
    'Wisdom tooth pain'
),
(
    'APT-00006',
    6,
    4,
    8,
    '2026-08-24',
    '15:00:00',
    'SCHEDULED',
    'Braces consultation for alignment'
);


-- ============================================================
-- STEP 13: INSERT BILLS
-- ============================================================

INSERT INTO bills (
    appointment_id,
    bill_number,
    treatment_cost,
    consultation_fee,
    additional_charges,
    discount,
    total_amount,
    payment_status,
    payment_method
)
VALUES
(
    1,
    'BILL-00001',
    1500.00,
    1500.00,
    0.00,
    0.00,
    3000.00,
    'PAID',
    'CASH'
),
(
    2,
    'BILL-00002',
    15000.00,
    1500.00,
    0.00,
    500.00,
    16000.00,
    'PENDING',
    'CASH'
),
(
    3,
    'BILL-00003',
    3000.00,
    1500.00,
    0.00,
    0.00,
    4500.00,
    'PAID',
    'CARD'
);


-- ============================================================
-- STEP 14: MIGRATION FOR EXISTING DATABASES
-- Adds the permissions column if it does not already exist.
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS permissions VARCHAR(255) DEFAULT NULL
    AFTER role;

-- ============================================================
-- STEP 14b: MIGRATION — Add the is_active column for accounts
-- that were created before the column existed. Existing users
-- are treated as active so nobody gets locked out.
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- STEP 14c: MIGRATION — Add contact number and email columns
-- so user accounts can store contact details.
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) DEFAULT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL;


-- ============================================================
-- STEP 14d: MIGRATION — Dentist weekly availability table.
-- One row per weekday per dentist (0 = Sunday ... 6 = Saturday).
-- Times are stored in 24h TIME format.
-- ============================================================

CREATE TABLE IF NOT EXISTS dentist_availability (
    availability_id INT PRIMARY KEY AUTO_INCREMENT,

    dentist_id INT NOT NULL,

    day_of_week TINYINT NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_availability_dentist
        FOREIGN KEY (dentist_id) REFERENCES dentists(dentist_id)
        ON DELETE CASCADE,

    CONSTRAINT uniq_dentist_day UNIQUE (dentist_id, day_of_week)
) ENGINE=InnoDB;

ALTER TABLE dentist_availability
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE dentist_availability
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- STEP 14e: MIGRATION — Dentist date-range availability.
-- Lets a dentist add availability (or block dates e.g. vacation)
-- for specific dates / date ranges, overriding the weekly schedule.
-- ============================================================

CREATE TABLE IF NOT EXISTS dentist_date_availability (
    date_availability_id INT PRIMARY KEY AUTO_INCREMENT,

    dentist_id INT NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    start_time TIME NOT NULL DEFAULT '09:00:00',

    end_time TIME NOT NULL DEFAULT '17:00:00',

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    slot_minutes INT NOT NULL DEFAULT 30,

    reason VARCHAR(255) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_date_availability_dentist
        FOREIGN KEY (dentist_id) REFERENCES dentists(dentist_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_date_range CHECK (end_date >= start_date)

) ENGINE=InnoDB;

ALTER TABLE dentist_date_availability
    ADD COLUMN IF NOT EXISTS slot_minutes INT NOT NULL DEFAULT 30;



-- ============================================================
-- STEP 15: VERIFY DATA
-- ============================================================

SELECT * FROM users;

SELECT * FROM dentists;

SELECT * FROM patients;

SELECT * FROM treatments;

SELECT * FROM appointments;

SELECT * FROM bills;


-- ============================================================
-- STEP 15: USEFUL JOIN QUERY
-- View appointment details with patient, dentist & treatment
-- ============================================================

SELECT
    a.appointment_id,
    a.appointment_number,
    p.patient_name,
    p.contact_number,
    d.dentist_name,
    d.specialization,
    t.treatment_name,
    t.treatment_code,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.notes
FROM appointments a
INNER JOIN patients p
    ON a.patient_id = p.patient_id
INNER JOIN dentists d
    ON a.dentist_id = d.dentist_id
INNER JOIN treatments t
    ON a.treatment_id = t.treatment_id
ORDER BY
    a.appointment_date,
    a.appointment_time;