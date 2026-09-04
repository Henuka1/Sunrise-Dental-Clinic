package com.sunrise.dental.factory;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */

import com.sunrise.dental.factory.BillFactory;
import com.sunrise.dental.model.Bill;
import com.sunrise.dental.model.Treatment;
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
public class BillFactoryTest {
    
    public BillFactoryTest() {
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

    private Treatment getTestTreatment() {
        return new Treatment(1, "Filling", "FIL", 8000, 1000, "Tooth filling");
    }

    /**
     * Test of createBill method, of class BillFactory.
     */
    @org.junit.jupiter.api.Test
    public void testCreateBill() {
        System.out.println("createBill");
        Bill bill = BillFactory.createBill(1, getTestTreatment(), 500, 300);
        
        assertEquals(8000, bill.getTreatmentCost());
        assertEquals(1000, bill.getConsultationFee());
        assertEquals(500, bill.getAdditionalCharges());
        assertEquals(300, bill.getDiscount());
        assertEquals(9200, bill.getTotalAmount(), 0.001);
        assertEquals("PENDING", bill.getPaymentStatus());
    }

    /**
     * Test of createBill with high discount - total should not go negative.
     */
    @org.junit.jupiter.api.Test
    public void testCreateBillTotalNeverNegative() {
        System.out.println("createBill - total never negative");
        Bill bill = BillFactory.createBill(1, getTestTreatment(), 0, 100000);
        assertEquals(0, bill.getTotalAmount(), 0.001);
    }

    /**
     * Test of generateBillNumber method, of class BillFactory.
     */
    @org.junit.jupiter.api.Test
    public void testGenerateBillNumber() {
        System.out.println("generateBillNumber");
        assertEquals("BILL-00001", BillFactory.generateBillNumber(null));
        assertEquals("BILL-00002", BillFactory.generateBillNumber("BILL-00001"));
        assertEquals("BILL-00010", BillFactory.generateBillNumber("BILL-00009"));
    }

    /**
     * Test of generateAppointmentNumber method, of class BillFactory.
     */
    @org.junit.jupiter.api.Test
    public void testGenerateAppointmentNumber() {
        System.out.println("generateAppointmentNumber");
        assertEquals("APT-00001", BillFactory.generateAppointmentNumber(null));
        assertEquals("APT-00002", BillFactory.generateAppointmentNumber("APT-00001"));
    }
}