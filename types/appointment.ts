// ============================================
// SHARED APPOINTMENT TYPES
// Single source of truth for appointment-related types
// ============================================

export type AppointmentStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
