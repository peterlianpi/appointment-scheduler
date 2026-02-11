// ============================================
// Authentication Types
// ============================================

// Core credential types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

// Password reset types
export interface ForgotPasswordEmail {
  email: string;
}

export interface ResetPasswordToken {
  token: string;
  password: string;
}

// Email verification types
export interface VerificationEmail {
  email: string;
}

export interface VerifyEmailToken {
  token: string;
}

// Callback types for component events
export interface AuthCallbacks {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onVerificationRequired?: () => void;
}

// Theme props
export interface ThemeProps {
  theme?: "light" | "dark";
  className?: string;
}

// Login page props
export interface LoginPageProps extends AuthCallbacks, ThemeProps {
  showRegisterLink?: boolean;
  showForgotPasswordLink?: boolean;
  redirectUrl?: string;
}

// Register form props
export interface RegisterFormProps extends AuthCallbacks, ThemeProps {
  defaultEmail?: string;
  defaultName?: string;
  showLoginLink?: boolean;
}

// Forgot password form props
export interface ForgotPasswordFormProps extends ThemeProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

// Reset password form props
export interface ResetPasswordFormProps extends ThemeProps {
  token?: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

// Resend verification form props
export interface ResendVerificationFormProps extends ThemeProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

// Verify email page props
export interface VerifyEmailPageProps extends ThemeProps {
  callbackUrl?: string;
  onGoToDashboard?: () => void;
}

// Password input props
export interface PasswordInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showStrength?: boolean;
  showConfirm?: boolean;
  confirmPassword?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  theme?: "light" | "dark";
  className?: string;
}

// Password strength indicator props
export interface PasswordStrengthIndicatorProps {
  password: string;
  name?: string;
  email?: string;
  oldPassword?: string;
  theme?: "light" | "dark";
  className?: string;
}

// Auth state types
export interface AuthState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

// API response types
export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form validation errors
export interface ValidationError {
  field: string;
  message: string;
}
