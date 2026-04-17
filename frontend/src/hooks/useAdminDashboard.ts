import { useState, useCallback } from "react";

// API utility for admin endpoints
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const BASE_URL = "http://192.168.1.33:8000";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

interface StatsData {
  total_policies: number;
  total_claims: number;
  approved_claims: number;
  fraud_detected: number;
  total_payout: number;
  total_premium: number;
  loss_ratio: number;
  risk_prediction: string;
}

interface Claim {
  id: string;
  user_id: string;
  user_name: string;
  partner_id: string;
  disruption_type: string;
  amount: number;
  status: "approved" | "rejected" | "fraud" | "processing";
  created_at: string;
  verified_at?: string;
  paid_at?: string;
  location?: { lat: number; lng: number; zone: string };
}

interface ClaimsResponse {
  total: number;
  page: number;
  limit: number;
  claims: Claim[];
}

interface FraudClaim {
  id: string;
  user_name: string;
  disruption_type: string;
  amount: number;
  reason: {
    type: string;
    description: string;
  };
  created_at: string;
  location?: { lat: number; lng: number; zone: string };
}

interface FraudResponse {
  total: number;
  page: number;
  limit: number;
  claims: FraudClaim[];
}

interface AnalyticsData {
  loss_ratio: number;
  claims_by_type: Record<string, number>;
  approval_rate: number;
  fraud_rate: number;
  average_payout_time_hours: number;
  top_disruption_zones: Array<{ zone: string; count: number }>;
}

interface PredictionData {
  region: string;
  predicted_claims_increase: number;
  expected_disruption: string;
  confidence: number;
  recommendation: string;
}

interface PayoutResponse {
  status: "success" | "failed" | "pending";
  amount: number;
  claim_id: string;
  transaction_id?: string;
  message: string;
  timestamp: string;
}

// Extend the API object with admin endpoints
const adminApi = {
  stats: () => request<StatsData>("/admin/stats"),
  
  claims: (page: number = 1, limit: number = 20, status?: string) => {
    const query = new URLSearchParams();
    query.append("page", page.toString());
    query.append("limit", limit.toString());
    if (status) query.append("status", status);
    return request<ClaimsResponse>(`/admin/claims?${query}`);
  },

  fraud: (page: number = 1, limit: number = 10) => {
    const query = new URLSearchParams();
    query.append("page", page.toString());
    query.append("limit", limit.toString());
    return request<FraudResponse>(`/admin/fraud?${query}`);
  },

  analytics: () => request<AnalyticsData>("/admin/analytics"),

  predictions: () => request<PredictionData>("/admin/predictions"),

  createClaim: (data: {
    user_id: string;
    user_name: string;
    location: { lat: number; lng: number; zone: string };
    disruption_type: string;
    amount: number;
  }) =>
    request("/admin/claims", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  processPayout: (claimId: string, amount: number) => {
    const query = new URLSearchParams();
    query.append("claim_id", claimId);
    query.append("amount", amount.toString());
    return request<PayoutResponse>(`/admin/payout?${query}`, {
      method: "POST",
    });
  },

  approveClaim: (claimId: string) =>
    request(`/admin/claim/${claimId}/approve`, { method: "POST" }),

  rejectClaim: (claimId: string, reason?: string) => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return request(`/admin/claim/${claimId}/reject${query}`, {
      method: "POST",
    });
  },

  payoutSummary: () => request("/admin/payout-summary"),
};

export function useAdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [claims, setClaims] = useState<ClaimsResponse | null>(null);
  const [fraudClaims, setFraudClaims] = useState<FraudResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, claimsData, fraudData, analyticsData, predictionsData] =
        await Promise.all([
          adminApi.stats(),
          adminApi.claims(1, 20),
          adminApi.fraud(),
          adminApi.analytics(),
          adminApi.predictions(),
        ]);

      setStats(statsData);
      setClaims(claimsData);
      setFraudClaims(fraudData);
      setAnalytics(analyticsData);
      setPredictions(predictionsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
      console.error("Admin dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveClaim = useCallback(
    async (claimId: string) => {
      try {
        await adminApi.approveClaim(claimId);
        // Refresh fraud list after approval
        const updatedFraud = await adminApi.fraud();
        setFraudClaims(updatedFraud);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve claim";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const rejectClaim = useCallback(
    async (claimId: string, reason?: string) => {
      try {
        await adminApi.rejectClaim(claimId, reason);
        // Refresh data
        await refreshData();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject claim";
        setError(message);
        return { success: false, error: message };
      }
    },
    [refreshData]
  );

  const processPayout = useCallback(
    async (claimId: string, amount: number) => {
      try {
        const result = await adminApi.processPayout(claimId, amount);
        if (result.status === "success") {
          // Refresh to update tables
          await refreshData();
          return { success: true, transaction_id: result.transaction_id };
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process payout";
        setError(message);
        return { success: false, error: message };
      }
    },
    [refreshData]
  );

  const createTestClaim = useCallback(
    async (data: {
      user_id: string;
      user_name: string;
      location: { lat: number; lng: number; zone: string };
      disruption_type: string;
      amount: number;
    }) => {
      try {
        const result = await adminApi.createClaim(data);
        await refreshData();
        return { success: true, ...result };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create claim";
        setError(message);
        return { success: false, error: message };
      }
    },
    [refreshData]
  );

  return {
    // Data
    stats,
    claims,
    fraudClaims,
    analytics,
    predictions,
    loading,
    error,

    // Actions
    refreshData,
    approveClaim,
    rejectClaim,
    processPayout,
    createTestClaim,
  };
}

export default useAdminDashboard;
