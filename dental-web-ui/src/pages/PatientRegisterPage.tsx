import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserRoundPlus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { patientService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";

const patientSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address is required"),
  contactNumber: z
    .string()
    .min(10, "Contact number must be at least 10 digits")
    .regex(/^[0-9+\-\s]+$/, "Invalid contact number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    setSubmitting(true);
    try {
      const res = await patientService.create(data);
      const patient = res.data.data;
      toast.success("Patient registered successfully");
      navigate("/appointments/new", { state: { selectedPatient: patient } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Register Patient"
        description="Create a new patient profile before scheduling an appointment"
      />

      <Card className="mx-auto max-w-3xl">
        <CardHeader
          title="Patient Information"
          description="Enter accurate contact details to ensure smooth follow-up and billing"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              error={errors.patientName?.message}
              {...register("patientName")}
            />
            <Input
              label="Contact Number"
              required
              placeholder="0771234567"
              error={errors.contactNumber?.message}
              {...register("contactNumber")}
            />
          </div>

          <Input
            label="Address"
            required
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              placeholder="optional"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Date of Birth"
              type="date"
              {...register("dateOfBirth")}
            />
          </div>

          <Select
            label="Gender"
            required
            placeholder="Select gender"
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
            error={errors.gender?.message}
            {...register("gender")}
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              <UserRoundPlus className="h-4 w-4" />
              Save Patient & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}