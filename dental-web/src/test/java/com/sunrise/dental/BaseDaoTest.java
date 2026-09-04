/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental;

import com.sunrise.dental.model.Patient;
import com.sunrise.dental.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

/**
 *
 * @author User
 */
public abstract class BaseDaoTest {
    
    public BaseDaoTest() {
    }

    @org.junit.jupiter.api.BeforeAll
    public static void setUpClass() throws Exception {
        System.out.println("Setting up test database (H2 in-memory)...");
        
        // Set H2 database for testing
        System.setProperty("sunrise.db.url",
                "jdbc:h2:mem:sunrise_test;MODE=MySQL;DB_CLOSE_DELAY=-1");
        System.setProperty("sunrise.db.user", "sa");
        System.setProperty("sunrise.db.pass", "");

        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement st = conn.createStatement()) {

            // Drop existing tables first to avoid old schema conflicts (like narrow gender column)
            st.execute("SET FOREIGN_KEY_CHECKS = 0;");
            st.execute("DROP TABLE IF EXISTS bills");
            st.execute("DROP TABLE IF EXISTS appointments");
            st.execute("DROP TABLE IF EXISTS patients");
            st.execute("DROP TABLE IF EXISTS dentists");
            st.execute("DROP TABLE IF EXISTS treatments");
            st.execute("DROP TABLE IF EXISTS users");
            st.execute("SET FOREIGN_KEY_CHECKS = 1;");

            // Create tables with safe column lengths
            st.execute("CREATE TABLE users (" +
                    "user_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "username VARCHAR(50), password VARCHAR(100)," +
                    "full_name VARCHAR(100), role VARCHAR(20))");

            st.execute("CREATE TABLE patients (" +
                    "patient_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "patient_name VARCHAR(100), address VARCHAR(200)," +
                    "contact_number VARCHAR(15), email VARCHAR(100)," +
                    "date_of_birth VARCHAR(20), gender VARCHAR(20)," +
                    "registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            st.execute("CREATE TABLE dentists (" +
                    "dentist_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "dentist_name VARCHAR(100), specialization VARCHAR(100)," +
                    "contact_number VARCHAR(20), email VARCHAR(100)," +
                    "is_active BOOLEAN)");

            st.execute("CREATE TABLE treatments (" +
                    "treatment_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "treatment_name VARCHAR(100), treatment_code VARCHAR(20)," +
                    "base_cost DOUBLE, consultation_fee DOUBLE, description VARCHAR(500))");

            st.execute("CREATE TABLE appointments (" +
                    "appointment_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "appointment_number VARCHAR(20), patient_id INT," +
                    "dentist_id INT, treatment_id INT," +
                    "appointment_date VARCHAR(10), appointment_time VARCHAR(8)," +
                    "status VARCHAR(20), notes VARCHAR(500)," +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            st.execute("CREATE TABLE bills (" +
                    "bill_id INT AUTO_INCREMENT PRIMARY KEY," +
                    "appointment_id INT, bill_number VARCHAR(20)," +
                    "treatment_cost DOUBLE, consultation_fee DOUBLE," +
                    "additional_charges DOUBLE, discount DOUBLE," +
                    "total_amount DOUBLE, payment_status VARCHAR(20)," +
                    "payment_method VARCHAR(20)," +
                    "billed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            System.out.println("Test database ready!");
        }
    }

    @org.junit.jupiter.api.AfterAll
    public static void tearDownClass() throws Exception {
        System.out.println("Tearing down test database...");
    }

    @org.junit.jupiter.api.BeforeEach
    public void setUp() throws Exception {
        // Clean tables and re-insert essential reference data before each test
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement st = conn.createStatement()) {
            st.execute("SET FOREIGN_KEY_CHECKS = 0;");
            st.execute("DELETE FROM bills");
            st.execute("DELETE FROM appointments");
            st.execute("DELETE FROM patients");
            st.execute("DELETE FROM treatments");
            st.execute("DELETE FROM dentists");
            st.execute("DELETE FROM users");

            // Seed users
            st.execute("INSERT INTO users (username, password, full_name, role) VALUES " +
                    "('admin','admin123','System Admin','ADMIN')," +
                    "('reception','reception123','Nimal Perera','RECEPTIONIST')");

            // Seed dentists with explicit IDs so foreign keys match
            st.execute("INSERT INTO dentists (dentist_id, dentist_name, specialization, contact_number, email, is_active) VALUES " +
                    "(1, 'Dr. Kasun Perera', 'General Dentistry', '0771111111', 'kasun@sunrise.lk', TRUE)," +
                    "(2, 'Dr. Sandya Fernando', 'Orthodontics', '0772222222', 'sandya@sunrise.lk', TRUE)");

            // Seed treatments with explicit IDs so foreign keys match
            st.execute("INSERT INTO treatments (treatment_id, treatment_name, treatment_code, base_cost, consultation_fee, description) VALUES " +
                    "(1, 'Cleaning', 'CLN', 5000, 1000, 'Regular cleaning')," +
                    "(2, 'Filling', 'FIL', 8000, 1000, 'Tooth filling')," +
                    "(3, 'Root Canal', 'RCT', 25000, 1500, 'Root canal treatment')");
            
            st.execute("SET FOREIGN_KEY_CHECKS = 1;");
        }
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() throws Exception {
    }
    
    // Helper methods using direct JDBC to prevent DAO dependency issues during test setup
    protected int insertPatient(String name, String contact) throws Exception {
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "INSERT INTO patients (patient_name, address, contact_number, email, gender) VALUES (?, ?, ?, ?, ?)",
                     Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.setString(2, "12 Galle Road, Colombo 03");
            ps.setString(3, contact);
            ps.setString(4, "test@mail.com");
            ps.setString(5, "Male");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        throw new RuntimeException("Failed to insert test patient");
    }
    
    protected com.sunrise.dental.model.Appointment insertAppointment(
            int patientId, int dentistId, int treatmentId, String date, String time) {
        com.sunrise.dental.dao.AppointmentDAO dao = new com.sunrise.dental.dao.AppointmentDAO();
        com.sunrise.dental.model.Appointment a = new com.sunrise.dental.model.Appointment();
        a.setAppointmentNumber(com.sunrise.dental.factory.BillFactory
                .generateAppointmentNumber(dao.getLastAppointmentNumber()));
        a.setPatientId(patientId);
        a.setDentistId(dentistId);
        a.setTreatmentId(treatmentId);
        a.setAppointmentDate(date);
        a.setAppointmentTime(time);
        a.setStatus("SCHEDULED");
        dao.addAppointment(a);
        return dao.getAppointmentByNumber(a.getAppointmentNumber());
    }
}