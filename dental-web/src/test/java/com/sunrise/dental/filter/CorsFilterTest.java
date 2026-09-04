/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit5TestClass.java to edit this template
 */
package com.sunrise.dental.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
public class CorsFilterTest {
    
    private final CorsFilter filter = new CorsFilter();
    
    public CorsFilterTest() {
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

    /**
     * Test of doFilter method, of class CorsFilter.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterNormalRequest() throws Exception {
        System.out.println("doFilter - normal request");
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        FilterChain chain = Mockito.mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        Mockito.verify(res).setHeader("Access-Control-Allow-Origin", "*");
        Mockito.verify(res).setHeader(Mockito.eq("Access-Control-Allow-Methods"), Mockito.contains("GET"));
        Mockito.verify(chain).doFilter(req, res);
    }

    /**
     * Test of doFilter with OPTIONS request.
     */
    @org.junit.jupiter.api.Test
    public void testDoFilterOptionsRequest() throws Exception {
        System.out.println("doFilter - OPTIONS request");
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        FilterChain chain = Mockito.mock(FilterChain.class);
        Mockito.when(req.getMethod()).thenReturn("OPTIONS");

        filter.doFilter(req, res, chain);

        Mockito.verify(res).setStatus(HttpServletResponse.SC_OK);
        Mockito.verify(chain, Mockito.never()).doFilter(req, res);
    }
}