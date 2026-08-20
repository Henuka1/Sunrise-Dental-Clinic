/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.model;

/**
 *
 * @author User
 */
public class Dentist {
    private int dentistId;
    private String dentistName;
    private String specialization;
    private String contactNumber;
    private String email;
    private boolean isActive;

    public Dentist() {}

    public Dentist(int dentistId, String dentistName, String specialization, String contactNumber, String email, boolean isActive) {
        this.dentistId = dentistId;
        this.dentistName = dentistName;
        this.specialization = specialization;
        this.contactNumber = contactNumber;
        this.email = email;
        this.isActive = isActive;
    }

    public int getDentistId() { return dentistId; }
    public void setDentistId(int dentistId) { this.dentistId = dentistId; }
    public String getDentistName() { return dentistName; }
    public void setDentistName(String dentistName) { this.dentistName = dentistName; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
