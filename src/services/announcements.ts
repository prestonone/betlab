import { apiRequest } from "./api";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
}

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const response = await apiRequest<ApiEnvelope<Announcement | null>>("/api/v1/announcements/active/");
  return response.data;
}
