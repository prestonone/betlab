export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  accepted_terms: boolean;
  acknowledged_privacy: boolean;
  confirmed_age_and_risk: boolean;
  marketing_consent?: boolean;
}

export interface ApiErrorResponse {
  detail?: string;
  [field: string]: unknown;
}
