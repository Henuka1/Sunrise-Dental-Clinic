/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.util;

import java.util.regex.Pattern;
/**
 *
 * @author User
 */
public class ValidationUtil {
    private static final Pattern PHONE_PATTERN = Pattern.compile("^07[0-9]{8}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern APT_NUMBER_PATTERN = Pattern.compile("^APT-[0-9]{5}$");

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone).matches();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidAppointmentNumber(String aptNum) {
        return aptNum != null && APT_NUMBER_PATTERN.matcher(aptNum).matches();
    }

    public static boolean isValidDateRange(String date) {
        // Should not be in the past and not more than 90 days in future
        try {
            java.time.LocalDate aptDate = java.time.LocalDate.parse(date);
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate maxDate = today.plusDays(90);
            return !aptDate.isBefore(today) && !aptDate.isAfter(maxDate);
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isValidTime(String time) {
        try {
            java.time.LocalTime t = java.time.LocalTime.parse(time);
            java.time.LocalTime open = java.time.LocalTime.of(8, 0);
            java.time.LocalTime close = java.time.LocalTime.of(18, 0);
            return !t.isBefore(open) && !t.isAfter(close);
        } catch (Exception e) {
            return false;
        }
    }
}