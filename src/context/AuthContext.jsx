import { createContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

const TOKEN_KEY = "bugpilot_token";
const USER_KEY = "bugpilot_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, validate it against /me and
  // hydrate the user. This keeps a refreshed page logged in.
  const getCurrentUser = useCallback(async () => {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (!existingToken) {
      setLoading(false);
      return;
    }
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}!`);
    return data.user;
  };

  const signup = async ({ fullName, email, password }) => {
    const data = await authService.signup({ fullName, email, password });
    toast.success(data.message || "Account created. Please log in.");
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    signup,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
