/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.TreatmentDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.Treatment;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.ValidationUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
/**
 *
 * @author User
 */
@Path("treatments")
public class TreatmentResource {
    private final Gson gson = new Gson();
    private final TreatmentDAO treatmentDAO = new TreatmentDAO();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllTreatments() {
        return ResponseUtil.success(new ApiResponseDTO(true, "Treatments retrieved", treatmentDAO.getAllTreatments()));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getTreatment(@PathParam("id") int id) {
        var treatment = treatmentDAO.getTreatmentById(id);
        if (treatment == null) {
            return ResponseUtil.notFound("Treatment not found");
        }
                return ResponseUtil.success(new ApiResponseDTO(true, "Treatment found", treatment));
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createTreatment(String json) {
        try {
            Treatment treatment = gson.fromJson(json, Treatment.class);
            if (ValidationUtil.isNullOrEmpty(treatment.getTreatmentName())) {
                return ResponseUtil.badRequest("Treatment name is required");
            }
            if (ValidationUtil.isNullOrEmpty(treatment.getTreatmentCode())) {
                return ResponseUtil.badRequest("Treatment code is required");
            }
            boolean created = treatmentDAO.createTreatment(treatment);
            if (!created) {
                return ResponseUtil.badRequest("Failed to create treatment (treatment code may already exist)");
            }
            return ResponseUtil.created(new ApiResponseDTO(true, "Treatment created successfully", treatment));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateTreatment(@PathParam("id") int id, String json) {
        try {
            Treatment treatment = gson.fromJson(json, Treatment.class);
            treatment.setTreatmentId(id);
            if (ValidationUtil.isNullOrEmpty(treatment.getTreatmentName())) {
                return ResponseUtil.badRequest("Treatment name is required");
            }
            if (ValidationUtil.isNullOrEmpty(treatment.getTreatmentCode())) {
                return ResponseUtil.badRequest("Treatment code is required");
            }
            boolean updated = treatmentDAO.updateTreatment(treatment);
            if (!updated) {
                return ResponseUtil.notFound("Treatment not found or failed to update");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Treatment updated successfully", treatment));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @DELETE
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteTreatment(@PathParam("id") int id) {
        boolean deleted = treatmentDAO.deleteTreatment(id);
        if (!deleted) {
            return ResponseUtil.notFound("Treatment not found or could not be deleted (it may be in use by appointments)");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Treatment deleted successfully", id));
    }
}
