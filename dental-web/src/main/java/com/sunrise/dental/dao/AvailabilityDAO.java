package com.sunrise.dental.dao;

import com.sunrise.dental.model.DentistAvailability;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * CRUD for the dentist_availability table. Each dentist has at most one
 * row per weekday (unique dentist_id + day_of_week).
 */
public class AvailabilityDAO {

    public List<DentistAvailability> getByDentistId(int dentistId) {
        List<DentistAvailability> list = new ArrayList<>();
        String sql = "SELECT * FROM dentist_availability WHERE dentist_id = ? ORDER BY day_of_week";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Replaces the dentist's whole weekly availability in a single
     * transaction (delete existing rows, insert the new schedule).
     * Throws SQLException so callers can surface the real error message.
     */
    public boolean saveAll(int dentistId, List<DentistAvailability> slots) throws SQLException {
        String deleteSql = "DELETE FROM dentist_availability WHERE dentist_id = ?";
        String insertSql = "INSERT INTO dentist_availability "
                + "(dentist_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)";
        Connection conn = null;
        try {
            conn = DBConnection.getInstance().getConnection();
            conn.setAutoCommit(false);
            try (PreparedStatement del = conn.prepareStatement(deleteSql)) {
                del.setInt(1, dentistId);
                del.executeUpdate();
            }
            try (PreparedStatement ins = conn.prepareStatement(insertSql)) {
                for (DentistAvailability s : slots) {
                    ins.setInt(1, dentistId);
                    ins.setInt(2, s.getDayOfWeek());
                    ins.setTime(3, Time.valueOf(normalizeTime(s.getStartTime())));
                    ins.setTime(4, Time.valueOf(normalizeTime(s.getEndTime())));
                    ins.setBoolean(5, s.isAvailable());
                    ins.addBatch();
                }
                ins.executeBatch();
            }
            conn.commit();
            return true;
        } catch (IllegalArgumentException e) {
            // invalid time string — roll back and rethrow with a clear message
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignore) {}
            }
            throw new SQLException("Invalid time value: " + e.getMessage(), e);
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignore) {}
            }
            throw e;
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignore) {}
            }
        }
    }

    /** Accepts "HH:MM", "HH:MM:SS", or values with stray spaces (e.g. " 00: 00") and returns "HH:MM:SS" for Time.valueOf. */
    private String normalizeTime(String time) {
        if (time == null || time.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty time value");
        }
        String t = time.trim().replaceAll("[\\s\\u00A0]+", "");
        String[] parts = t.split(":");
        if (parts.length < 2) {
            throw new IllegalArgumentException("AV2: Time must be in HH:MM format: " + time);
        }
        try {
            int h = Integer.parseInt(parts[0].trim());
            int m = Integer.parseInt(parts[1].trim());
            if (h < 0 || h > 23 || m < 0 || m > 59) {
                throw new IllegalArgumentException("AV1: Invalid time: " + time);
            }
            return String.format("%02d:%02d:00", h, m);
        } catch (NumberFormatException nfe) {
            throw new IllegalArgumentException("AV2: Non-numeric time: " + time);
        }
    }

    private DentistAvailability mapResultSet(ResultSet rs) throws SQLException {
        DentistAvailability a = new DentistAvailability();
        a.setAvailabilityId(rs.getInt("availability_id"));
        a.setDentistId(rs.getInt("dentist_id"));
        a.setDayOfWeek(rs.getInt("day_of_week"));
        Time start = rs.getTime("start_time");
        Time end = rs.getTime("end_time");
        a.setStartTime(start != null ? start.toLocalTime().toString().substring(0, 5) : "");
        a.setEndTime(end != null ? end.toLocalTime().toString().substring(0, 5) : "");
        a.setAvailable(rs.getBoolean("is_available"));
        return a;
    }
}