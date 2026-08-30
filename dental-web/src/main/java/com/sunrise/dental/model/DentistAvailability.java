package com.sunrise.dental.model;

/**
 * Weekly availability slot for a dentist, stored in the
 * dentist_availability table. Times are handled as "HH:MM" strings
 * (24h format) so they serialize cleanly to/from JSON.
 */
public class DentistAvailability {
    private int availabilityId;
    private int dentistId;
    /** 0 = Sunday, 1 = Monday, ... 6 = Saturday (matches JS Date.getDay()). */
    private int dayOfWeek;
    /** "HH:MM" 24h format. */
    private String startTime;
    /** "HH:MM" 24h format. */
    private String endTime;
    private boolean isAvailable;

    public DentistAvailability() {}

    public DentistAvailability(int dentistId, int dayOfWeek, String startTime, String endTime, boolean isAvailable) {
        this.dentistId = dentistId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isAvailable = isAvailable;
    }

    public int getAvailabilityId() { return availabilityId; }
    public void setAvailabilityId(int availabilityId) { this.availabilityId = availabilityId; }
    public int getDentistId() { return dentistId; }
    public void setDentistId(int dentistId) { this.dentistId = dentistId; }
    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean isAvailable) { this.isAvailable = isAvailable; }
}