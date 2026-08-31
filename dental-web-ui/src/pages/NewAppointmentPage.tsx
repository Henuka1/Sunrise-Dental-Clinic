import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  CalendarPlus,
  CalendarDays,
  Clock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import {
  patientService,
  dentistService,
  treatmentService,
  appointmentService,
  availabilityService,
} from "@/lib/services";
import { cn, getTodayString, getMaxDatePlus90, formatTime, getErrorMessage } from "@/lib/utils";
import type { Patient, Dentist, Treatment, CalendarDay, FreeSlot } from "@/types";

const appointmentSchema = z.object({
  dentistId: z.string().min(1, "Dentist is required"),
  treatmentId: z.string().min(1, "Treatment is required"),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentLocationState {
  selectedPatient?: Patient;
}

export default function NewAppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    (location.state as AppointmentLocationState | null)?.selectedPatient || null
  );

  const {
    register: registerApt,
    handleSubmit: handleSubmitApt,
    formState: { errors: aptErrors },
    setValue: setAptValue,
    watch: watchApt,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { appointmentDate: getTodayString() },
  });

  // ---- Dentist availability booking picker --------------------------------
  const selectedDentistId = watchApt("dentistId");
  const pickedDate = watchApt("appointmentDate");
  const [availableDays, setAvailableDays] = useState<CalendarDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [daysError, setDaysError] = useState("");
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Build the list of (year, month) pairs covering today .. today+90 days.
  const buildMonthRange = (): { year: number; month: number }[] => {
    const months: { year: number; month: number }[] = [];
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    let cursor = { year: start.getFullYear(), month: start.getMonth() + 1 };
    const maxKey = end.getFullYear() * 12 + end.getMonth();
    while (cursor.year * 12 + (cursor.month - 1) <= maxKey) {
      months.push({ ...cursor });
      cursor = cursor.month === 12 ? { year: cursor.year + 1, month: 1 } : { year: cursor.year, month: cursor.month + 1 };
    }
    return months;
  };

  // When the dentist changes, load their available dates (next 90 days).
  useEffect(() => {
    let cancelled = false;
    if (!selectedDentistId) {
      setAvailableDays([]);
      setFreeSlots([]);
      setBookedSlots([]);
      setDaysError("");
      setSlotsError("");
      return;
    }
    const dentistId = Number(selectedDentistId);
    (async () => {
      setLoadingDays(true);
      setDaysError("");
      setSlotsError("");
      try {
        const monthResults = await Promise.all(
          buildMonthRange().map((m) => availabilityService.calendar(dentistId, m.year, m.month))
        );
        if (cancelled) return;
        const today = getTodayString();
        const max = getMaxDatePlus90();
        const dayMap = new Map<string, CalendarDay>();
        monthResults.forEach((res) => {
          (res.data.data?.days || []).forEach((d) => dayMap.set(d.date, d));
        });
        const list: CalendarDay[] = [];
        dayMap.forEach((d) => {
          if (d.available && d.date >= today && d.date <= max) list.push(d);
        });
        list.sort((a, b) => a.date.localeCompare(b.date));
        setAvailableDays(list);
        setFreeSlots([]);
        setBookedSlots([]);
        // Reset the previous selection; the user picks a date from the new list.
        setAptValue("appointmentDate", "", { shouldValidate: true });
        setAptValue("appointmentTime", "", { shouldValidate: true });
      } catch {
        if (!cancelled) {
          setAvailableDays([]);
          setDaysError("Could not load this dentist's availability. Try again.");
        }
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDentistId]);

  // When a date is picked, load that day's actual free time slots.
  useEffect(() => {
    let cancelled = false;
    if (!selectedDentistId || !pickedDate) {
      setFreeSlots([]);
      setBookedSlots([]);
      setSlotsError("");
      return;
    }
    (async () => {
      setLoadingSlots(true);
      setSlotsError("");
      try {
        const res = await availabilityService.daySchedule(Number(selectedDentistId), pickedDate);
        if (cancelled) return;
        const data = res.data.data;
        setFreeSlots(data?.slots || []);
        // Times that have an active booking on this date — shown as "Booked".
        setBookedSlots(
          (data?.bookedAppointments || [])
            .map((a) => a.appointmentTime.slice(0, 5))
            .filter((t): t is string => !!t)
        );
      } catch {
        if (!cancelled) setSlotsError("Could not load time slots for this date.");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDentistId, pickedDate]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [dentistRes, treatmentRes] = await Promise.all([
          dentistService.getAll({ includeInactive: true }),
          treatmentService.getAll(),
        ]);
        setDentists(dentistRes.data.data || []);
        setTreatments(treatmentRes.data.data || []);
      } catch {
        toast.error("Failed to load dentists and treatments");
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await patientService.search(searchQuery.trim());
      setSearchResults(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const onSubmitAppointment = async (data: AppointmentFormData) => {
    if (!selectedPatient) {
      toast.error("Please select or create a patient first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await appointmentService.create({
        patientId: selectedPatient.patientId,
        dentistId: parseInt(data.dentistId, 10),
        treatmentId: parseInt(data.treatmentId, 10),
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        notes: data.notes,
      });
      toast.success("Appointment created successfully");
      const apt = res.data.data;
      navigate(`/appointments`);
      void apt;
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div>
        <PageHeader title="New Appointment" description="Schedule a new appointment" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New Appointment"
        description="Schedule a new appointment for a patient"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Patient" description="Search an existing patient or register from dedicated page" />

          {!selectedPatient ? (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or NIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSearch}
                  loading={searching}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.patientId}
                      onClick={() => setSelectedPatient(p)}
                      className="w-full rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50/60"
                    >
                      <p className="text-sm font-medium text-slate-900">{p.patientName}</p>
                      <p className="text-xs text-slate-500">{p.contactNumber}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-teal-300/80 bg-teal-50/70 p-4">
                <p className="mb-3 text-sm text-slate-600">Patient not found? Register from the dedicated page and come back automatically.</p>
                <Link
                  to="/patients/new"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Register New Patient
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/80 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{selectedPatient.patientName}</p>
                  <p className="text-xs text-slate-600">{selectedPatient.contactNumber}</p>
                  {selectedPatient.email && (
                    <p className="text-xs text-slate-600">{selectedPatient.email}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Appointment Details"
            description="Select dentist, treatment, and schedule"
          />
          <form
            onSubmit={handleSubmitApt(onSubmitAppointment)}
            className="mt-6 space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Dentist"
                required
                placeholder="Select dentist"
                options={dentists.map((d) => ({
                  value: d.dentistId,
                  label: d.isActive === false
                    ? `Dr. ${d.dentistName} — ${d.specialization} (Unavailable)`
                    : `Dr. ${d.dentistName} — ${d.specialization}`,
                  disabled: d.isActive === false,
                }))}
                error={aptErrors.dentistId?.message}
                {...registerApt("dentistId")}
              />
              <Select
                label="Treatment"
                required
                placeholder="Select treatment"
                options={treatments.map((t) => ({
                  value: t.treatmentId,
                  label: `${t.treatmentName} (${t.treatmentCode})`,
                }))}
                error={aptErrors.treatmentId?.message}
                {...registerApt("treatmentId")}
              />
            </div>
            {/* Date + time slot booking picker */}
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-cyan-50/40 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-semibold text-slate-800">Select Date & Time</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {selectedDentistId
                  ? "Pick an available day, then choose a free time slot for the dentist."
                  : "Choose a dentist first to see their available dates and times."}
              </p>

              {!selectedDentistId ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/70 py-6 text-center text-sm text-slate-500">
                  No dentist selected yet.
                </div>
              ) : loadingDays ? (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 py-6 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Loading available dates...
                </div>
              ) : daysError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {daysError}
                </div>
              ) : availableDays.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/70 py-6 text-center text-sm text-slate-500">
                  This dentist has no availability scheduled in the next 90 days.
                </div>
              ) : (
                <>
                  {/* Available dates */}
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Available dates
                    </p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                      {availableDays.map((d) => {
                        const dayNum = Number(d.date.slice(-2));
                        const monthShort = new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", {
                          month: "short",
                        });
                        const isSel = d.date === pickedDate;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => {
                              setAptValue("appointmentDate", d.date, { shouldValidate: true });
                              setAptValue("appointmentTime", "", { shouldValidate: true });
                            }}
                            className={cn(
                              "flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-center transition-all",
                              isSel
                                ? "border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                                : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md"
                            )}
                          >
                            <span className={cn("text-[10px] font-medium uppercase", isSel ? "text-teal-100" : "text-slate-400")}>
                              {monthShort}
                            </span>
                            <span className="text-lg font-bold leading-none">{dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free time slots */}
                  <div className="mt-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {pickedDate
                        ? `Slots on ${new Date(pickedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}`
                        : "Slots"}
                    </p>
                    <div className="mt-2">
                      {loadingSlots ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-6 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Loading slots...
                        </div>
                      ) : slotsError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {slotsError}
                        </div>
                      ) : !pickedDate ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 py-6 text-center text-sm text-slate-500">
                          Select a date above to see slots.
                        </div>
                      ) : freeSlots.length === 0 && bookedSlots.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 py-6 text-center text-sm text-amber-700">
                          No free slots left on this day — please pick another date.
                        </div>
                      ) : (
                        <>
                          {freeSlots.length === 0 && bookedSlots.length > 0 && (
                            <div className="mb-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-3 py-3 text-xs text-amber-700">
                              This day is fully booked — all slots below are already taken.
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              ...freeSlots.map((s) => ({
                                type: "free" as const,
                                key: `${s.start}-${s.end}`,
                                start: s.start,
                                end: s.end,
                              })),
                              ...bookedSlots.map((t) => ({
                                type: "booked" as const,
                                key: `booked-${t}`,
                                start: t,
                                end: t,
                              })),
                            ]
                              .sort((a, b) => a.start.localeCompare(b.start))
                              .map((slot) =>
                                slot.type === "free" ? (
                                  <button
                                    key={slot.key}
                                    type="button"
                                    onClick={() =>
                                      setAptValue("appointmentTime", slot.start, {
                                        shouldValidate: true,
                                      })
                                    }
                                    className={cn(
                                      "flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-semibold transition-all",
                                      slot.start === watchApt("appointmentTime")
                                        ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/30"
                                        : "border-green-200 bg-green-50 text-green-700 hover:-translate-y-0.5 hover:border-green-400 hover:shadow-md"
                                    )}
                                  >
                                    {slot.start === watchApt("appointmentTime") && (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    {formatTime(slot.start)}
                                  </button>
                                ) : (
                                  <div
                                    key={slot.key}
                                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-2 py-2 text-slate-400"
                                  >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                      Booked
                                    </span>
                                    <span className="text-sm font-semibold line-through">
                                      {formatTime(slot.start)}
                                    </span>
                                  </div>
                                )
                              )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {aptErrors.appointmentDate?.message && (
              <p className="text-xs text-red-600">{aptErrors.appointmentDate.message}</p>
            )}
            {aptErrors.appointmentTime?.message && (
              <p className="text-xs text-red-600">{aptErrors.appointmentTime.message}</p>
            )}
            <Textarea
              label="Notes"
              rows={3}
              placeholder="Optional notes about the appointment..."
              {...registerApt("notes")}
            />
            <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                <CalendarPlus className="h-4 w-4" />
                Create Appointment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
