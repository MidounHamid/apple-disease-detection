import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Dragimage from "./Dragimage.jsx";
import HistoryPage from "./pages/HistoryPage";

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const isAuthenticated = !!localStorage.getItem("access_token");
  const isAdmin = localStorage.getItem("is_admin") === "true";

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect non-admin users from admin routes
    return <Navigate to="/detect" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/detect"
            element={
              <ProtectedRoute>
                <Dragimage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Dragimage />} />
          <Route path="/history" element={<HistoryPage />} />

          {/* Default route - redirect based on authentication */}
          <Route
            path="/"
            element={
              localStorage.getItem("access_token") ? (
                localStorage.getItem("is_admin") === "true" ? (
                  <Navigate to="/admin-dashboard" replace />
                ) : (
                  <Navigate to="/detect" replace />
                )
              ) : (
                <Login />
              )
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
