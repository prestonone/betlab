import type { CurrentSubscriptionResponse, Plan, PlansResponse } from "../types/subscriptions";
import {
  getAccessToken,
  getRefreshToken,
  removeTokens,
} from "../utils/token";
import { refreshAccessToken } from "./auth";
import { apiRequest } from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

export class SubscriptionApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SubscriptionApiError";
    this.status = status;
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

function getErrorMessage(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof data.detail === "string"
  ) {
    return data.detail;
  }

  return "Unable to retrieve subscription information.";
}

export async function getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
  let accessToken = getAccessToken();

  if (!accessToken) {
    throw new SubscriptionApiError("You are not signed in.", 401);
  }

  let response = await fetch(
    `${API_BASE_URL}/api/v1/subscriptions/current/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 401 && getRefreshToken()) {
    accessToken = await refreshAccessToken();

    response = await fetch(
      `${API_BASE_URL}/api/v1/subscriptions/current/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  const data = await readResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      removeTokens();
    }

    throw new SubscriptionApiError(
      getErrorMessage(data),
      response.status,
    );
  }

  return data as CurrentSubscriptionResponse;
}

export async function getPlans(country = "NG"): Promise<Plan[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans/?country=${encodeURIComponent(country)}`,
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new SubscriptionApiError(getErrorMessage(data), response.status);
  }

  return (data as PlansResponse).data;
}

export async function setBillingCountry(country: string): Promise<void> {
  await apiRequest(
    "/api/v1/subscriptions/billing-profile/",
    {
      method: "POST",
      body: JSON.stringify({ country }),
    },
    true,
  );
}
