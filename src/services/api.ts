import { refreshAccessToken } from "./auth";
import { getAccessToken, getRefreshToken, removeTokens } from "../utils/token";


export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";


export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}


async function readResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json()
    : { message: await response.text() };
}


function messageFrom(data: unknown): string {
  if (typeof data === "object" && data !== null) {
    if ("message" in data && typeof data.message === "string") return data.message;
    if ("detail" in data && typeof data.detail === "string") return data.detail;
  }
  return "The request could not be completed.";
}


export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  let access = authenticated ? getAccessToken() : null;
  if (authenticated && !access) throw new ApiError("You are not signed in.", 401);

  const send = (token: string | null) => fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let response = await send(access);
  if (authenticated && response.status === 401 && getRefreshToken()) {
    access = await refreshAccessToken();
    response = await send(access);
  }
  const data = await readResponse(response);
  if (!response.ok) {
    if (response.status === 401) removeTokens();
    throw new ApiError(messageFrom(data), response.status);
  }
  return data as T;
}
