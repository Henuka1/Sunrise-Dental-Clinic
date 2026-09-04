package com.sunrise.dental.util;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */

import com.sunrise.dental.util.ValidationUtil;
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
public class ValidationUtilTest {
    
    public ValidationUtilTest() {
    }

    @org.junit.jupiter.api.BeforeAll
    public static void setUpClass() throws Exception {
    }

    @org.junit.jupiter.api.AfterAll
    public static void tearDownClass() throws Exception {
    }

    @org.junit.jupiter.api.BeforeEach
    public void setUp() throws Exception {
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() throws Exception {
    }

    /**
     * Test of isNullOrEmpty method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsNullOrEmpty() {
        System.out.println("isNullOrEmpty");
        assertTrue(ValidationUtil.isNullOrEmpty(null));
        assertTrue(ValidationUtil.isNullOrEmpty(""));
        assertTrue(ValidationUtil.isNullOrEmpty("   "));
        assertFalse(ValidationUtil.isNullOrEmpty("abc"));
    }

    /**
     * Test of isValidPhone method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsValidPhone() {
        System.out.println("isValidPhone");
        assertTrue(ValidationUtil.isValidPhone("0771234567"));
        assertFalse(ValidationUtil.isValidPhone("077123456"));
        assertFalse(ValidationUtil.isValidPhone("07712345"));
        assertFalse(ValidationUtil.isValidPhone("1234567890"));
        assertFalse(ValidationUtil.isValidPhone(null));
    }

    /**
     * Test of isValidEmail method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsValidEmail() {
        System.out.println("isValidEmail");
        assertTrue(ValidationUtil.isValidEmail("user@gmail.com"));
        assertTrue(ValidationUtil.isValidEmail("test.mail@yahoo.com"));
        assertFalse(ValidationUtil.isValidEmail("user@"));
        assertFalse(ValidationUtil.isValidEmail("invalid"));
    }

    /**
     * Test of isValidAppointmentNumber method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsValidAppointmentNumber() {
        System.out.println("isValidAppointmentNumber");
        assertTrue(ValidationUtil.isValidAppointmentNumber("APT-00001"));
        assertFalse(ValidationUtil.isValidAppointmentNumber("APT00001"));
        assertFalse(ValidationUtil.isValidAppointmentNumber("APT-1"));
    }

    /**
     * Test of isValidDateRange method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsValidDateRange() {
        System.out.println("isValidDateRange");
        String today = LocalDate.now().toString();
        String future = LocalDate.now().plusDays(30).toString();
        String past = LocalDate.now().minusDays(1).toString();
        String tooFar = LocalDate.now().plusDays(91).toString();
        
        assertTrue(ValidationUtil.isValidDateRange(today));
        assertTrue(ValidationUtil.isValidDateRange(future));
        assertFalse(ValidationUtil.isValidDateRange(past));
        assertFalse(ValidationUtil.isValidDateRange(tooFar));
        assertFalse(ValidationUtil.isValidDateRange("not-a-date"));
    }

    /**
     * Test of isValidTime method, of class ValidationUtil.
     */
    @org.junit.jupiter.api.Test
    public void testIsValidTime() {
        System.out.println("isValidTime");
        assertTrue(ValidationUtil.isValidTime("08:00"));
        assertTrue(ValidationUtil.isValidTime("12:30"));
        assertTrue(ValidationUtil.isValidTime("18:00"));
        assertFalse(ValidationUtil.isValidTime("07:59"));
        assertFalse(ValidationUtil.isValidTime("18:01"));
        assertFalse(ValidationUtil.isValidTime("25:00"));
    }
}