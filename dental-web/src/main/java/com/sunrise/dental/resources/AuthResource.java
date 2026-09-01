/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.DentistDAO;
import com.sunrise.dental.dao.UserDAO;
import com.sunrise.dental.dto.LoginRequestDTO;
import com.sunrise.dental.dto.LoginResponseDTO;
import com.sunrise.dental.dto.ProfileUpdateRequestDTO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.TokenStore;
import com.sunrise.dental.util.PermissionUtil;
import com.sunrise.dental.util.ValidationUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
/**
 *
 * @author User
 */
@Path("auth")
public class AuthResource {
    private final Gson gson = new Gson();
    private final UserDAO userDAO = new UserDAO();
    private final DentistDAO dentistDAO = new DentistDAO();

    @POST
    @Path("login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(String json) {
        try {
            LoginRequestDTO request = gson.fromJson(json, LoginRequestDTO.class);

            if (request.getUsername() == null || request.getPassword() == null) {
                return ResponseUtil.badRequest("Username and password are required");
            }

            User user = userDAO.authenticate(request.getUsername(), request.getPassword());

            if (user == null) {
                return ResponseUtil.unauthorized("Invalid username or password");
            }

            // Account exists with correct credentials but has been deactivated.
            if (!user.isActive()) {
                return ResponseUtil.forbidden("Your account has been deactivated. Please contact the administrator.");
            }

            // For DENTIST role, resolve the matching dentist record by full name.
            if ("DENTIST".equals(user.getRole())) {
                user.setDentistId(dentistDAO.getDentistIdByFullName(user.getFullName()));
            }

            LoginResponseDTO response = new LoginResponseDTO();
            response.setSuccess(true);
            response.setMessage("Login successful");
            String rawToken = UUID.randomUUID().toString();
            response.setToken("Bearer " + rawToken);
            response.setUsername(user.getUsername());
            response.setFullName(user.getFullName());
            response.setRole(user.getRole());
            response.setDentistId(user.getDentistId());
            response.setPermissions(PermissionUtil.resolvePermissions(user.getRole(), user.getPermissions()));
            TokenStore.put(rawToken, user);

            return ResponseUtil.success(response);

        } catch (Exception e) {
            return ResponseUtil.serverError("Login error: " + e.getMessage());
        }
    }
    // GET - Test endpoint (browser eken check karanna)
    @GET
    @Path("login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response loginGet() {
        return ResponseUtil.success("{\"message\":\"Use POST method with JSON body: {\\\"username\\\":\\\"admin\\\",\\\"password\\\":\\\"admin123\\\"}\"}");
    }

    private User getLoggedInUser(HttpServletRequest request) {
        if (request == null) return null;
        Object attr = request.getAttribute("authenticatedUser");
        return (attr instanceof User) ? (User) attr : null;
    }

    /**
     * Allow the logged-in user to update their own profile:
     * full name and optionally their password.
     */
    @PUT
    @Path("profile")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateProfile(@Context HttpServletRequest request, String json) {
        User loggedIn = getLoggedInUser(request);
        if (loggedIn == null) {
            return ResponseUtil.unauthorized("Unauthorized - Please log in");
        }
        try {
            ProfileUpdateRequestDTO dto = gson.fromJson(json, ProfileUpdateRequestDTO.class);
            if (dto == null) {
                return ResponseUtil.badRequest("Request body is required");
            }
            if (ValidationUtil.isNullOrEmpty(dto.getUsername())) {
                return ResponseUtil.badRequest("Username is required");
            }
            if (ValidationUtil.isNullOrEmpty(dto.getFullName())) {
                return ResponseUtil.badRequest("Full name is required");
            }
            String newUsername = dto.getUsername().trim();
            if (loggedIn.getUserId() != 0) {
                // Ensure the username is not already used by another account.
                // Uniqueness is enforced only when we can identify the caller.
                User nameOwner = userDAO.getUserByUsername(newUsername);
                if (nameOwner != null && nameOwner.getUserId() != loggedIn.getUserId()) {
                    return ResponseUtil.badRequest("Username already exists");
                }
            }
            String newPassword = dto.getNewPassword() == null ? null : dto.getNewPassword().trim();
            if (newPassword != null && !newPassword.isEmpty() && newPassword.length() < 4) {
                return ResponseUtil.badRequest("Password must be at least 4 characters");
            }
            String newContact = dto.getContactNumber() == null ? null : dto.getContactNumber().trim();
            if (!ValidationUtil.isNullOrEmpty(newContact)
                    && !ValidationUtil.isValidPhone(newContact)) {
                return ResponseUtil.badRequest("Invalid contact number");
            }
            String newEmail = dto.getEmail() == null ? null : dto.getEmail().trim();
            if (!ValidationUtil.isNullOrEmpty(newEmail)
                    && !ValidationUtil.isValidEmail(newEmail)) {
                return ResponseUtil.badRequest("Invalid email address");
            }
            newContact = ValidationUtil.isNullOrEmpty(newContact) ? null : newContact;
            newEmail = ValidationUtil.isNullOrEmpty(newEmail) ? null : newEmail;

            boolean isDentist = "DENTIST".equals(loggedIn.getRole());
            String newSpecialization = dto.getSpecialization() == null ? null : dto.getSpecialization().trim();
            if (isDentist && ValidationUtil.isNullOrEmpty(newSpecialization)) {
                return ResponseUtil.badRequest("Specialization is required for dentists");
            }

            boolean updated = userDAO.updateOwnProfile(
                    loggedIn.getUserId(),
                    newUsername,
                    dto.getFullName().trim(),
                    newContact,
                    newEmail,
                    newPassword);

            if (!updated) {
                return ResponseUtil.badRequest("Failed to update profile");
            }

            // Reflect the change in the in-memory session (same object reference).
            loggedIn.setUsername(newUsername);
            loggedIn.setFullName(dto.getFullName().trim());
            loggedIn.setContactNumber(newContact);
            loggedIn.setEmail(newEmail);
            loggedIn.setPassword(null);

            if (isDentist) {
                // Keep the dentist record (specialization + contact) in sync.
                dentistDAO.upsertDentist(
                        loggedIn.getFullName(),
                        newSpecialization,
                        newContact,
                        newEmail);
            }

            User updatedUser = new User(
                    loggedIn.getUserId(),
                    loggedIn.getUsername(),
                    loggedIn.getFullName(),
                    loggedIn.getRole());
            updatedUser.setDentistId(loggedIn.getDentistId());
            updatedUser.setPermissions(loggedIn.getPermissions());
            updatedUser.setActive(loggedIn.isActive());
            updatedUser.setContactNumber(loggedIn.getContactNumber());
            updatedUser.setEmail(loggedIn.getEmail());
            if (isDentist) {
                updatedUser.setDentistId(dentistDAO.getDentistIdByFullName(loggedIn.getFullName()));
                updatedUser.setSpecialization(newSpecialization);
            }

            return ResponseUtil.success(new ApiResponseDTO(true,
                    "Profile updated successfully", updatedUser));
        } catch (Exception e) {
            return ResponseUtil.serverError("Profile update error: " + e.getMessage());
        }
    }

    /**
     * Returns the logged-in user's own profile, including the specialization
     * for dentists, so the profile form can be prefilled.
     */
    @GET
    @Path("profile")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfile(@Context HttpServletRequest request) {
        User loggedIn = getLoggedInUser(request);
        if (loggedIn == null) {
            return ResponseUtil.unauthorized("Unauthorized - Please log in");
        }
        try {
            User profile = new User(
                    loggedIn.getUserId(),
                    loggedIn.getUsername(),
                    loggedIn.getFullName(),
                    loggedIn.getRole());
            profile.setContactNumber(loggedIn.getContactNumber());
            profile.setEmail(loggedIn.getEmail());
            profile.setDentistId(loggedIn.getDentistId());
            if ("DENTIST".equals(loggedIn.getRole())) {
                com.sunrise.dental.model.Dentist dentist =
                        dentistDAO.getDentistByFullName(loggedIn.getFullName());
                if (dentist != null) {
                    profile.setDentistId(dentist.getDentistId());
                    profile.setSpecialization(dentist.getSpecialization());
                }
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "Profile retrieved", profile));
        } catch (Exception e) {
            return ResponseUtil.serverError("Profile error: " + e.getMessage());
        }
    }

    /**
     * Returns the logged-in user's CURRENT permissions, re-read from the DB.
     * Used by the frontend to pick up User Access Control changes in real time
     * (without re-login). Also refreshes the in-memory session so backend
     * permission checks stay in sync.
     */
    @GET
    @Path("permissions")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPermissions(@Context HttpServletRequest request) {
        User loggedIn = getLoggedInUser(request);
        if (loggedIn == null) {
            return ResponseUtil.unauthorized("Unauthorized - Please log in");
        }
        try {
            User fresh = userDAO.getUserById(loggedIn.getUserId());
            if (fresh == null || !fresh.isActive()) {
                return ResponseUtil.unauthorized("Your account is no longer active");
            }
            java.util.List<String> permissions =
                    PermissionUtil.resolvePermissions(fresh.getRole(), fresh.getPermissions());

            // Keep the in-memory session in sync with the DB.
            loggedIn.setPermissions(fresh.getPermissions());

            com.sunrise.dental.dto.ApiResponseDTO body =
                    new com.sunrise.dental.dto.ApiResponseDTO(true, "Permissions retrieved",
                            java.util.Collections.singletonMap("permissions", permissions));
            return ResponseUtil.success(body);
        } catch (Exception e) {
            return ResponseUtil.serverError("Permissions error: " + e.getMessage());
        }
    }
}
