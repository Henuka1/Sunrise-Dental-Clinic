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

  // --------------------------------------------------
  // Load users
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Selected user
  // --------------------------------------------------
  const selected =
    users.find((u) => u.userId === selectedId) || null;

  // --------------------------------------------------
  // Load selected user's permissions
  // --------------------------------------------------
  useEffect(() => {
    if (!selected) {
      setGranted([]);
      setSaved(JSON.stringify(ALL_KEYS));
      return;
    }

    const stored = parseCsvPermissions(selected.permissions);

    const effective: ModuleKey[] =
      stored.length > 0
        ? stored
        : selected.role === "ADMIN"
        ? [...ALL_KEYS]
        : [...DEFAULT_PERMISSIONS[selected.role]];

    setGranted(effective);
    setSaved(JSON.stringify(effective));
  }, [selected]);

  // --------------------------------------------------
  // Toggle permission
  // --------------------------------------------------
  const toggle = (key: ModuleKey) => {
    if (!selected) return;

    // ADMIN users always have full access.
    if (selected.role === "ADMIN") return;

    setGranted((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  // --------------------------------------------------
  // Check whether permissions were changed
  // --------------------------------------------------
  const isDirty =
    JSON.stringify(granted) !== saved;

  // --------------------------------------------------
  // Save permissions
  // --------------------------------------------------
  const save = async () => {
    if (!selected) return;

    setSaving(true);

    try {
      // ADMIN users always get all permissions.
      const perms: ModuleKey[] =
        selected.role === "ADMIN"
          ? [...ALL_KEYS]
          : [...granted];

      const res = await userService.updateAccess(
        selected.userId,
        perms
      );

      const updatedPermissions: ModuleKey[] =
        Array.isArray(res.data.data)
          ? (res.data.data as ModuleKey[])
          : perms;

      setSaved(JSON.stringify(updatedPermissions));
      setGranted(updatedPermissions);

      toast.success(
        res.data.message ||
          "Access updated successfully"
      );

      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Reset to role defaults
  // --------------------------------------------------
  const resetToRoleDefault = async () => {
    if (!selected) return;

    // ADMIN users cannot be restricted.
    if (selected.role === "ADMIN") return;

    setSaving(true);

    try {
      // Empty list clears the user's custom permission override.
      const res = await userService.updateAccess(
        selected.userId,
        []
      );

      const cleared: ModuleKey[] = [
        ...DEFAULT_PERMISSIONS[selected.role],
      ];

      setGranted(cleared);

      /*
       * If backend returns an empty array after clearing,
       * use the role defaults as the current saved state.
       */
      const returnedPermissions: ModuleKey[] =
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
          ? (res.data.data as ModuleKey[])
          : cleared;

      setSaved(JSON.stringify(returnedPermissions));

      toast.success(
        res.data.message ||
          "Access reset to role defaults"
      );

      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div>
      <PageHeader
        title="User Access Control"
        description="Choose which modules each user can access. Changes take effect on next login."
      />

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        /* Error */
        <ErrorState
          message={error}
          onRetry={load}
        />
      ) : users.length === 0 ? (
        /* Empty */
        <EmptyState
          icon={
            <UserRoundPlus className="h-12 w-12" />
          }
          title="No users available"
          description="Add users first, then configure their access here."
        />
      ) : (
        /* Main content */
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ==================================================
              USER LIST
          ================================================== */}
          <Card
            className="lg:col-span-2"
            noPadding
          >
            <CardHeader
              title="Select a user"
              description="Choose the account to configure"
              className="border-b border-slate-100 px-6 py-4"
            />

            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() =>
                    setSelectedId(u.userId)
                  }
                  className={
                    "flex w-full items-center gap-3 px-6 py-4 text-left transition-colors " +
                    (selectedId === u.userId
                      ? "bg-teal-50/70"
                      : "hover:bg-slate-50/60")
                  }
                >
                  {/* User icon */}
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

                  {/* User information */}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {u.fullName}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      @{u.username}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {u.isActive === false && (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                          Inactive
                        </span>
                      )}

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {u.role}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* ==================================================
              PERMISSIONS EDITOR
          ================================================== */}
          <Card className="lg:col-span-3">
            {!selected ? (
              /* No selected user */
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Lock className="h-10 w-10 text-slate-300" />

                <p className="text-sm font-medium text-slate-700">
                  Select a user to manage their access
                </p>

                <p className="max-w-xs text-sm text-slate-500">
                  Toggle the modules below to grant or revoke access.
                </p>
              </div>
            ) : (
              <>
                {/* ==================================================
                    SELECTED USER HEADER
                ================================================== */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {selected.fullName}
                    </h3>

                    <p className="text-xs text-slate-500">
                      @{selected.username} · {selected.role}
                    </p>
                  </div>

                  {/* ADMIN badge */}
                  {selected.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                      <Unlock className="h-3.5 w-3.5" />
                      Full access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      <Lock className="h-3.5 w-3.5" />
                      Restricted
                    </span>
                  )}
                </div>

                {/* ==================================================
                    MODULE PERMISSIONS
                ================================================== */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {MODULES.map((m) => {
                    const enabled =
                      granted.includes(m.key);

                    const disabled =
                      selected.role === "ADMIN";

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
                          (disabled
                            ? " cursor-not-allowed opacity-70"
                            : " hover:border-teal-300")
                        }
                      >
                        {/* Checkbox */}
                        <span
                          className={
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border " +
                            (enabled
                              ? "border-teal-600 bg-teal-600 text-white"
                              : "border-slate-300 bg-white")
                          }
                        >
                          {enabled && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                            >
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

                        {/* Module details */}
                        <div>
                          <p className="font-medium text-slate-900">
                            {m.label}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ==================================================
                    ACTION BUTTONS
                ================================================== */}
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">

                  {/* Reset button */}
                  {selected.role !== "ADMIN" && (
                    <Button
                      variant="outline"
                      onClick={resetToRoleDefault}
                      loading={saving}
                      disabled={saving}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset to role defaults
                    </Button>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={save}
                    loading={saving}
                    disabled={!isDirty || saving}
                  >
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