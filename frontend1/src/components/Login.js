import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate input
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      // Log the attempt with masked password for security
      console.log(`Attempting login for username: ${username}`);

      const response = await axios.post(
        "http://localhost:5000/login",
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          // Add timeout to catch network issues
          timeout: 10000,
        }
      );

      // Log the full response for debugging
      console.log(
        "Full login response:",
        JSON.stringify(response.data, null, 2)
      );

      // Destructure response data with fallback values
      const {
        user_id = null,
        is_admin = false,
        access_token = null,
      } = response.data || {};

      // Validate response data
      if (!user_id || !access_token) {
        throw new Error("Invalid login response");
      }

      // Store user info in localStorage
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("is_admin", is_admin.toString());
      localStorage.setItem("access_token", access_token);

      // Log storage for verification
      console.log("Stored in localStorage:", {
        user_id: localStorage.getItem("user_id"),
        is_admin: localStorage.getItem("is_admin"),
        token_exists: !!localStorage.getItem("access_token"),
      });

      // Navigate based on user role
      if (is_admin) {
        console.log("Navigating to admin dashboard");
        navigate("/admin-dashboard");
      } else {
        console.log("Navigating to detect page");
        navigate("/detect");
      }
    } catch (err) {
      // Clear any existing tokens on login failure
      localStorage.removeItem("user_id");
      localStorage.removeItem("is_admin");
      localStorage.removeItem("access_token");

      // Detailed error logging
      console.error("Login error details:", {
        errorResponse: err.response?.data,
        errorMessage: err.message,
        errorStatus: err.response?.status,
      });

      // Set user-friendly error message
      if (err.response) {
        // Server responded with an error
        setError(
          err.response.data?.detail || "Login failed. Please try again."
        );
      } else if (err.request) {
        // Request made but no response received
        setError("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && (
        <p className="error" style={{ color: "red" }}>
          {error}
        </p>
      )}
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(""); // Clear previous errors
            }}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(""); // Clear previous errors
            }}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  );
}

export default Login;
