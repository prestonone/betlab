import type {
  ApiErrorResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth";
import {
  getAccessToken,
  getRefreshToken,
  removeTokens,
  saveTokens,
  updateAccessToken,
} from "../utils/token";
import { apiRequest } from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

export class AuthApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(
    message: string,
    status: number,
    data: ApiErrorResponse = {},
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.data = data;
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { detail: text } : {};
}

function getErrorMessage(data: ApiErrorResponse): string {
  if (typeof data.detail === "string") {
    return data.detail;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }

    if (typeof value === "string") {
      return value;
    }
  }

  return "Authentication request failed.";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await readResponse(response)) as ApiErrorResponse;

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(data),
      response.status,
      data,
    );
  }

  return data as T;
}

export async function login(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const response = await request<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  saveTokens(response);
  return response;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const response = await request<AuthResponse>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  saveTokens(response);
  return response;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new AuthApiError("No refresh token is available.", 401);
  }

  const response = await request<{ access: string }>(
    "/api/auth/refresh/",
    {
      method: "POST",
      body: JSON.stringify({ refresh }),
    },
  );

  updateAccessToken(response.access);
  return response.access;
}

export async function getCurrentUser(): Promise<User> {
  let access = getAccessToken();

  if (!access) {
    throw new AuthApiError("You are not signed in.", 401);
  }

  let response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  });

  if (response.status === 401 && getRefreshToken()) {
    access = await refreshAccessToken();

    response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
  }

  const data = (await readResponse(response)) as ApiErrorResponse;

  if (!response.ok) {
    if (response.status === 401) {
      removeTokens();
    }

    throw new AuthApiError(
      getErrorMessage(data),
      response.status,
      data,
    );
  }

  return data as unknown as User;
}

export function logout(): void {
  removeTokens();
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>("/api/v1/auth/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(payload: {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<{ detail: string }> {
  return request<{ detail: string }>("/api/v1/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(payload: { uid: string; token: string }): Promise<{ detail: string }> {
  return request<{ detail: string }>("/api/v1/auth/verify-email/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendVerificationEmail(): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(
    "/api/v1/auth/verify-email/resend/",
    { method: "POST" },
    true,
  );
}
