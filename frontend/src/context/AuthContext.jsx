import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("snip_token");
    if (token) {
      api.getMe()
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem("snip_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const _save = (data) => {
    localStorage.setItem("snip_token", data.token);
    setUser(data.user);
    return data;
  };

  const login = (email, password) => api.login({ email, password }).then(_save);
  const signup = (name, email, password) => api.signup({ name, email, password }).then(_save);
  const logout = () => { localStorage.removeItem("snip_token"); setUser(null); };
  const refreshUser = () => api.getMe().then(d => setUser(d.user));
  const loginWithToken = (token) => {
    localStorage.setItem("snip_token", token);
    return api.getMe().then(d => { setUser(d.user); return d; });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, refreshUser, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
