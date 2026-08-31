/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sunrise.dental.resources;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sunrise.dental.dao.AvailabilityDAO;
import com.sunrise.dental.dao.DateAvailabilityDAO;
import com.sunrise.dental.dao.DentistDAO;
import com.sunrise.dental.dto.ApiResponseDTO;
import com.sunrise.dental.model.DentistAvailability;
import com.sunrise.dental.model.DentistDateAvailability;
import com.sunrise.dental.model.User;
import com.sunrise.dental.util.ResponseUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.List;
/**
 *
 * @author User
 */
@Path("dentists")
public class DentistResource {
    private final Gson gson = new Gson();
    private final DentistDAO dentistDAO = new DentistDAO();
    private final AvailabilityDAO availabilityDAO = new AvailabilityDAO();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllDentists(@QueryParam("includeInactive") boolean includeInactive) {
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentists retrieved",
                dentistDAO.getAllDentists(includeInactive)));
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDentist(@PathParam("id") int id) {
        var dentist = dentistDAO.getDentistById(id);
        if (dentist == null) {
            return ResponseUtil.notFound("Dentist not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true, "Dentist found", dentist));
    }

    /** Weekly availability slots of a dentist (one row per weekday). */
    @GET
    @Path("{id}/availability")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAvailability(@PathParam("id") int id) {
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Availability retrieved", availabilityDAO.getByDentistId(id)));
    }

    /**
     * Saves the full weekly availability of a dentist. A DENTIST account may
     * only save its own availability; ADMIN can save any dentist's schedule.
     */
    @PUT
    @Path("{id}/availability")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveAvailability(@PathParam("id") int id,
                                     String body,
                                     @Context HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && "DENTIST".equals(authUser.getRole())
                && authUser.getDentistId() != id) {
            return ResponseUtil.forbidden("Dentists can only manage their own availability");
        }

        List<DentistAvailability> slots;
        try {
            slots = gson.fromJson(body, new TypeToken<List<DentistAvailability>>(){}.getType());
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid availability data");
        }
        if (slots == null) {
            slots = java.util.Collections.emptyList();
        }

        // Basic validation before persisting.
        for (DentistAvailability s : slots) {
            if (s.getDayOfWeek() < 0 || s.getDayOfWeek() > 6
                    || s.getStartTime() == null || s.getEndTime() == null
                    || s.getStartTime().compareTo(s.getEndTime()) >= 0) {
                return ResponseUtil.badRequest(
                        "Invalid slot: day must be 0-6 and start time must be before end time");
            }
        }

        boolean saved;
        try {
            saved = availabilityDAO.saveAll(id, slots);
        } catch (java.sql.SQLException e) {
            e.printStackTrace();
            return ResponseUtil.serverError("Failed to save availability: " + e.getMessage());
        }
        if (!saved) {
            return ResponseUtil.serverError("Failed to save availability");
        }
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Availability saved", availabilityDAO.getByDentistId(id)));
    }

    // ==================== Date-range availability ====================

    private final DateAvailabilityDAO dateAvailabilityDAO = new DateAvailabilityDAO();
    private final com.sunrise.dental.dao.AppointmentDAO appointmentDAO =
            new com.sunrise.dental.dao.AppointmentDAO();

    /** All date-range overrides of a dentist (extra hours or blocked dates). */
    @GET
    @Path("{id}/date-availability")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDateAvailability(@PathParam("id") int id) {
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Date availability retrieved", dateAvailabilityDAO.getByDentistId(id)));
    }

    /** Adds a date-range override (available hours or blocked dates). */
    @POST
    @Path("{id}/date-availability")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addDateAvailability(@PathParam("id") int id,
                                        String body,
                                        @Context HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && "DENTIST".equals(authUser.getRole())
                && authUser.getDentistId() != id) {
            return ResponseUtil.forbidden("Dentists can only manage their own availability");
        }

        DentistDateAvailability a;
        try {
            a = gson.fromJson(body, DentistDateAvailability.class);
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid date availability data");
        }
        if (a == null || a.getStartDate() == null || a.getEndDate() == null
                || a.getStartDate().isEmpty() || a.getEndDate().isEmpty()) {
            return ResponseUtil.badRequest("Start date and end date are required");
        }
        if (a.getStartDate().compareTo(a.getEndDate()) > 0) {
            return ResponseUtil.badRequest("End date must be on or after start date");
        }
        if (a.isAvailable() && (a.getStartTime() == null || a.getEndTime() == null
                || a.getStartTime().trim().isEmpty() || a.getEndTime().trim().isEmpty())) {
            return ResponseUtil.badRequest("Start time and end time are required");
        }
        String cleanStart = a.getStartTime() == null ? "09:00" : a.getStartTime().replaceAll("[\\s\\u00A0]+", "");
        String cleanEnd = a.getEndTime() == null ? "17:00" : a.getEndTime().replaceAll("[\\s\\u00A0]+", "");
        if (a.isAvailable() && cleanStart.compareTo(cleanEnd) >= 0) {
            return ResponseUtil.badRequest("Start time must be before end time");
        }
        if (dateAvailabilityDAO.hasOverlap(id, a.getStartDate(), a.getEndDate(), 0)) {
            return ResponseUtil.badRequest(
                    "This date range overlaps an existing availability entry. Cancel it first.");
        }
        a.setDentistId(id);
        a.setStartTime(cleanStart);
        a.setEndTime(cleanEnd);
        try {
            int newId = dateAvailabilityDAO.add(a);
            if (newId <= 0) {
                return ResponseUtil.serverError("Failed to save date availability");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseUtil.serverError("Failed to save date availability: " + e.getMessage());
        }
        return ResponseUtil.created(new ApiResponseDTO(true,
                "Date availability added", dateAvailabilityDAO.getByDentistId(id)));
    }

    /** Updates (edits) an existing date-range override. */
    @PUT
    @Path("{id}/date-availability/{daId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateDateAvailability(@PathParam("id") int id,
                                           @PathParam("daId") int daId,
                                           String body,
                                           @Context HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && "DENTIST".equals(authUser.getRole())
                && authUser.getDentistId() != id) {
            return ResponseUtil.forbidden("Dentists can only manage their own availability");
        }

        DentistDateAvailability a;
        try {
            a = gson.fromJson(body, DentistDateAvailability.class);
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid date availability data");
        }
        if (a == null || a.getStartDate() == null || a.getEndDate() == null
                || a.getStartDate().isEmpty() || a.getEndDate().isEmpty()) {
            return ResponseUtil.badRequest("Start date and end date are required");
        }
        if (a.getStartDate().compareTo(a.getEndDate()) > 0) {
            return ResponseUtil.badRequest("End date must be on or after start date");
        }
        if (a.isAvailable() && (a.getStartTime() == null || a.getEndTime() == null
                || a.getStartTime().trim().isEmpty() || a.getEndTime().trim().isEmpty())) {
            return ResponseUtil.badRequest("Start time and end time are required");
        }
        String cleanStart = a.getStartTime() == null ? "09:00" : a.getStartTime().replaceAll("[\\s\\u00A0]+", "");
        String cleanEnd = a.getEndTime() == null ? "17:00" : a.getEndTime().replaceAll("[\\s\\u00A0]+", "");
        if (a.isAvailable() && cleanStart.compareTo(cleanEnd) >= 0) {
            return ResponseUtil.badRequest("Start time must be before end time");
        }
        if (dateAvailabilityDAO.hasOverlap(id, a.getStartDate(), a.getEndDate(), daId)) {
            return ResponseUtil.badRequest(
                    "This date range overlaps another availability entry. Cancel it first.");
        }
        a.setDentistId(id);
        a.setDateAvailabilityId(daId);
        a.setStartTime(cleanStart);
        a.setEndTime(cleanEnd);
        try {
            boolean updated = dateAvailabilityDAO.update(id, a);
            if (!updated) {
                return ResponseUtil.notFound("Date availability entry not found");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseUtil.serverError("Failed to update date availability: " + e.getMessage());
        }
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Date availability updated", dateAvailabilityDAO.getByDentistId(id)));
    }

    /** Cancels (removes) one date-range override. */
    @DELETE
    @Path("{id}/date-availability/{daId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response cancelDateAvailability(@PathParam("id") int id,
                                           @PathParam("daId") int daId,
                                           @Context HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && "DENTIST".equals(authUser.getRole())
                && authUser.getDentistId() != id) {
            return ResponseUtil.forbidden("Dentists can only manage their own availability");
        }
        boolean removed = dateAvailabilityDAO.delete(id, daId);
        if (!removed) {
            return ResponseUtil.notFound("Date availability entry not found");
        }
        return ResponseUtil.success(new ApiResponseDTO(true,
                "Date availability cancelled", dateAvailabilityDAO.getByDentistId(id)));
    }

    /**
     * Monthly calendar summary: for every day of the given month returns
     * availability status, working hours and the booked appointment count.
     */
    @GET
    @Path("{id}/calendar")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCalendar(@PathParam("id") int id,
                                @QueryParam("year") int year,
                                @QueryParam("month") int month) {
        java.time.LocalDate first;
        try {
            if (year > 0 && month >= 1 && month <= 12) {
                first = java.time.LocalDate.of(year, month, 1);
            } else {
                first = java.time.LocalDate.now().withDayOfMonth(1);
            }
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid year/month");
        }
        java.time.LocalDate last = first.withDayOfMonth(first.lengthOfMonth());

        List<DentistAvailability> weekly = availabilityDAO.getByDentistId(id);
        List<DentistDateAvailability> overrides = dateAvailabilityDAO.getByDentistId(id);
        List<com.sunrise.dental.model.Appointment> monthAppointments =
                appointmentDAO.getByDentistAndDateRange(id, first.toString(), last.toString());

        java.util.Map<String, Integer> bookedPerDay = new java.util.HashMap<>();
        for (com.sunrise.dental.model.Appointment ap : monthAppointments) {
            bookedPerDay.merge(ap.getAppointmentDate().substring(0, 10), 1, Integer::sum);
        }

        List<java.util.Map<String, Object>> days = new java.util.ArrayList<>();
        for (java.time.LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
            String ds = d.toString();
            java.util.Map<String, Object> day = new java.util.HashMap<>();
            day.put("date", ds);
            day.put("dayOfWeek", d.getDayOfWeek().getValue() % 7); // JS getDay(): 0=Sunday
            day.put("bookedCount", bookedPerDay.getOrDefault(ds, 0));

            DentistDateAvailability override = null;
            for (DentistDateAvailability o : overrides) {
                if (o.getStartDate().compareTo(ds) <= 0 && o.getEndDate().compareTo(ds) >= 0) {
                    override = o;
                    break;
                }
            }
            if (override != null) {
                day.put("source", "OVERRIDE");
                day.put("available", override.isAvailable());
                day.put("startTime", override.getStartTime());
                day.put("endTime", override.getEndTime());
                day.put("reason", override.getReason());
            } else {
                DentistAvailability w = null;
                for (DentistAvailability s : weekly) {
                    if (s.getDayOfWeek() == d.getDayOfWeek().getValue() % 7 && s.isAvailable()) {
                        w = s;
                        break;
                    }
                }
                day.put("source", "WEEKLY");
                day.put("available", w != null);
                day.put("startTime", w != null ? w.getStartTime() : null);
                day.put("endTime", w != null ? w.getEndTime() : null);
                day.put("reason", null);
            }
            days.add(day);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("year", first.getYear());
        result.put("month", first.getMonthValue());
        result.put("days", days);
        return ResponseUtil.success(new ApiResponseDTO(true, "Calendar retrieved", result));
    }

    /**
     * Free time slots for one date. Slots come from the working window
     * (date override first, then the weekly schedule) minus booked
     * appointments. Each slot reports how many minutes are still free.
     */
    @GET
    @Path("{id}/day-schedule")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDaySchedule(@PathParam("id") int id,
                                   @QueryParam("date") String date,
                                   @QueryParam("slotMinutes") Integer slotMinutesParam) {
        if (date == null || date.isEmpty()) {
            date = java.time.LocalDate.now().toString();
        }
        java.time.LocalDate day;
        try {
            day = java.time.LocalDate.parse(date);
        } catch (Exception e) {
            return ResponseUtil.badRequest("Invalid date, use YYYY-MM-DD");
        }
        int slotMinutes = (slotMinutesParam == null || slotMinutesParam < 10 || slotMinutesParam > 240)
                ? 30 : slotMinutesParam;

        DentistAvailability weekly = null;
        for (DentistAvailability s : availabilityDAO.getByDentistId(id)) {
            if (s.getDayOfWeek() == day.getDayOfWeek().getValue() % 7 && s.isAvailable()) {
                weekly = s;
                break;
            }
        }
        DentistDateAvailability override = dateAvailabilityDAO.findCovering(id, date);

        boolean available;
        String windowStart;
        String windowEnd;
        String source;
        if (override != null) {
            available = override.isAvailable();
            windowStart = override.getStartTime();
            windowEnd = override.getEndTime();
            source = "OVERRIDE";
        } else if (weekly != null) {
            available = true;
            windowStart = weekly.getStartTime();
            windowEnd = weekly.getEndTime();
            source = "WEEKLY";
        } else {
            available = false;
            windowStart = null;
            windowEnd = null;
            source = "WEEKLY";
        }

        List<com.sunrise.dental.model.Appointment> booked =
                appointmentDAO.getByDentistAndDate(id, date);

        List<java.util.Map<String, Object>> slots = new java.util.ArrayList<>();
        int totalFreeMinutes = 0;
        if (available && windowStart != null && windowEnd != null) {
            int winStart = toMinutes(windowStart);
            int winEnd = toMinutes(windowEnd);

            List<int[]> bookedIntervals = new java.util.ArrayList<>();
            for (com.sunrise.dental.model.Appointment ap : booked) {
                int t = toMinutes(ap.getAppointmentTime());
                bookedIntervals.add(new int[]{t, Math.min(winEnd, t + slotMinutes)});
            }
            bookedIntervals.sort((x, y) -> Integer.compare(x[0], y[0]));

            int cursor = winStart;
            for (int[] bi : bookedIntervals) {
                if (bi[0] > cursor) {
                    totalFreeMinutes += addSlots(slots, cursor, bi[0], slotMinutes);
                }
                cursor = Math.max(cursor, bi[1]);
            }
            if (winEnd > cursor) {
                totalFreeMinutes += addSlots(slots, cursor, winEnd, slotMinutes);
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("date", date);
        result.put("dayOfWeek", day.getDayOfWeek().getValue() % 7);
        result.put("available", available);
        result.put("source", source);
        result.put("startTime", windowStart);
        result.put("endTime", windowEnd);
        result.put("slotMinutes", slotMinutes);
        result.put("totalFreeMinutes", totalFreeMinutes);
        result.put("bookedCount", booked.size());
        result.put("slots", slots);
        result.put("bookedAppointments", booked);
        return ResponseUtil.success(new ApiResponseDTO(true, "Day schedule retrieved", result));
    }

    /** Chops [from, to) minutes into slots of up to slotMinutes each. Returns minutes produced. */
    private int addSlots(List<java.util.Map<String, Object>> slots, int from, int to, int slotMinutes) {
        int minutes = 0;
        int cursor = from;
        while (cursor < to) {
            int end = Math.min(cursor + slotMinutes, to);
            int len = end - cursor;
            if (len >= 10) {
                java.util.Map<String, Object> slot = new java.util.HashMap<>();
                slot.put("start", toHHMM(cursor));
                slot.put("end", toHHMM(end));
                slot.put("minutes", len);
                slots.add(slot);
                minutes += len;
            }
            cursor = end;
        }
        return minutes;
    }

    private static int toMinutes(String time) {
        String t = time.trim().replaceAll("[\\s\\u00A0]+", "");
        String[] parts = t.split(":");
        try {
            int h = Integer.parseInt(parts[0].trim());
            int m = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
            return h * 60 + m;
        } catch (Exception e) {
            return 0;
        }
    }

    private static String toHHMM(int minutes) {
        return String.format("%02d:%02d", minutes / 60, minutes % 60);
    }
}
