import { useCallback, useEffect, useState } from "react";

import { getCurrentSubscription } from "../services/subscriptions";
import type { Subscription } from "../types/subscriptions";

interface UseCurrentSubscriptionResult {
  subscription: Subscription | null;
  hasSubscription: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

export function useCurrentSubscription(enabled = true): UseCurrentSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setHasSubscription(false);
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCurrentSubscription();

      setHasSubscription(response.data.has_subscription);
      setSubscription(response.data.subscription);
    } catch (requestError) {
      setHasSubscription(false);
      setSubscription(null);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load membership information.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  return {
    subscription,
    hasSubscription,
    isLoading,
    error,
    refreshSubscription,
  };
}
