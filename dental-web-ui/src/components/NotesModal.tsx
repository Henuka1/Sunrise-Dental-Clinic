import { X, StickyNote } from "lucide-react";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import type { Appointment } from "@/types";

interface NotesModalProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export default function NotesModal({ open, appointment, onClose }: NotesModalProps) {
  if (!open || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Appointment Notes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-teal-700">{appointment.appointmentNumber}</p>
                <p className="mt-0.5 text-sm text-slate-900">{appointment.patientName}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {appointment.treatmentName} · Dr. {appointment.dentistName}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span>{formatDate(appointment.appointmentDate)}</span>
              <span>{formatTime(appointment.appointmentTime)}</span>
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold tracking-wide text-slate-700">Notes</label>
            <div className="mt-1.5 min-h-[150px] w-full whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              {appointment.notes ? appointment.notes : "No notes added for this appointment."}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}