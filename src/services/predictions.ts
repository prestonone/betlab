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
  published: boolean;
  selections: PredictionSelection[];
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function getPredictions(): Promise<Prediction[]> {
  const response = await fetch(`${API_BASE_URL}/predictions/`);

  if (!response.ok) {
    throw new Error(`Failed to fetch predictions: ${response.status}`);
  }

  return response.json();
}
