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
public class DentistDAOTest extends BaseDaoTest {
    
    private final DentistDAO dao = new DentistDAO();
    
    public DentistDAOTest() {
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
     * Test of getAllDentists method, of class DentistDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetAllDentists() {
        System.out.println("getAllDentists");
        assertEquals(2, dao.getAllDentists().size());
    }

    /**
     * Test of getDentistById method, of class DentistDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetDentistById() {
        System.out.println("getDentistById");
        assertEquals("Dr. Kasun Perera", dao.getDentistById(1).getDentistName());
        assertEquals("Orthodontics", dao.getDentistById(2).getSpecialization());
        assertNull(dao.getDentistById(999));
    }
}
