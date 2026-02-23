import { useEffect } from "react";

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fraunces:wght@600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #faf8ff; --bg2: #f5f3ff; --surface: #fff; --border: #ede9fe; --border2: #e9d5ff;
    --text: #3d3557; --text2: #7c6f9a; --text3: #c4b5fd;
    --accent: #7c3aed; --accent2: #a78bfa; --accent-bg: #f5f3ff; --accent-border: #ede9fe;
    --pink: #ec4899; --error-bg: #fdf2f8; --error-text: #be185d; --error-border: #fce7f3;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Nunito', sans-serif; transition: background .3s, color .3s; }

  @keyframes slideUp { from{opacity:0;transform:translate(-50%,12px)} to{opacity:1;transform:translate(-50%,0)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInScale { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }

  .card { background:var(--surface); border:1px solid var(--border); border-radius:20px; transition:box-shadow .2s,border-color .2s,background .3s; }
  .card:hover { box-shadow:0 4px 24px rgba(167,139,250,.12); border-color:var(--accent2); }
  .card-static { background:var(--surface); border:1px solid var(--border); border-radius:20px; transition:background .3s; }

  .btn-primary { background:linear-gradient(135deg,#a78bfa,#c084fc); color:#fff; border:none; border-radius:50px; padding:12px 28px; font-weight:700; font-size:14px; cursor:pointer; transition:all .2s; font-family:inherit; box-shadow:0 4px 16px rgba(167,139,250,.3); white-space:nowrap; }
  .btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(167,139,250,.45); }
  .btn-primary:disabled { opacity:.65; cursor:not-allowed; }

  .btn-soft { background:var(--accent-bg); color:var(--accent); border:1px solid var(--accent-border); border-radius:50px; padding:8px 18px; font-size:13px; cursor:pointer; transition:all .15s; font-family:inherit; font-weight:600; }
  .btn-soft:hover { background:var(--border); border-color:var(--accent2); }

  .btn-ghost { background:transparent; color:var(--accent2); border:1px solid var(--border2); border-radius:50px; padding:8px 16px; font-size:13px; cursor:pointer; transition:all .15s; font-family:inherit; font-weight:600; }
  .btn-ghost:hover { background:var(--accent-bg); }

  .btn-danger { background:transparent; color:#f9a8d4; border:1px solid var(--error-border); border-radius:50px; padding:7px 14px; font-size:12px; cursor:pointer; font-family:inherit; font-weight:600; transition:all .15s; }
  .btn-danger:hover { background:var(--error-bg); border-color:#f9a8d4; color:var(--pink); }

  .input { background:var(--bg); border:1.5px solid var(--border2); border-radius:14px; padding:13px 18px; color:var(--text); font-family:inherit; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s,background .3s; width:100%; }
  .input:focus { border-color:var(--accent2); box-shadow:0 0 0 3px rgba(167,139,250,.15); }
  .input::placeholder { color:var(--text3); }

  .tab { background:transparent; border:none; padding:10px 20px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; border-radius:50px; transition:all .2s; color:var(--accent2); }
  .tab.active { background:var(--border); color:var(--accent); }
  .tab:not(.active):hover { background:var(--bg2); }

  .label { font-size:11px; color:var(--text3); font-weight:700; letter-spacing:1px; text-transform:uppercase; display:block; margin-bottom:7px; }
  .link-row { animation:fadeIn .3s ease both; }
  .skeleton { background:linear-gradient(90deg,var(--bg2) 25%,var(--border) 50%,var(--bg2) 75%); background-size:800px 100%; animation:shimmer 1.4s ease infinite; border-radius:16px; }
  .blob { position:fixed; border-radius:50%; filter:blur(80px); opacity:.25; pointer-events:none; z-index:0; }
  .spinner { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  .spinner-dark { border-color:rgba(167,139,250,.3); border-top-color:var(--accent2); }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:10px}
`;

export function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: isErr ? "var(--error-bg)" : "var(--surface)",
      color: isErr ? "var(--error-text)" : "var(--text)",
      padding: "12px 24px", borderRadius: 50, fontWeight: 600, fontSize: 14, zIndex: 9999,
      boxShadow: "0 8px 32px rgba(167,139,250,.25)",
      border: `1px solid ${isErr ? "var(--error-border)" : "var(--border)"}`,
      animation: "slideUp .25s ease", whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

export function MiniBar({ data = [] }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
      {data.map((v, i) => (
        <div key={i} style={{ width: 7, borderRadius: 4, height: `${Math.max(15, (v / max) * 100)}%`, background: "linear-gradient(to top,#c4b5fd,#e9d5ff)", opacity: .5 + .5 * (v / max) }} />
      ))}
    </div>
  );
}

export function Modal({ children, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(100,80,160,.18)", backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998, padding: 20 }}
      onClick={onClose}>
      <div className="card-static" style={{ maxWidth: 420, width: "100%", padding: 32, animation: "fadeInScale .2s ease", position: "relative" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text3)", lineHeight: 1 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ dark } = {}) {
  return <span className={`spinner${dark ? " spinner-dark" : ""}`} />;
}

export const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
