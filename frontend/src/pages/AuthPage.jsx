import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Spinner } from "../components/ui";

export default function AuthPage({ initialMode = "login", onOAuthCallback }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "", newPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const reset = () => { setError(""); setSuccess(""); };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const err = params.get("error");
    if (token && onOAuthCallback) { onOAuthCallback(token); return; }
    if (err) setError("OAuth login failed. Please try again.");

    if (window.location.pathname.includes("verify-email") && token) {
      setMode("verifying");
      api.verifyEmail({ token })
        .then(() => setMode("verified"))
        .catch(e => { setError(e.message); setMode("login"); });
    }

    if (window.location.pathname.includes("reset-password") && token) {
      setMode("reset");
    }
  }, []);

  const submit = async () => {
    reset();
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) throw new Error("Please fill in all fields.");
        await login(form.email, form.password);
      } else if (mode === "signup") {
        if (!form.name || !form.email || !form.password) throw new Error("Please fill in all fields.");
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signup(form.name, form.email, form.password);
      } else if (mode === "forgot") {
        if (!form.email) throw new Error("Please enter your email.");
        await api.forgotPassword({ email: form.email });
        setSuccess("If that email exists, a reset link has been sent. Check your inbox 🌸");
      } else if (mode === "reset") {
        if (!form.newPassword) throw new Error("Please enter a new password.");
        const params = new URLSearchParams(window.location.search);
        await api.resetPassword({ token: params.get("token"), password: form.newPassword });
        setSuccess("Password reset! You can now log in.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); reset(); setForm({ name: "", email: "", password: "", newPassword: "" }); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fraunces:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text);font-family:'Nunito',sans-serif}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        :root{--bg:#faf8ff;--bg2:#f5f3ff;--surface:#fff;--border:#ede9fe;--border2:#e9d5ff;--text:#3d3557;--text2:#7c6f9a;--text3:#c4b5fd;--accent:#7c3aed;--accent2:#a78bfa;--accent-bg:#f5f3ff;--accent-border:#ede9fe;--pink:#ec4899;--error-bg:#fdf2f8;--error-text:#be185d;--error-border:#fce7f3}
        .a-input{background:var(--bg);border:1.5px solid var(--border2);border-radius:14px;padding:13px 18px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
        .a-input:focus{border-color:var(--accent2);box-shadow:0 0 0 3px rgba(167,139,250,.15)}
        .a-input::placeholder{color:var(--text3)}
        .a-btn{background:linear-gradient(135deg,#a78bfa,#c084fc);color:#fff;border:none;border-radius:50px;padding:14px;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;font-family:inherit;width:100%;box-shadow:0 4px 16px rgba(167,139,250,.3)}
        .a-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(167,139,250,.45)}
        .a-btn:disabled{opacity:.7;cursor:not-allowed}
        .blob{position:fixed;border-radius:50%;filter:blur(80px);opacity:.3;pointer-events:none}
        .label{font-size:11px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:7px}
      `}</style>

      <div className="blob" style={{ width: 380, height: 380, background: "#e9d5ff", top: -80, right: -80 }} />
      <div className="blob" style={{ width: 280, height: 280, background: "#fbcfe8", bottom: 60, left: -60 }} />

      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn .4s ease", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🔗</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: "var(--accent)", marginTop: 8 }}>Snip</div>
          <div style={{ color: "var(--accent2)", fontSize: 14, marginTop: 4 }}>Short links with a little magic</div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, boxShadow: "0 8px 40px rgba(167,139,250,.1)" }}>

          {/* Verified */}
          {mode === "verified" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>🎀</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, marginTop: 12 }}>Email Verified!</div>
              <p style={{ color: "var(--text2)", marginTop: 8, fontSize: 14 }}>Your account is all set. Welcome to Snip!</p>
              <button className="a-btn" onClick={() => switchMode("login")} style={{ marginTop: 20 }}>Go to Login →</button>
            </div>
          )}

          {/* Verifying */}
          {mode === "verifying" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✉️</div>
              <div style={{ color: "var(--text2)" }}>Verifying your email...</div>
            </div>
          )}

          {/* Login / Signup */}
          {(mode === "login" || mode === "signup") && (
            <>
              {/* Tab toggle */}
              <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 50, padding: 4, marginBottom: 24 }}>
                {["login", "signup"].map(m => (
                  <button key={m} onClick={() => switchMode(m)} style={{
                    flex: 1, padding: 10, border: "none", borderRadius: 50, cursor: "pointer",
                    fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all .2s",
                    background: mode === m ? "var(--surface)" : "transparent",
                    color: mode === m ? "var(--accent)" : "var(--accent2)",
                    boxShadow: mode === m ? "0 2px 8px rgba(167,139,250,.2)" : "none",
                  }}>
                    {m === "login" ? "✨ Sign In" : "🌸 Sign Up"}
                  </button>
                ))}
              </div>

              {/* GitHub OAuth */}
              <a href={`${import.meta.env.VITE_API_URL || ""}/api/auth/github`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "12px", borderRadius: 14, border: "1.5px solid var(--border2)",
                background: "var(--bg)", color: "var(--text)", textDecoration: "none",
                fontWeight: 700, fontSize: 14, marginBottom: 16, transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.background = "var(--bg2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg)"; }}>
                <span style={{ fontSize: 18 }}>🐙</span> Continue with GitHub
              </a>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <div>
                    <span className="label">Your Name</span>
                    <input className="a-input" placeholder="e.g. Alex Johnson" value={form.name} onChange={set("name")} onKeyDown={e => e.key === "Enter" && submit()} />
                  </div>
                )}
                <div>
                  <span className="label">Email</span>
                  <input className="a-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span className="label" style={{ margin: 0 }}>Password</span>
                    {mode === "login" && (
                      <button onClick={() => switchMode("forgot")} style={{ background: "none", border: "none", color: "var(--accent2)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input className="a-input" type="password" placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"} value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>

                {error && <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 12, padding: "10px 14px", color: "var(--error-text)", fontSize: 13, fontWeight: 600 }}>🌷 {error}</div>}

                <button className="a-btn" onClick={submit} disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? <Spinner /> : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>
              </div>
            </>
          )}

          {/* Forgot password */}
          {mode === "forgot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 32 }}>🔑</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, marginTop: 10 }}>Reset Password</div>
                <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 6 }}>Enter your email and we'll send a reset link.</p>
              </div>
              <div>
                <span className="label">Email</span>
                <input className="a-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={e => e.key === "Enter" && submit()} />
              </div>
              {error && <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 12, padding: "10px 14px", color: "var(--error-text)", fontSize: 13, fontWeight: 600 }}>🌷 {error}</div>}
              {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 14px", color: "#166534", fontSize: 13, fontWeight: 600 }}>✅ {success}</div>}
              <button className="a-btn" onClick={submit} disabled={loading}>{loading ? <Spinner /> : "Send Reset Link →"}</button>
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "var(--accent2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, textAlign: "center" }}>← Back to login</button>
            </div>
          )}

          {/* Reset password */}
          {mode === "reset" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 32 }}>🔒</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, marginTop: 10 }}>New Password</div>
              </div>
              <div>
                <span className="label">New Password</span>
                <input className="a-input" type="password" placeholder="At least 6 characters" value={form.newPassword} onChange={set("newPassword")} onKeyDown={e => e.key === "Enter" && submit()} />
              </div>
              {error && <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 12, padding: "10px 14px", color: "var(--error-text)", fontSize: 13, fontWeight: 600 }}>🌷 {error}</div>}
              {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 14px", color: "#166534", fontSize: 13, fontWeight: 600 }}>✅ {success}</div>}
              <button className="a-btn" onClick={submit} disabled={loading}>{loading ? <Spinner /> : "Set New Password →"}</button>
            </div>
          )}
        </div>

        {(mode === "login" || mode === "signup") && (
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text3)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => switchMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
