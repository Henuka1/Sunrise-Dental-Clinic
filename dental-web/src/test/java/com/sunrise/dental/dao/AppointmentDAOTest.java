/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.BaseDaoTest;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 *
 * @author User
 */
public class AppointmentDAOTest extends BaseDaoTest {
    
    private final AppointmentDAO dao = new AppointmentDAO();
    private final String date = LocalDate.now().plusDays(1).toString();
    
    public AppointmentDAOTest() {
    }

    @org.junit.jupiter.api.BeforeAll
    public static void setUpClass() throws Exception {
        BaseDaoTest.setUpClass();
    }

    @org.junit.jupiter.api.AfterAll
    public static void tearDownClass() throws Exception {
        BaseDaoTest.tearDownClass();
    }

    @org.junit.jupiter.api.BeforeEach
    public void setUp() throws Exception {
        super.setUp();
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() throws Exception {
        super.tearDown();
    }

    /**
     * Test of addAppointment method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testAddAppointment() throws Exception {
        System.out.println("addAppointment");
        int pid = insertPatient("Test Patient", "0771110001");
        var apt = insertAppointment(pid, 1, 1, date, "09:00");
        
        assertNotNull(apt.getAppointmentNumber());
        assertTrue(apt.getAppointmentNumber().matches("APT-\\d{5}"));
        assertEquals("Test Patient", apt.getPatientName());
        assertEquals("Dr. Kasun Perera", apt.getDentistName());
        assertEquals("Cleaning", apt.getTreatmentName());
    }

    /**
     * Test of isTimeSlotAvailable method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testIsTimeSlotAvailable() throws Exception {
        System.out.println("isTimeSlotAvailable");
        int pid = insertPatient("Dup Patient", "0771110002");
        insertAppointment(pid, 1, 1, date, "10:00");
        
        assertFalse(dao.isTimeSlotAvailable(1, date, "10:00"));
        assertTrue(dao.isTimeSlotAvailable(1, date, "11:00"));
        assertTrue(dao.isTimeSlotAvailable(2, date, "10:00"));
    }

    /**
     * Test of searchAppointments method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testSearchAppointments() throws Exception {
        System.out.println("searchAppointments");
        int pid = insertPatient("Search Me", "0771110003");
        var apt = insertAppointment(pid, 1, 2, date, "09:30");
        
        assertNotNull(dao.getAppointmentByNumber(apt.getAppointmentNumber()));
        assertEquals(1, dao.searchAppointments("search me").size());
        assertEquals(1, dao.searchAppointments(apt.getAppointmentNumber()).size());
        assertNull(dao.getAppointmentByNumber("APT-99999"));
    }

    /**
     * Test of getAppointmentsByDate method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetAppointmentsByDate() throws Exception {
        System.out.println("getAppointmentsByDate");
        int pid = insertPatient("Filter P", "0771110004");
        insertAppointment(pid, 1, 1, date, "08:30");
        insertAppointment(pid, 2, 1, date, "09:30");
        
        assertEquals(2, dao.getAppointmentsByDate(date).size());
        assertEquals(2, dao.getAppointments(date, "SCHEDULED").size());
        assertEquals(0, dao.getAppointments(date, "COMPLETED").size());
    }

    /**
     * Test of cancelAppointment method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testCancelAppointment() throws Exception {
        System.out.println("cancelAppointment");
        int pid = insertPatient("Cancel P", "0771110005");
        var apt = insertAppointment(pid, 1, 1, date, "12:00");
        
        assertTrue(dao.cancelAppointment(apt.getAppointmentId()));
        assertEquals("CANCELLED", dao.getAppointmentById(apt.getAppointmentId()).getStatus());
        assertTrue(dao.isTimeSlotAvailable(1, date, "12:00"));
    }

    /**
     * Test of updateAppointmentStatus method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testUpdateAppointmentStatus() throws Exception {
        System.out.println("updateAppointmentStatus");
        int pid = insertPatient("Complete P", "0771110006");
        var apt = insertAppointment(pid, 1, 1, date, "13:00");
        
        assertTrue(dao.updateAppointmentStatus(apt.getAppointmentId(), "COMPLETED", "Done"));
        assertEquals("COMPLETED", dao.getAppointmentById(apt.getAppointmentId()).getStatus());
        assertEquals("Done", dao.getAppointmentById(apt.getAppointmentId()).getNotes());
    }

    /**
     * Test of getAppointmentsByPatient method, of class AppointmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetAppointmentsByPatient() throws Exception {
        System.out.println("getAppointmentsByPatient");
        int pid = insertPatient("History P", "0771110008");
        insertAppointment(pid, 1, 1, date, "14:30");
        insertAppointment(pid, 1, 2, date, "15:30");
        
        assertEquals(2, dao.getAppointmentsByPatient(pid).size());
    }
}