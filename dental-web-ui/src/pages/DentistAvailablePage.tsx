import { useState, useEffect } from "react";
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
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { dentistService, appointmentService, availabilityService } from "@/lib/services";
import { getTodayString, formatTime, formatDate, getErrorMessage } from "@/lib/utils";
import type { Appointment, Dentist, DentistAvailability } from "@/types";

/** Clinic working hours used when no availability is saved yet. */
const WORK_START = 9; // 09:00
const WORK_END = 17; // 17:00

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()). */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SLOT = { startTime: "09:00", endTime: "17:00", isAvailable: false };

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
        slots.filter((s) => s.isAvailable)
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