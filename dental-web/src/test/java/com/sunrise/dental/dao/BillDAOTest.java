/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.BaseDaoTest;
import com.sunrise.dental.factory.BillFactory;
import com.sunrise.dental.model.Bill;
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
public class BillDAOTest extends BaseDaoTest {
    
    private final BillDAO dao = new BillDAO();
    private final TreatmentDAO trDao = new TreatmentDAO();
    
    public BillDAOTest() {
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

    private Bill newBill(boolean paid) throws Exception {
        int pid = insertPatient("Bill Patient", "0772220001");
        var apt = insertAppointment(pid, 1, 1, LocalDate.now().toString(), "09:00");
        Bill b = BillFactory.createBill(apt.getAppointmentId(),
                trDao.getTreatmentById(1), 200, 0);
        b.setBillNumber(BillFactory.generateBillNumber(dao.getLastBillNumber()));
        b.setPaymentStatus(paid ? "PAID" : "PENDING");
        b.setPaymentMethod("CASH");
        assertTrue(dao.addBill(b));
        return b;
    }

    /**
     * Test of addBill method, of class BillDAO.
     */
    @org.junit.jupiter.api.Test
    public void testAddBill() throws Exception {
        System.out.println("addBill");
        Bill b = newBill(false);
        Bill fetched = dao.getBillByAppointmentId(b.getAppointmentId());
        assertNotNull(fetched);
        assertEquals(6200, fetched.getTotalAmount(), 0.001);
        assertEquals("PENDING", fetched.getPaymentStatus());
        assertEquals("Bill Patient", fetched.getPatientName());
    }

    /**
     * Test of getPendingBills method, of class BillDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetPendingBills() throws Exception {
        System.out.println("getPendingBills");
        newBill(false);
        newBill(true);
        assertEquals(1, dao.getPendingBills().size());
        assertEquals(1, dao.getBillsByStatus("PAID").size());
        assertEquals(2, dao.getAllBills().size());
    }

    /**
     * Test of updatePaymentStatus method, of class BillDAO.
     */
    @org.junit.jupiter.api.Test
    public void testUpdatePaymentStatus() throws Exception {
        System.out.println("updatePaymentStatus");
        Bill b = newBill(false);
        Bill saved = dao.getBillByAppointmentId(b.getAppointmentId());
        assertTrue(dao.updatePaymentStatus(saved.getBillId(), "PAID", "CARD"));
        assertEquals("PAID", dao.getBillById(saved.getBillId()).getPaymentStatus());
        assertEquals("CARD", dao.getBillById(saved.getBillId()).getPaymentMethod());
    }

    /**
     * Test of getTotalRevenue method, of class BillDAO.
     */
    @org.junit.jupiter.api.Test
    public void testGetTotalRevenue() throws Exception {
        System.out.println("getTotalRevenue");
        newBill(true);
        newBill(false);
        double revenue = dao.getTotalRevenue(
                LocalDate.now().minusDays(1).toString(),
                LocalDate.now().plusDays(1).toString());
        assertEquals(6200, revenue, 0.001);
    }
}