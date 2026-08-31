import { useEffect } from "react";
import { Printer, X, CheckCircle2, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Bill } from "@/types";

interface Props {
  bill: Bill | null;
  onClose: () => void;
}

export default function ReceiptModal({ bill, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (bill) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [bill, onClose]);

  if (!bill) return null;

  const primaryTotal = bill.treatmentCost + bill.consultationFee;
  const subtotal = primaryTotal + (bill.additionalCharges || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { visibility: visible !important; }
          #receipt-print { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="receipt-print"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl my-8 overflow-hidden"
      >
        {/* Clinic header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦷</span>
                <h2 className="text-xl font-bold tracking-wide">Sunrise Dental Clinic</h2>
              </div>
              <p className="mt-1 text-xs text-teal-100">
                Quality Dental Care for Your Smile
              </p>
            </div>
            <button
              onClick={onClose}
              className="no-print rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt meta */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
              Payment Receipt
            </span>
            <StatusBadge status={bill.paymentStatus} />
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No</span>
              <span className="font-semibold text-slate-900">{bill.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Appointment</span>
              <span className="font-medium text-slate-700">{bill.appointmentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient</span>
              <span className="font-medium text-slate-700">{bill.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-700">
                {bill.billedAt ? formatDate(bill.billedAt) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-dashed border-slate-300" />

        {/* Line items */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="py-2">Primary Treatment</td>
                <td className="py-2 text-right">{formatCurrency(primaryTotal)}</td>
              </tr>
              {bill.additionalCharges > 0 && (
                <tr className="border-t border-slate-100">
                  <td className="py-2">Additional Treatments</td>
                  <td className="py-2 text-right">{formatCurrency(bill.additionalCharges)}</td>
                </tr>
              )}
              <tr className="border-t border-slate-100">
                <td className="py-2">Subtotal</td>
                <td className="py-2 text-right">{formatCurrency(subtotal)}</td>
              </tr>
              {bill.discount > 0 && (
                <tr className="border-t border-slate-100 text-green-600">
                  <td className="py-2">Discount</td>
                  <td className="py-2 text-right">- {formatCurrency(bill.discount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="mx-6 border-t-2 border-slate-800" />
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Total {bill.paymentStatus === "PAID" ? "Paid" : "Due"}
          </span>
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(bill.totalAmount)}
          </span>
        </div>

        {/* Payment info */}
        <div className="mx-6 mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-medium capitalize text-slate-800">
              {bill.paymentMethod ? bill.paymentMethod.toLowerCase() : "Not paid yet"}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                bill.paymentStatus === "PAID" ? "text-green-600" : "text-orange-600"
              }`}
            >
              {bill.paymentStatus === "PAID" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {bill.paymentStatus}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-slate-300 px-6 py-4 text-center">
          <p className="text-xs text-slate-500">
            Thank you for choosing Sunrise Dental Clinic!
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            This is a computer generated receipt.
          </p>
        </div>

        {/* Actions */}
        <div className="no-print flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
