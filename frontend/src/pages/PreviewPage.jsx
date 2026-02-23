import { useState, useEffect } from "react";
import { api } from "../api";

export default function PreviewPage() {
  const code = window.location.pathname.split("/preview/")[1];
  const isProtected = new URLSearchParams(window.location.search).get("protected") === "1";

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!code) { setError("Invalid link."); setLoading(false); return; }
    api.getLinkInfo(code)
      .then(data => {
        if (data.isExpired) { setError("This link has expired."); }
        else if (!data.isActive) { setError("This link has been deactivated."); }
        else { setInfo(data); }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const proceed = async () => {
    if (!info) return;
    setError("");
    setConfirming(true);
    try {
      let data;
      if (info.isPasswordProtected) {
        if (!password.trim()) { setError("Please enter the password."); setConfirming(false); return; }
        data = await api.verifyLinkPassword({ code, password });
      } else {
        data = await api.confirmPreview({ code });
      }
      // ✅ Redirect to the ORIGINAL URL (e.g. youtube.com)
      window.location.href = data.originalUrl;
    } catch (e) {
      setError(e.message);
      setConfirming(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8ff" }}>
      <div style={{ fontSize: 32, animation: "pulse 1.5s ease infinite" }}>🔗</div>
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#faf8ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fraunces:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .inp{background:#faf8ff;border:1.5px solid #e9d5ff;border-radius:14px;padding:13px 16px;width:100%;font-family:inherit;font-size:14px;outline:none;color:#3d3557;transition:border-color .2s,box-shadow .2s}
        .inp:focus{border-color:#a78bfa;box-shadow:0 0 0 3px rgba(167,139,250,.15)}
        .inp::placeholder{color:#c4b5fd}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ maxWidth: 440, width: "100%", background: "#fff", border: "1px solid #ede9fe", borderRadius: 24, padding: 36, boxShadow: "0 8px 40px rgba(167,139,250,.12)", animation: "fadeIn .4s ease" }}>

        {/* Fatal error (expired / inactive) */}
        {error && !info && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "#3d3557", marginBottom: 10 }}>Link Unavailable</h1>
            <p style={{ color: "#a78bfa", fontSize: 14, marginBottom: 24 }}>{error}</p>
            <a href="/" style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>← Go to Snip</a>
          </div>
        )}

        {/* Normal flow */}
        {info && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{info.isPasswordProtected ? "🔒" : "👁️"}</div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: "#3d3557" }}>
                {info.isPasswordProtected ? "Protected Link" : "Link Preview"}
              </h1>
              <p style={{ color: "#a78bfa", fontSize: 14, marginTop: 8 }}>
                {info.isPasswordProtected
                  ? "Enter the password to access this link."
                  : "You're about to be redirected to the following destination."}
              </p>
            </div>

            {/* Destination */}
            <div style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>DESTINATION URL</div>
              <div style={{ fontSize: 13, color: "#3d3557", wordBreak: "break-all", lineHeight: 1.6 }}>
                {info.isPasswordProtected ? "🔒 Hidden until unlocked" : info.originalUrl}
              </div>
            </div>

            {/* Password field */}
            {info.isPasswordProtected && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 700, letterSpacing: 1, marginBottom: 7 }}>PASSWORD</div>
                <input
                  className="inp"
                  type="password"
                  placeholder="Enter password to continue"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && proceed()}
                  autoFocus
                />
              </div>
            )}

            {/* Inline error */}
            {error && (
              <div style={{ background: "#fdf2f8", border: "1px solid #fce7f3", borderRadius: 12, padding: "10px 14px", color: "#be185d", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                🌷 {error}
              </div>
            )}

            <button
              onClick={proceed}
              disabled={confirming}
              style={{
                background: "linear-gradient(135deg,#a78bfa,#c084fc)", color: "#fff", border: "none",
                borderRadius: 50, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer",
                fontFamily: "inherit", width: "100%", boxShadow: "0 4px 16px rgba(167,139,250,.3)",
                opacity: confirming ? .75 : 1, transition: "opacity .15s",
              }}
            >
              {confirming
                ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                : info.isPasswordProtected ? "Unlock & Go →" : "Continue to Destination →"
              }
            </button>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#c4b5fd" }}>
              Powered by <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, color: "#7c3aed" }}>Snip</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
