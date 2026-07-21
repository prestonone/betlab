import { apiRequest } from "./api";


interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InitializedPayment {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifiedPayment {
  reference: string;
  plan_code: string;
  plan_name: string;
  amount: string;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
}

export async function initializePayment(plan: string): Promise<InitializedPayment> {
  const response = await apiRequest<ApiEnvelope<InitializedPayment>>(
    "/api/v1/payments/initialize/",
    { method: "POST", body: JSON.stringify({ plan }) },
    true,
  );
  return response.data;
}

export async function verifyPayment(reference: string): Promise<VerifiedPayment> {
  const response = await apiRequest<ApiEnvelope<VerifiedPayment>>(
    `/api/v1/payments/verify/${encodeURIComponent(reference)}/`,
    {},
    true,
  );
  return response.data;
}
