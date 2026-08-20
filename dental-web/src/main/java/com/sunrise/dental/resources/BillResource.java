/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.AppointmentDAO;
import com.sunrise.dental.dao.BillDAO;
import com.sunrise.dental.dao.TreatmentDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.factory.BillFactory;
import com.sunrise.dental.model.Appointment;
import com.sunrise.dental.model.Bill;
import com.sunrise.dental.model.Treatment;
import com.sunrise.dental.util.ResponseUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
/**
 *
 * @author User
 */
@Path("bills")
public class BillResource {
    private final Gson gson = new Gson();
    private final BillDAO billDAO = new BillDAO();
    private final AppointmentDAO appointmentDAO = new AppointmentDAO();
    private final TreatmentDAO treatmentDAO = new TreatmentDAO();

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response generateBill(String json) {
        try {
            Bill request = gson.fromJson(json, Bill.class);

            Appointment apt = appointmentDAO.getAppointmentById(request.getAppointmentId());
            if (apt == null) {
                return ResponseUtil.notFound("Appointment not found");
            }

            Treatment treatment = treatmentDAO.getTreatmentById(apt.getTreatmentId());
            if (treatment == null) {
                return ResponseUtil.notFound("Treatment not found");
            }

            // Check if bill already exists
            Bill existing = billDAO.getBillByAppointmentId(request.getAppointmentId());
            if (existing != null) {
                return ResponseUtil.badRequest("Bill already generated for this appointment");
            }

            Bill bill = BillFactory.createBill(
                request.getAppointmentId(),
                treatment,
                request.getAdditionalCharges(),
                request.getDiscount()
            );

            String lastBill = billDAO.getLastBillNumber();
            bill.setBillNumber(BillFactory.generateBillNumber(lastBill));

            boolean added = billDAO.addBill(bill);
            if (!added) {
                return ResponseUtil.badRequest("Failed to generate bill");
            }

            // Set display fields
            bill.setAppointmentNumber(apt.getAppointmentNumber());
            bill.setPatientName(apt.getPatientName());

            return ResponseUtil.created(new ApiResponseDTO(true, "Bill generated successfully", bill));

        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getBills(@QueryParam("status") String status) {
        return ResponseUtil.success(new ApiResponseDTO(true, "Bills retrieved", billDAO.getBills(status)));
    }

    @GET
    @Path("appointment/{appointmentId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getBillByAppointment(@PathParam("appointmentId") int appointmentId) {
        Bill bill = billDAO.getBillByAppointmentId(appointmentId);
        if (bill == null) {
            return ResponseUtil.notFound("Bill not found for this appointment");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Bill found", bill));
    }

    @GET
    @Path("pending")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPendingBills() {
        return ResponseUtil.success(new ApiResponseDTO(true, "Pending bills retrieved", billDAO.getPendingBills()));
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updatePaymentAlias(@PathParam("id") int id, String json) {
        return updatePayment(id, json);
    }

    @PUT
    @Path("{id}/pay")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updatePayment(@PathParam("id") int id, String json) {
        try {
            Bill request = gson.fromJson(json, Bill.class);
            boolean updated = billDAO.updatePaymentStatus(id, request.getPaymentStatus(), request.getPaymentMethod());
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update payment");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Payment updated successfully", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }
}


