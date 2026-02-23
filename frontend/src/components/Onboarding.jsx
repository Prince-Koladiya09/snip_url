import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";

const STEPS = [
  {
    emoji: "🎀",
    title: "Welcome to Snip!",
    desc: "You're about to start shortening links like a pro. Let's get you set up in just 3 quick steps.",
    cta: "Let's go →",
  },
  {
    emoji: "🔗",
    title: "Create short links",
    desc: "Paste any long URL and get a clean short link. Add a custom alias, set an expiry date, or protect it with a password.",
    cta: "Got it →",
  },
  {
    emoji: "📊",
    title: "Track every click",
    desc: "See how your links perform with 7-day click trends, click history, and milestone email notifications.",
    cta: "Next →",
  },
  {
    emoji: "🏷️",
    title: "Organize your links",
    desc: "Use tags and folders to keep everything tidy. Filter, search, and bulk-create links for maximum efficiency.",
    cta: "Start Snipping! 🌸",
  },
];

export default function Onboarding({ onComplete }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const next = async () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setLoading(true);
    try {
      const data = await api.updateMe({ onboardingCompleted: true });
      setUser(data.user);
      onComplete();
    } catch {
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const s = STEPS[step];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(100,80,160,.2)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, padding: 20,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 28, padding: 40,
        maxWidth: 400, width: "100%", textAlign: "center", animation: "fadeInScale .25s ease",
        boxShadow: "0 24px 64px rgba(167,139,250,.2)",
      }}>
        <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 50,
              background: i <= step ? "linear-gradient(135deg,#a78bfa,#c084fc)" : "var(--border2)",
              transition: "all .3s",
            }} />
          ))}
        </div>

        <div style={{ fontSize: 52, marginBottom: 18 }}>{s.emoji}</div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{s.title}</h2>
        <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>{s.desc}</p>

        <button
          onClick={next}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg,#a78bfa,#c084fc)", color: "#fff", border: "none",
            borderRadius: 50, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 4px 16px rgba(167,139,250,.35)", width: "100%",
            transition: "all .2s",
          }}
        >
          {loading ? <Spinner /> : s.cta}
        </button>

        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, marginTop: 14 }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
