package com.sunrise.dental.dao;

import com.sunrise.dental.model.DentistDateAvailability;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * CRUD for the dentist_date_availability table. Each row is a date-range
 * override: either extra working hours or blocked dates (vacation).
 */
public class DateAvailabilityDAO {

    public List<DentistDateAvailability> getByDentistId(int dentistId) {
        List<DentistDateAvailability> list = new ArrayList<>();
        String sql = "SELECT * FROM dentist_date_availability WHERE dentist_id = ? "
                + "ORDER BY start_date, start_time";
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

    /** Returns the override covering the given date, or null. */
    public DentistDateAvailability findCovering(int dentistId, String date) {
        String sql = "SELECT * FROM dentist_date_availability "
                + "WHERE dentist_id = ? AND start_date <= ? AND end_date >= ? "
                + "ORDER BY date_availability_id LIMIT 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, date);
            ps.setString(3, date);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /** True when the dentist already has a range overlapping [startDate, endDate]. */
    public boolean hasOverlap(int dentistId, String startDate, String endDate, int excludeId) {
        String sql = "SELECT COUNT(*) FROM dentist_date_availability "
                + "WHERE dentist_id = ? AND date_availability_id <> ? "
                + "AND start_date <= ? AND end_date >= ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setInt(2, excludeId);
            ps.setString(3, endDate);
            ps.setString(4, startDate);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public int add(DentistDateAvailability a) throws SQLException {
        String sql = "INSERT INTO dentist_date_availability "
                + "(dentist_id, start_date, end_date, start_time, end_time, is_available, reason) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, a.getDentistId());
            ps.setString(2, a.getStartDate());
            ps.setString(3, a.getEndDate());
            ps.setTime(4, Time.valueOf(a.getStartTime() + ":00"));
            ps.setTime(5, Time.valueOf(a.getEndTime() + ":00"));
            ps.setBoolean(6, a.isAvailable());
            ps.setString(7, a.getReason());
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) {
                return keys.getInt(1);
            }
        }
        return -1;
    }

    /** Updates an existing date-range override owned by the dentist. */
    public boolean update(int dentistId, DentistDateAvailability a) throws SQLException {
        String sql = "UPDATE dentist_date_availability "
                + "SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, "
                + "is_available = ?, reason = ? "
                + "WHERE date_availability_id = ? AND dentist_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, a.getStartDate());
            ps.setString(2, a.getEndDate());
            ps.setTime(3, Time.valueOf(a.getStartTime() + ":00"));
            ps.setTime(4, Time.valueOf(a.getEndTime() + ":00"));
            ps.setBoolean(5, a.isAvailable());
            ps.setString(6, a.getReason());
            ps.setInt(7, a.getDateAvailabilityId());
            ps.setInt(8, dentistId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(int dentistId, int dateAvailabilityId) {
        String sql = "DELETE FROM dentist_date_availability "
                + "WHERE date_availability_id = ? AND dentist_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dateAvailabilityId);
            ps.setInt(2, dentistId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private DentistDateAvailability mapResultSet(ResultSet rs) throws SQLException {
        DentistDateAvailability a = new DentistDateAvailability();
        a.setDateAvailabilityId(rs.getInt("date_availability_id"));
        a.setDentistId(rs.getInt("dentist_id"));
        Date start = rs.getDate("start_date");
        Date end = rs.getDate("end_date");
        a.setStartDate(start != null ? start.toString() : "");
        a.setEndDate(end != null ? end.toString() : "");
        Time st = rs.getTime("start_time");
        Time et = rs.getTime("end_time");
        a.setStartTime(st != null ? st.toLocalTime().toString().substring(0, 5) : "09:00");
        a.setEndTime(et != null ? et.toLocalTime().toString().substring(0, 5) : "17:00");
        a.setAvailable(rs.getBoolean("is_available"));
        a.setReason(rs.getString("reason"));
        return a;
    }
}
