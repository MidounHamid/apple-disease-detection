import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is an admin
    const userId = localStorage.getItem("user_id");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const accessToken = localStorage.getItem("access_token");

    if (!userId || !isAdmin || !accessToken) {
      // Redirect to login if not logged in or not an admin
      navigate("/login");
      return;
    }

    // Fetch all users (admin-only route)
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/admin/users", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch users");
        // Optionally redirect to login on error
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchUsers();
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
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <div className="dashboard-content">
        <h2>Registered Users</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Admin Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.is_admin ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-actions">
          <button onClick={() => navigate("/detect")}>
            Go to Disease Detection
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
