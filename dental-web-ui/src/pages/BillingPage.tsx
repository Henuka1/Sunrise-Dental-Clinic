import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DollarSign, Receipt, CreditCard, Banknote, Globe } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import ReceiptModal from "@/components/ReceiptModal";
import EmptyState, { TableLoading } from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { billingService } from "@/lib/services";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import type { Bill } from "@/types";

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<Record<number, "CASH" | "CARD" | "ONLINE">>({});
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params: { status?: string } = {};
      if (filterStatus) params.status = filterStatus;
      const res = await billingService.getAll(params);
      setBills(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const handleUpdatePayment = async (
    bill: Bill,
    status: "PENDING" | "PAID" | "PARTIAL",
    method: "CASH" | "CARD" | "ONLINE"
  ) => {
    try {
      await billingService.updatePayment(bill.billId, {
        paymentStatus: status,
        paymentMethod: method,
      });
      toast.success("Payment updated successfully");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const totalRevenue = bills
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingAmount = bills
    .filter((b) => b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIAL")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const summaryCards = [
    { label: "Total Bills", value: bills.length.toString(), icon: Receipt, color: "text-teal-600 bg-teal-50" },
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "Pending Amount", value: formatCurrency(pendingAmount), icon: CreditCard, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage bills and track payments"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <Select
          label="Filter by Payment Status"
          placeholder="All statuses"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: "PAID", label: "Paid" },
            { value: "PENDING", label: "Pending" },
            { value: "PARTIAL", label: "Partial" },
          ]}
        />
      </Card>

      {loading ? (
        <TableLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No bills found"
          description="Bills will appear here once appointments are completed."
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Bill #</th>
                  <th className="px-6 py-3 font-medium">Apt #</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Primary Treatment</th>
                  <th className="px-6 py-3 font-medium">Additional Treatments</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.billId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-teal-700">{bill.billNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{bill.appointmentNumber}</td>
                    <td className="px-6 py-4 text-slate-900">{bill.patientName}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatCurrency(bill.treatmentCost + bill.consultationFee)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {bill.additionalCharges > 0
                        ? formatCurrency(bill.additionalCharges)
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bill.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {bill.paymentMethod ? (
                        <span className="inline-flex items-center gap-1.5">
                          {bill.paymentMethod === "CASH" && <Banknote className="h-3.5 w-3.5" />}
                          {bill.paymentMethod === "CARD" && <CreditCard className="h-3.5 w-3.5" />}
                          {bill.paymentMethod === "ONLINE" && <Globe className="h-3.5 w-3.5" />}
                          {bill.paymentMethod}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {bill.billedAt ? formatDate(bill.billedAt) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="inline-flex items-center gap-1.5 text-teal-600 hover:bg-teal-50"
                          onClick={() => setReceiptBill(bill)}
                        >
                          <Receipt className="h-4 w-4" />
                          Receipt
                        </Button>
                        {bill.paymentStatus !== "PAID" && (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                              value={selectedMethods[bill.billId] || "CASH"}
                              onChange={(e) =>
                                setSelectedMethods((prev) => ({
                                  ...prev,
                                  [bill.billId]: e.target.value as "CASH" | "CARD" | "ONLINE",
                                }))
                              }
                            >
                              <option value="CASH">Cash</option>
                              <option value="CARD">Card</option>
                              <option value="ONLINE">Online</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() =>
                                handleUpdatePayment(bill, "PAID", selectedMethods[bill.billId] || "CASH")
                              }
                            >
                              Mark Paid
                            </Button>
                          </div>
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

      <ReceiptModal bill={receiptBill} onClose={() => setReceiptBill(null)} />
    </div>
  );
}
