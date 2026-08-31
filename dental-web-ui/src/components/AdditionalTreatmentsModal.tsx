import { useState, useEffect } from "react";
import { X, ClipboardPlus, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import { appointmentService, treatmentService } from "@/lib/services";
import { formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import type { Appointment, Treatment } from "@/types";

interface AdditionalTreatmentsModalProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export default function AdditionalTreatmentsModal({
  open,
  appointment,
  onClose,
}: AdditionalTreatmentsModalProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !appointment) return;
    setSelectedId("");
    loadTreatments(appointment.appointmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.appointmentId]);

  const loadTreatments = async (appointmentId: number) => {
    setLoading(true);
    try {
      const [addRes, allRes] = await Promise.all([
        appointmentService.getAdditionalTreatments(appointmentId),
        treatmentService.getAll(),
      ]);
      setTreatments(addRes.data?.data ?? []);
      setAllTreatments(allRes.data?.data ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const availableOptions = allTreatments
    .filter((t) => !treatments.some((a) => a.treatmentId === t.treatmentId))
    .map((t) => ({ value: t.treatmentId, label: `${t.treatmentName} (${t.treatmentCode})` }));

  const handleAdd = async () => {
    if (!appointment || !selectedId) return;
    setSaving(true);
    try {
      const res = await appointmentService.addAdditionalTreatment(
        appointment.appointmentId,
        Number(selectedId)
      );
      setTreatments(res.data?.data ?? []);
      setSelectedId("");
      toast.success("Additional treatment added");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (treatmentId: number) => {
    if (!appointment) return;
    try {
      const res = await appointmentService.removeAdditionalTreatment(
        appointment.appointmentId,
        treatmentId
      );
      setTreatments(res.data?.data ?? []);
      toast.success("Additional treatment removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!open || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Additional Treatments</h2>
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
            <label className="block text-[13px] font-semibold tracking-wide text-slate-700">
              Primary Treatment
            </label>
            <p className="mt-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700">
              {appointment.treatmentName}
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold tracking-wide text-slate-700">
              Additional Treatments
            </label>
            {loading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : treatments.length === 0 ? (
              <p className="mt-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                No additional treatments added yet.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-2">
                {treatments.map((t) => (
                  <li
                    key={t.treatmentId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.treatmentName}</p>
                      <p className="text-xs text-slate-500">
                        {t.treatmentCode} · Rs. {t.baseCost.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(t.treatmentId)}
                      className="text-red-600 hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {availableOptions.length > 0 && (
            <div className="mt-4 flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Add Treatment"
                  placeholder="Select a treatment"
                  options={availableOptions}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} disabled={!selectedId || saving} loading={saving}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          )}
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
