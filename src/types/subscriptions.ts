export interface Subscription {
  id: number;
  plan_code: string;
  plan_name: string;
  status: "pending" | "active" | "grace" | "expired" | "cancelled";
  source: string;
  starts_at: string | null;
  expires_at: string | null;
  grace_ends_at: string | null;
  auto_renew: boolean;
  duration_days: number;
  grace_period_days: number;
}

export interface CurrentSubscriptionData {
  has_subscription: boolean;
  subscription: Subscription | null;
}

export interface CurrentSubscriptionResponse {
  success: boolean;
  message: string;
  data: CurrentSubscriptionData;
}

export interface Plan {
  code: string;
  name: string;
  badge: string;
  description: string;
  duration_days: number;
  grace_period_days: number;
  price: string;
  currency: string;
  currency_symbol: string;
}

export interface PlansResponse {
  success: boolean;
  message: string;
  data: Plan[];
  meta: {
    country: string;
    country_name: string;
    currency: string;
    currency_symbol: string;
    checkout_enabled: boolean;
  };
}
