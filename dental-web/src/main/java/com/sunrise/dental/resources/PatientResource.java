/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.AppointmentDAO;
import com.sunrise.dental.dao.PatientDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.Patient;
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
@Path("patients")
public class PatientResource {
    private final Gson gson = new Gson();
    private final PatientDAO patientDAO = new PatientDAO();
    private final AppointmentDAO appointmentDAO = new AppointmentDAO();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllPatients() {
        List<Patient> patients = patientDAO.getAllPatients();
        return ResponseUtil.success(new ApiResponseDTO(true, "Patients retrieved", patients));
    }

    @GET
    @Path("search")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchPatients(@QueryParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseUtil.badRequest("Search query is required");
        }
        List<Patient> patients = patientDAO.searchPatients(query.trim());
        return ResponseUtil.success(new ApiResponseDTO(true, "Patients retrieved", patients));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPatient(@PathParam("id") int id) {
        Patient patient = patientDAO.getPatientById(id);
        if (patient == null) {
            return ResponseUtil.notFound("Patient not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Patient found", patient));
    }

    @GET
    @Path("{id}/history")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPatientHistory(@PathParam("id") int id) {
        return ResponseUtil.success(new ApiResponseDTO(true, "Patient history retrieved", appointmentDAO.getAppointmentsByPatient(id)));
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addPatient(String json) {
        try {
            Patient patient = gson.fromJson(json, Patient.class);

            // Validation
            if (ValidationUtil.isNullOrEmpty(patient.getPatientName())) {
                return ResponseUtil.badRequest("Patient name is required");
            }
            if (!ValidationUtil.isValidPhone(patient.getContactNumber())) {
                return ResponseUtil.badRequest("Valid Sri Lankan phone number required (07XXXXXXXX)");
            }
            if (ValidationUtil.isNullOrEmpty(patient.getAddress()) || patient.getAddress().length() < 10) {
                return ResponseUtil.badRequest("Address must be at least 10 characters");
            }

            boolean added = patientDAO.addPatient(patient);
            if (!added) {
                return ResponseUtil.badRequest("Failed to add patient");
            }

            return ResponseUtil.created(new ApiResponseDTO(true, "Patient added successfully", patient));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updatePatient(@PathParam("id") int id, String json) {
        try {
            Patient patient = gson.fromJson(json, Patient.class);
            patient.setPatientId(id);

            if (ValidationUtil.isNullOrEmpty(patient.getPatientName())) {
                return ResponseUtil.badRequest("Patient name is required");
            }
            if (!ValidationUtil.isValidPhone(patient.getContactNumber())) {
                return ResponseUtil.badRequest("Valid phone number required");
            }

            boolean updated = patientDAO.updatePatient(patient);
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update patient");
            }

            return ResponseUtil.success(new ApiResponseDTO(true, "Patient updated successfully", patient));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }
}