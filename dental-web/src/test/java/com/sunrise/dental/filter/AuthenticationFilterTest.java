/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.io.StringWriter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import org.mockito.Mockito;

/**
 *
 * @author User
 */
public class AuthenticationFilterTest {
    
    private final AuthenticationFilter filter = new AuthenticationFilter();
    
    public AuthenticationFilterTest() {
    }

    @org.junit.jupiter.api.BeforeAll
    public static void setUpClass() throws Exception {
    }

    @org.junit.jupiter.api.AfterAll
    public static void tearDownClass() throws Exception {
    }

    @org.junit.jupiter.api.BeforeEach
    public void setUp() throws Exception {
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() throws Exception {
    }

    private HttpServletRequest mockRequest(String path, String method, String authHeader) {
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        Mockito.when(req.getRequestURI()).thenReturn("/sunrise-dental" + path);
        Mockito.when(req.getContextPath()).thenReturn("/sunrise-dental");
        Mockito.when(req.getMethod()).thenReturn(method);
        Mockito.when(req.getHeader("Authorization")).thenReturn(authHeader);
        return req;
    }

    /**
     * Test of doFilter method, of class AuthenticationFilter.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterPublicPath() throws Exception {
        System.out.println("doFilter - public path");
        HttpServletRequest req = mockRequest("/api/auth/login", "POST", null);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        FilterChain chain = Mockito.mock(FilterChain.class);

        filter.doFilter(req, res, chain);
        Mockito.verify(chain).doFilter(req, res);
        Mockito.verify(res, Mockito.never()).setStatus(Mockito.anyInt());
    }

    /**
     * Test of doFilter with missing token.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterMissingToken() throws Exception {
        System.out.println("doFilter - missing token");
        HttpServletRequest req = mockRequest("/api/appointments", "GET", null);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        StringWriter out = new StringWriter();
        Mockito.when(res.getWriter()).thenReturn(new PrintWriter(out));
        FilterChain chain = Mockito.mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        Mockito.verify(res).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        Mockito.verify(chain, Mockito.never()).doFilter(req, res);
    }

    /**
     * Test of doFilter with valid bearer token.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterValidToken() throws Exception {
        System.out.println("doFilter - valid token");
        HttpServletRequest req = mockRequest("/api/patients", "GET", "Bearer abc-123");
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        FilterChain chain = Mockito.mock(FilterChain.class);

        filter.doFilter(req, res, chain);
        Mockito.verify(chain).doFilter(req, res);
    }

    /**
     * Test of doFilter with malformed token.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterMalformedToken() throws Exception {
        System.out.println("doFilter - malformed token");
        HttpServletRequest req = mockRequest("/api/bills", "GET", "Basic xyz");
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        Mockito.when(res.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        FilterChain chain = Mockito.mock(FilterChain.class);

        filter.doFilter(req, res, chain);
        Mockito.verify(res).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
}