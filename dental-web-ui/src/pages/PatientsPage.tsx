import { useState, useEffect } from "react";
import { History, Users, Calendar, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { appointmentService, patientService } from "@/lib/services";
import { formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import type { Appointment } from "@/types";

interface PatientSummary {
  patientId: number;
  patientName: string;
  visits: number;
  lastVisit?: string;
}

export default function PatientsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [history, setHistory] = useState<Appointment[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await appointmentService.getAll();
      setAppointments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patients: PatientSummary[] = appointments.reduce<PatientSummary[]>((acc, apt) => {
    const existing = acc.find((p) => p.patientId === apt.patientId);
    if (existing) {
      existing.visits += 1;
      if (!existing.lastVisit || apt.appointmentDate > existing.lastVisit) {
        existing.lastVisit = apt.appointmentDate;
      }
    } else {
      acc.push({
        patientId: apt.patientId,
        patientName: apt.patientName,
        visits: 1,
        lastVisit: apt.appointmentDate,
      });
    }
    return acc;
  }, []);

  const viewHistory = async (patientId: number, name: string) => {
    setSelectedName(name);
    setHistoryLoading(true);
    setHistory(null);
    try {
      const res = await patientService.getHistory(patientId);
      const payload = res.data as any;
      // Backend returns ApiResponse wrapping the list at `payload.data`.
      const list =
        payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
      setHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  };
return (
    <div>
      <PageHeader
        title="Patient History"
        description="View patients you have treated and their appointment history"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error && patients.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No patients yet"
          description="Patients you have treated will appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {patients.map((p) => (
              <Card key={p.patientId}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{p.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {p.visits} visit{p.visits > 1 ? "s" : ""}
                        {p.lastVisit ? ` · Last: ${formatDate(p.lastVisit)}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => viewHistory(p.patientId, p.patientName)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-2 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <History className="h-5 w-5 text-teal-600" />
              <h3 className="font-semibold text-slate-900">
                {selectedName ? `${selectedName}'s History` : "Patient History"}
              </h3>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((apt) => (
                  <div key={apt.appointmentId} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{apt.treatmentName}</p>
                      <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(apt.appointmentDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(apt.appointmentTime)}
                        </span>
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-12 text-sm text-slate-500">
                {selectedName
                  ? "No appointment history found for this patient."
                  : "Select a patient to view their history."}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}