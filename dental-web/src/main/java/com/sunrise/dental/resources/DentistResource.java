/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sunrise.dental.dao.AvailabilityDAO;
import com.sunrise.dental.dao.DentistDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.DentistAvailability;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
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
@Path("dentists")
public class DentistResource {
    private final Gson gson = new Gson();
    private final DentistDAO dentistDAO = new DentistDAO();
    private final AvailabilityDAO availabilityDAO = new AvailabilityDAO();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllDentists(@QueryParam("includeInactive") boolean includeInactive) {
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentists retrieved",
                dentistDAO.getAllDentists(includeInactive)));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDentist(@PathParam("id") int id) {
        var dentist = dentistDAO.getDentistById(id);
        if (dentist == null) {
            return ResponseUtil.notFound("Dentist not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentist found", dentist));
    }

    /** Weekly availability slots of a dentist (one row per weekday). */
    @GET
    @Path("{id}/availability")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAvailability(@PathParam("id") int id) {
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Availability retrieved", availabilityDAO.getByDentistId(id)));
    }

    /**
     * Saves the full weekly availability of a dentist. A DENTIST account may
     * only save its own availability; ADMIN can save any dentist's schedule.
     */
    @PUT
    @Path("{id}/availability")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveAvailability(@PathParam("id") int id,
                                     String body,
                                     @Context HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && "DENTIST".equals(authUser.getRole())
                && authUser.getDentistId() != id) {
            return ResponseUtil.forbidden("Dentists can only manage their own availability");
        }

        List<DentistAvailability> slots;
        try {
            slots = gson.fromJson(body, new TypeToken<List<DentistAvailability>>(){}.getType());
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid availability data");
        }
        if (slots == null) {
            slots = java.util.Collections.emptyList();
        }

        // Basic validation before persisting.
        for (DentistAvailability s : slots) {
            if (s.getDayOfWeek() < 0 || s.getDayOfWeek() > 6
                    || s.getStartTime() == null || s.getEndTime() == null
                    || s.getStartTime().compareTo(s.getEndTime()) >= 0) {
                return ResponseUtil.badRequest(
                        "Invalid slot: day must be 0-6 and start time must be before end time");
            }
        }

        boolean saved;
        try {
            saved = availabilityDAO.saveAll(id, slots);
        } catch (java.sql.SQLException e) {
            e.printStackTrace();
            return ResponseUtil.serverError("Failed to save availability: " + e.getMessage());
        }
        if (!saved) {
            return ResponseUtil.serverError("Failed to save availability");
        }
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Availability saved", availabilityDAO.getByDentistId(id)));
    }
}
