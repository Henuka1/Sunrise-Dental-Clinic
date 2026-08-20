/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.sunrise.dental.dao.UserDAO;
import com.sunrise.dental.dto.LoginRequestDTO;
import com.sunrise.dental.dto.LoginResponseDTO;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
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

            LoginResponseDTO response = new LoginResponseDTO();
            response.setSuccess(true);
            response.setMessage("Login successful");
            response.setToken("Bearer " + UUID.randomUUID().toString());
            response.setUsername(user.getUsername());
            response.setFullName(user.getFullName());
            response.setRole(user.getRole());

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
