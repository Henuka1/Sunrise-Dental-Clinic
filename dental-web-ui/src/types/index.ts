export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  userId: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
  dentistId?: number;
}

export interface Patient {
  patientId: number;
  patientName: string;
  address: string;
  contactNumber: string;
  email?: string;
  dateOfBirth?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  registeredDate?: string;
}

export interface Dentist {
  dentistId: number;
  dentistName: string;
  specialization: string;
  contactNumber?: string;
  email?: string;
  isActive: boolean;
}

export interface Treatment {
  treatmentId: number;
  treatmentName: string;
  treatmentCode: string;
  baseCost: number;
  consultationFee: number;
  description?: string;
}

export interface Appointment {
  appointmentId: number;
  appointmentNumber: string;
  patientId: number;
  patientName: string;
  dentistId: number;
  dentistName: string;
  treatmentId: number;
  treatmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  createdAt?: string;
}

export interface Bill {
  billId: number;
  appointmentId: number;
  appointmentNumber: string;
  patientName: string;
  billNumber: string;
  treatmentCost: number;
  consultationFee: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "PARTIAL";
  paymentMethod: "CASH" | "CARD" | "ONLINE";
  billedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  username: string;
  fullName: string;
  role: string;
  dentistId?: number;
}

export interface ManagedUser {
  userId: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
  createdAt?: string;
}

export interface UserPayload {
  username: string;
  password?: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
}

export interface DailyReportData {
  date: string;
  appointments: Appointment[];
  totalAppointments: number;
}

export interface RevenueReportData {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
}

export interface DentistReportData {
  dentistId: number;
  fromDate: string;
  toDate: string;
  totalAppointments: number;
  appointments: Appointment[];
}

export interface PatientReportData {
  patientId: number;
  totalVisits: number;
  appointments: Appointment[];
}
