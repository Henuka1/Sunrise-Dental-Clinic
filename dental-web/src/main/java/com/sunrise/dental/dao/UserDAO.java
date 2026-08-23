/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.dao;

import com.sunrise.dental.model.User;
import com.sunrise.dental.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author User
 */
public class UserDAO {

    // Tracks whether the auto-migration (permissions + is_active columns) has run.
    // Auto-migrated on first connection so login keeps working even if the DDL
    // wasn't run manually.
    private static boolean permissionsReady = false;

    private void ensurePermissionsColumn(Connection conn) {
        if (permissionsReady) return;
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions VARCHAR(255) DEFAULT NULL AFTER role"
            );
            stmt.executeUpdate(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE"
            );
            permissionsReady = true;
        } catch (SQLException e) {
            // Column may already exist under a different state, or ALTER unsupported.
            // Fall back to queries that ignore the extra columns.
            permissionsReady = false;
            e.printStackTrace();
        }
    }

    private String userSelectColumns() {
        return permissionsReady
                ? "user_id, username, full_name, role, permissions, is_active"
                : "user_id, username, full_name, role";
    }

    private String userSelectColumnsWithCreated() {
        return permissionsReady
                ? "user_id, username, full_name, role, permissions, is_active, created_at"
                : "user_id, username, full_name, role, created_at";
    }

    public User authenticate(String username, String password) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            String sql = "SELECT " + userSelectColumns() + " FROM users WHERE username = ? AND password = ?";
            // Intentionally DO NOT filter by is_active here. Auth succeeds based on
            // credentials alone so the login layer can report a clear
            // "account deactivated" message for inactive accounts.
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, username);
                ps.setString(2, password);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    User user = new User(
                        rs.getInt("user_id"),
                        rs.getString("username"),
                        rs.getString("full_name"),
                        rs.getString("role")
                    );
                    if (permissionsReady) {
                        user.setPermissions(rs.getString("permissions"));
                        user.setActive(rs.getBoolean("is_active"));
                    } else {
                        // The is_active column does not exist in this database.
                        // Treat every account as active so nobody gets locked out.
                        user.setActive(true);
                    }
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public User getUserByUsername(String username) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            String sql = "SELECT " + userSelectColumns() + " FROM users WHERE username = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, username);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    User user = new User(
                        rs.getInt("user_id"),
                        rs.getString("username"),
                        rs.getString("full_name"),
                        rs.getString("role")
                    );
                    if (permissionsReady) {
                        user.setPermissions(rs.getString("permissions"));
                        user.setActive(rs.getBoolean("is_active"));
                    }
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            String sql = "SELECT " + userSelectColumnsWithCreated() + " FROM users ORDER BY user_id";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    users.add(mapUser(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return users;
    }

    public User getUserById(int id) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            String sql = "SELECT " + userSelectColumnsWithCreated() + " FROM users WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean addUser(User user) {
        String sql = "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getPassword());
            ps.setString(3, user.getFullName());
            ps.setString(4, user.getRole());
            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        user.setUserId(keys.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateUser(User user) {
        String sql;
        boolean hasNewPassword = user.getPassword() != null && !user.getPassword().trim().isEmpty();
        if (hasNewPassword) {
            sql = "UPDATE users SET full_name = ?, role = ?, password = ? WHERE user_id = ?";
        } else {
            sql = "UPDATE users SET full_name = ?, role = ? WHERE user_id = ?";
        }
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getFullName());
            ps.setString(2, user.getRole());
            if (hasNewPassword) {
                ps.setString(3, user.getPassword());
                ps.setInt(4, user.getUserId());
            } else {
                ps.setInt(3, user.getUserId());
            }
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateOwnProfile(int userId, String username, String fullName, String newPassword) {
        String sql;
        boolean hasNewPassword = newPassword != null && !newPassword.trim().isEmpty();
        if (hasNewPassword) {
            sql = "UPDATE users SET username = ?, full_name = ?, password = ? WHERE user_id = ?";
        } else {
            sql = "UPDATE users SET username = ?, full_name = ? WHERE user_id = ?";
        }
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, fullName);
            if (hasNewPassword) {
                ps.setString(3, newPassword);
                ps.setInt(4, userId);
            } else {
                ps.setInt(3, userId);
            }
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteUser(int id) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            String sql = "DELETE FROM users WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updatePermissions(int id, String permissions) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            if (!permissionsReady) {
                return false;
            }
            String sql = "UPDATE users SET permissions = ? WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, permissions);
                ps.setInt(2, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateActiveStatus(int id, boolean isActive) {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            ensurePermissionsColumn(conn);
            if (!permissionsReady) {
                return false;
            }
            String sql = "UPDATE users SET is_active = ? WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setBoolean(1, isActive);
                ps.setInt(2, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User user = new User(
                rs.getInt("user_id"),
                rs.getString("username"),
                rs.getString("full_name"),
                rs.getString("role")
        );
        if (permissionsReady) {
            user.setPermissions(rs.getString("permissions"));
            user.setActive(rs.getBoolean("is_active"));
        }
        user.setCreatedAt(rs.getString("created_at"));
        return user;
    }
}
