import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus, Search, CalendarPlus } from "lucide-react";
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
} from "@/lib/services";
import { getTodayString, getMaxDatePlus90, getErrorMessage } from "@/lib/utils";
import type { Patient, Dentist, Treatment } from "@/types";

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
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { appointmentDate: getTodayString() },
  });

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [dentistRes, treatmentRes] = await Promise.all([
          dentistService.getAll(),
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
                  label: `Dr. ${d.dentistName} — ${d.specialization}`,
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Appointment Date"
                type="date"
                required
                min={getTodayString()}
                max={getMaxDatePlus90()}
                error={aptErrors.appointmentDate?.message}
                {...registerApt("appointmentDate")}
              />
              <Input
                label="Appointment Time"
                type="time"
                required
                error={aptErrors.appointmentTime?.message}
                {...registerApt("appointmentTime")}
              />
            </div>
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
