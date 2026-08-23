import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  UserRoundPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  Shield,
  Stethoscope,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/lib/services";
import { getErrorMessage, formatDate } from "@/lib/utils";
import type { ManagedUser, UserPayload } from "@/types";

const userSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    fullName: z.string().min(1, "Full name is required"),
    role: z.enum(["ADMIN", "RECEPTIONIST", "DENTIST"]),
    password: z.string().optional(),
    contactNumber: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[0-9+\-\s]+$/.test(val),
        { message: "Invalid contact number" }
      ),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.password || data.password.length >= 4,
    { message: "Password must be at least 4 characters", path: ["password"] }
  );

type UserFormData = z.infer<typeof userSchema>;

const ROLE_OPTIONS = [
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "DENTIST", label: "Dentist" },
  { value: "ADMIN", label: "Administrator" },
];

function RoleIcon({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <ShieldCheck className="h-4 w-4" />
      </span>
    );
  }
  if (role === "DENTIST") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
        <Stethoscope className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <Shield className="h-4 w-4" />
    </span>
  );
}

function roleBadgeClass(role: string): string {
  if (role === "ADMIN") return "border-teal-200 bg-teal-50 text-teal-700";
  if (role === "DENTIST") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const currentUserId = user?.userId ?? -1;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toToggle, setToToggle] = useState<ManagedUser | null>(null);
  const [toggling, setToggling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

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

  const openAdd = () => {
    setEditing(null);
    reset({
      username: "",
      fullName: "",
      role: "RECEPTIONIST",
      password: "",
      contactNumber: "",
      email: "",
    });
    setModalOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    reset({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      password: "",
      contactNumber: user.contactNumber ?? "",
      email: user.email ?? "",
    });
    setModalOpen(true);
  };

  const onSubmitForm = async (data: UserFormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        const payload: Partial<UserPayload> = {
          username: data.username,
          fullName: data.fullName,
          role: data.role,
          contactNumber: data.contactNumber || undefined,
          email: data.email || undefined,
        };
        if (data.password && data.password.length >= 4) {
          payload.password = data.password;
        }
        const res = await userService.update(editing.userId, payload);
        toast.success(res.data.message || "User updated successfully");
      } else {
        const res = await userService.create({
          username: data.username,
          fullName: data.fullName,
          role: data.role,
          password: data.password || "",
          contactNumber: data.contactNumber || undefined,
          email: data.email || undefined,
        });
        toast.success(res.data.message || "User added successfully");
      }
      setModalOpen(false);
      await load();
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
      const res = await userService.remove(toDelete.userId);
      toast.success(res.data.message || "User deleted successfully");
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmToggle = async () => {
    if (!toToggle) return;
    setToggling(true);
    try {
      const nextActive = !toToggle.isActive;
      const res = await userService.toggleActive(toToggle.userId, nextActive);
      toast.success(res.data.message || (nextActive ? "User activated" : "User deactivated"));
      setToToggle(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description={
          isAdmin
            ? "Create, edit and remove system users."
            : "View system users (read-only — only administrators can manage them)."
        }
        action={
          isAdmin && (
            <Button onClick={openAdd}>
              <UserRoundPlus className="h-4 w-4" />
              Add User
            </Button>
          )
        }
      />

      {!isAdmin && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have view-only access to user management. Only administrators can add, edit or delete users.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UserRoundPlus className="h-12 w-12" />}
          title="No users yet"
          description="Add your first system user to get started."
          action={
            isAdmin && (
              <Button onClick={openAdd}>
                <UserRoundPlus className="h-4 w-4" />
                Add User
              </Button>
            )
          }
        />
      ) : (
        <Card noPadding>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.userId}
                    className={
                      "transition-colors hover:bg-slate-50/60" +
                      (user.isActive === false ? " opacity-60" : "")
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RoleIcon role={user.role} />
                        <div>
                          <p className="font-medium text-slate-900">{user.fullName}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                          {(user.contactNumber || user.email) && (
                            <p className="text-xs text-slate-500">
                              {[user.contactNumber, user.email].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                          roleBadgeClass(user.role)
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                          (user.isActive === false
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700")
                        }
                      >
                        <span
                          className={
                            "h-1.5 w-1.5 rounded-full " +
                            (user.isActive === false ? "bg-red-500" : "bg-green-500")
                          }
                        />
                        {user.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.createdAt ? formatDate(user.createdAt) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <Button
                              variant={user.isActive === false ? "primary" : "outline"}
                              size="sm"
                              onClick={() => setToToggle(user)}
                              disabled={user.userId === currentUserId}
                            >
                              {user.isActive === false ? (
                                <PlayCircle className="h-3.5 w-3.5" />
                              ) : (
                                <PauseCircle className="h-3.5 w-3.5" />
                              )}
                              {user.isActive === false ? "Activate" : "Deactivate"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setToDelete(user)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {users.map((user) => (
              <div
                key={user.userId}
                className={
                  "space-y-3 px-5 py-4" + (user.isActive === false ? " opacity-60" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <RoleIcon role={user.role} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500">@{user.username}</p>
                    {(user.contactNumber || user.email) && (
                      <p className="truncate text-xs text-slate-500">
                        {[user.contactNumber, user.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                        roleBadgeClass(user.role)
                      }
                    >
                      {user.role}
                    </span>
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                        (user.isActive === false
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-green-200 bg-green-50 text-green-700")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (user.isActive === false ? "bg-red-500" : "bg-green-500")
                        }
                      />
                      {user.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          variant={user.isActive === false ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setToToggle(user)}
                          disabled={user.userId === currentUserId}
                        >
                          {user.isActive === false ? (
                            <PlayCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PauseCircle className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setToDelete(user)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
                {editing ? "Edit User" : "Add User"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="mt-6 space-y-5">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Nimal Perera"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <Input
                label="Username"
                required
                placeholder="login username"
                disabled={!!editing}
                error={errors.username?.message}
                {...register("username")}
              />
              <Input
                label="Contact Number"
                placeholder="e.g. 0771234567"
                error={errors.contactNumber?.message}
                {...register("contactNumber")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="optional"
                error={errors.email?.message}
                {...register("email")}
              />
              <Select
                label="Role"
                required
                options={ROLE_OPTIONS}
                error={errors.role?.message}
                {...register("role")}
              />
              <Input
                label={editing ? "New Password (leave blank to keep current)" : "Password"}
                type="password"
                required={!editing}
                placeholder={editing ? "Enter new password" : "Enter password"}
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {editing ? "Save Changes" : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete user"
        message={`Are you sure you want to delete ${toDelete?.fullName} (@${toDelete?.username})? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={!!toToggle}
        title={toToggle?.isActive === false ? "Activate user" : "Deactivate user"}
        message={
          toToggle?.isActive === false
            ? `Are you sure you want to activate ${toToggle?.fullName} (@${toToggle?.username})? They will be able to log in again.`
            : `Are you sure you want to deactivate ${toToggle?.fullName} (@${toToggle?.username})? They will no longer be able to log in.`
        }
        confirmLabel={toggling ? "Saving..." : toToggle?.isActive === false ? "Activate" : "Deactivate"}
        variant={toToggle?.isActive === false ? "primary" : "danger"}
        onConfirm={confirmToggle}
        onCancel={() => setToToggle(null)}
      />
    </div>
  );
}
