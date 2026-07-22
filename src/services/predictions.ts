export interface PredictionCategory {
  id: number;
  name: string;
  slug: string;
}

export interface PredictionSelection {
  id: number;
  league: string;
  home_team: string;
  away_team: string;
  market: string;
  odds: string;
  match_time: string;
  selection_order: number;
}

export interface Prediction {
  id: number;
  title: string;
  category: PredictionCategory;
  analysis: string;
  access_level: string;
  result_status: "pending" | "won" | "lost" | "void";
  is_published: boolean;
  settled_at: string | null;
  selections: PredictionSelection[];
}

import { apiRequest } from "./api";
import { getAccessToken } from "../utils/token";

export async function getPredictions(): Promise<Prediction[]> {
  return apiRequest<Prediction[]>(
    "/api/v1/predictions/predictions/",
    {},
    Boolean(getAccessToken()),
  );
}
