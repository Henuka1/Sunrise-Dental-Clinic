/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Central definition of the application's access-controlled modules and the
 * default modules granted to each role. Admins can override a user's access
 * via the User Access Control screen; NULL / empty stored permission = role default.
 *
 * @author User
 */
public class PermissionUtil {

    // The canonical list of access-controlled module keys (must match the frontend).
    public static final List<String> ALL_MODULES = Arrays.asList(
        "dashboard",
        "patients",
        "appointments",
        "billing",
        "reports",
        "users",
        "user_access",
        "availability",
        "help"
    );

    private static final Map<String, List<String>> ROLE_DEFAULTS = new HashMap<>();

    static {
        // Admin implicitly has full access (always).
        ROLE_DEFAULTS.put("ADMIN", new ArrayList<>(ALL_MODULES));
        ROLE_DEFAULTS.put("RECEPTIONIST", Arrays.asList(
            "dashboard", "patients", "appointments", "billing", "reports", "help"
        ));
        ROLE_DEFAULTS.put("DENTIST", Arrays.asList(
            "dashboard", "patients", "appointments", "availability", "reports", "help"
        ));
    }

    private PermissionUtil() {}

    /**
     * Returns the effective set of modules for a user.
     * Stored permissions take precedence; if none are stored, the role default applies.
     * An ADMIN always keeps every module.
     */
    public static List<String> resolvePermissions(String role, String storedPermissions) {
        Set<String> granted = new LinkedHashSet<>();

        boolean isAdmin = "ADMIN".equals(role);

        boolean hasStored = storedPermissions != null
                && !storedPermissions.trim().isEmpty()
                && !storedPermissions.trim().equalsIgnoreCase("null");

        if (hasStored && !isAdmin) {
            for (String key : storedPermissions.split(",")) {
                String k = key.trim();
                if (!k.isEmpty() && ALL_MODULES.contains(k)) {
                    granted.add(k);
                }
            }
        }

        // If nothing valid was stored (or is admin), fall back to role defaults.
        if (granted.isEmpty()) {
            List<String> defaults = ROLE_DEFAULTS.get(role);
            if (defaults != null) {
                granted.addAll(defaults);
            }
        }

        // Admins always have complete access regardless of stored value.
        if (isAdmin) {
            granted.addAll(ALL_MODULES);
        }

        return new ArrayList<>(granted);
    }

    /**
     * Serializes a set of granted module keys into the DB CSV format.
     * Returns null when nothing is granted (so role defaults apply on next login).
     */
    public static String toCsv(List<String> permissions) {
        if (permissions == null) {
            return null;
        }
        Set<String> unique = new LinkedHashSet<>(permissions);
        unique.retainAll(ALL_MODULES);
        return unique.isEmpty() ? null : String.join(",", unique);
    }
}