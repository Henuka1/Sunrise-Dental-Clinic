import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  UserRound,
  AtSign,
  BadgeCheck,
  ShieldCheck,
  FileText,
  Hash,
  UserCog,
  Phone,
  Mail,
  Stethoscope,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/services";
import { MODULES, getEffectivePermissions } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
  DENTIST: "Dentist",
};

const profileSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    fullName: z.string().min(1, "Full name is required"),
    role: z.string().optional(),
    newPassword: z.string().optional(),
    contactNumber: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[0-9+\-\s]+$/.test(val),
        { message: "Invalid contact number" }
      ),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    specialization: z.string().optional(),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword.length >= 4,
    { message: "Password must be at least 4 characters", path: ["newPassword"] }
  )
  .refine(
    (data) =>
      !isDentistRole(data.role) || (data.specialization ?? "").trim().length > 0,
    { message: "Specialization is required for dentists", path: ["specialization"] }
  );

function isDentistRole(role?: string) {
  return role === "DENTIST";
}

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSpecialization, setProfileSpecialization] = useState("");
  const isDentist = isDentistRole(user?.role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      role: user?.role ?? "",
      newPassword: "",
      contactNumber: "",
      email: "",
      specialization: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        const profile = res.data.data;
        if (cancelled) return;
        setProfileSpecialization(profile.specialization ?? "");
        reset({
          username: profile.username ?? "",
          fullName: profile.fullName ?? "",
          role: profile.role ?? "",
          newPassword: "",
          contactNumber: profile.contactNumber ?? "",
          email: profile.email ?? "",
          specialization: profile.specialization ?? "",
        });
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    void loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissions = getEffectivePermissions(user);
  const roleLabel = user?.role ? ROLE_LABEL[user.role] : "";
  const moduleNames = permissions
    .map((key) => MODULES.find((m) => m.key === key)?.label ?? key)
    .sort();

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      const res = await authService.updateProfile({
        username: data.username.trim(),
        fullName: data.fullName.trim(),
        contactNumber: data.contactNumber?.trim() || undefined,
        email: data.email?.trim() || undefined,
        ...(isDentist ? { specialization: data.specialization?.trim() } : {}),
        ...(data.newPassword && data.newPassword.trim()
          ? { newPassword: data.newPassword.trim() }
          : {}),
      });
      const updated = res.data.data;
      if (user) {
        updateUser({
          ...user,
          username: updated.username,
          fullName: updated.fullName,
        });
      }
      setProfileSpecialization(updated.specialization ?? "");
      toast.success("Profile updated successfully");
      reset({
        username: updated.username,
        fullName: updated.fullName,
        role: updated.role ?? "",
        newPassword: "",
        contactNumber: updated.contactNumber ?? "",
        email: updated.email ?? "",
        specialization: updated.specialization ?? "",
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="View and manage your account details"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <Card
            noPadding
            className="overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 text-white border-transparent"
          >
            <div className="flex flex-col items-center gap-4 px-6 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <UserRound className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                <p className="text-sm text-teal-50">{roleLabel}</p>
              </div>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                {user?.role}
              </span>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Access Level"
              description="Modules you can currently access"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {moduleNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card noPadding>
            <div className="p-6">
              <CardHeader
                title="Edit Profile"
                description="Update your username, display name and password"
              />
            </div>
            <form
              onSubmit={handleSubmit(onSubmitProfile)}
              className="border-t border-slate-200/80 p-6 space-y-5"
            >
              <Input
                label="Username"
                required
                placeholder="login username"
                error={errors.username?.message}
                {...register("username")}
              />
              <Input
                label="Full Name"
                required
                placeholder="e.g. Nimal Perera"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              {isDentist && (
                <Input
                  label="Specialization"
                  required
                  placeholder="e.g. Orthodontics, Oral Surgery"
                  error={errors.specialization?.message}
                  {...register("specialization")}
                />
              )}
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
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                placeholder="Enter new password"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <Button
                type="submit"
                className="w-full"
                loading={saving}
              >
                Save Profile
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Account Information"
              description="Basic details of your account"
            />
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <ProfileField icon={UserRound} label="Full Name" value={user?.fullName ?? ""} />
              <ProfileField icon={AtSign} label="Username" value={user?.username ?? ""} />
              <ProfileField icon={ShieldCheck} label="Role" value={roleLabel} />
              <ProfileField icon={FileText} label="Staff ID" value={user?.userId ? String(user.userId) : ""} />
              {user?.role === "DENTIST" && (
                <ProfileField
                  icon={Hash}
                  label="Dentist ID"
                  value={user.dentistId ? String(user.dentistId) : ""}
                />
              )}
            </dl>
          </Card>

          <Card className="border-slate-200 bg-slate-50/60">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Need help managing your account?
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  To reset your access or if you need further assistance, please contact
                  the system administrator.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}