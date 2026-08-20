import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Stethoscope, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/services";
import { CLINIC_INFO } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authService.login(data);
      const { token, username, fullName, role } = res.data;
      login(
        token,
        {
          userId: 0,
          username,
          fullName,
          role: role as "ADMIN" | "RECEPTIONIST" | "DENTIST",
        }
      );
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <img
          src="https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Dental clinic"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 to-slate-900/70" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{CLINIC_INFO.name}</h1>
              <p className="text-sm text-teal-100">Management System</p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-teal-50">
            Comprehensive dental clinic management — appointments, billing, and reports
            in one place.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">{CLINIC_INFO.name}</h1>
            <p className="text-sm text-slate-500">Management System</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input
              label="Username"
              required
              placeholder="Enter your username"
              error={errors.username?.message}
              {...register("username")}
            />
            <div className="relative">
              <Input
                label="Password"
                required
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            {CLINIC_INFO.name} — {CLINIC_INFO.address}
          </p>
        </div>
      </div>
    </div>
  );
}
