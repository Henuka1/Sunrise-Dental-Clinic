/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.util;

import com.sunrise.dental.model.User;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store mapping an auth token to its logged-in user.
 * Used so role-aware resources (e.g. DENTIST) can resolve the caller.
 *
 * @author User
 */
public class TokenStore {

    private static final Map<String, User> SESSIONS = new ConcurrentHashMap<>();

    private TokenStore() {}

    public static void put(String token, User user) {
        if (token != null && user != null) {
            SESSIONS.put(token, user);
        }
    }

    public static User get(String token) {
        return token == null ? null : SESSIONS.get(token);
    }

    public static void remove(String token) {
        if (token != null) {
            SESSIONS.remove(token);
        }
    }
}