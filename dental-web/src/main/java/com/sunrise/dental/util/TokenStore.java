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
 * Tokens carry a time-to-live (TTL); expired sessions are evicted lazily.
 * NOTE: this store is process-memory. If the app restarts (e.g. a Railway
 * redeploy/scale), all sessions are lost and clients must re-login.
 *
 * @author User
 */
public class TokenStore {

    /** Session lifetime in milliseconds (12 hours). */
    private static final long TTL_MS = 12L * 60L * 60L * 1000L;

    private static final Map<String, Entry> SESSIONS = new ConcurrentHashMap<>();

    private TokenStore() {}

    private static final class Entry {
        final User user;
        final long expiresAt;

        Entry(User user, long expiresAt) {
            this.user = user;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    public static void put(String token, User user) {
        if (token != null && user != null) {
            SESSIONS.put(token, new Entry(user, System.currentTimeMillis() + TTL_MS));
        }
    }

    public static User get(String token) {
        if (token == null) {
            return null;
        }
        Entry e = SESSIONS.get(token);
        if (e == null) {
            return null;
        }
        if (e.isExpired()) {
            SESSIONS.remove(token);
            return null;
        }
        return e.user;
    }

    public static void remove(String token) {
        if (token != null) {
            SESSIONS.remove(token);
        }
    }
}