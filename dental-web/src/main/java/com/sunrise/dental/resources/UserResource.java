/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.DentistDAO;
import com.sunrise.dental.dao.UserDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.ValidationUtil;
import com.sunrise.dental.util.PermissionUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
/**
 *
 * @author User
 */
@Path("users")
public class UserResource {
    private final Gson gson = new Gson();
    private final UserDAO userDAO = new UserDAO();
    private final DentistDAO dentistDAO = new DentistDAO();

    /**
     * Keeps the dentists table in sync with DENTIST user accounts.
     * Creates the dentist record when missing and stores the specialization.
     */
    private void syncDentistRecord(User user) {
        if (!"DENTIST".equals(user.getRole())) {
            return;
        }
        dentistDAO.upsertDentist(
                user.getFullName(),
                user.getSpecialization(),
                user.getContactNumber(),
                user.getEmail());
    }

    private User getLoggedInUser(HttpServletRequest request) {
        if (request == null) return null;
        Object attr = request.getAttribute("authenticatedUser");
        return (attr instanceof User) ? (User) attr : null;
    }

    // Only ADMIN is allowed to manage users.
    private Response requireAdmin(HttpServletRequest request) {
        User loggedIn = getLoggedInUser(request);
        if (loggedIn == null) {
            return ResponseUtil.unauthorized("Unauthorized - Please log in");
        }
        if (!"ADMIN".equals(loggedIn.getRole())) {
            return ResponseUtil.forbidden("Access denied: Only ADMIN can manage users");
        }
        return null;
    }

    // Users with the "users" module can READ the user/access pages.
    private boolean canViewUsers(HttpServletRequest request) {
        User loggedIn = getLoggedInUser(request);
        if (loggedIn == null) return false;
        return PermissionUtil.resolvePermissions(loggedIn.getRole(), loggedIn.getPermissions())
                .contains("users");
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllUsers(@Context HttpServletRequest request) {
        if (!canViewUsers(request)) {
            return ResponseUtil.forbidden("Access denied: You do not have access to user management");
        }
        List<User> users = userDAO.getAllUsers();
        // Attach the dentist specialization for DENTIST accounts so the UI
        // can display it in user management.
        for (User user : users) {
            if ("DENTIST".equals(user.getRole())) {
                com.sunrise.dental.model.Dentist dentist =
                        dentistDAO.getDentistByFullName(user.getFullName());
                if (dentist != null) {
                    user.setDentistId(dentist.getDentistId());
                    user.setSpecialization(dentist.getSpecialization());
                }
            }
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Users retrieved", users));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUser(@Context HttpServletRequest request, @PathParam("id") int id) {
        if (!canViewUsers(request)) {
            return ResponseUtil.forbidden("Access denied: You do not have access to user management");
        }
        User user = userDAO.getUserById(id);
        if (user == null) {
            return ResponseUtil.notFound("User not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "User found", user));
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addUser(@Context HttpServletRequest request, String json) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        try {
            User user = gson.fromJson(json, User.class);

            if (ValidationUtil.isNullOrEmpty(user.getUsername())) {
                return ResponseUtil.badRequest("Username is required");
            }
            if (ValidationUtil.isNullOrEmpty(user.getFullName())) {
                return ResponseUtil.badRequest("Full name is required");
            }
            if (ValidationUtil.isNullOrEmpty(user.getPassword()) || user.getPassword().length() < 4) {
                return ResponseUtil.badRequest("Password must be at least 4 characters");
            }
            if (!isValidRole(user.getRole())) {
                return ResponseUtil.badRequest("Role must be ADMIN, RECEPTIONIST or DENTIST");
            }
            if (userDAO.getUserByUsername(user.getUsername().trim()) != null) {
                return ResponseUtil.badRequest("Username already exists");
            }

            user.setUsername(user.getUsername().trim());
            user.setFullName(user.getFullName().trim());
            if (!ValidationUtil.isNullOrEmpty(user.getContactNumber())
                    && !ValidationUtil.isValidPhone(user.getContactNumber().trim())) {
                return ResponseUtil.badRequest("Invalid contact number");
            }
            if (!ValidationUtil.isNullOrEmpty(user.getEmail())
                    && !ValidationUtil.isValidEmail(user.getEmail().trim())) {
                return ResponseUtil.badRequest("Invalid email address");
            }
            user.setContactNumber(ValidationUtil.isNullOrEmpty(user.getContactNumber()) ? null : user.getContactNumber().trim());
            user.setEmail(ValidationUtil.isNullOrEmpty(user.getEmail()) ? null : user.getEmail().trim());
            if ("DENTIST".equals(user.getRole())) {
                if (ValidationUtil.isNullOrEmpty(user.getSpecialization())) {
                    return ResponseUtil.badRequest("Specialization is required for dentists");
                }
                user.setSpecialization(user.getSpecialization().trim());
            }
            boolean added = userDAO.addUser(user);
            if (!added) {
                return ResponseUtil.badRequest("Failed to add user");
            }
            if ("DENTIST".equals(user.getRole())) {
                syncDentistRecord(user);
                user.setDentistId(dentistDAO.getDentistIdByFullName(user.getFullName()));
            }
            return ResponseUtil.created(new ApiResponseDTO(true, "User added successfully", user));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateUser(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        try {
            User existing = userDAO.getUserById(id);
            if (existing == null) {
                return ResponseUtil.notFound("User not found");
            }

            User user = gson.fromJson(json, User.class);
            user.setUserId(id);

            if (ValidationUtil.isNullOrEmpty(user.getUsername())) {
                return ResponseUtil.badRequest("Username is required");
            }
            if (ValidationUtil.isNullOrEmpty(user.getFullName())) {
                return ResponseUtil.badRequest("Full name is required");
            }
            if (!isValidRole(user.getRole())) {
                return ResponseUtil.badRequest("Role must be ADMIN, RECEPTIONIST or DENTIST");
            }
            if (!ValidationUtil.isNullOrEmpty(user.getContactNumber())
                    && !ValidationUtil.isValidPhone(user.getContactNumber().trim())) {
                return ResponseUtil.badRequest("Invalid contact number");
            }
            if (!ValidationUtil.isNullOrEmpty(user.getEmail())
                    && !ValidationUtil.isValidEmail(user.getEmail().trim())) {
                return ResponseUtil.badRequest("Invalid email address");
            }
            user.setContactNumber(ValidationUtil.isNullOrEmpty(user.getContactNumber()) ? null : user.getContactNumber().trim());
            user.setEmail(ValidationUtil.isNullOrEmpty(user.getEmail()) ? null : user.getEmail().trim());

            boolean wasDentist = "DENTIST".equals(existing.getRole());
            boolean isDentist = "DENTIST".equals(user.getRole());
            String newFullName = user.getFullName().trim();

            if (isDentist) {
                if (ValidationUtil.isNullOrEmpty(user.getSpecialization())) {
                    // Keep the specialization already stored on the dentist record.
                    com.sunrise.dental.model.Dentist dentistRecord =
                            dentistDAO.getDentistByFullName(existing.getFullName());
                    String currentSpec = dentistRecord != null ? dentistRecord.getSpecialization() : null;
                    if (ValidationUtil.isNullOrEmpty(currentSpec)) {
                        return ResponseUtil.badRequest("Specialization is required for dentists");
                    }
                    user.setSpecialization(currentSpec);
                } else {
                    user.setSpecialization(user.getSpecialization().trim());
                }
                // Keep the dentist record linked when the account is renamed.
                if (!existing.getFullName().equals(newFullName)) {
                    dentistDAO.updateDentistName(existing.getFullName(), newFullName);
                }
            } else if (wasDentist) {
                // Role changed away from DENTIST: hide the dentist record.
                dentistDAO.setDentistActiveByName(existing.getFullName(), false);
            }

            boolean updated = userDAO.updateUser(user);
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update user");
            }
            if (isDentist) {
                syncDentistRecord(user);
                user.setDentistId(dentistDAO.getDentistIdByFullName(newFullName));
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "User updated successfully", user));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @DELETE
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteUser(@Context HttpServletRequest request, @PathParam("id") int id) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        try {
            User loggedIn = getLoggedInUser(request);
            if (loggedIn != null && loggedIn.getUserId() == id) {
                return ResponseUtil.badRequest("You cannot delete your own account");
            }

            User existing = userDAO.getUserById(id);
            if (existing == null) {
                return ResponseUtil.notFound("User not found");
            }

            boolean deleted = userDAO.deleteUser(id);
            if (!deleted) {
                return ResponseUtil.badRequest("Failed to delete user");
            }
            return ResponseUtil.success(new ApiResponseDTO(true, "User deleted successfully", null));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}/access")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateAccess(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        try {
            User existing = userDAO.getUserById(id);
            if (existing == null) {
                return ResponseUtil.notFound("User not found");
            }

            AccessRequestDTO dto = gson.fromJson(json, AccessRequestDTO.class);
            if (dto == null || dto.getPermissions() == null) {
                return ResponseUtil.badRequest("permissions list is required");
            }

            // Validate that only known module keys are used.
            List<String> sanitized = new java.util.ArrayList<>();
            for (String key : dto.getPermissions()) {
                if (key != null && PermissionUtil.ALL_MODULES.contains(key.trim())) {
                    sanitized.add(key.trim());
                }
            }

            String csv = PermissionUtil.toCsv(sanitized);
            boolean updated = userDAO.updatePermissions(id, csv);
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update access");
            }

            return ResponseUtil.success(new ApiResponseDTO(true, "Access updated successfully",
                    PermissionUtil.resolvePermissions(existing.getRole(), csv)));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    @PUT
    @Path("{id}/active")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateActiveStatus(@Context HttpServletRequest request, @PathParam("id") int id, String json) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        try {
            User existing = userDAO.getUserById(id);
            if (existing == null) {
                return ResponseUtil.notFound("User not found");
            }

            User loggedIn = getLoggedInUser(request);
            if (loggedIn != null && loggedIn.getUserId() == id) {
                return ResponseUtil.badRequest("You cannot deactivate your own account");
            }

            ActiveRequestDTO dto = gson.fromJson(json, ActiveRequestDTO.class);
            if (dto == null) {
                return ResponseUtil.badRequest("Request body is required");
            }

            boolean updated = userDAO.updateActiveStatus(id, dto.isActive());
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update active status");
            }

            existing.setActive(dto.isActive());
            return ResponseUtil.success(new ApiResponseDTO(true,
                dto.isActive()
                    ? "User activated successfully"
                    : "User deactivated successfully",
                existing));
        } catch (Exception e) {
            return ResponseUtil.serverError("Error: " + e.getMessage());
        }
    }

    private boolean isValidRole(String role) {
        return "ADMIN".equals(role)
                || "RECEPTIONIST".equals(role)
                || "DENTIST".equals(role);
    }

    private static class AccessRequestDTO {
        private List<String> permissions;
        public List<String> getPermissions() { return permissions; }
        public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    }

    private static class ActiveRequestDTO {
        private boolean active;
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }
}
