/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.AppointmentDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.factory.BillFactory;
import com.sunrise.dental.model.Appointment;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.ValidationUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
/**
 *
 * @author User
 */
@Path("appointments")
public class AppointmentResource {
    private final Gson gson = new Gson();
    private final AppointmentDAO appointmentDAO = new AppointmentDAO();

    private User getLoggedInUser(HttpServletRequest request) {
        if (request == null) return null;
        Object attr = request.getAttribute("authenticatedUser");
        return (attr instanceof User) ? (User) attr : null;
    }

    private boolean isDentist(User user) {
        return user != null && "DENTIST".equals(user.getRole());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllAppointments(
            @Context HttpServletRequest request,
            @QueryParam("date") String date,
            @QueryParam("status") String status) {
        User loggedIn = getLoggedInUser(request);
        List<Appointment> appointments;
        if (isDentist(loggedIn)) {
            appointments = appointmentDAO.getAppointmentsByDentistScoped(loggedIn.getDentistId(), date, status);
        } else {
            appointments = appointmentDAO.getAppointments(date, status);
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }

    @GET
    @Path("search")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchAppointments(@Context HttpServletRequest request, @QueryParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseUtil.badRequest("Search query is required");
        }
        User dentist = getLoggedInUser(request);
        List<Appointment> appointments;
        if (isDentist(dentist)) {
            appointments = appointmentDAO.searchAppointmentsByDentist(dentist.getDentistId(), query.trim());
        } else {
            appointments = appointmentDAO.searchAppointments(query.trim());
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }

    @GET
    @Path("number/{number}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentByNumber(@Context HttpServletRequest request, @PathParam("number") String number) {
        if (!ValidationUtil.isValidAppointmentNumber(number)) {
            return ResponseUtil.badRequest("Invalid appointment number format (APT-XXXXX)");
        }
        Appointment apt = appointmentDAO.getAppointmentByNumber(number);
        if (apt == null) {
            return ResponseUtil.notFound("Appointment not found");
        }
        User loggedIn = getLoggedInUser(request);
        if (isDentist(loggedIn) && loggedIn.getDentistId() != apt.getDentistId()) {
            return ResponseUtil.notFound("Appointment not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment found", apt));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentById(@Context HttpServletRequest request, @PathParam("id") int id) {
        Appointment apt = appointmentDAO.getAppointmentById(id);
        if (apt == null) {
            return ResponseUtil.notFound("Appointment not found");
        }
        User dentist = getLoggedInUser(request);
        if (isDentist(dentist) && dentist.getDentistId() != apt.getDentistId()) {
            return ResponseUtil.notFound("Appointment not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment found", apt));
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createAppointment(@Context HttpServletRequest request, String json) {
        if (isDentist(getLoggedInUser(request))) {
            return ResponseUtil.forbidden("Dentist role cannot create appointments");
        }
        try {
            Appointment apt = gson.fromJson(json, Appointment.class);

            // Validation
            if (apt.getPatientId() <= 0) {
                return ResponseUtil.badRequest("Valid patient ID is required");
            }
            if (apt.getDentistId() <= 0) {
                return ResponseUtil.badRequest("Valid dentist ID is required");
            }
            if (apt.getTreatmentId() <= 0) {
                return ResponseUtil.badRequest("Valid treatment ID is required");
            }
            if (!ValidationUtil.isValidDateRange(apt.getAppointmentDate())) {
                return ResponseUtil.badRequest("Date must be today or within next 90 days");
            }
            if (!ValidationUtil.isValidTime(apt.getAppointmentTime())) {
                return ResponseUtil.badRequest("Time must be between 08:00 and 18:00");
            }

            // Check for duplicate booking
            if (!appointmentDAO.isTimeSlotAvailable(apt.getDentistId(), apt.getAppointmentDate(), apt.getAppointmentTime())) {
                return ResponseUtil.badRequest("This time slot is already booked for the selected dentist");
            }

            // Generate appointment number
            String lastNum = appointmentDAO.getLastAppointmentNumber();
            apt.setAppointmentNumber(BillFactory.generateAppointmentNumber(lastNum));
            apt.setStatus("SCHEDULED");

            boolean added = appointmentDAO.addAppointment(apt);
            if (!added) {
                return ResponseUtil.badRequest("Failed to create appointment");
            }

            return ResponseUtil.created(new ApiResponseDTO(true, "Appointment created successfully", apt));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateAppointment(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        if (isDentist(getLoggedInUser(request))) {
            // Dentist must not edit appointment details (only status via dedicated endpoints).
            return ResponseUtil.forbidden("Dentist role can only update appointment status");
        }
        try {
            Appointment apt = gson.fromJson(json, Appointment.class);
            apt.setAppointmentId(id);

            boolean updated = appointmentDAO.updateAppointment(apt);
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update appointment");
            }

            return ResponseUtil.success(new ApiResponseDTO(true, "Appointment updated successfully", apt));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @DELETE
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response cancelAppointment(@Context HttpServletRequest request, @PathParam("id") int id) {
        if (isDentist(getLoggedInUser(request))) {
            return ResponseUtil.forbidden("Dentist role cannot cancel appointments");
        }
        boolean cancelled = appointmentDAO.cancelAppointment(id);
        if (!cancelled) {
            return ResponseUtil.badRequest("Failed to cancel appointment");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment cancelled successfully", null));
    }

    @PUT
    @Path("{id}/cancel")
    @Produces(MediaType.APPLICATION_JSON)
    public Response cancelAppointmentAlias(@Context HttpServletRequest request, @PathParam("id") int id) {
        return cancelAppointment(request, id);
    }

    @PUT
    @Path("{id}/complete")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response completeAppointment(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        User dentist = getLoggedInUser(request);
        if (isDentist(dentist) && !ownsAppointment(dentist, id)) {
            return ResponseUtil.notFound("Appointment not found");
        }
        try {
            Appointment requestJson = json == null || json.trim().isEmpty()
                    ? new Appointment()
                    : gson.fromJson(json, Appointment.class);
            boolean completed = appointmentDAO.updateAppointmentStatus(id, "COMPLETED", requestJson.getNotes());
            if (!completed) {
                return ResponseUtil.badRequest("Failed to complete appointment");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Appointment marked as completed", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}/no-show")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response noShowAppointment(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        User dentist = getLoggedInUser(request);
        if (isDentist(dentist) && !ownsAppointment(dentist, id)) {
            return ResponseUtil.notFound("Appointment not found");
        }
        try {
            Appointment requestJson = json == null || json.trim().isEmpty()
                    ? new Appointment()
                    : gson.fromJson(json, Appointment.class);
            boolean updated = appointmentDAO.updateAppointmentStatus(id, "NO_SHOW", requestJson.getNotes());
            if (!updated) {
                return ResponseUtil.badRequest("Failed to mark appointment as no-show");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Appointment marked as no-show", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}/check-in")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response checkInAppointment(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        User dentist = getLoggedInUser(request);
        if (isDentist(dentist) && !ownsAppointment(dentist, id)) {
            return ResponseUtil.notFound("Appointment not found");
        }
        try {
            Appointment requestJson = json == null || json.trim().isEmpty()
                    ? new Appointment()
                    : gson.fromJson(json, Appointment.class);
            boolean updated = appointmentDAO.updateAppointmentStatus(id, "CHECKED_IN", requestJson.getNotes());
            if (!updated) {
                return ResponseUtil.badRequest("Failed to check in appointment");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Appointment checked in successfully", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    private boolean ownsAppointment(User dentist, int appointmentId) {
        if (dentist == null || dentist.getDentistId() <= 0) return false;
        Appointment apt = appointmentDAO.getAppointmentById(appointmentId);
        return apt != null && apt.getDentistId() == dentist.getDentistId();
    }

    @GET
    @Path("date/{date}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentsByDate(@Context HttpServletRequest request, @PathParam("date") String date) {
        User dentist = getLoggedInUser(request);
        List<Appointment> appointments;
        if (isDentist(dentist)) {
            appointments = appointmentDAO.getAppointmentsByDentistScoped(dentist.getDentistId(), date, null);
        } else {
            appointments = appointmentDAO.getAppointmentsByDate(date);
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }
}
