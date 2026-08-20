/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.model.Bill;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author User
 */
public class BillDAO {

    public List<Bill> getBills(String status) {
        if (status == null || status.isEmpty()) {
            return getAllBills();
        }
        return getBillsByStatus(status);
    }

    public List<Bill> getAllBills() {
        List<Bill> bills = new ArrayList<>();
        String sql = "SELECT b.*, a.appointment_number, p.patient_name " +
                     "FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "ORDER BY b.billed_at DESC";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                bills.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return bills;
    }

    public List<Bill> getBillsByStatus(String status) {
        List<Bill> bills = new ArrayList<>();
        String sql = "SELECT b.*, a.appointment_number, p.patient_name " +
                     "FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "WHERE b.payment_status = ? ORDER BY b.billed_at DESC";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                bills.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return bills;
    }

    public boolean addBill(Bill bill) {
        String sql = "INSERT INTO bills (appointment_id, bill_number, treatment_cost, consultation_fee, additional_charges, discount, total_amount, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, bill.getAppointmentId());
            ps.setString(2, bill.getBillNumber());
            ps.setDouble(3, bill.getTreatmentCost());
            ps.setDouble(4, bill.getConsultationFee());
            ps.setDouble(5, bill.getAdditionalCharges());
            ps.setDouble(6, bill.getDiscount());
            ps.setDouble(7, bill.getTotalAmount());
            ps.setString(8, bill.getPaymentStatus());
            ps.setString(9, bill.getPaymentMethod());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public Bill getBillByAppointmentId(int appointmentId) {
        String sql = "SELECT b.*, a.appointment_number, p.patient_name " +
                     "FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "WHERE b.appointment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Bill getBillById(int billId) {
        String sql = "SELECT b.*, a.appointment_number, p.patient_name " +
                     "FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "WHERE b.bill_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, billId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Bill> getPendingBills() {
        List<Bill> bills = new ArrayList<>();
        String sql = "SELECT b.*, a.appointment_number, p.patient_name " +
                     "FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "WHERE b.payment_status = 'PENDING'";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                bills.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return bills;
    }

    public boolean updatePaymentStatus(int billId, String status, String method) {
        String sql = "UPDATE bills SET payment_status = ?, payment_method = ? WHERE bill_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, method);
            ps.setInt(3, billId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public double getTotalRevenue(String fromDate, String toDate) {
        String sql = "SELECT SUM(total_amount) as total FROM bills b " +
                     "JOIN appointments a ON b.appointment_id = a.appointment_id " +
                     "WHERE a.appointment_date BETWEEN ? AND ? AND b.payment_status = 'PAID'";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getDouble("total");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public String getLastBillNumber() {
        String sql = "SELECT bill_number FROM bills ORDER BY bill_id DESC LIMIT 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getString("bill_number");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    private Bill mapResultSet(ResultSet rs) throws SQLException {
        Bill b = new Bill();
        b.setBillId(rs.getInt("bill_id"));
        b.setAppointmentId(rs.getInt("appointment_id"));
        b.setAppointmentNumber(rs.getString("appointment_number"));
        b.setPatientName(rs.getString("patient_name"));
        b.setBillNumber(rs.getString("bill_number"));
        b.setTreatmentCost(rs.getDouble("treatment_cost"));
        b.setConsultationFee(rs.getDouble("consultation_fee"));
        b.setAdditionalCharges(rs.getDouble("additional_charges"));
        b.setDiscount(rs.getDouble("discount"));
        b.setTotalAmount(rs.getDouble("total_amount"));
        b.setPaymentStatus(rs.getString("payment_status"));
        b.setPaymentMethod(rs.getString("payment_method"));
        b.setBilledAt(rs.getString("billed_at"));
        return b;
    }
}
