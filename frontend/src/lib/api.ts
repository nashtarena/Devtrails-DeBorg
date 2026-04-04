const BASE_URL = "http://192.168.1.33:8000";
const ML_URL   = "http://192.168.1.33:8001";

// Shared token store — single source of truth
const store = { token: null as string | null };

export const setToken = (token: string | null) => { store.token = token; };
export const getToken = () => store.token;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = path.startsWith("/ml") ? ML_URL : BASE_URL;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (store.token) headers["Authorization"] = `Bearer ${store.token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export const api = {
  auth: {
    requestOtp: (mobile: string) =>
      request("/auth/otp-request", { method: "POST", body: JSON.stringify({ mobile }) }),

    verifyOtp: (mobile: string, otp: string) =>
      request("/auth/otp-verify", { method: "POST", body: JSON.stringify({ mobile, otp }) }),

    register: (data: {
      swiggy_partner_id: string; name: string; mobile: string; otp: string;
      weekly_income: number; work_type: string; zone: string; upi_id: string;
      pan: string; aadhaar_last4: string;
    }) => request<{ access_token: string; partner_id: string }>(
      "/auth/register", { method: "POST", body: JSON.stringify(data) }
    ),

    login: (mobile: string, swiggy_partner_id: string) =>
      request("/auth/login", { method: "POST", body: JSON.stringify({ mobile, swiggy_partner_id }) }),

    loginVerify: (mobile: string, otp: string) =>
      request<{ access_token: string; partner_id: string }>(
        "/auth/login/verify", { method: "POST", body: JSON.stringify({ mobile, otp }) }
      ),
  },

  // ── Partner ────────────────────────────────────────────────
  partner: {
    getProfile: () => request<any>("/partner/profile"),
    getCoverage: () => request<any>("/partner/coverage"),
    getRiskScore: () => request<any>("/partner/risk-score"),
    getLiveConditions: () => request<any>("/partner/live-conditions"),
    updateProfile: (data: Record<string, any>) =>
      request("/partner/profile", { method: "PUT", body: JSON.stringify(data) }),
  },

  // ── Claims ─────────────────────────────────────────────────
  claims: {
    list: (page = 1) => request<any>(`/partner/claims?page=${page}&limit=20`),
    get: (id: string) => request<any>(`/partner/claims/${id}`),
    submit: (data: {
      trigger_type: string;
      gps_accuracy_m?: number;
      accel_norm?: number;
      location_velocity_kmh?: number;
      network_type?: number;
      battery_drain_pct_per_hr?: number;
    }) => request<any>("/partner/claims/submit", { method: "POST", body: JSON.stringify(data) }),
  },

  // ── ML ─────────────────────────────────────────────────────
  ml: {
    premium: (data: {
      zone: string; month: number; weather_severity: number;
      aqi_level: number; traffic_disruption: number;
      worker_tenure_weeks: number; worker_claim_ratio: number;
    }) => request<any>("/ml/score/premium", { method: "POST", body: JSON.stringify(data) }),

    fraud: (data: {
      claim_id: string; gps_accuracy_m: number; accel_norm: number;
      location_velocity_kmh: number; network_type: number;
      order_acceptance_latency_s: number; battery_drain_pct_per_hr: number;
      peer_claims_same_window: number; zone_claim_spike_ratio: number;
      device_subnet_overlap: number; claim_time_std_minutes: number;
    }) => request<any>("/ml/score/fraud", { method: "POST", body: JSON.stringify(data) }),

    validateLocation: (data: {
      worker_id: string; gps_accuracy_m: number; accel_norm: number;
      network_type: number; battery_drain_pct_per_hr: number;
    }) => request<any>("/ml/validate/location", { method: "POST", body: JSON.stringify(data) }),
  },
  alerts: {
    list: (unreadOnly = false) =>
      request<any[]>(`/partner/alerts?unread_only=${unreadOnly}`),
    markRead: (id: string) =>
      request(`/partner/alerts/${id}/read`, { method: "POST" }),
  },
};
