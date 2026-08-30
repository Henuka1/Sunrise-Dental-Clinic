import api from "./api";
import type {
  ApiResponse,
  Patient,
  Dentist,
  Treatment,
  Appointment,
  Bill,
  LoginRequest,
  LoginResponse,
  DailyReportData,
  RevenueReportData,
  DentistReportData,
  PatientReportData,
  ManagedUser,
  UserPayload,
  ProfileUpdateRequest,
  UserProfileData,
} from "@/types";

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),
  logout: () => api.post<ApiResponse<null>>("/auth/logout"),
  getProfile: () => api.get<ApiResponse<UserProfileData>>("/auth/profile"),
  updateProfile: (data: ProfileUpdateRequest) =>
    api.put<ApiResponse<UserProfileData>>("/auth/profile", data),
};

export const userService = {
  getAll: () => api.get<ApiResponse<ManagedUser[]>>("/users"),
  getById: (id: number) => api.get<ApiResponse<ManagedUser>>(`/users/${id}`),
  create: (data: UserPayload) => api.post<ApiResponse<ManagedUser>>("/users", data),
  update: (id: number, data: Partial<UserPayload>) =>
    api.put<ApiResponse<ManagedUser>>(`/users/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}`),
  updateAccess: (id: number, permissions: string[]) =>
    api.put<ApiResponse<string[]>>(`/users/${id}/access`, { permissions }),
  toggleActive: (id: number, isActive: boolean) =>
    api.put<ApiResponse<ManagedUser>>(`/users/${id}/active`, { active: isActive }),
};

export const patientService = {
  search: (query: string) =>
    api.get<ApiResponse<Patient[]>>("/patients/search", { params: { q: query } }),
  create: (data: Partial<Patient>) => api.post<ApiResponse<Patient>>("/patients", data),
  getById: (id: number) => api.get<ApiResponse<Patient>>(`/patients/${id}`),
  getHistory: (id: number) => api.get<PatientReportData>(`/patients/${id}/history`),
};

export const dentistService = {
  getAll: (params?: { includeInactive?: boolean }) =>
    api.get<ApiResponse<Dentist[]>>("/dentists", { params }),
  getById: (id: number) => api.get<ApiResponse<Dentist>>(`/dentists/${id}`),
};

export const treatmentService = {
  getAll: () => api.get<ApiResponse<Treatment[]>>("/treatments"),
  getById: (id: number) => api.get<ApiResponse<Treatment>>(`/treatments/${id}`),
  create: (data: Partial<Treatment>) => api.post<ApiResponse<Treatment>>("/treatments", data),
  update: (id: number, data: Partial<Treatment>) =>
    api.put<ApiResponse<Treatment>>(`/treatments/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/treatments/${id}`),
};

export const appointmentService = {
  create: (data: Partial<Appointment>) =>
    api.post<ApiResponse<Appointment>>("/appointments", data),
  getAll: (params?: { date?: string; status?: string }) =>
    api.get<ApiResponse<Appointment[]>>("/appointments", { params }),
  getById: (id: number) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  getByNumber: (number: string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/number/${number}`),
  searchByNicOrName: (query: string) =>
    api.get<ApiResponse<Appointment[]>>("/appointments/search", { params: { q: query } }),
  cancel: (id: number) =>
    api.put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`),
  complete: (id: number, notes?: string) =>
    api.put<ApiResponse<Appointment>>(`/appointments/${id}/complete`, { notes }),
  noShow: (id: number, notes?: string) =>
    api.put<ApiResponse<Appointment>>(`/appointments/${id}/no-show`, { notes }),
};

export const billingService = {
  getByAppointment: (appointmentId: number) =>
    api.get<ApiResponse<Bill>>(`/bills/appointment/${appointmentId}`),
  create: (data: Partial<Bill>) => api.post<ApiResponse<Bill>>("/bills", data),
  getAll: async (params?: { status?: string }) => {
    try {
      return await api.get<ApiResponse<Bill[]>>("/bills", { params });
    } catch (err: any) {
      if (err?.response?.status === 405 && (!params?.status || params.status === "PENDING")) {
        return api.get<ApiResponse<Bill[]>>("/bills/pending");
      }
      throw err;
    }
  },
  updatePayment: (id: number, data: Partial<Bill>) =>
    api.put<ApiResponse<Bill>>(`/bills/${id}`, data),
};

export const reportService = {
  daily: (date: string) =>
    api.get<ApiResponse<DailyReportData>>("/reports/daily", { params: { date } }),
  revenue: (fromDate: string, toDate: string) =>
    api.get<ApiResponse<RevenueReportData>>("/reports/revenue", {
      params: { fromDate, toDate },
    }),
  dentist: (dentistId: number, fromDate: string, toDate: string) =>
    api.get<ApiResponse<DentistReportData>>("/reports/dentist", {
      params: { dentistId, fromDate, toDate },
    }),
};
