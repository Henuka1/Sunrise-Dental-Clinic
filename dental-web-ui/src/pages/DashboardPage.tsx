import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, Plus, DollarSign, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import { appointmentService, billingService } from "@/lib/services";
import { getTodayString, formatTime, formatCurrency } from "@/lib/utils";
import type { Appointment, Bill } from "@/types";

interface Stats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const [aptResult, billResult] = await Promise.allSettled([
      appointmentService.getAll({ date: getTodayString() }),
      billingService.getAll(),
    ]);

    if (aptResult.status === "fulfilled") {
      setAppointments(aptResult.value.data.data || []);
    } else {
      setError((aptResult.reason as Error).message || "Failed to load dashboard data");
      setLoading(false);
      return;
    }

    if (billResult.status === "fulfilled") {
      setBills(billResult.value.data.data || []);
    } else {
      setBills([]);
      toast.error("Billing summary could not be loaded. Appointments are still available.");
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stats: Stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  const todaysRevenue = bills
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const upcoming = appointments
    .filter((a) => a.status === "SCHEDULED")
    .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
    .slice(0, 5);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Today's overview at a glance" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Today's overview at a glance" />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const statCards = [
    { label: "Today's Appointments", value: stats.total, icon: Calendar, color: "text-teal-600 bg-teal-50" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-blue-600 bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today's overview at a glance"
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" noPadding>
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Upcoming Appointments</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              No upcoming appointments for today
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((apt) => (
                <div key={apt.appointmentId} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{apt.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {apt.treatmentName} — Dr. {apt.dentistName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {formatTime(apt.appointmentTime)}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Revenue (Paid)</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(todaysRevenue)}</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <p className="text-xs text-slate-500">Collected from {bills.filter(b => b.paymentStatus === "PAID").length} bills</p>
            </div>
          </div>
          <Link
            to="/billing"
            className="mt-4 block text-center text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all bills →
          </Link>
        </Card>
      </div>
    </div>
  );
}
