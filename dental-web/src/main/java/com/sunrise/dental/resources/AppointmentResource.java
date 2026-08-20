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
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.ValidationUtil;
import jakarta.ws.rs.*;
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

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllAppointments(
            @QueryParam("date") String date,
            @QueryParam("status") String status) {
        List<Appointment> appointments = appointmentDAO.getAppointments(date, status);
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }

    @GET
    @Path("search")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchAppointments(@QueryParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseUtil.badRequest("Search query is required");
        }
        List<Appointment> appointments = appointmentDAO.searchAppointments(query.trim());
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }

    @GET
    @Path("number/{number}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentByNumber(@PathParam("number") String number) {
        if (!ValidationUtil.isValidAppointmentNumber(number)) {
            return ResponseUtil.badRequest("Invalid appointment number format (APT-XXXXX)");
        }
        Appointment apt = appointmentDAO.getAppointmentByNumber(number);
        if (apt == null) {
            return ResponseUtil.notFound("Appointment not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment found", apt));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentById(@PathParam("id") int id) {
        Appointment apt = appointmentDAO.getAppointmentById(id);
        if (apt == null) {
            return ResponseUtil.notFound("Appointment not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment found", apt));
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createAppointment(String json) {
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
    public Response updateAppointment(@PathParam("id") int id, String json) {
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
    public Response cancelAppointment(@PathParam("id") int id) {
        boolean cancelled = appointmentDAO.cancelAppointment(id);
        if (!cancelled) {
            return ResponseUtil.badRequest("Failed to cancel appointment");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointment cancelled successfully", null));
    }

    @PUT
    @Path("{id}/cancel")
    @Produces(MediaType.APPLICATION_JSON)
    public Response cancelAppointmentAlias(@PathParam("id") int id) {
        return cancelAppointment(id);
    }

    @PUT
    @Path("{id}/complete")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response completeAppointment(@PathParam("id") int id, String json) {
        try {
            Appointment request = json == null || json.trim().isEmpty()
                    ? new Appointment()
                    : gson.fromJson(json, Appointment.class);
            boolean completed = appointmentDAO.updateAppointmentStatus(id, "COMPLETED", request.getNotes());
            if (!completed) {
                return ResponseUtil.badRequest("Failed to complete appointment");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Appointment marked as completed", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @GET
    @Path("date/{date}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentsByDate(@PathParam("date") String date) {
        List<Appointment> appointments = appointmentDAO.getAppointmentsByDate(date);
        return ResponseUtil.success(new ApiResponseDTO(true, "Appointments retrieved", appointments));
    }
}
