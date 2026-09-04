/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.BaseDaoTest;
import com.sunrise.dental.BaseDaoTest;
import com.sunrise.dental.dao.PatientDAO;
import com.sunrise.dental.model.Patient;
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
public class PatientDAOTest extends BaseDaoTest {
    
    private final PatientDAO dao = new PatientDAO();
    
    public PatientDAOTest() {
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

    private Patient newPatient(String name, String contact) {
        Patient p = new Patient();
        p.setPatientName(name);
        p.setAddress("45 Kandy Road, Colombo 07");
        p.setContactNumber(contact);
        p.setEmail(name.replace(" ", "").toLowerCase() + "@mail.com");
        p.setGender("M");
        return p;
    }

    /**
     * Test of addPatient method, of class PatientDAO.
     */
    @org.junit.jupiter.api.Test
    public void testAddPatient() {
        System.out.println("addPatient");
        assertTrue(dao.addPatient(newPatient("Sunil Jayasinghe", "0775551234")));
        Patient fetched = dao.getPatientByContact("0775551234");
        assertNotNull(fetched);
        assertEquals("Sunil Jayasinghe", fetched.getPatientName());
        assertTrue(fetched.getPatientId() > 0);
    }

    /**
     * Test of getPatientById method, of class PatientDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetPatientById() throws Exception {
        System.out.println("getPatientById");
        int id = insertPatient("Kamal Silva", "0775559999");
        assertEquals("Kamal Silva", dao.getPatientById(id).getPatientName());
        assertNull(dao.getPatientById(9999));
    }

    /**
     * Test of searchPatients method, of class PatientDAO.
     */
    @org.junit.jupiter.api.Test
    public void testSearchPatients() throws Exception {
        System.out.println("searchPatients");
        insertPatient("Nadeesha Perera", "0774441111");
        assertEquals(1, dao.searchPatients("nadeesha").size());
        assertEquals(1, dao.searchPatients("0774441").size());
        assertEquals(0, dao.searchPatients("xyz").size());
    }

    /**
     * Test of updatePatient method, of class PatientDAO.
     */
    @org.junit.jupiter.api.Test
    public void testUpdatePatient() throws Exception {
        System.out.println("updatePatient");
        int id = insertPatient("Old Name", "0773332222");
        Patient p = dao.getPatientById(id);
        p.setPatientName("New Name");
        assertTrue(dao.updatePatient(p));
        assertEquals("New Name", dao.getPatientById(id).getPatientName());
    }

    /**
     * Test of getAllPatients method, of class PatientDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetAllPatients() throws Exception {
        System.out.println("getAllPatients");
        insertPatient("P One", "0770000001");
        insertPatient("P Two", "0770000002");
        assertTrue(dao.getAllPatients().size() >= 2);
    }
}