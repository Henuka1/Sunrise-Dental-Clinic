import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { treatmentService } from "@/lib/services";
import { getErrorMessage, formatCurrency } from "@/lib/utils";
import type { Treatment } from "@/types";

const treatmentSchema = z.object({
  treatmentName: z.string().min(1, "Treatment name is required"),
  treatmentCode: z.string().min(1, "Treatment code is required"),
  baseCost: z.coerce.number().min(0, "Must be 0 or more"),
  consultationFee: z.coerce.number().min(0, "Must be 0 or more"),
  description: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<Treatment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await treatmentService.getAll();
      setTreatments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    reset({
      treatmentName: "",
      treatmentCode: "",
      baseCost: 0,
      consultationFee: 0,
      description: "",
    });
    setModalOpen(true);
  };

  const openEdit = (t: Treatment) => {
    setEditing(t);
    reset({
      treatmentName: t.treatmentName,
      treatmentCode: t.treatmentCode,
      baseCost: t.baseCost,
      consultationFee: t.consultationFee,
      description: t.description ?? "",
    });
    setModalOpen(true);
  };

  const onSubmitForm = async (data: TreatmentFormData) => {
    setSubmitting(true);
    try {
      const payload: Partial<Treatment> = {
        treatmentName: data.treatmentName,
        treatmentCode: data.treatmentCode,
        baseCost: data.baseCost,
        consultationFee: data.consultationFee,
        description: data.description ?? "",
      };
      if (editing) {
        const res = await treatmentService.update(editing.treatmentId, payload);
        setTreatments(
          treatments.map((t) =>
            t.treatmentId === editing.treatmentId ? res.data.data : t
          )
        );
        toast.success(res.data.message || "Treatment updated");
      } else {
        const res = await treatmentService.create(payload);
        setTreatments([res.data.data, ...treatments]);
        toast.success(res.data.message || "Treatment created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await treatmentService.remove(toDelete.treatmentId);
      setTreatments(
        treatments.filter((t) => t.treatmentId !== toDelete.treatmentId)
      );
      toast.success("Treatment deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Treatment Manage"
        description="Manage the treatment catalogue and pricing"
        action={(
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Treatment
          </Button>
        )}
      />

      <Card>
        <CardHeader
          title="All Treatments"
          description={`${treatments.length} treatment${treatments.length === 1 ? "" : "s"} registered`}
        />
        {loading ? (
          <div className="p-6">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : treatments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No treatments yet"
              description="Add your first treatment to get started."
              action={(
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" /> Add Treatment
                </Button>
              )}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Base Cost</th>
                  <th className="px-6 py-3 font-medium">Consultation Fee</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treatments.map((t) => (
                  <tr key={t.treatmentId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-teal-700">
                      {t.treatmentCode}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{t.treatmentName}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(t.baseCost)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(t.consultationFee)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-teal-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(t)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !submitting && setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Edit Treatment" : "Add Treatment"}
              </h2>
              <button
                onClick={() => !submitting && setModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="mt-6 space-y-5">
              <Input
                label="Treatment Name"
                required
                placeholder="e.g. Root Canal Treatment"
                error={errors.treatmentName?.message}
                {...register("treatmentName")}
              />
              <Input
                label="Treatment Code"
                required
                placeholder="e.g. RCT001"
                error={errors.treatmentCode?.message}
                {...register("treatmentCode")}
              />
              <Input
                label="Base Cost"
                type="number"
                min={0}
                step="0.01"
                error={errors.baseCost?.message}
                {...register("baseCost")}
              />
              <Input
                label="Consultation Fee"
                type="number"
                min={0}
                step="0.01"
                error={errors.consultationFee?.message}
                {...register("consultationFee")}
              />
              <Input
                label="Description"
                placeholder="Optional notes about this treatment"
                error={errors.description?.message}
                {...register("description")}
              />
              <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  <Save className="h-4 w-4" />
                  {editing ? "Save Changes" : "Create Treatment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete treatment"
        message={`Are you sure you want to delete ${toDelete?.treatmentName} (${toDelete?.treatmentCode})? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
