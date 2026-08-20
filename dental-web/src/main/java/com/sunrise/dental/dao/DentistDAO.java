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
