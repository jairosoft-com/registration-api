// Registration domain types

export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  schedule: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  emailSent: boolean;
  adminNotificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  registrationId: string;
  emailSent?: boolean;
  adminNotificationSent?: boolean;
  nextSteps?: string;
}

export interface ValidationResponse {
  valid: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface DuplicateErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  existingRegistrationId?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  requestId?: string;
}

export interface RegistrationDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  schedule: string;
  createdAt: string;
  status: string;
  emailSent: boolean;
}
