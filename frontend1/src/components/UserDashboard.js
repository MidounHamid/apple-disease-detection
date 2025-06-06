import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("user_id");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const accessToken = localStorage.getItem("access_token");

    if (!userId || !accessToken) {
      // Redirect to login if not logged in
      navigate("/login");
      return;
    }

    // If somehow an admin tries to access user dashboard
    if (isAdmin) {
      navigate("/admin-dashboard");
      return;
    }

    // Optional: Fetch user data from backend
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        // Optionally handle error (e.g., logout user)
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user_id");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("access_token");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="user-dashboard">
      <h1>User Dashboard</h1>
      <div className="dashboard-content">
        <p>Welcome to your personal dashboard!</p>
        {userData && (
          <div className="user-info">
            <p>Username: {userData.username}</p>
            <p>Email: {userData.email}</p>
          </div>
        )}
        <button onClick={() => navigate("/detect")}>
          Go to Disease Detection
        </button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default UserDashboard;
