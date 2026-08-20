/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.model;

/**
 *
 * @author User
 */
public class Patient {
    private int patientId;
    private String patientName;
    private String address;
    private String contactNumber;
    private String email;
    private String dateOfBirth;
    private String gender;
    private String registeredDate;

    public Patient() {}

    public Patient(int patientId, String patientName, String address, String contactNumber, String email, String dateOfBirth, String gender) {
        this.patientId = patientId;
        this.patientName = patientName;
        this.address = address;
        this.contactNumber = contactNumber;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
    }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getRegisteredDate() { return registeredDate; }
    public void setRegisteredDate(String registeredDate) { this.registeredDate = registeredDate; }
}
