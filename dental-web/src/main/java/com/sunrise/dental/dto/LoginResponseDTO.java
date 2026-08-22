/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dto;

/**
 *
 * @author User
 */
public class LoginResponseDTO {
    private boolean success;
    private String message;
    private String token;
    private String username;
    private String fullName;
    private String role;
    private int dentistId;
    private java.util.List<String> permissions;

    public LoginResponseDTO() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getDentistId() { return dentistId; }
    public void setDentistId(int dentistId) { this.dentistId = dentistId; }
    public java.util.List<String> getPermissions() { return permissions; }
    public void setPermissions(java.util.List<String> permissions) { this.permissions = permissions; }
}