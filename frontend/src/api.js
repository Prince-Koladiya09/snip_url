const BASE = "/api";

const getHeaders = () => {
  const token = localStorage.getItem("snip_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
};

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  signup: (b) => fetch(`${BASE}/auth/signup`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  login: (b) => fetch(`${BASE}/auth/login`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  getMe: () => fetch(`${BASE}/auth/me`, { headers: getHeaders() }).then(handle),
  updateMe: (b) => fetch(`${BASE}/auth/me`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  changePassword: (b) => fetch(`${BASE}/auth/change-password`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  deleteAccount: () => fetch(`${BASE}/auth/me`, { method: "DELETE", headers: getHeaders() }).then(handle),
  verifyEmail: (b) => fetch(`${BASE}/auth/verify-email`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  resendVerification: () => fetch(`${BASE}/auth/resend-verification`, { method: "POST", headers: getHeaders() }).then(handle),
  forgotPassword: (b) => fetch(`${BASE}/auth/forgot-password`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  resetPassword: (b) => fetch(`${BASE}/auth/reset-password`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),

  // ── Links ─────────────────────────────────────────────────────────────────
  getLinks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/links${q ? "?" + q : ""}`, { headers: getHeaders() }).then(handle);
  },
  createLink: (b) => fetch(`${BASE}/links`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  bulkCreate: (b) => fetch(`${BASE}/links/bulk`, { method: "POST", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  updateLink: (id, b) => fetch(`${BASE}/links/${id}`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(b) }).then(handle),
  deleteLink: (id) => fetch(`${BASE}/links/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle),
  getQR: (id) => fetch(`${BASE}/links/${id}/qr`, { headers: getHeaders() }).then(handle),

  // ── Redirect helpers (public, use /r/ prefix) ─────────────────────────────
  // Verify password for a protected link
  verifyLinkPassword: (b) => fetch(`/r/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(handle),
  // Confirm a preview-page redirect
  confirmPreview: (b) => fetch(`/r/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(handle),
  // Get public link info (for preview/password pages)
  getLinkInfo: (code) => fetch(`/r/info/${code}`).then(handle),
};
