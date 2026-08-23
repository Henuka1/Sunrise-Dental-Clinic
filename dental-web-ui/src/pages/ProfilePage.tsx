import {
  UserRound,
  AtSign,
  BadgeCheck,
  ShieldCheck,
  Stethoscope,
  FileText,
  Hash,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { MODULES, getEffectivePermissions } from "@/lib/permissions";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
  DENTIST: "Dentist",
};

export default function ProfilePage() {
  const { user } = useAuth();

  const permissions = getEffectivePermissions(user);
  const roleLabel = user?.role ? ROLE_LABEL[user.role] : "";
  const moduleNames = permissions
    .map((key) => MODULES.find((m) => m.key === key)?.label ?? key)
    .sort();

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your account details and access permissions"
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
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Need to change something?
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  To update your details, change your password, or reset access, please
                  contact the system administrator.
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