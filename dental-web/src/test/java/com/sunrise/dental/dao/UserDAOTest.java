package com.sunrise.dental.dao;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */

import com.sunrise.dental.BaseDaoTest;
import com.sunrise.dental.dao.UserDAO;
import com.sunrise.dental.model.User;
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
public class UserDAOTest extends BaseDaoTest {
    
    private final UserDAO dao = new UserDAO();
    
    public UserDAOTest() {
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
     * Test of authenticate method, of class UserDAO.
     */
    @org.junit.jupiter.api.Test
    public void testAuthenticateValidUser() {
        System.out.println("authenticate - valid user");
        User user = dao.authenticate("admin", "admin123");
        assertNotNull(user);
        assertEquals("admin", user.getUsername());
        assertEquals("ADMIN", user.getRole());
        assertEquals("System Admin", user.getFullName());
    }

    /**
     * Test of authenticate with wrong password.
     */
    @org.junit.jupiter.api.Test
    public void testAuthenticateWrongPassword() {
        System.out.println("authenticate - wrong password");
        assertNull(dao.authenticate("admin", "wrongpass"));
    }

    /**
     * Test of authenticate with unknown user.
     */
    @org.junit.jupiter.api.Test
    public void testAuthenticateUnknownUser() {
        System.out.println("authenticate - unknown user");
        assertNull(dao.authenticate("nobody", "x"));
    }

    /**
     * Test of getUserByUsername method, of class UserDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetUserByUsername() {
        System.out.println("getUserByUsername");
        assertNotNull(dao.getUserByUsername("reception"));
        assertNull(dao.getUserByUsername("ghost"));
    }
}