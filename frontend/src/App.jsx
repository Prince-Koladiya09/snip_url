import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import PreviewPage from "./pages/PreviewPage";
import { GLOBAL_CSS } from "./components/ui";

function Router() {
  const { user, loading, loginWithToken } = useAuth();
  const path = window.location.pathname;

  // Handle GitHub OAuth callback
  if (path === "/oauth-callback") {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      loginWithToken(token)
        .then(() => { window.history.replaceState({}, "", "/"); })
        .catch(() => { window.location.href = "/"; });
    }
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Nunito, sans-serif", color: "var(--text2)" }}>
        Signing you in... 🌸
      </div>
    );
  }

  // Preview / password page (public — no auth needed)
  if (path.startsWith("/preview/")) return <PreviewPage />;

  // Email verify & reset password (handled inside AuthPage)
  if (path === "/verify-email") return <AuthPage initialMode="verify" />;
  if (path === "/reset-password") return <AuthPage initialMode="reset" />;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Nunito, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14, animation: "pulse 1.5s ease infinite" }}>🔗</div>
          <div style={{ color: "var(--text3)", fontSize: 14, fontWeight: 600 }}>Loading your magic...</div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}`}</style>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <style>{GLOBAL_CSS}</style>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
