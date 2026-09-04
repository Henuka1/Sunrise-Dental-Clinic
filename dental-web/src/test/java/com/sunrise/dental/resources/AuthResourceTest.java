/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sunrise.dental.BaseDaoTest;
import jakarta.ws.rs.core.Response;
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
public class AuthResourceTest extends BaseDaoTest {
    
    private final AuthResource resource = new AuthResource();
    private final Gson gson = new Gson();
    
    public AuthResourceTest() {
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
     * Test of login method, of class AuthResource.
     */
    @org.junit.jupiter.api.Test
    public void testLoginValid() {
        System.out.println("login - valid credentials");
        Response res = resource.login("{\"username\":\"admin\",\"password\":\"admin123\"}");
        assertEquals(200, res.getStatus());
        JsonObject json = gson.fromJson((String) res.getEntity(), JsonObject.class);
        assertTrue(json.get("success").getAsBoolean());
        assertNotNull(json.get("token"));
        assertEquals("System Admin", json.get("fullName").getAsString());
    }

    /**
     * Test of login with wrong password.
     */
    @org.junit.jupiter.api.Test
    public void testLoginWrongPassword() {
        System.out.println("login - wrong password");
        Response res = resource.login("{\"username\":\"admin\",\"password\":\"wrong\"}");
        assertEquals(401, res.getStatus());
        JsonObject json = gson.fromJson((String) res.getEntity(), JsonObject.class);
        assertFalse(json.get("success").getAsBoolean());
    }

    /**
     * Test of login with missing fields.
     */
    @org.junit.jupiter.api.Test
    public void testLoginMissingFields() {
        System.out.println("login - missing fields");
        Response res = resource.login("{}");
        assertEquals(400, res.getStatus());
    }
}