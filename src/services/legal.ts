import { apiRequest } from "./api";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface PolicyChangeLogEntry {
  policy_type: string;
  policy_type_display: string;
  version: string;
  effective_date: string;
  is_active: boolean;
  is_material_change: boolean;
  change_summary: string;
}

export function getPolicyChangeLog(): Promise<PolicyChangeLogEntry[]> {
  return apiRequest<PolicyChangeLogEntry[]>("/api/v1/legal/policies/");
}

export interface LegalContactPayload {
  category: string;
  name: string;
  email: string;
  message: string;
}

export async function submitLegalContact(payload: LegalContactPayload): Promise<string> {
  const response = await apiRequest<ApiEnvelope<null>>("/api/v1/legal/contact/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.message;
}

export interface MyPolicyAcceptance {
  policy_type: string;
  policy_type_display: string;
  version: string;
  accepted_at: string;
  acceptance_source: string;
}

export interface MarketingConsentStatus {
  status: "opted_in" | "opted_out";
  consented_at: string | null;
  withdrawn_at: string | null;
}

export interface MyConsentData {
  acceptances: MyPolicyAcceptance[];
  marketing_consent: MarketingConsentStatus;
}

export async function getMyConsent(): Promise<MyConsentData> {
  const response = await apiRequest<ApiEnvelope<MyConsentData>>("/api/v1/legal/my-consent/", {}, true);
  return response.data;
}

export async function updateMarketingConsent(optedIn: boolean): Promise<MarketingConsentStatus> {
  const response = await apiRequest<ApiEnvelope<MarketingConsentStatus>>(
    "/api/v1/legal/marketing-consent/",
    { method: "POST", body: JSON.stringify({ opted_in: optedIn }) },
    true,
  );
  return response.data;
}
