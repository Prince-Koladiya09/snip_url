import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("snip_dark");
    return saved === "true";
  });

  const toggle = () => {
    setDark(d => {
      localStorage.setItem("snip_dark", !d);
      return !d;
    });
  };

  // CSS variables applied to :root
  useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.style.setProperty("--bg", "#0f0d1a");
      r.style.setProperty("--bg2", "#1a1528");
      r.style.setProperty("--surface", "#1e1830");
      r.style.setProperty("--border", "#2d2450");
      r.style.setProperty("--border2", "#3d3060");
      r.style.setProperty("--text", "#e8e0ff");
      r.style.setProperty("--text2", "#9b8ec4");
      r.style.setProperty("--text3", "#5a4f80");
      r.style.setProperty("--accent", "#a78bfa");
      r.style.setProperty("--accent2", "#c084fc");
      r.style.setProperty("--accent-bg", "#2d1f50");
      r.style.setProperty("--accent-border", "#4c3580");
      r.style.setProperty("--pink", "#f472b6");
      r.style.setProperty("--error-bg", "#2d1520");
      r.style.setProperty("--error-text", "#f9a8d4");
      r.style.setProperty("--error-border", "#4d2535");
    } else {
      r.style.setProperty("--bg", "#faf8ff");
      r.style.setProperty("--bg2", "#f5f3ff");
      r.style.setProperty("--surface", "#ffffff");
      r.style.setProperty("--border", "#ede9fe");
      r.style.setProperty("--border2", "#e9d5ff");
      r.style.setProperty("--text", "#3d3557");
      r.style.setProperty("--text2", "#7c6f9a");
      r.style.setProperty("--text3", "#c4b5fd");
      r.style.setProperty("--accent", "#7c3aed");
      r.style.setProperty("--accent2", "#a78bfa");
      r.style.setProperty("--accent-bg", "#f5f3ff");
      r.style.setProperty("--accent-border", "#ede9fe");
      r.style.setProperty("--pink", "#ec4899");
      r.style.setProperty("--error-bg", "#fdf2f8");
      r.style.setProperty("--error-text", "#be185d");
      r.style.setProperty("--error-border", "#fce7f3");
    }
  }, [dark]);

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
