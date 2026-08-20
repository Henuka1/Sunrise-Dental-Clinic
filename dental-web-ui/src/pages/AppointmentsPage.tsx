import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Plus, XCircle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import EmptyState, { TableLoading } from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { appointmentService } from "@/lib/services";
import { getTodayString, formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterStatus, setFilterStatus] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params: { date?: string; status?: string } = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const res = await appointmentService.getAll(params);
      setAppointments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterDate, filterStatus]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await appointmentService.cancel(cancelTarget.appointmentId);
      toast.success("Appointment cancelled");
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleComplete = async (apt: Appointment) => {
    setCompleting(apt.appointmentId);
    try {
      await appointmentService.complete(apt.appointmentId);
      toast.success("Appointment marked as completed");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="View and manage all appointments"
        action={
          <Link
            to="/appointments/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Filter by Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Select
            label="Filter by Status"
            placeholder="All statuses"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "NO_SHOW", label: "No Show" },
            ]}
          />
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilterDate("");
                setFilterStatus("");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <TableLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No appointments found"
          description="Try adjusting your filters or create a new appointment."
          action={
            <Link
              to="/appointments/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Link>
          }
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Apt #</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Dentist</th>
                  <th className="px-6 py-3 font-medium">Treatment</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.appointmentId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-teal-700">
                      {apt.appointmentNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{apt.patientName}</td>
                    <td className="px-6 py-4 text-slate-600">Dr. {apt.dentistName}</td>
                    <td className="px-6 py-4 text-slate-600">{apt.treatmentName}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(apt.appointmentDate)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatTime(apt.appointmentTime)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {apt.status === "SCHEDULED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComplete(apt)}
                              loading={completing === apt.appointmentId}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTarget(apt)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment ${cancelTarget?.appointmentNumber} for ${cancelTarget?.patientName}?`}
        confirmLabel="Yes, Cancel"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
