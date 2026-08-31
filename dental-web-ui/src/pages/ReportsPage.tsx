import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Calendar,
  TrendingUp,
  User,
  FileBarChart,
  Printer,
  FileDown,
  Download,
  CheckCircle2,
  Clock4,
  XCircle,
  UserX,
  ReceiptText,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/EmptyState";
import {
  DonutChart,
  BarList,
  AreaChart,
  StatCard,
  STATUS_CHART_COLORS,
  CHART_PALETTE,
  type ChartDatum,
} from "@/components/charts";
import { useAuth } from "@/context/AuthContext";
import { reportService, dentistService, billingService } from "@/lib/services";
import {
  formatDate,
  formatTime,
  formatCurrency,
  getTodayString,
  getErrorMessage,
} from "@/lib/utils";
import type {
  Dentist,
  DailyReportData,
  RevenueReportData,
  DentistReportData,
  Appointment,
  Bill,
} from "@/types";

type ReportTab = "daily" | "revenue" | "dentist";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

function countBy(items: Appointment[], keyFn: (item: Appointment) => string): ChartDatum[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function statusSlices(appointments: Appointment[]): ChartDatum[] {
  const order = ["COMPLETED", "SCHEDULED", "CHECKED_IN", "CANCELLED", "NO_SHOW"];
  return order
    .map((status) => ({
      label: STATUS_LABELS[status] ?? status,
      value: appointments.filter((a) => a.status === status).length,
      color: STATUS_CHART_COLORS[status],
    }))
    .filter((s) => s.value > 0);
}

function dayDiff(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(Math.round((b - a) / 86400000), 0);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const isDentist = user?.role === "DENTIST";
  const [tab, setTab] = useState<ReportTab>(isDentist ? "dentist" : "daily");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(false);

  const [dailyDate, setDailyDate] = useState(getTodayString());
  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);

  const [revFrom, setRevFrom] = useState(getTodayString());
  const [revTo, setRevTo] = useState(getTodayString());
  const [revData, setRevData] = useState<RevenueReportData | null>(null);
  const [revBills, setRevBills] = useState<Bill[] | null>(null);

  const [dentistId, setDentistId] = useState(isDentist ? String(user?.dentistId ?? "") : "");
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
    setRevBills(null);
    try {
      const res = await reportService.revenue(revFrom, revTo);
      setRevData(res.data.data);
      try {
        const bills = await billingService.getAll();
        setRevBills(bills.data.data || []);
      } catch {
        setRevBills(null); // charts degrade gracefully, headline total still shown
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runDentist = async () => {
    const id = dentistId || String(user?.dentistId ?? "");
    if (!id) {
      toast.error("Please select a dentist");
      return;
    }
    setLoading(true);
    setDentistData(null);
    try {
      const res = await reportService.dentist(parseInt(id, 10), dentistFrom, dentistTo);
      setDentistData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  /* ------------------------- Derived chart data ------------------------- */

  const dailyStatus = dailyData ? statusSlices(dailyData.appointments) : [];
  const dailyDentists = dailyData ? countBy(dailyData.appointments, (a) => `Dr. ${a.dentistName}`) : [];
  const dailyTreatments = dailyData ? countBy(dailyData.appointments, (a) => a.treatmentName) : [];

  const dentistStatus = dentistData ? statusSlices(dentistData.appointments) : [];
  const dentistTreatments = dentistData
    ? countBy(dentistData.appointments, (a) => a.treatmentName)
    : [];

  const revRangeBills = useMemo(() => {
    if (!revData || !revBills) return [];
    const from = revData.fromDate.slice(0, 10);
    const to = revData.toDate.slice(0, 10);
    return revBills.filter((b) => {
      const d = (b.billedAt || "").slice(0, 10);
      return d >= from && d <= to;
    });
  }, [revData, revBills]);

  const revSeries = useMemo(() => {
    if (!revData) return [];
    const from = revData.fromDate.slice(0, 10);
    const to = revData.toDate.slice(0, 10);
    const days = dayDiff(from, to);

    const sumFor = (predicate: (d: string) => boolean) =>
      revRangeBills.filter((b) => predicate((b.billedAt || "").slice(0, 10))).reduce((s, b) => s + b.totalAmount, 0);

    if (days <= 31) {
      const out: { label: string; value: number }[] = [];
      const cursor = new Date(from);
      for (let i = 0; i <= days; i++) {
        const iso = cursor.toISOString().slice(0, 10);
        out.push({ label: iso.slice(5), value: sumFor((d) => d === iso) });
        cursor.setDate(cursor.getDate() + 1);
      }
      return out;
    }

    const monthly = new Map<string, number>();
    revRangeBills.forEach((b) => {
      const key = (b.billedAt || "").slice(0, 7);
      monthly.set(key, (monthly.get(key) ?? 0) + b.totalAmount);
    });
    return Array.from(monthly.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ label: k, value: v }));
  }, [revData, revRangeBills]);

  const revMethodSlices = useMemo(() => {
    const methods = ["CASH", "CARD", "ONLINE"];
    return methods
      .map((m) => ({
        label: m.charAt(0) + m.slice(1).toLowerCase(),
        value: revRangeBills
          .filter((b) => b.paymentMethod === m && b.paymentStatus === "PAID")
          .reduce((s, b) => s + b.totalAmount, 0),
      }))
      .filter((s) => s.value > 0);
  }, [revRangeBills]);

  const revPaid = revRangeBills
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((s, b) => s + b.totalAmount, 0);
  const revPending = revRangeBills
    .filter((b) => b.paymentStatus !== "PAID")
    .reduce((s, b) => s + b.totalAmount, 0);

  /* --------------------------- Titles / export --------------------------- */

  const reportTitle =
    tab === "daily"
      ? `Daily Report — ${dailyData ? formatDate(dailyData.date) : formatDate(dailyDate)}`
      : tab === "revenue"
      ? `Revenue Report — ${revData ? `${formatDate(revData.fromDate)} to ${formatDate(revData.toDate)}` : ""}`
      : `Dentist Report — ${dentistData ? `${formatDate(dentistData.fromDate)} to ${formatDate(dentistData.toDate)}` : ""}`;

  const handlePrint = () => window.print();

  const exportCsv = () => {
    let rows: string[][] = [];
    if (tab === "daily" && dailyData) {
      rows = [
        ["Apt #", "Patient", "Dentist", "Time", "Status"],
        ...dailyData.appointments.map((a) => [
          a.appointmentNumber,
          a.patientName,
          `Dr. ${a.dentistName}`,
          formatTime(a.appointmentTime),
          a.status,
        ]),
      ];
    } else if (tab === "revenue" && revData) {
      rows = [
        ["Period", "Revenue (LKR)"],
        ["From", revData.fromDate],
        ["To", revData.toDate],
        ["Total", String(revData.totalRevenue)],
        [],
        ["Date", "Billed (LKR)"],
        ...revSeries.map((s) => [s.label, String(s.value)]),
      ];
    } else if (tab === "dentist" && dentistData) {
      rows = [
        ["Apt #", "Patient", "Treatment", "Date", "Status"],
        ...dentistData.appointments.map((a) => [
          a.appointmentNumber,
          a.patientName,
          a.treatmentName,
          formatDate(a.appointmentDate),
          a.status,
        ]),
      ];
    }
    if (rows.length === 0) return;
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTitle.replace(/[^a-z0-9]+/gi, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as CSV");
  };

  const hasResult = !!(dailyData || revData || dentistData);

  const tabs: { id: ReportTab; label: string; icon: typeof Calendar }[] = isDentist
    ? [{ id: "dentist", label: "My Workload Report", icon: User }]
    : [
        { id: "daily", label: "Daily Report", icon: Calendar },
        { id: "revenue", label: "Revenue Report", icon: TrendingUp },
        { id: "dentist", label: "Dentist Report", icon: User },
      ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description={
          isDentist ? "View your personal workload report" : "Generate and view clinic reports"
        }
      />

      {/* Tab switcher + report actions (never printed) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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

        {hasResult && (
          <div className="flex flex-wrap gap-2">
            {tab === "revenue" && revData && (
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            {(tab === "daily" || tab === "dentist") && (
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!hasResult}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={!hasResult}>
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {tab === "daily" && (
        <div className="space-y-6">
          <Card className="no-print">
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
            <div className="print-area space-y-6">
              <div className="hidden print:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Sunrise Dental Clinic
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{reportTitle}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Appointments"
                  value={dailyData.totalAppointments}
                  icon={<ReceiptText className="h-5 w-5 text-teal-600" />}
                />
                <StatCard
                  label="Completed"
                  value={dailyData.appointments.filter((a) => a.status === "COMPLETED").length}
                  accentClass="border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 text-emerald-900"
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                />
                <StatCard
                  label="Scheduled / Upcoming"
                  value={dailyData.appointments.filter((a) => a.status === "SCHEDULED").length}
                  accentClass="border-sky-100 bg-gradient-to-br from-sky-50/90 to-blue-50/60 text-sky-900"
                  icon={<Clock4 className="h-5 w-5 text-sky-600" />}
                />
                <StatCard
                  label="Cancelled / No Show"
                  value={
                    dailyData.appointments.filter(
                      (a) => a.status === "CANCELLED" || a.status === "NO_SHOW"
                    ).length
                  }
                  accentClass="border-red-100 bg-gradient-to-br from-red-50/90 to-orange-50/60 text-red-900"
                  icon={<XCircle className="h-5 w-5 text-red-600" />}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Appointment Status" description="How the day's bookings resolved" />
                  <div className="mt-6">
                    {dailyStatus.length > 0 ? (
                      <DonutChart data={dailyStatus} centerLabel="Bookings" />
                    ) : (
                      <p className="py-10 text-center text-sm text-slate-500">No appointments on this date</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Load per Dentist" description="Appointments handled by each dentist" />
                  <div className="mt-6">
                    <BarList data={dailyDentists} emptyMessage="No dentist workload for this date" />
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader title="Popular Treatments" description="Treatments performed on this date" />
                <div className="mt-6">
                  <BarList data={dailyTreatments} emptyMessage="No treatments recorded for this date" />
                </div>
              </Card>

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
            </div>
          ) : null}
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-6">
          <Card className="no-print">
            <CardHeader title="Revenue Report" description="Calculate total revenue between two dates" />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Input label="From Date" type="date" value={revFrom} onChange={(e) => setRevFrom(e.target.value)} />
              <Input label="To Date" type="date" value={revTo} onChange={(e) => setRevTo(e.target.value)} />
              <Button onClick={runRevenue} loading={loading}>
                <FileBarChart className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : revData ? (
            <div className="print-area space-y-6">
              <div className="hidden print:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Sunrise Dental Clinic
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{reportTitle}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(revData.totalRevenue)}
                  hint={`${formatDate(revData.fromDate)} — ${formatDate(revData.toDate)}`}
                  icon={<TrendingUp className="h-5 w-5 text-teal-600" />}
                />
                <StatCard
                  label="Collected (Paid)"
                  value={formatCurrency(revPaid)}
                  accentClass="border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 text-emerald-900"
                  icon={<Wallet className="h-5 w-5 text-emerald-600" />}
                  hint={`${revRangeBills.filter((b) => b.paymentStatus === "PAID").length} paid bills`}
                />
                <StatCard
                  label="Outstanding"
                  value={formatCurrency(revPending)}
                  accentClass="border-amber-100 bg-gradient-to-br from-amber-50/90 to-orange-50/60 text-amber-900"
                  icon={<ReceiptText className="h-5 w-5 text-amber-600" />}
                  hint={`${revRangeBills.filter((b) => b.paymentStatus !== "PAID").length} pending bills`}
                />
                <StatCard
                  label="Bills Issued"
                  value={revRangeBills.length}
                  accentClass="border-sky-100 bg-gradient-to-br from-sky-50/90 to-blue-50/60 text-sky-900"
                  icon={<FileBarChart className="h-5 w-5 text-sky-600" />}
                />
              </div>

              {revBills ? (
                <>
                  <Card>
                    <CardHeader
                      title="Revenue Trend"
                      description={
                        dayDiff(revData.fromDate, revData.toDate) <= 31
                          ? "Amount billed per day"
                          : "Amount billed per month"
                      }
                    />
                    <div className="mt-4">
                      <AreaChart
                        data={revSeries}
                        color="#0d9488"
                        formatValue={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${Math.round(v)}`
                        }
                        emptyMessage="No bills were issued in this period"
                      />
                    </div>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader title="Payment Methods" description="Collected revenue by method" />
                      <div className="mt-6">
                        {revMethodSlices.length > 0 ? (
                          <DonutChart
                            data={revMethodSlices}
                            centerLabel="Collected"
                            centerValue={formatCurrency(revPaid)}
                          />
                        ) : (
                          <p className="py-10 text-center text-sm text-slate-500">
                            No payments collected in this period
                          </p>
                        )}
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Revenue Split" description="Collected vs outstanding amount" />
                      <div className="mt-6">
                        <BarList
                          data={[
                            { label: "Collected", value: revPaid, color: "#10b981" },
                            { label: "Outstanding", value: revPending, color: "#f59e0b" },
                          ]}
                          formatValue={(v) => formatCurrency(v)}
                          emptyMessage="No billing activity in this period"
                        />
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <p className="text-sm text-slate-500">
                    Detailed charts are unavailable right now — total revenue is shown above.
                  </p>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      )}

      {tab === "dentist" && (
        <div className="space-y-6">
          <Card className="no-print">
            <CardHeader
              title={isDentist ? "My Workload Report" : "Dentist Report"}
              description={
                isDentist
                  ? "View your appointments within a date range"
                  : "View appointments for a specific dentist"
              }
            />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              {!isDentist && (
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
              )}
              <Input label="From Date" type="date" value={dentistFrom} onChange={(e) => setDentistFrom(e.target.value)} />
              <Input label="To Date" type="date" value={dentistTo} onChange={(e) => setDentistTo(e.target.value)} />
              <Button onClick={runDentist} loading={loading}>
                <FileBarChart className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : dentistData ? (
            <div className="print-area space-y-6">
              <div className="hidden print:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Sunrise Dental Clinic
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{reportTitle}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Appointments"
                  value={dentistData.totalAppointments}
                  hint={`${formatDate(dentistData.fromDate)} — ${formatDate(dentistData.toDate)}`}
                  icon={<User className="h-5 w-5 text-teal-600" />}
                />
                <StatCard
                  label="Completed"
                  value={dentistData.appointments.filter((a) => a.status === "COMPLETED").length}
                  accentClass="border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 text-emerald-900"
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                />
                <StatCard
                  label="Scheduled / Upcoming"
                  value={dentistData.appointments.filter((a) => a.status === "SCHEDULED").length}
                  accentClass="border-sky-100 bg-gradient-to-br from-sky-50/90 to-blue-50/60 text-sky-900"
                  icon={<Clock4 className="h-5 w-5 text-sky-600" />}
                />
                <StatCard
                  label="Cancelled / No Show"
                  value={
                    dentistData.appointments.filter(
                      (a) => a.status === "CANCELLED" || a.status === "NO_SHOW"
                    ).length
                  }
                  accentClass="border-red-100 bg-gradient-to-br from-red-50/90 to-orange-50/60 text-red-900"
                  icon={<XCircle className="h-5 w-5 text-red-600" />}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Appointment Status" description="Outcome of treatments in range" />
                  <div className="mt-6">
                    {dentistStatus.length > 0 ? (
                      <DonutChart data={dentistStatus} centerLabel="Appointments" />
                    ) : (
                      <p className="py-10 text-center text-sm text-slate-500">
                        No appointments in this range
                      </p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Treatment Mix" description="Treatments performed in this range" />
                  <div className="mt-6">
                    <BarList data={dentistTreatments} emptyMessage="No treatments recorded in this range" />
                  </div>
                </Card>
              </div>

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
