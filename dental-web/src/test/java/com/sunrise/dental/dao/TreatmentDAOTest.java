/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.BaseDaoTest;
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
public class TreatmentDAOTest extends BaseDaoTest {
    
    private final TreatmentDAO dao = new TreatmentDAO();
    
    public TreatmentDAOTest() {
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
     * Test of getAllTreatments method, of class TreatmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetAllTreatments() {
        System.out.println("getAllTreatments");
        assertEquals(3, dao.getAllTreatments().size());
    }

    /**
     * Test of getTreatmentById method, of class TreatmentDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetTreatmentById() {
        System.out.println("getTreatmentById");
        var t = dao.getTreatmentById(3);
        assertEquals("Root Canal", t.getTreatmentName());
        assertEquals(25000, t.getBaseCost(), 0.001);
        assertEquals(1500, t.getConsultationFee(), 0.001);
        assertNull(dao.getTreatmentById(999));
    }
}