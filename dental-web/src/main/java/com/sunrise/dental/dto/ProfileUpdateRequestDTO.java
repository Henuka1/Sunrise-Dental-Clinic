package com.sunrise.dental.dto;

/**
 * Request body for a user updating their own profile.
 * @author User
 */
public class ProfileUpdateRequestDTO {
    private String fullName;
    private String newPassword;

    public ProfileUpdateRequestDTO() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}