/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.model.Treatment;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author User
 */
public class TreatmentDAO {

    public List<Treatment> getAllTreatments() {
        List<Treatment> treatments = new ArrayList<>();
        String sql = "SELECT * FROM treatments ORDER BY treatment_name";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                treatments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return treatments;
    }

    public Treatment getTreatmentById(int id) {
        String sql = "SELECT * FROM treatments WHERE treatment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
                return null;
    }

    public boolean createTreatment(Treatment treatment) {
        String sql = "INSERT INTO treatments (treatment_name, treatment_code, base_cost, consultation_fee, description) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, treatment.getTreatmentName());
            ps.setString(2, treatment.getTreatmentCode());
            ps.setDouble(3, treatment.getBaseCost());
            ps.setDouble(4, treatment.getConsultationFee());
            ps.setString(5, treatment.getDescription());
            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        treatment.setTreatmentId(keys.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            // Duplicate treatment_code or other constraint violation -> false
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateTreatment(Treatment treatment) {
        String sql = "UPDATE treatments SET treatment_name = ?, treatment_code = ?, base_cost = ?, consultation_fee = ?, description = ? WHERE treatment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, treatment.getTreatmentName());
            ps.setString(2, treatment.getTreatmentCode());
            ps.setDouble(3, treatment.getBaseCost());
            ps.setDouble(4, treatment.getConsultationFee());
            ps.setString(5, treatment.getDescription());
            ps.setInt(6, treatment.getTreatmentId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteTreatment(int treatmentId) {
        String sql = "DELETE FROM treatments WHERE treatment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, treatmentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            // FK constraint (e.g. referenced by appointments) -> false
            e.printStackTrace();
        }
        return false;
    }

    private Treatment mapResultSet(ResultSet rs) throws SQLException {
        Treatment t = new Treatment();
        t.setTreatmentId(rs.getInt("treatment_id"));
        t.setTreatmentName(rs.getString("treatment_name"));
        t.setTreatmentCode(rs.getString("treatment_code"));
        t.setBaseCost(rs.getDouble("base_cost"));
        t.setConsultationFee(rs.getDouble("consultation_fee"));
        t.setDescription(rs.getString("description"));
        return t;
    }
}
