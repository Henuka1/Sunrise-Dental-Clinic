/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.model;

/**
 *
 * @author User
 */
public class Treatment {
    private int treatmentId;
    private String treatmentName;
    private String treatmentCode;
    private double baseCost;
    private double consultationFee;
    private String description;

    public Treatment() {}

    public Treatment(int treatmentId, String treatmentName, String treatmentCode, double baseCost, double consultationFee, String description) {
        this.treatmentId = treatmentId;
        this.treatmentName = treatmentName;
        this.treatmentCode = treatmentCode;
        this.baseCost = baseCost;
        this.consultationFee = consultationFee;
        this.description = description;
    }

    public int getTreatmentId() { return treatmentId; }
    public void setTreatmentId(int treatmentId) { this.treatmentId = treatmentId; }
    public String getTreatmentName() { return treatmentName; }
    public void setTreatmentName(String treatmentName) { this.treatmentName = treatmentName; }
    public String getTreatmentCode() { return treatmentCode; }
    public void setTreatmentCode(String treatmentCode) { this.treatmentCode = treatmentCode; }
    public double getBaseCost() { return baseCost; }
    public void setBaseCost(double baseCost) { this.baseCost = baseCost; }
    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double consultationFee) { this.consultationFee = consultationFee; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
