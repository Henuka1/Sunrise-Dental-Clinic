/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.AppointmentDAO;
import com.sunrise.dental.dao.BillDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.Appointment;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 *
 * @author User
 */
@Path("reports")
public class ReportResource {
    private final Gson gson = new Gson();
    private final AppointmentDAO appointmentDAO = new AppointmentDAO();
    private final BillDAO billDAO = new BillDAO();

    private User getUser(HttpServletRequest request) {
        if (request == null) return null;
        Object attr = request.getAttribute("authenticatedUser");
        return (attr instanceof User) ? (User) attr : null;
    }

    private boolean isDentist(User user) {
        return user != null && "DENTIST".equals(user.getRole());
    }

    @GET
    @Path("daily")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDailyReport(@Context HttpServletRequest request, @QueryParam("date") String date) {
        if (isDentist(getUser(request))) {
            return ResponseUtil.forbidden("Dentist role cannot view the daily clinic schedule");
        }
        if (date == null || date.isEmpty()) {
            date = java.time.LocalDate.now().toString();
        }
        Map<String, Object> report = new HashMap<>();
        report.put("date", date);
        report.put("appointments", appointmentDAO.getAppointmentsByDate(date));
        report.put("totalAppointments", appointmentDAO.getAppointmentsByDate(date).size());
        return ResponseUtil.success(new ApiResponseDTO(true, "Daily report generated", report));
    }

    @GET
    @Path("revenue")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getRevenueReport(
            @Context HttpServletRequest request,
            @QueryParam("from") String fromDate,
            @QueryParam("to") String toDate,
            @QueryParam("fromDate") String fromDateAlt,
            @QueryParam("toDate") String toDateAlt) {
        if (isDentist(getUser(request))) {
            return ResponseUtil.forbidden("Dentist role cannot view revenue reports");
        }
        if ((fromDate == null || fromDate.isEmpty()) && fromDateAlt != null && !fromDateAlt.isEmpty()) {
            fromDate = fromDateAlt;
        }
        if ((toDate == null || toDate.isEmpty()) && toDateAlt != null && !toDateAlt.isEmpty()) {
            toDate = toDateAlt;
        }
        if (fromDate == null || toDate == null) {
            return ResponseUtil.badRequest("From and To dates are required");
        }
        double totalRevenue = billDAO.getTotalRevenue(fromDate, toDate);
        Map<String, Object> report = new HashMap<>();
        report.put("fromDate", fromDate);
        report.put("toDate", toDate);
        report.put("totalRevenue", totalRevenue);
        return ResponseUtil.success(new ApiResponseDTO(true, "Revenue report generated", report));
    }

    @GET
    @Path("dentist/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDentistWorkload(
            @Context HttpServletRequest request,
            @PathParam("id") int dentistId,
            @QueryParam("from") String fromDate,
            @QueryParam("to") String toDate) {
        if (isDentist(getUser(request)) && getUser(request).getDentistId() != dentistId) {
            return ResponseUtil.forbidden("Dentist role can only view their own workload report");
        }
        if (fromDate == null || toDate == null) {
            return ResponseUtil.badRequest("From and To dates are required");
        }
        var appointments = appointmentDAO.getAppointmentsByDentist(dentistId, fromDate, toDate);
        Map<String, Object> report = new HashMap<>();
        report.put("dentistId", dentistId);
        report.put("fromDate", fromDate);
        report.put("toDate", toDate);
        report.put("totalAppointments", appointments.size());
        report.put("appointments", appointments);
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentist workload report generated", report));
    }

    @GET
    @Path("dentist")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDentistWorkloadByQuery(
            @Context HttpServletRequest request,
            @QueryParam("dentistId") int dentistId,
            @QueryParam("fromDate") String fromDate,
            @QueryParam("toDate") String toDate) {
        if (isDentist(getUser(request)) && getUser(request).getDentistId() != dentistId) {
            return ResponseUtil.forbidden("Dentist role can only view their own workload report");
        }
        if (dentistId <= 0) {
            return ResponseUtil.badRequest("Valid dentistId is required");
        }
        if (fromDate == null || toDate == null) {
            return ResponseUtil.badRequest("From and To dates are required");
        }
        var appointments = appointmentDAO.getAppointmentsByDentist(dentistId, fromDate, toDate);
        Map<String, Object> report = new HashMap<>();
        report.put("dentistId", dentistId);
        report.put("fromDate", fromDate);
        report.put("toDate", toDate);
        report.put("totalAppointments", appointments.size());
        report.put("appointments", appointments);
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentist workload report generated", report));
    }

    @GET
    @Path("patient/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPatientHistory(@Context HttpServletRequest request, @PathParam("id") int patientId) {
        List<Appointment> appointments = appointmentDAO.getAppointmentsByPatient(patientId);
        if (isDentist(getUser(request))) {
            User dentist = getUser(request);
            boolean owned = false;
            if (dentist != null) {
                for (Appointment apt : appointments) {
                    if (apt.getDentistId() == dentist.getDentistId()) { owned = true; break; }
                }
            }
            if (!owned) {
                return ResponseUtil.notFound("Patient history not found");
            }
        }
        Map<String, Object> report = new HashMap<>();
        report.put("patientId", patientId);
        report.put("totalVisits", appointments.size());
        report.put("appointments", appointments);
        return ResponseUtil.success(new ApiResponseDTO(true, "Patient history report generated", report));
    }

    @GET
    @Path("pending-bills")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPendingBillsReport(@Context HttpServletRequest request) {
        if (isDentist(getUser(request))) {
            return ResponseUtil.forbidden("Dentist role cannot view pending bills");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Pending bills report", billDAO.getPendingBills()));
    }
}

