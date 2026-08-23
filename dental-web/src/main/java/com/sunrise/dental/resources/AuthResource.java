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
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import com.sunrise.dental.util.TokenStore;
import com.sunrise.dental.util.PermissionUtil;
import jakarta.ws.rs.*;
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
                LoginResponseDTO response = new LoginResponseDTO();
                response.setSuccess(false);
                response.setMessage("Invalid username or password");
                return ResponseUtil.unauthorized(gson.toJson(response));
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
}
