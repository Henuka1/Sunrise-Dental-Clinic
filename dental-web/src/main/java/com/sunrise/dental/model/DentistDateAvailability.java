package com.sunrise.dental.model;

/**
 * Date-range availability override for a dentist, stored in the
 * dentist_date_availability table. When isAvailable is true the dentist
 * works start_time–end_time on every day of the range; when false the
 * range is blocked (e.g. vacation). Overrides the weekly schedule.
 */
public class DentistDateAvailability {
    private int dateAvailabilityId;
    private int dentistId;
    /** "YYYY-MM-DD" */
    private String startDate;
    /** "YYYY-MM-DD" (inclusive) */
    private String endDate;
    /** "HH:MM" 24h format */
    private String startTime;
    /** "HH:MM" 24h format */
    private String endTime;
    private boolean isAvailable;
    private String reason;

    public DentistDateAvailability() {}

    public DentistDateAvailability(int dentistId, String startDate, String endDate,
                                   String startTime, String endTime, boolean isAvailable, String reason) {
        this.dentistId = dentistId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isAvailable = isAvailable;
        this.reason = reason;
    }

    public int getDateAvailabilityId() { return dateAvailabilityId; }
    public void setDateAvailabilityId(int dateAvailabilityId) { this.dateAvailabilityId = dateAvailabilityId; }
    public int getDentistId() { return dentistId; }
    public void setDentistId(int dentistId) { this.dentistId = dentistId; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean isAvailable) { this.isAvailable = isAvailable; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
