import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  CalendarOff,
  Save,
  CalendarCog,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Trash2,
  Timer,
  Ban,
  Pencil,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { dentistService, appointmentService, availabilityService } from "@/lib/services";
import { getTodayString, formatTime, formatDate, getErrorMessage } from "@/lib/utils";
import type {
  Appointment,
  Dentist,
  DentistAvailability,
  DentistDateAvailability,
  CalendarDay,
  CalendarMonthData,
  DaySchedule,
} from "@/types";

/** Clinic working hours used when no availability is saved yet. */
const WORK_START = 9; // 09:00
const WORK_END = 17; // 17:00

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()). */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SLOT = { startTime: "09:00", endTime: "17:00", isAvailable: false };

/**
 * Fallback slot length (minutes) for dates backed by the recurring weekly
 * schedule, which doesn't store a slot length. Only per-date overrides carry a
 * custom saved length.
 */
const DEFAULT_SLOT_MINUTES = 30;

/** Selectable appointment slot lengths (minutes) for per-date availability. */
const SLOT_LENGTHS = [15, 20, 30, 45, 60];

export default function DentistAvailablePage() {
  const { user } = useAuth();
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // Determine which dentist record belongs to the logged-in dentist.
      let target: Dentist | null = null;
      if (user?.dentistId) {
        const res = await dentistService.getById(user.dentistId);
        target = res.data.data;
      } else {
        const all = await dentistService.getAll();
        target =
          (all.data.data || []).find((d) => d.email && user && d.email === user.username) ?? null;
      }

      const today = getTodayString();
      const apptRes = await appointmentService.getAll({ date: today });
      const allToday = apptRes.data.data || [];
      const mine = target
        ? allToday.filter((a) => a.dentistId === target!.dentistId)
        : allToday.filter((a) => a.dentistName === user?.fullName);

      let avail: DentistAvailability[] = [];
      if (target) {
        try {
          const availRes = await availabilityService.get(target.dentistId);
          avail = availRes.data.data || [];
        } catch {
          // Availability table may not exist yet — fall back to defaults.
          avail = [];
        }
      }

      setDentist(target);
      setAppointments(mine);
      setAvailability(avail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dentist Available" description="Your availability for today" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dentist Available" description="Your availability for today" />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <AvailabilityView
      dentist={dentist}
      appointments={appointments}
      availability={availability}
      user={user}
      onChanged={load}
    />
  );
}

/** Current time rounded down to the nearest half hour, e.g. "14:30". */
function getCurrentHalfHour(): string {
  const now = new Date();
  const m = now.getMinutes() < 30 ? "00" : "30";
  return `${now.getHours().toString().padStart(2, "0")}:${m}`;
}

interface AvailabilityViewProps {
  dentist: Dentist | null;
  appointments: Appointment[];
  availability: DentistAvailability[];
  user: { fullName?: string } | null;
  onChanged: () => void;
}

function AvailabilityView({ dentist, appointments, availability, user, onChanged }: AvailabilityViewProps) {
  const [dataVersion, setDataVersion] = useState(0);
  // Bumped whenever the calendar quick-add saves, so the Date-Range list below
  // reloads without requiring a full page refresh.
  const [dateRangeVersion, setDateRangeVersion] = useState(0);
  const today = getTodayString();
  const todayDow = new Date().getDay();
  const active = appointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "COMPLETED"
  );
  const bookedTimes = active.map((a) => a.appointmentTime.slice(0, 5));

  // Working window for today comes from the saved weekly schedule;
  // fall back to the default clinic hours when nothing is saved.
  const todaySlot = availability.find((s) => s.dayOfWeek === todayDow);
  const windowStart = todaySlot?.startTime ?? `${WORK_START}:00`;
  const windowEnd = todaySlot?.endTime ?? `${WORK_END}:00`;

  const freeSlots: string[] = [];
  if (todaySlot?.isAvailable) {
    let [h, m] = windowStart.split(":").map(Number);
    const [eh, em] = windowEnd.split(":").map(Number);
    while (h < eh || (h === eh && m < em)) {
      const slot = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (!bookedTimes.includes(slot)) freeSlots.push(slot);
      m += 30;
      if (m >= 60) { m -= 60; h += 1; }
    }
  }

  const isAvailableNow =
    !!dentist?.isActive &&
    !!todaySlot?.isAvailable &&
    windowStart <= getCurrentHalfHour() &&
    getCurrentHalfHour() < windowEnd &&
    !bookedTimes.includes(getCurrentHalfHour());

  return (
    <div>
      <PageHeader
        title="Dentist Available"
        description="Your availability status and schedule for today"
      />

      {/* Availability status card */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ${
                isAvailableNow
                  ? "bg-green-600 shadow-green-600/30"
                  : "bg-slate-400 shadow-slate-400/30"
              }`}
            >
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {dentist?.dentistName ?? user?.fullName ?? "Dentist"}
              </p>
              <p className="text-sm text-slate-500">
                {dentist?.specialization || "Dental Surgeon"} • {formatDate(today)}
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${
              isAvailableNow
                ? "border border-green-200 bg-green-100 text-green-700"
                : "border border-slate-200 bg-slate-100 text-slate-600"
            }`}
          >
            {isAvailableNow ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {isAvailableNow ? "Available Now" : "Not Available Now"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-slate-500">Today's Appointments</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{appointments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-slate-500">Free Slots Left</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{freeSlots.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              {dentist?.isActive ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <p className="text-xs text-slate-500">Account Status</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {dentist?.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </Card>

      {/* Booked slots + free slots */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Booked Time Slots" description="Appointments scheduled for today" />
          {active.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <CalendarOff className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">
                No bookings today — you are fully available.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...active]
                .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                .map((a) => (
                  <li
                    key={a.appointmentId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.patientName}</p>
                      <p className="text-xs text-slate-500">{a.treatmentName}</p>
                    </div>
                    <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
                      {formatTime(a.appointmentTime)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Available Time Slots"
            description={
              todaySlot?.isAvailable
                ? `Today's hours ${formatTime(windowStart)} – ${formatTime(windowEnd)}`
                : "You are marked unavailable today — set your hours below"
            }
          />
          {!todaySlot?.isAvailable ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <CalendarOff className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">
                Marked as unavailable for {DAY_NAMES[todayDow]}.
              </p>
            </div>
          ) : freeSlots.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <CalendarOff className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">No free slots remaining today.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {freeSlots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-lg border border-green-200 bg-green-50 px-2 py-2 text-center text-xs font-semibold text-green-700"
                >
                  {formatTime(slot)}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly calendar + selected day slot checker */}
      <AvailabilityCalendar
        key={`cal-${dataVersion}`}
        dentistId={dentist?.dentistId ?? 0}
        onChanged={() => setDateRangeVersion((v) => v + 1)}
      />

      {/* Date-range availability manager */}
      <DateRangeManager
        dentistId={dentist?.dentistId ?? 0}
        refreshKey={dateRangeVersion}
        onChanged={() => setDataVersion((v) => v + 1)}
      />

      {/* Manage weekly availability */}
      <ManageAvailability dentistId={dentist?.dentistId ?? 0} availability={availability} onChanged={onChanged} />
    </div>
  );
}

interface ManageAvailabilityProps {
  dentistId: number;
  availability: DentistAvailability[];
  onChanged: () => void;
}

function ManageAvailability({ dentistId, availability, onChanged }: ManageAvailabilityProps) {
  const [slots, setSlots] = useState<DentistAvailability[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync the editable copy whenever the loaded availability changes.
  useEffect(() => {
    setSlots(
      DAY_NAMES.map((_, day) => {
        const existing = availability.find((s) => s.dayOfWeek === day);
        return {
          dentistId,
          dayOfWeek: day,
          startTime: existing?.startTime ?? DEFAULT_SLOT.startTime,
          endTime: existing?.endTime ?? DEFAULT_SLOT.endTime,
          isAvailable: existing?.isAvailable ?? false,
        };
      })
    );
  }, [availability, dentistId]);

  const update = (day: number, patch: Partial<DentistAvailability>) =>
    setSlots((prev) => prev.map((s) => (s.dayOfWeek === day ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    if (!dentistId) {
      toast.error("No dentist record linked to your account");
      return;
    }
    const invalid = slots.find((s) => s.isAvailable && s.startTime >= s.endTime);
    if (invalid) {
      toast.error(`${DAY_NAMES[invalid.dayOfWeek]}: start time must be before end time`);
      return;
    }
    setSaving(true);
    try {
      await availabilityService.save(
        dentistId,
        slots
          .filter((s) => s.isAvailable)
          .map((s) => ({
            ...s,
            startTime: s.startTime.replace(/\s/g, ""),
            endTime: s.endTime.replace(/\s/g, ""),
          }))
      );
      toast.success("Weekly availability saved");
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        title="Manage My Weekly Availability"
        description="Set which days and hours you are available at the clinic. Saved to the database."
        action={
          <Button onClick={handleSave} disabled={saving || !dentistId}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        }
      />

      <div className="mt-4 space-y-2">
        {slots.map((slot) => (
          <div
            key={slot.dayOfWeek}
            className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              slot.isAvailable ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={slot.isAvailable}
                onChange={(e) => update(slot.dayOfWeek, { isAvailable: e.target.checked })}
                className="h-4 w-4 accent-teal-600"
              />
              <span className="text-sm font-medium text-slate-900">{DAY_NAMES[slot.dayOfWeek]}</span>
              {slot.dayOfWeek === new Date().getDay() && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal-700">
                  Today
                </span>
              )}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={slot.startTime}
                disabled={!slot.isAvailable}
                onChange={(e) => update(slot.dayOfWeek, { startTime: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:opacity-50"
              />
              <span className="text-sm text-slate-400">–</span>
              <input
                type="time"
                value={slot.endTime}
                disabled={!slot.isAvailable}
                onChange={(e) => update(slot.dayOfWeek, { endTime: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Unchecked days are treated as fully unavailable. Booked appointments inside your hours are
        excluded from the free slots shown above.
      </p>
    </Card>
  );
}

/** Local date string (YYYY-MM-DD) without timezone shifts. */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CAL_CELL = {
  available: "border-green-300 bg-green-50 text-green-900 hover:bg-green-100",
  override: "border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
  blocked: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  off: "border-slate-200 bg-slate-50 text-slate-400",
};

// ==================== Monthly calendar + day slot checker ====================

function AvailabilityCalendar({ dentistId, onChanged }: { dentistId: number; onChanged?: () => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [calendar, setCalendar] = useState<CalendarMonthData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [loadingCal, setLoadingCal] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [applyingSlot, setApplyingSlot] = useState(false);
  const [quickForm, setQuickForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: true,
    slotMinutes: 30,
    reason: "",
  });

  const loadCalendar = async () => {
    if (!dentistId) return;
    setLoadingCal(true);
    try {
      const res = await availabilityService.calendar(dentistId, year, month);
      setCalendar(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingCal(false);
    }
  };

  // Remembers the previously opened date so we can tell a "date changed" load
  // apart from a load caused by the user editing the slot-length dropdown. That
  // way we reflect a saved override's slot length when first opening a date,
  // without forcing the dropdown back every time the user changes it.
  const prevDateRef = useRef<string | null>(null);

  const loadDay = async (date: string, minutes = slotMinutes, applyOverrideSlot = false) => {
    if (!dentistId) return;
    setLoadingDay(true);
    try {
      const res = await availabilityService.daySchedule(dentistId, date, minutes);
      const data = res.data.data;
      setDaySchedule(data);
      // When first landing on a date, reflect that date's *saved* slot length
      // only. Per-date overrides carry their own length; dates backed purely by
      // the recurring weekly schedule have no stored length, so they reset to the
      // default 30 min — never inheriting a leftover from another date. This is
      // what keeps changing Sep 1 from touching other Tuesdays.
      if (applyOverrideSlot) {
        const len =
          data?.source === "OVERRIDE" && data.slotMinutes ? data.slotMinutes : DEFAULT_SLOT_MINUTES;
        setSlotMinutes(len);
        setQuickForm((f) => ({ ...f, slotMinutes: len }));
      }
    } catch (err) {
      setDaySchedule(null);
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId, year, month]);

  useEffect(() => {
    const dateChanged = prevDateRef.current !== selectedDate;
    prevDateRef.current = selectedDate;
    loadDay(selectedDate, undefined, dateChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId, selectedDate, slotMinutes]);

  // Close the quick-add form whenever the picked day changes.
  useEffect(() => {
    setShowAdd(false);
  }, [selectedDate]);

  const handleQuickAdd = async () => {
    if (!dentistId) {
      toast.error("No dentist record linked to your account");
      return;
    }
    if (quickForm.isAvailable && quickForm.startTime >= quickForm.endTime) {
      toast.error("Start time must be before end time");
      return;
    }
    setSavingAdd(true);
    try {
      await availabilityService.addDateRange(dentistId, {
        dentistId,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: quickForm.startTime.replace(/\s/g, ""),
        endTime: quickForm.endTime.replace(/\s/g, ""),
        isAvailable: quickForm.isAvailable,
        slotMinutes: quickForm.slotMinutes,
        reason: quickForm.reason.trim() || undefined,
      });
      toast.success(
        quickForm.isAvailable
          ? `Availability added for ${formatDate(selectedDate)} (${formatTime(quickForm.startTime)} – ${formatTime(quickForm.endTime)})`
          : `${formatDate(selectedDate)} blocked as unavailable`
      );
      setShowAdd(false);
      setQuickForm((f) => ({ ...f, reason: "" }));
      loadCalendar();
      // Keep the slot-length dropdown in sync with the value just saved for
      // this specific date (a weekly day becomes a per-date override).
      setSlotMinutes(quickForm.slotMinutes);
      loadDay(selectedDate);
      // Notify the parent so the Date-Range Availability list below refreshes.
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAdd(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  // Persist the chosen slot length for the selected date. Creates a per-date
  // override (keeping the day's current working window) or updates the existing
  // single-date override, so the value sticks instead of only changing the view.
  const handleApplySlotLength = async () => {
    if (!dentistId) {
      toast.error("No dentist record linked to your account");
      return;
    }
    if (!daySchedule || !daySchedule.available || !daySchedule.startTime || !daySchedule.endTime) {
      toast.error("Select an available day with working hours to apply a slot length.");
      return;
    }
    setApplyingSlot(true);
    try {
      const rangesRes = await availabilityService.getDateRanges(dentistId);
      const ranges = rangesRes.data.data || [];
      const covering = ranges.find(
        (r) => selectedDate >= r.startDate && selectedDate <= r.endDate
      );

      if (covering) {
        if (covering.startDate === selectedDate && covering.endDate === selectedDate) {
          // Single-date override -> update just its slot length.
          await availabilityService.updateDateRange(dentistId, covering.dateAvailabilityId!, {
            startDate: covering.startDate,
            endDate: covering.endDate,
            startTime: covering.startTime,
            endTime: covering.endTime,
            isAvailable: covering.isAvailable,
            slotMinutes,
            reason: covering.reason,
          });
        } else {
          // A multi-date range covers this date; changing only one day would
          // affect the whole range, so direct the user to the list below.
          toast.error(
            "This date belongs to a date-range entry — edit its slot length in the Date-Range Availability section."
          );
          return;
        }
      } else {
        // No override yet -> create a per-date override for this single date.
        const start = (daySchedule.startTime || "09:00").replace(/\s/g, "");
        const end = (daySchedule.endTime || "17:00").replace(/\s/g, "");
        await availabilityService.addDateRange(dentistId, {
          dentistId,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: start,
          endTime: end,
          isAvailable: true,
          slotMinutes,
        });
      }

      toast.success(`Slot length set to ${slotMinutes} min for ${formatDate(selectedDate)}`);
      loadCalendar();
      loadDay(selectedDate);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplyingSlot(false);
    }
  };

  const dayMap = new Map<string, CalendarDay>();
  (calendar?.days || []).forEach((d) => dayMap.set(d.date, d));

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateString(new Date(year, month - 1, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = getTodayString();

  const cellClass = (d: CalendarDay) => {
    if (d.source === "OVERRIDE") {
      return d.available ? CAL_CELL.override : CAL_CELL.blocked;
    }
    return d.available ? CAL_CELL.available : CAL_CELL.off;
  };

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-5">
      {/* Calendar */}
      <Card className="lg:col-span-3">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-600" />
              Monthly Calendar
            </span>
          }
          description="Pick a day to view slots or add availability for it"
          action={
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[9.5rem] text-center text-sm font-semibold text-slate-800">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          }
        />
        {loadingCal ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <CalendarGrid
            cells={cells}
            dayMap={dayMap}
            selectedDate={selectedDate}
            today={today}
            cellClass={cellClass}
            onSelect={setSelectedDate}
          />
        )}
      </Card>

      {/* Selected day slot checker */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-teal-600" />
              Free Time Slots
            </span>
          }
          description={formatDate(selectedDate)}
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Slot length</label>
            <select
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
            >
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
            <Button
              onClick={handleApplySlotLength}
              disabled={applyingSlot}
              size="sm"
              variant="outline"
              title="Save this slot length for the selected date (creates/updates a per-date entry)"
            >
              <Save className="h-3.5 w-3.5" />
              {applyingSlot ? "Saving..." : "Apply to this date"}
            </Button>
          </div>
          <Button
            onClick={() => setShowAdd((v) => !v)}
            className={showAdd ? "bg-slate-500 hover:bg-slate-600" : ""}
          >
            {showAdd ? "Close" : <><CalendarPlus className="h-4 w-4" /> Add</>}
          </Button>
        </div>

        {/* Quick add availability for the picked day */}
        {showAdd && (
          <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarPlus className="h-4 w-4 text-teal-600" />
              Add availability for {formatDate(selectedDate)}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setQuickForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                  quickForm.isAvailable
                    ? "bg-green-600 shadow shadow-green-600/30"
                    : "bg-red-600 shadow shadow-red-600/30"
                }`}
              >
                {quickForm.isAvailable ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Available this day</>
                ) : (
                  <><Ban className="h-3.5 w-3.5" /> Block this day</>
                )}
              </button>
            </div>
            {quickForm.isAvailable && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">
                  From
                  <input
                    type="time"
                    value={quickForm.startTime}
                    onChange={(e) => setQuickForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  To
                  <input
                    type="time"
                    value={quickForm.endTime}
                    onChange={(e) => setQuickForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                  />
                </label>
              </div>
            )}
            {quickForm.isAvailable && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500">Slot length (per appointment)</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {SLOT_LENGTHS.map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setQuickForm((f) => ({ ...f, slotMinutes: len }))}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        quickForm.slotMinutes === len
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {len} min
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              value={quickForm.reason}
              placeholder="Reason (optional) — e.g. Extra clinic, Leave"
              onChange={(e) => setQuickForm((f) => ({ ...f, reason: e.target.value }))}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <Button onClick={handleQuickAdd} disabled={savingAdd} className="mt-3 w-full">
              <Save className="h-4 w-4" />
              {savingAdd ? "Saving..." : "Save for this date"}
            </Button>
          </div>
        )}

        {loadingDay ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !daySchedule ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
            Select a day on the calendar.
          </div>
        ) : !daySchedule.available ? (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-red-200 bg-red-50/50 py-8 text-center">
            <CalendarOff className="h-8 w-8 text-red-400" />
            <p className="mt-3 text-sm font-medium text-red-600">Not available on this day</p>
            {daySchedule.source === "OVERRIDE" && (
              <p className="mt-1 text-xs text-slate-500">Blocked by a date-range override</p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">
                  {formatTime(daySchedule.startTime || "")} – {formatTime(daySchedule.endTime || "")}
                </span>
              </div>
              <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
                {Math.floor(daySchedule.totalFreeMinutes / 60)}h {daySchedule.totalFreeMinutes % 60}m free
              </span>
            </div>
            {daySchedule.slots.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">
                No free slots remaining — fully booked.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {daySchedule.slots.map((s) => (
                  <div key={s.start} className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                    <p className="text-sm font-semibold text-green-800">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </p>
                    <p className="text-[11px] text-green-600">{s.minutes} min available</p>
                  </div>
                ))}
              </div>
            )}
            {daySchedule.bookedAppointments.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Booked</p>
                <ul className="mt-1 space-y-1">
                  {daySchedule.bookedAppointments.map((a) => (
                    <li key={a.appointmentId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                      <span>{a.patientName}</span>
                      <span className="font-semibold text-teal-700">{formatTime(a.appointmentTime)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function CalendarGrid({
  cells,
  dayMap,
  selectedDate,
  today,
  cellClass,
  onSelect,
}: {
  cells: (string | null)[];
  dayMap: Map<string, CalendarDay>;
  selectedDate: string;
  today: string;
  cellClass: (d: CalendarDay) => string;
  onSelect: (date: string) => void;
}) {
  return (
    <>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
        {DAY_NAMES.map((d) => (
          <span key={d}>{d.slice(0, 3)}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const d = dayMap.get(date);
          const isSel = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`relative flex h-16 flex-col items-center justify-center rounded-xl border text-sm transition ${
                d ? cellClass(d) : "border-slate-100 bg-white text-slate-300"
              } ${isSel ? "ring-2 ring-teal-600 ring-offset-1" : ""}`}
            >
              <span className={`font-semibold ${date === today ? "underline decoration-2 underline-offset-2" : ""}`}>
                {Number(date.slice(-2))}
              </span>
              {d?.available && d.startTime && (
                <span className="mt-0.5 text-[10px] opacity-80">
                  {d.startTime}–{d.endTime}
                </span>
              )}
              {d?.source === "OVERRIDE" && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
              {!!d?.bookedCount && (
                <span className="absolute left-1 top-1 rounded-full bg-teal-600 px-1.5 text-[9px] font-bold text-white">
                  {d.bookedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-green-300 bg-green-50" /> Weekly hours</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-indigo-300 bg-indigo-50" /> Date-range override</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-red-200 bg-red-50" /> Blocked / vacation</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Booked count</span>
      </div>
    </>
  );
}

// ==================== Date-range availability manager ====================

function DateRangeManager({ dentistId, refreshKey = 0, onChanged }: { dentistId: number; refreshKey?: number; onChanged: () => void }) {
  const [ranges, setRanges] = useState<DentistDateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    startDate: getTodayString(),
    endDate: getTodayString(),
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: true,
    slotMinutes: 30,
    reason: "",
  });

  const load = async () => {
    if (!dentistId) return;
    setLoading(true);
    try {
      const res = await availabilityService.getDateRanges(dentistId);
      setRanges(res.data.data || []);
    } catch {
      setRanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId, refreshKey]);

  const handleAdd = async () => {
    if (!dentistId) {
      toast.error("No dentist record linked to your account");
      return;
    }
    if (form.startDate > form.endDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    if (form.isAvailable && form.startTime >= form.endTime) {
      toast.error("Start time must be before end time");
      return;
    }
    setSaving(true);
    const payload = {
      dentistId,
      startDate: form.startDate,
      endDate: form.endDate,
      startTime: form.startTime.replace(/\s/g, ""),
      endTime: form.endTime.replace(/\s/g, ""),
      isAvailable: form.isAvailable,
      slotMinutes: form.slotMinutes,
      reason: form.reason.trim() || undefined,
    };
    try {
      if (editingId != null) {
        await availabilityService.updateDateRange(dentistId, editingId, payload);
        toast.success(
          form.isAvailable
            ? `Availability updated for ${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
            : `Blocked dates updated: ${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
        );
        setEditingId(null);
      } else {
        await availabilityService.addDateRange(dentistId, payload);
        toast.success(
          form.isAvailable
            ? `Availability added for ${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
            : `Dates blocked: ${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
        );
      }
      setForm((f) => ({ ...f, reason: "" }));
      load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: DentistDateAvailability) => {
    setEditingId(r.dateAvailabilityId ?? null);
    setForm({
      startDate: r.startDate,
      endDate: r.endDate,
      startTime: r.startTime,
      endTime: r.endTime,
      isAvailable: r.isAvailable,
      slotMinutes: r.slotMinutes ?? 30,
      reason: r.reason ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      startDate: getTodayString(),
      endDate: getTodayString(),
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true,
      slotMinutes: 30,
      reason: "",
    });
  };

  const handleCancel = async (id: number) => {
    if (!dentistId) return;
    setCancellingId(id);
    try {
      await availabilityService.cancelDateRange(dentistId, id);
      toast.success("Availability entry cancelled");
      load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-teal-600" />
            Date-Range Availability
          </span>
        }
        description="Add extra hours, special working days or block vacation dates. Overrides your weekly schedule."
      />

      {/* Editing banner */}
      {editingId != null && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Pencil className="h-4 w-4" />
            Editing an existing availability entry — change the values and update.
          </p>
          <button
            onClick={cancelEdit}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
          >
            Discard
          </button>
        </div>
      )}

      {/* Add form */}
      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              form.isAvailable
                ? "bg-green-600 text-white shadow shadow-green-600/30"
                : "bg-red-600 text-white shadow shadow-red-600/30"
            }`}
          >
            {form.isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {form.isAvailable ? "Available (extra hours)" : "Blocked (vacation / off)"}
          </button>
        </div>
        <label className="text-xs font-medium text-slate-500">
          From date
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          To date
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>
        {form.isAvailable && (
          <>
            <label className="text-xs font-medium text-slate-500">
              From time
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              To time
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <div>
              <p className="text-xs font-medium text-slate-500">Slot length (per appointment)</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {SLOT_LENGTHS.map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, slotMinutes: len }))}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      form.slotMinutes === len
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {len} min
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <label className="text-xs font-medium text-slate-500">
          Reason (optional)
          <input
            type="text"
            value={form.reason}
            placeholder={form.isAvailable ? "e.g. Special clinic day" : "e.g. Annual leave"}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <div className="flex items-end gap-2">
          <Button onClick={handleAdd} disabled={saving || !dentistId} className="w-full sm:w-auto">
            {editingId != null ? <Pencil className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
            {saving ? "Saving..." : editingId != null ? "Update Changes" : "Add Availability"}
          </Button>
          {editingId != null && (
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Saved ranges */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : ranges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              No date-range overrides yet — your weekly schedule applies to every week.
            </p>
          </div>
        ) : (
          ranges.map((r) => (
            <div
              key={r.dateAvailabilityId}
              className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                r.isAvailable
                  ? "border-indigo-200 bg-indigo-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {r.isAvailable ? (
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Ban className="h-4 w-4 text-red-500" />
                  )}
                  {formatDate(r.startDate)}
                  {r.endDate !== r.startDate && ` → ${formatDate(r.endDate)}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.isAvailable
                    ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)}`
                    : "Unavailable"}
                  {r.slotMinutes ? ` • ${r.slotMinutes} min slots` : ""}
                  {r.reason ? ` • ${r.reason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(r)}
                  disabled={editingId === r.dateAvailabilityId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editingId === r.dateAvailabilityId ? "Editing..." : "Edit"}
                </button>
                <button
                  onClick={() => handleCancel(r.dateAvailabilityId!)}
                  disabled={cancellingId === r.dateAvailabilityId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {cancellingId === r.dateAvailabilityId ? "Cancelling..." : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
