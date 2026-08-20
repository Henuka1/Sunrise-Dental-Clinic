/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
/**
 *
 * @author User
 */
public class AuthenticationFilter implements Filter {

    private static final String[] PUBLIC_PATHS = {"/api/auth/login", "/api/auth/register"};

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI().substring(req.getContextPath().length());

        // Allow public paths
        for (String publicPath : PUBLIC_PATHS) {
            if (path.startsWith(publicPath)) {
                chain.doFilter(request, response);
                return;
            }
        }

        // Skip OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Check for Authorization header
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || authHeader.isEmpty()) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"message\":\"Unauthorized - No token provided\"}");
            return;
        }

        // Simple token validation (in production use JWT)
        if (!authHeader.startsWith("Bearer ")) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"message\":\"Unauthorized - Invalid token format\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
