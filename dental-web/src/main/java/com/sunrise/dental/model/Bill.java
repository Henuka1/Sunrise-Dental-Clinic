/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.model;

/**
 *
 * @author User
 */
public class Bill {
    private int billId;
    private int appointmentId;
    private String appointmentNumber;
    private String patientName;
    private String billNumber;
    private double treatmentCost;
    private double consultationFee;
    private double additionalCharges;
    private double discount;
    private double totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private String billedAt;

    public Bill() {}

    public int getBillId() { return billId; }
    public void setBillId(int billId) { this.billId = billId; }
    public int getAppointmentId() { return appointmentId; }
    public void setAppointmentId(int appointmentId) { this.appointmentId = appointmentId; }
    public String getAppointmentNumber() { return appointmentNumber; }
    public void setAppointmentNumber(String appointmentNumber) { this.appointmentNumber = appointmentNumber; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getBillNumber() { return billNumber; }
    public void setBillNumber(String billNumber) { this.billNumber = billNumber; }
    public double getTreatmentCost() { return treatmentCost; }
    public void setTreatmentCost(double treatmentCost) { this.treatmentCost = treatmentCost; }
    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double consultationFee) { this.consultationFee = consultationFee; }
    public double getAdditionalCharges() { return additionalCharges; }
    public void setAdditionalCharges(double additionalCharges) { this.additionalCharges = additionalCharges; }
    public double getDiscount() { return discount; }
    public void setDiscount(double discount) { this.discount = discount; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getBilledAt() { return billedAt; }
    public void setBilledAt(String billedAt) { this.billedAt = billedAt; }
}