import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  );

  const login = async (username, password) => {
    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        username,
        password,
      });

      const { access_token, token_type, is_admin } = response.data;

      // Store token and admin status
      localStorage.setItem("token", access_token);
      localStorage.setItem("isAdmin", is_admin);

      setToken(access_token);
      setIsAdmin(is_admin);
      setUser({ username });

      return response.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await axios.post("http://localhost:8000/auth/signup", {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setToken(null);
    setIsAdmin(false);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAdmin,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
