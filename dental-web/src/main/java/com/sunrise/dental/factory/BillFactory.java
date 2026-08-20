/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.factory;

import com.sunrise.dental.model.Bill;
import com.sunrise.dental.model.Treatment;
/**
 *
 * @author User
 */
public class BillFactory {

    public static Bill createBill(int appointmentId, Treatment treatment, double additionalCharges, double discount) {
        Bill bill = new Bill();
        bill.setAppointmentId(appointmentId);
        bill.setTreatmentCost(treatment.getBaseCost());
        bill.setConsultationFee(treatment.getConsultationFee());
        bill.setAdditionalCharges(additionalCharges);
        bill.setDiscount(discount);

        double total = treatment.getBaseCost() + treatment.getConsultationFee() + additionalCharges - discount;
        bill.setTotalAmount(Math.max(total, 0));
        bill.setPaymentStatus("PENDING");
        bill.setPaymentMethod("CASH");

        return bill;
    }

    public static String generateBillNumber(String lastBillNumber) {
        if (lastBillNumber == null) {
            return "BILL-00001";
        }
        int num = Integer.parseInt(lastBillNumber.substring(5));
        return String.format("BILL-%05d", num + 1);
    }

    public static String generateAppointmentNumber(String lastNumber) {
        if (lastNumber == null) {
            return "APT-00001";
        }
        int num = Integer.parseInt(lastNumber.substring(4));
        return String.format("APT-%05d", num + 1);
    }
}