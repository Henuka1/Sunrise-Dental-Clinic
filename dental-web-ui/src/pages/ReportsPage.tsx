import { useState } from "react";
import { toast } from "sonner";
import { Calendar, TrendingUp, User, FileBarChart, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/EmptyState";
import { reportService, dentistService } from "@/lib/services";
import { formatDate, formatTime, formatCurrency, getTodayString, getErrorMessage } from "@/lib/utils";
import type { Dentist, DailyReportData, RevenueReportData, DentistReportData } from "@/types";

type ReportTab = "daily" | "revenue" | "dentist";

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("daily");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(false);

  const [dailyDate, setDailyDate] = useState(getTodayString());
  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);

  const [revFrom, setRevFrom] = useState(getTodayString());
  const [revTo, setRevTo] = useState(getTodayString());
  const [revData, setRevData] = useState<RevenueReportData | null>(null);

  const [dentistId, setDentistId] = useState("");
  const [dentistFrom, setDentistFrom] = useState(getTodayString());
  const [dentistTo, setDentistTo] = useState(getTodayString());
  const [dentistData, setDentistData] = useState<DentistReportData | null>(null);

  const loadDentists = async () => {
    try {
      const res = await dentistService.getAll();
      setDentists(res.data.data || []);
    } catch {
      // silent
    }
  };

  const runDaily = async () => {
    setLoading(true);
    setDailyData(null);
    try {
      const res = await reportService.daily(dailyDate);
      setDailyData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runRevenue = async () => {
    setLoading(true);
    setRevData(null);
    try {
      const res = await reportService.revenue(revFrom, revTo);
      setRevData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runDentist = async () => {
    if (!dentistId) {
      toast.error("Please select a dentist");
      return;
    }
    setLoading(true);
    setDentistData(null);
    try {
      const res = await reportService.dentist(parseInt(dentistId, 10), dentistFrom, dentistTo);
      setDentistData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: ReportTab; label: string; icon: typeof Calendar }[] = [
    { id: "daily", label: "Daily Report", icon: Calendar },
    { id: "revenue", label: "Revenue Report", icon: TrendingUp },
    { id: "dentist", label: "Dentist Report", icon: User },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Generate and view clinic reports" />

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === "dentist" && dentists.length === 0) loadDentists();
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "daily" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Daily Report" description="View all appointments for a specific date" />
            <div className="mt-4 flex items-end gap-3">
              <Input
                label="Date"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={runDaily} loading={loading}>
                <FileBarChart className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : dailyData ? (
            <Card noPadding>
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="font-semibold text-slate-900">
                  Appointments for {formatDate(dailyData.date)}
                </h3>
                <p className="text-sm text-slate-500">{dailyData.totalAppointments} total</p>
              </div>
              {dailyData.appointments.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-500">
                  No appointments on this date
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Apt #</th>
                        <th className="px-6 py-3 font-medium">Patient</th>
                        <th className="px-6 py-3 font-medium">Dentist</th>
                        <th className="px-6 py-3 font-medium">Time</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyData.appointments.map((apt) => (
                        <tr key={apt.appointmentId} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-teal-700">{apt.appointmentNumber}</td>
                          <td className="px-6 py-4 text-slate-900">{apt.patientName}</td>
                          <td className="px-6 py-4 text-slate-600">Dr. {apt.dentistName}</td>
                          <td className="px-6 py-4 text-slate-600">{formatTime(apt.appointmentTime)}</td>
                          <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Revenue Report" description="Calculate total revenue between two dates" />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Input
                label="From Date"
                type="date"
                value={revFrom}
                onChange={(e) => setRevFrom(e.target.value)}
              />
              <Input
                label="To Date"
                type="date"
                value={revTo}
                onChange={(e) => setRevTo(e.target.value)}
              />
              <Button onClick={runRevenue} loading={loading}>
                <FileBarChart className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : revData ? (
            <Card>
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-50">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(revData.totalRevenue)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(revData.fromDate)} — {formatDate(revData.toDate)}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {tab === "dentist" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Dentist Report" description="View appointments for a specific dentist" />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Select
                label="Dentist"
                placeholder="Select dentist"
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                options={dentists.map((d) => ({
                  value: d.dentistId,
                  label: `Dr. ${d.dentistName} — ${d.specialization}`,
                }))}
              />
              <Input
                label="From Date"
                type="date"
                value={dentistFrom}
                onChange={(e) => setDentistFrom(e.target.value)}
              />
              <Input
                label="To Date"
                type="date"
                value={dentistTo}
                onChange={(e) => setDentistTo(e.target.value)}
              />
              <Button onClick={runDentist} loading={loading}>
                <FileBarChart className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : dentistData ? (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50">
                    <User className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Appointments</p>
                    <p className="text-3xl font-bold text-slate-900">{dentistData.totalAppointments}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(dentistData.fromDate)} — {formatDate(dentistData.toDate)}
                    </p>
                  </div>
                </div>
              </Card>
              {dentistData.appointments.length > 0 && (
                <Card noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-medium">Apt #</th>
                          <th className="px-6 py-3 font-medium">Patient</th>
                          <th className="px-6 py-3 font-medium">Treatment</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dentistData.appointments.map((apt) => (
                          <tr key={apt.appointmentId} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-teal-700">{apt.appointmentNumber}</td>
                            <td className="px-6 py-4 text-slate-900">{apt.patientName}</td>
                            <td className="px-6 py-4 text-slate-600">{apt.treatmentName}</td>
                            <td className="px-6 py-4 text-slate-600">{formatDate(apt.appointmentDate)}</td>
                            <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
