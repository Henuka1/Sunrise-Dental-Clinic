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
  permissions?: string[];
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
  permissions?: string[];
}

export interface ManagedUser {
  userId: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
  createdAt?: string;
  permissions?: string;
  isActive?: boolean;
  contactNumber?: string;
  email?: string;
  dentistId?: number;
  specialization?: string;
}

export interface UserPayload {
  username: string;
  password?: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
  contactNumber?: string;
  email?: string;
  specialization?: string;
}

export interface ProfileUpdateRequest {
  username: string;
  fullName: string;
  newPassword?: string;
  contactNumber?: string;
  email?: string;
  specialization?: string;
}

export interface UserProfileData {
  userId: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST";
  contactNumber?: string;
  email?: string;
  dentistId?: number;
  specialization?: string;
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

export interface DentistAvailability {
  availabilityId?: number;
  dentistId: number;
  /** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()) */
  dayOfWeek: number;
  /** "HH:MM" 24h format */
  startTime: string;
  /** "HH:MM" 24h format */
  endTime: string;
  isAvailable: boolean;
}

export interface DentistDateAvailability {
  dateAvailabilityId?: number;
  dentistId: number;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" inclusive */
  endDate: string;
  /** "HH:MM" 24h format */
  startTime: string;
  /** "HH:MM" 24h format */
  endTime: string;
  isAvailable: boolean;
  /** Appointment slot length in minutes for this override (per-date). */
  slotMinutes?: number;
  reason?: string;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  bookedCount: number;
  source: "WEEKLY" | "OVERRIDE";
  available: boolean;
  startTime?: string | null;
  endTime?: string | null;
  slotMinutes?: number | null;
  reason?: string | null;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface FreeSlot {
  start: string;
  end: string;
  minutes: number;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: number;
  available: boolean;
  source: "WEEKLY" | "OVERRIDE";
  startTime?: string | null;
  endTime?: string | null;
  slotMinutes: number;
  totalFreeMinutes: number;
  bookedCount: number;
  slots: FreeSlot[];
  bookedAppointments: Appointment[];
}
