// ============================================
// Core Appointment Types
// ============================================

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  status: AppointmentStatus;
  location: string | null;
  meetingUrl: string | null;
  emailNotificationSent: boolean;
  reminderSent: boolean;
  reminderSentAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  // User info for admin searches
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

// ============================================
// List/Query Types
// ============================================

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus | "all" | undefined;
  statuses?: string; // Comma-separated statuses for multi-select
  search?: string;
  searchFields?: string; // Fields to search in: "title,description", "title,description,location", "all", "email"
  startDate?: string;
  endDate?: string;
  dateRangeType?: "upcoming" | "past" | "all";
  userId?: string;
}

export interface AppointmentListResponse {
  success: boolean;
  data: Appointment[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AppointmentResponse {
  success: boolean;
  data: Appointment;
}

// ============================================
// Input Types
// ============================================

export interface CreateAppointmentInput {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  emailNotification?: boolean;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
  id: string;
}

export interface UpdateStatusInput {
  status: "COMPLETED" | "NO_SHOW" | "CANCELLED";
  reason?: string;
}

// ============================================
// Stats Types
// ============================================

export interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

// ============================================
// Form Types
// ============================================

export type AppointmentFormValues = {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  meetingUrl?: string;
  emailNotification?: boolean;
};

export interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

export interface AppointmentFormUIProps {
  isPending?: boolean;
  isEditing?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

export interface AppointmentFormStandaloneProps {
  appointment?: Appointment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// List Types
// ============================================

export interface AppointmentListProps {
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  showFilters?: boolean;
  userId?: string;
  // Controlled state props (single status)
  status?: AppointmentStatus | "all";
  // Controlled state props (array of statuses)
  statuses?: string[];
  page?: number;
  search?: string;
  dateRangeType?: "upcoming" | "past" | "all";
  onStatusChange?: (status: AppointmentStatus | "all") => void;
  onStatusesChange?: (statuses: string[]) => void;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onDateRangeTypeChange?: (type: "upcoming" | "past" | "all") => void;
}

// ============================================
// Card Types
// ============================================

export interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onDelete?: (id: string) => void;
}

// ============================================
// Detail Types
// ============================================

export interface AppointmentDetailProps {
  appointmentId: string | null;
  onClose: () => void;
  onEdit?: (appointment: Appointment) => void;
}
