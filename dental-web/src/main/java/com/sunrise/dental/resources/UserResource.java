/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.UserDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.ValidationUtil;
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

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllUsers(@Context HttpServletRequest request) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
        List<User> users = userDAO.getAllUsers();
        return ResponseUtil.success(new ApiResponseDTO(true, "Users retrieved", users));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUser(@Context HttpServletRequest request, @PathParam("id") int id) {
        Response denied = requireAdmin(request);
        if (denied != null) return denied;
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
            boolean added = userDAO.addUser(user);
            if (!added) {
                return ResponseUtil.badRequest("Failed to add user");
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

            boolean updated = userDAO.updateUser(user);
            if (!updated) {
                return ResponseUtil.badRequest("Failed to update user");
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

    private boolean isValidRole(String role) {
        return "ADMIN".equals(role)
                || "RECEPTIONIST".equals(role)
                || "DENTIST".equals(role);
    }
}