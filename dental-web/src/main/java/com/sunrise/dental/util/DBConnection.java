/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Database connection manager.
 *
 * Reads connection settings from environment variables (set these on Railway
 * under the service's "Variables" tab, or in the local JVM/GlassFish env):
 *
 *   DB_URL  -> jdbc:mysql://<host>:<port>/sunrise_dental2
 *   DB_USER -> database user
 *   DB_PASS -> database password
 *
 * Local-development defaults are used when the variables are not set.
 */
public class DBConnection {

    private static final String DB_URL;
    private static final String USER;
    private static final String PASS;

    static {
        DB_URL = env("DB_URL", "jdbc:mysql://localhost:3306/sunrise_dental2");
        USER    = env("DB_USER", "root");
        PASS    = env("DB_PASS", "");
    }

    private static String env(String key, String fallback) {
        String v = System.getenv(key);
        if (v == null || v.trim().isEmpty()) {
            // Also honour -D JVM system properties as a fallback
            v = System.getProperty(key);
        }
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    private static DBConnection instance;

    private DBConnection() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC Driver not found", e);
        }
    }

    public static synchronized DBConnection getInstance() {
        if (instance == null) {
            instance = new DBConnection();
        }
        return instance;
    }

    public Connection getConnection() throws SQLException {
        // Railway's MySQL proxy exposes TLS with a self-signed cert, and MySQL 9
        // defaults to caching_sha2_password auth. Both can make the Connector/J
        // fail with "Public Key Retrieval is not allowed" unless we explicitly
        // allow public-key retrieval and disable SSL verification.
        //
        // We auto-append these params ONLY if the caller did not already provide
        // them, so an explicitly-configured DB_URL keeps full control.
        String url = ensureParam(DB_URL, "allowPublicKeyRetrieval=true");
        url = ensureParam(url, "sslMode=DISABLED"); // bypass self-signed cert check

        return DriverManager.getConnection(url, USER, PASS);
    }

    /** Appends "key=value" to the URL as a query parameter if not already present. */
    private static String ensureParam(String url, String pair) {
        String key = pair.substring(0, pair.indexOf('='));
        boolean hasIt = url.contains('?' + key + '=') || url.contains('&' + key + '=');
        if (hasIt) {
            return url;
        }
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + pair;
    }
}
