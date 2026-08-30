/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.DentistDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.util.ResponseUtil;
import jakarta.ws.rs.*;
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
}
