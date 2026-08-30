/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.model.Dentist;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author User
 */
public class DentistDAO {

    public List<Dentist> getAllDentists() {
        List<Dentist> dentists = new ArrayList<>();
        String sql = "SELECT * FROM dentists WHERE is_active = TRUE";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                dentists.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return dentists;
    }

    public int getDentistIdByFullName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return 0;
        }
        String sql = "SELECT dentist_id FROM dentists WHERE dentists.dentist_name = ? LIMIT 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fullName.trim());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("dentist_id");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public Dentist getDentistByFullName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return null;
        }
        String sql = "SELECT * FROM dentists WHERE dentist_name = ? LIMIT 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fullName.trim());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Creates the dentist record if it does not exist, otherwise updates its
     * specialization and contact details. Used when a DENTIST user account is
     * created or edited from user management so the clinic's dentist list
     * stays in sync with user accounts.
     */
    public boolean upsertDentist(String dentistName, String specialization,
                                 String contactNumber, String email) {
        if (dentistName == null || dentistName.trim().isEmpty()) {
            return false;
        }
        String name = dentistName.trim();
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            int existingId = getDentistIdByFullName(name);
            if (existingId > 0) {
                String sql = "UPDATE dentists SET specialization = ?, contact_number = ?, email = ? WHERE dentist_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, specialization);
                    ps.setString(2, contactNumber);
                    ps.setString(3, email);
                    ps.setInt(4, existingId);
                    return ps.executeUpdate() > 0;
                }
            }
            String sql = "INSERT INTO dentists (dentist_name, specialization, contact_number, email) VALUES (?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, name);
                ps.setString(2, specialization);
                ps.setString(3, contactNumber);
                ps.setString(4, email);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public Dentist getDentistById(int id) {
        String sql = "SELECT * FROM dentists WHERE dentist_id = ?";
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

    /**
     * Deletes the dentist record that matches the given name.
     * Used when a DENTIST user account is deleted from user management
     * so the clinic's dentist list stays in sync.
     */
    public boolean deleteDentistByName(String dentistName) {
        if (dentistName == null || dentistName.trim().isEmpty()) {
            return false;
        }
        String sql = "DELETE FROM dentists WHERE dentist_name = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, dentistName.trim());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Renames a dentist record (used when a DENTIST user account changes its
     * full name so the dentist record keeps pointing at the same account).
     */
    public boolean updateDentistName(String oldName, String newName) {
        if (oldName == null || newName == null
                || oldName.trim().isEmpty() || newName.trim().isEmpty()) {
            return false;
        }
        String sql = "UPDATE dentists SET dentist_name = ? WHERE dentist_name = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newName.trim());
            ps.setString(2, oldName.trim());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Activates or deactivates a dentist record by name. Used when a user's
     * role changes away from DENTIST so they no longer appear in dentist lists.
     */
    public boolean setDentistActiveByName(String dentistName, boolean active) {
        if (dentistName == null || dentistName.trim().isEmpty()) {
            return false;
        }
        String sql = "UPDATE dentists SET is_active = ? WHERE dentist_name = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, active);
            ps.setString(2, dentistName.trim());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private Dentist mapResultSet(ResultSet rs) throws SQLException {
        Dentist d = new Dentist();
        d.setDentistId(rs.getInt("dentist_id"));
        d.setDentistName(rs.getString("dentist_name"));
        d.setSpecialization(rs.getString("specialization"));
        d.setContactNumber(rs.getString("contact_number"));
        d.setEmail(rs.getString("email"));
        d.setActive(rs.getBoolean("is_active"));
        return d;
    }
}
