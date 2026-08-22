import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserRoundPlus,
  Save,
  RotateCcw,
  Lock,
  Unlock,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { userService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";
import {
  MODULES,
  ALL_KEYS,
  DEFAULT_PERMISSIONS,
  parseCsvPermissions,
  type ModuleKey,
} from "@/lib/permissions";
import type { ManagedUser } from "@/types";

export default function UserAccessControlPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [granted, setGranted] = useState<ModuleKey[]>([]);
  const [saved, setSaved] = useState<string>(JSON.stringify(ALL_KEYS));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userService.getAll();
      setUsers(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = users.find((u) => u.userId === selectedId) || null;

  useEffect(() => {
    if (!selected) {
      setGranted([]);
      setSaved(JSON.stringify(ALL_KEYS));
      return;
    }
    const stored = parseCsvPermissions(selected.permissions);
    const effective =
      stored.length > 0
        ? stored
        : selected.role === "ADMIN"
        ? [...ALL_KEYS]
        : [...DEFAULT_PERMISSIONS[selected.role]];
    setGranted(effective);
    setSaved(JSON.stringify(effective));
  }, [selected]);

  const toggle = (key: ModuleKey) => {
    if (!selected) return;
    // Admins always keep every module.
    if (selected.role === "ADMIN") return;
    setGranted((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isDirty = JSON.stringify(granted) !== saved;

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Admins are always granted full access - never restrict them.
      const perms = selected.role === "ADMIN" ? [...ALL_KEYS] : [...granted];
      const res = await userService.updateAccess(selected.userId, perms);
      setSaved(JSON.stringify(res.data.data));
      setGranted(res.data.data as ModuleKey[]);
      toast.success(res.data.message || "Access updated successfully");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const resetToRoleDefault = async () => {
    if (!selected) return;
    if (selected.role === "ADMIN") return;
    setSaving(true);
    try {
      // Sending an empty list clears the override so the system falls back
      // to the role default on the user's next login.
      const res = await userService.updateAccess(selected.userId, []);
      const cleared: ModuleKey[] = [...DEFAULT_PERMISSIONS[selected.role]];
      setGranted(cleared);
      setSaved(JSON.stringify(res.data.data));
      toast.success("Access reset to role defaults");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Access Control"
        description="Choose which modules each user can access. Changes take effect on next login."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UserRoundPlus className="h-12 w-12" />}
          title="No users available"
          description="Add users first, then configure their access here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* User list */}
          <Card className="lg:col-span-2" noPadding>
            <CardHeader
              title="Select a user"
              description="Choose the account to configure"
              className="border-b border-slate-100 px-6 py-4"
            />
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => setSelectedId(u.userId)}
                  className={
                    "flex w-full items-center gap-3 px-6 py-4 text-left transition-colors " +
                    (selectedId === u.userId
                      ? "bg-teal-50/70"
                      : "hover:bg-slate-50/60")
                  }
                >
                  <div
                    className={
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
                      (selectedId === u.userId
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-500")
                    }
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{u.fullName}</p>
                    <p className="truncate text-xs text-slate-500">@{u.username} · {u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Permissions editor */}
          <Card className="lg:col-span-3">
            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Lock className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Select a user to manage their access</p>
                <p className="max-w-xs text-sm text-slate-500">
                  Toggle the modules below to grant or revoke access.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{selected.fullName}</h3>
                    <p className="text-xs text-slate-500">@{selected.username} · {selected.role}</p>
                  </div>
                  {selected.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                      <Unlock className="h-3.5 w-3.5" /> Full access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      <Lock className="h-3.5 w-3.5" /> Restricted
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MODULES.map((m) => {
                    const enabled = granted.includes(m.key);
                    const disabled = selected.role === "ADMIN";
                    return (
                      <button
                        key={m.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(m.key)}
                        className={
                          "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors " +
                          (enabled
                            ? "border-teal-300 bg-teal-50/70"
                            : "border-slate-200 bg-white") +
                          (disabled ? " opacity-70 cursor-not-allowed" : " hover:border-teal-300")
                        }
                      >
                        <span
                          className={
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border " +
                            (enabled
                              ? "border-teal-600 bg-teal-600 text-white"
                              : "border-slate-300 bg-white")
                          }
                        >
                          {enabled && (
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{m.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{m.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
                  {selected.role !== "ADMIN" && (
                    <Button variant="outline" onClick={resetToRoleDefault} loading={saving}>
                      <RotateCcw className="h-4 w-4" />
                      Reset to role defaults
                    </Button>
                  )}
                  <Button onClick={save} loading={saving} disabled={!isDirty}>
                    <Save className="h-4 w-4" />
                    Save Access
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
