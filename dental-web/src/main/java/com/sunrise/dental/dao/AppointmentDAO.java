/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.model.Appointment;
import com.sunrise.dental.model.Treatment;
import com.sunrise.dental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author User
 */
public class AppointmentDAO {

    public List<Appointment> getAppointments(String date, String status) {
        if (date != null && !date.isEmpty()) {
            return getAppointmentsByDateAndStatus(date, status);
        }
        if (status != null && !status.isEmpty()) {
            return getAppointmentsByStatus(status);
        }
        return getAllAppointments();
    }

    public List<Appointment> getAllAppointments() {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "ORDER BY a.appointment_date DESC, a.appointment_time DESC";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getAppointmentsByStatus(String status) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.status = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getAppointmentsByDateAndStatus(String date, String status) {
        if (status == null || status.isEmpty()) {
            return getAppointmentsByDate(date);
        }

        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.appointment_date = ? AND a.status = ? " +
                     "ORDER BY a.appointment_time";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, date);
            ps.setString(2, status);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    /** Appointments of one dentist on a single date (status != CANCELLED). */
    public List<Appointment> getByDentistAndDate(int dentistId, String date) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.dentist_id = ? AND a.appointment_date = ? AND a.status <> 'CANCELLED' " +
                     "ORDER BY a.appointment_time";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, date);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    /** Appointments of one dentist within an inclusive date range (status != CANCELLED). */
    public List<Appointment> getByDentistAndDateRange(int dentistId, String fromDate, String toDate) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.dentist_id = ? AND a.appointment_date BETWEEN ? AND ? " +
                     "AND a.status <> 'CANCELLED' " +
                     "ORDER BY a.appointment_date, a.appointment_time";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, fromDate);
            ps.setString(3, toDate);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> searchAppointments(String query) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE LOWER(p.patient_name) LIKE ? " +
                     "OR p.contact_number LIKE ? " +
                     "OR LOWER(a.appointment_number) LIKE ? " +
                     "ORDER BY a.appointment_date DESC, a.appointment_time DESC";
        String like = "%" + query.toLowerCase() + "%";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, like);
            ps.setString(2, "%" + query + "%");
            ps.setString(3, like);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public Appointment getAppointmentByNumber(String number) {
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.appointment_number = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, number);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapResultSet(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Appointment getAppointmentById(int id) {
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.appointment_id = ?";
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

    public boolean isTimeSlotAvailable(int dentistId, String date, String time) {
        String sql = "SELECT COUNT(*) FROM appointments WHERE dentist_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED'";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, date);
            ps.setString(3, time);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt(1) == 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean addAppointment(Appointment apt) {
        String sql = "INSERT INTO appointments (appointment_number, patient_id, dentist_id, treatment_id, appointment_date, appointment_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, apt.getAppointmentNumber());
            ps.setInt(2, apt.getPatientId());
            ps.setInt(3, apt.getDentistId());
            ps.setInt(4, apt.getTreatmentId());
            ps.setString(5, apt.getAppointmentDate());
            ps.setString(6, apt.getAppointmentTime());
            ps.setString(7, apt.getStatus());
            ps.setString(8, apt.getNotes());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateAppointment(Appointment apt) {
        String sql = "UPDATE appointments SET patient_id = ?, dentist_id = ?, treatment_id = ?, appointment_date = ?, appointment_time = ?, status = ?, notes = ? WHERE appointment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, apt.getPatientId());
            ps.setInt(2, apt.getDentistId());
            ps.setInt(3, apt.getTreatmentId());
            ps.setString(4, apt.getAppointmentDate());
            ps.setString(5, apt.getAppointmentTime());
            ps.setString(6, apt.getStatus());
            ps.setString(7, apt.getNotes());
            ps.setInt(8, apt.getAppointmentId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean cancelAppointment(int id) {
        String sql = "UPDATE appointments SET status = 'CANCELLED' WHERE appointment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateAppointmentStatus(int id, String status, String notes) {
        String sql = "UPDATE appointments SET status = ?, notes = COALESCE(?, notes) WHERE appointment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, notes);
            ps.setInt(3, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateNotes(int id, String notes) {
        String sql = "UPDATE appointments SET notes = ? WHERE appointment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, notes);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public String getLastAppointmentNumber() {
        String sql = "SELECT appointment_number FROM appointments ORDER BY appointment_id DESC LIMIT 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getString("appointment_number");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Appointment> getAppointmentsByDate(String date) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.appointment_date = ? ORDER BY a.appointment_time";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, date);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getAppointmentsByDentist(int dentistId, String fromDate, String toDate) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.dentist_id = ? AND a.appointment_date BETWEEN ? AND ? " +
                     "ORDER BY a.appointment_date, a.appointment_time";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, fromDate);
            ps.setString(3, toDate);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getAppointmentsByPatient(int patientId) {
        List<Appointment> appointments = new ArrayList<>();
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.patient_id = ? ORDER BY a.appointment_date DESC";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, patientId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getAppointmentsByDentistScoped(int dentistId, String date, String status) {
        List<Appointment> appointments = new ArrayList<>();
        if (dentistId <= 0) {
            return appointments;
        }
        StringBuilder sql = new StringBuilder(
                "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                "FROM appointments a " +
                "JOIN patients p ON a.patient_id = p.patient_id " +
                "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                "WHERE a.dentist_id = ?");
        if (date != null && !date.isEmpty()) {
            sql.append(" AND a.appointment_date = ?");
        }
        if (status != null && !status.isEmpty()) {
            sql.append(" AND a.status = ?");
        }
        sql.append(" ORDER BY a.appointment_date DESC, a.appointment_time DESC");

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            int idx = 1;
            ps.setInt(idx++, dentistId);
            if (date != null && !date.isEmpty()) ps.setString(idx++, date);
            if (status != null && !status.isEmpty()) ps.setString(idx++, status);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> searchAppointmentsByDentist(int dentistId, String query) {
        List<Appointment> appointments = new ArrayList<>();
        if (dentistId <= 0) {
            return appointments;
        }
        String sql = "SELECT a.*, p.patient_name, d.dentist_name, t.treatment_name " +
                     "FROM appointments a " +
                     "JOIN patients p ON a.patient_id = p.patient_id " +
                     "JOIN dentists d ON a.dentist_id = d.dentist_id " +
                     "JOIN treatments t ON a.treatment_id = t.treatment_id " +
                     "WHERE a.dentist_id = ? AND (LOWER(p.patient_name) LIKE ? " +
                     "OR p.contact_number LIKE ? OR LOWER(a.appointment_number) LIKE ?) " +
                     "ORDER BY a.appointment_date DESC, a.appointment_time DESC";
        String like = "%" + query.toLowerCase() + "%";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dentistId);
            ps.setString(2, like);
            ps.setString(3, "%" + query + "%");
            ps.setString(4, like);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                appointments.add(mapResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return appointments;
    }

    /** Additional treatments linked to an appointment (many-to-many). */
    public List<Treatment> getAdditionalTreatments(int appointmentId) {
        List<Treatment> treatments = new ArrayList<>();
        String sql = "SELECT t.treatment_id, t.treatment_name, t.treatment_code, t.base_cost, t.consultation_fee, t.description " +
                     "FROM appointment_treatments atx " +
                     "JOIN treatments t ON atx.treatment_id = t.treatment_id " +
                     "WHERE atx.appointment_id = ? ORDER BY t.treatment_name";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                treatments.add(new Treatment(
                        rs.getInt("treatment_id"),
                        rs.getString("treatment_name"),
                        rs.getString("treatment_code"),
                        rs.getDouble("base_cost"),
                        rs.getDouble("consultation_fee"),
                        rs.getString("description")));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return treatments;
    }

    /** Link an additional treatment to an appointment. Returns false if already linked. */
    public boolean addAdditionalTreatment(int appointmentId, int treatmentId) {
        String sql = "INSERT IGNORE INTO appointment_treatments (appointment_id, treatment_id) VALUES (?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, appointmentId);
            ps.setInt(2, treatmentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /** Unlink an additional treatment from an appointment. */
    public boolean removeAdditionalTreatment(int appointmentId, int treatmentId) {
        String sql = "DELETE FROM appointment_treatments WHERE appointment_id = ? AND treatment_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, appointmentId);
            ps.setInt(2, treatmentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private Appointment mapResultSet(ResultSet rs) throws SQLException {
        Appointment a = new Appointment();
        a.setAppointmentId(rs.getInt("appointment_id"));
        a.setAppointmentNumber(rs.getString("appointment_number"));
        a.setPatientId(rs.getInt("patient_id"));
        a.setPatientName(rs.getString("patient_name"));
        a.setDentistId(rs.getInt("dentist_id"));
        a.setDentistName(rs.getString("dentist_name"));
        a.setTreatmentId(rs.getInt("treatment_id"));
        a.setTreatmentName(rs.getString("treatment_name"));
        a.setAppointmentDate(rs.getString("appointment_date"));
        a.setAppointmentTime(rs.getString("appointment_time"));
        a.setStatus(rs.getString("status"));
        a.setNotes(rs.getString("notes"));
        a.setCreatedAt(rs.getString("created_at"));
        return a;
    }
}
