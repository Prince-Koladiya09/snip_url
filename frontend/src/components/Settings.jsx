import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { Modal, Spinner, Toast } from "../components/ui";

export default function Settings({ onClose }) {
  const { user, setUser, logout, refreshUser } = useAuth();
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", current: "", newPass: "", confirm: "" });
  const [prefs, setPrefs] = useState({ emailDigest: user?.preferences?.emailDigest ?? true, digestThreshold: user?.preferences?.digestThreshold ?? 100 });

  const toast$ = (msg, type = "success") => setToast({ msg, type });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const saveName = async () => {
    setLoading(true);
    try {
      const data = await api.updateMe({ name: form.name });
      setUser(data.user);
      toast$("Name updated! 🌸");
    } catch (e) { toast$(e.message, "error"); } finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (form.newPass !== form.confirm) { toast$("Passwords don't match.", "error"); return; }
    if (form.newPass.length < 6) { toast$("Password must be at least 6 characters.", "error"); return; }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword: form.current, newPassword: form.newPass });
      setForm(f => ({ ...f, current: "", newPass: "", confirm: "" }));
      toast$("Password changed! 🔒");
    } catch (e) { toast$(e.message, "error"); } finally { setLoading(false); }
  };

  const savePrefs = async () => {
    setLoading(true);
    try {
      const data = await api.updateMe({ preferences: prefs });
      setUser(data.user);
      toast$("Preferences saved! ✨");
    } catch (e) { toast$(e.message, "error"); } finally { setLoading(false); }
  };

  const resendVerify = async () => {
    setLoading(true);
    try {
      await api.resendVerification();
      toast$("Verification email sent! Check your inbox 📬");
    } catch (e) { toast$(e.message, "error"); } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.deleteAccount();
      logout();
    } catch (e) { toast$(e.message, "error"); setLoading(false); }
  };

  const tabs = [
    { id: "profile", label: "👤 Profile" },
    { id: "security", label: "🔒 Security" },
    { id: "notifications", label: "🔔 Notifications" },
    { id: "appearance", label: "🎨 Appearance" },
    { id: "danger", label: "⚠️ Account" },
  ];

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'Nunito', sans-serif" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h2>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "var(--accent-bg)" : "transparent",
              border: `1px solid ${tab === t.id ? "var(--accent-border)" : "transparent"}`,
              borderRadius: 50, padding: "7px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", color: tab === t.id ? "var(--accent)" : "var(--text2)",
              whiteSpace: "nowrap", transition: "all .15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Profile */}
        {tab === "profile" && (
          <Section title="Profile">
            {!user?.isEmailVerified && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>⚠️ Your email is not verified.</span>
                <button onClick={resendVerify} disabled={loading} style={{ background: "none", border: "none", color: "#d97706", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                  Resend →
                </button>
              </div>
            )}
            <Field label="Name">
              <input className="input" value={form.name} onChange={set("name")} style={{ fontFamily: "'Nunito',sans-serif" }} />
            </Field>
            <Field label="Email">
              <input className="input" value={user?.email} disabled style={{ opacity: .6 }} />
            </Field>
            <Field label="Provider">
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 16px", fontSize: 14, color: "var(--text2)", fontWeight: 600 }}>
                {user?.provider === "google" ? "🔍 Google" : user?.provider === "github" ? "🐙 GitHub" : "📧 Email/Password"}
              </div>
            </Field>
            <button className="btn-primary" onClick={saveName} disabled={loading} style={{ width: "100%" }}>
              {loading ? <Spinner /> : "Save Changes"}
            </button>
          </Section>
        )}

        {/* Security */}
        {tab === "security" && (
          <Section title="Change Password">
            {user?.provider !== "local" ? (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, textAlign: "center", color: "var(--text2)", fontSize: 14 }}>
                You're signed in with {user.provider}. Password change is not available for OAuth accounts.
              </div>
            ) : (
              <>
                <Field label="Current Password"><input className="input" type="password" placeholder="••••••••" value={form.current} onChange={set("current")} /></Field>
                <Field label="New Password"><input className="input" type="password" placeholder="At least 6 characters" value={form.newPass} onChange={set("newPass")} /></Field>
                <Field label="Confirm New Password"><input className="input" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} /></Field>
                <button className="btn-primary" onClick={savePassword} disabled={loading} style={{ width: "100%" }}>
                  {loading ? <Spinner /> : "Change Password 🔒"}
                </button>
              </>
            )}
          </Section>
        )}

        {/* Notifications */}
        {tab === "notifications" && (
          <Section title="Email Notifications">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Click Digest Emails</div>
                <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 3 }}>Get notified when your links hit milestones</div>
              </div>
              <button onClick={() => setPrefs(p => ({ ...p, emailDigest: !p.emailDigest }))} style={{
                width: 44, height: 24, borderRadius: 50, border: "none", cursor: "pointer",
                background: prefs.emailDigest ? "linear-gradient(135deg,#a78bfa,#c084fc)" : "var(--border2)",
                position: "relative", transition: "background .2s",
              }}>
                <div style={{ position: "absolute", top: 3, left: prefs.emailDigest ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
              </button>
            </div>

            {prefs.emailDigest && (
              <Field label={`Notify me every ${prefs.digestThreshold} clicks`}>
                <input className="input" type="number" min="10" max="10000" step="10" value={prefs.digestThreshold}
                  onChange={e => setPrefs(p => ({ ...p, digestThreshold: parseInt(e.target.value) || 100 }))} />
              </Field>
            )}

            <button className="btn-primary" onClick={savePrefs} disabled={loading} style={{ width: "100%" }}>
              {loading ? <Spinner /> : "Save Preferences"}
            </button>
          </Section>
        )}

        {/* Appearance */}
        {tab === "appearance" && (
          <Section title="Appearance">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</div>
                <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 3 }}>Switch between light and dark themes</div>
              </div>
              <button onClick={toggle} style={{
                width: 44, height: 24, borderRadius: 50, border: "none", cursor: "pointer",
                background: dark ? "linear-gradient(135deg,#a78bfa,#c084fc)" : "var(--border2)",
                position: "relative", transition: "background .2s",
              }}>
                <div style={{ position: "absolute", top: 3, left: dark ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
              </button>
            </div>
            <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 12, fontSize: 13, color: "var(--text2)" }}>
              💡 Your theme preference is saved locally on this device.
            </div>
          </Section>
        )}

        {/* Danger zone */}
        {tab === "danger" && (
          <Section title="Danger Zone">
            <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--error-text)", marginBottom: 8 }}>⚠️ Delete Account</div>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
                This will permanently delete your account and all your links. This action cannot be undone.
              </p>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="btn-danger" style={{ width: "100%", padding: "10px" }}>
                  Delete My Account
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--error-text)", marginBottom: 12, textAlign: "center" }}>Are you absolutely sure?</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-soft" onClick={() => setDeleteConfirm(false)} style={{ flex: 1 }}>Cancel</button>
                    <button onClick={deleteAccount} disabled={loading} style={{ flex: 1, background: "linear-gradient(135deg,#f9a8d4,#ec4899)", color: "#fff", border: "none", borderRadius: 50, padding: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                      {loading ? <Spinner /> : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </Modal>
  );
}
