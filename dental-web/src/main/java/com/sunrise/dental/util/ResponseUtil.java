/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.util;

import com.google.gson.Gson;
import jakarta.ws.rs.core.Response;
/**
 *
 * @author User
 */
public class ResponseUtil {
    private static final Gson gson = new Gson();

    public static Response success(Object data) {
        return Response.status(Response.Status.OK)
                .entity(gson.toJson(data))
                .type("application/json")
                .build();
    }

    public static Response created(Object data) {
        return Response.status(Response.Status.CREATED)
                .entity(gson.toJson(data))
                .type("application/json")
                .build();
    }

    public static Response badRequest(String message) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"success\":false,\"message\":\"" + message + "\"}")
                .type("application/json")
                .build();
    }

    public static Response notFound(String message) {
        return Response.status(Response.Status.NOT_FOUND)
                .entity("{\"success\":false,\"message\":\"" + message + "\"}")
                .type("application/json")
                .build();
    }

    public static Response unauthorized(String message) {
        return Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"success\":false,\"message\":\"" + message + "\"}")
                .type("application/json")
                .build();
    }

    public static Response serverError(String message) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("{\"success\":false,\"message\":\"" + message + "\"}")
                .type("application/json")
                .build();
    }
}
