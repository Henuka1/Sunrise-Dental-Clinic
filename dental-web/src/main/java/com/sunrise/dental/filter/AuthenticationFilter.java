/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.filter;

import com.sunrise.dental.model.User;
import com.sunrise.dental.util.TokenStore;
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

        // Resolve the logged-in user from the token (if registered in this server's session store).
        String rawToken = authHeader.substring("Bearer ".length());
        User user = TokenStore.get(rawToken);
        req.setAttribute("authenticatedUser", user);

        // Role-based restriction for DENTIST: forbid endpoints the dentist must not access.
        if (user != null && "DENTIST".equals(user.getRole())) {
            if (isDentistForbidden(req.getMethod(), path)) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json");
                res.getWriter().write("{\"success\":false,\"message\":\"Access denied: Dentist role is not allowed to perform this action\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isDentistForbidden(String method, String path) {
        String m = method == null ? "" : method.toUpperCase();
        String p = path == null ? "" : path;

        // Create / edit patients
        if (("POST".equals(m) || "PUT".equals(m) || "DELETE".equals(m)) && p.startsWith("/api/patients")) {
            return true;
        }
        // Create or cancel appointments
        if ("POST".equals(m) && p.startsWith("/api/appointments")) {
            return true;
        }
        // Dentist cannot cancel appointments (DELETE /appointments/{id} or PUT /appointments/{id}/cancel)
        if (("DELETE".equals(m) || "PUT".equals(m)) && p.startsWith("/api/appointments") && p.contains("/cancel")) {
            return true;
        }
        // All bill operations
        if (p.startsWith("/api/bills")) {
            return true;
        }
        // Clinic-wide / sensitive reports
        if (p.startsWith("/api/reports/daily")
                || p.startsWith("/api/reports/revenue")
                || p.startsWith("/api/reports/pending-bills")) {
            return true;
        }
        return false;
    }
}
