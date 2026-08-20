/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.TreatmentDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.util.ResponseUtil;
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
}
