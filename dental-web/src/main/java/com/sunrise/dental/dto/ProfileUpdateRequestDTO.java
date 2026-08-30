package com.sunrise.dental.dto;

/**
 * Request body for a user updating their own profile.
 * @author User
 */
public class ProfileUpdateRequestDTO {
    private String username;
    private String fullName;
    private String newPassword;
    private String contactNumber;
    private String email;
    private String specialization;

    public ProfileUpdateRequestDTO() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
}