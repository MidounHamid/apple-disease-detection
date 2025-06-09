import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Calendar, Target } from "lucide-react";
import axios from "axios";
import "../HistoryPage.css";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API URLs - Fixed to ensure proper URL construction
  const HISTORY_API_URL =
    process.env.REACT_APP_HISTORY_API_URL || "http://localhost:5000/history";
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login");
      return;
    }

    loadHistoryFromDatabase();
  }, [navigate]);

  const loadHistoryFromDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      const response = await axios.get(HISTORY_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("History loaded from database:", response.data);
      console.log("BASE_URL being used:", BASE_URL);

      // Debug each item's image path
      response.data.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          image_path: item.image_path,
          disease_name: item.disease_name,
        });
      });

      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load history from database:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("is_admin");
        navigate("/login");
        return;
      }

      setError("Failed to load history from database");

      // Fallback to localStorage if database fails
      try {
        const savedHistory = localStorage.getItem("detection_history");
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (parseErr) {
        console.error("Failed to parse local history:", parseErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("access_token");

      await axios.delete(`${HISTORY_API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
      console.log(`History item ${id} deleted successfully`);
    } catch (err) {
      console.error(`Failed to delete history item ${id}:`, err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("is_admin");
        navigate("/login");
        return;
      }

      setError("Failed to delete from database, but removed locally");
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem("access_token");

      for (const item of history) {
        try {
          await axios.delete(`${HISTORY_API_URL}/${item.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          console.error(`Failed to delete history item ${item.id}:`, err);
        }
      }

      setHistory([]);
      localStorage.removeItem("detection_history");
      console.log("History cleared successfully");
    } catch (err) {
      console.error("Failed to clear history:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("is_admin");
        navigate("/login");
        return;
      }

      setHistory([]);
      localStorage.removeItem("detection_history");
      setError("Failed to clear from database, but cleared locally");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getDiseaseColor = (diseaseClass) => {
    const colorMap = {
      healthy: "#4CAF50",
      "apple scab": "#FF9800",
      "apple rust": "#F44336",
      "black rot": "#9C27B0",
      "cedar apple rust": "#FF5722",
      default: "#2196F3",
    };
    return colorMap[diseaseClass?.toLowerCase()] || colorMap.default;
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const getHealthyCount = () => {
    return history.filter((item) =>
      (item.class || item.disease_name || "").toLowerCase().includes("healthy")
    ).length;
  };

  const getDiseasedCount = () => {
    return history.filter(
      (item) =>
        !(item.class || item.disease_name || "")
          .toLowerCase()
          .includes("healthy")
    ).length;
  };

  // FIXED: Improved image URL generation with better debugging
  const getImageUrl = (item) => {
    if (!item.image_path) {
      console.warn("No image path provided:", item);
      return null;
    }

    const filename = item.image_path.split(/[\/\\]/).pop();
    const imageUrl = `${BASE_URL}/uploads/images/${filename}`;

    console.log("Generated image URL:", {
      original: item.image_path,
      filename: filename,
      url: imageUrl,
    });

    return imageUrl;
  };

  // Enhanced image URL testing function
  const testImageUrl = async (url) => {
    try {
      console.log("Testing image URL:", url);
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      console.log(`Image URL test result:`, {
        url: url,
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
      return response.ok;
    } catch (error) {
      console.error(`Image URL test failed for ${url}:`, error);
      return false;
    }
  };

  // Add a function to test all image URLs on component mount
  useEffect(() => {
    if (history.length > 0) {
      console.log("Testing all image URLs...");
      history.forEach((item, index) => {
        const imageUrl = getImageUrl(item);
        if (imageUrl) {
          testImageUrl(imageUrl).then((result) => {
            console.log(`Image ${index} test result:`, result, imageUrl);
          });
        }
      });
    }
  }, [history]);

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-page-header">
        <button
          className="back-button"
          onClick={() => navigate("/")}
          aria-label="Go back to main page"
        >
          <ArrowLeft size={20} />
          <span className="back-text">Back</span>
        </button>

        <h1 className="history-title">
          <Calendar size={24} />
          Detection History
        </h1>

        {history.length > 0 && (
          <button
            className="clear-all-button"
            onClick={clearHistory}
            aria-label="Clear all detection history"
          >
            <Trash2 size={16} />
            <span className="clear-text">Clear All</span>
          </button>
        )}
      </div>

      {error && (
        <div
          className="error-message"
          style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "12px",
            margin: "16px",
            borderRadius: "4px",
            border: "1px solid #ef5350",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              color: "#c62828",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="history-content">
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">
              <Target size={64} />
            </div>
            <h2>No Detections Yet</h2>
            <p>
              Upload an apple leaf image to start building your detection
              history!
            </p>
            <button
              className="start-detecting-btn"
              onClick={() => navigate("/")}
            >
              Start Detecting
            </button>
          </div>
        ) : (
          <>
            <div className="history-stats">
              <div className="stat-card">
                <span className="stat-number">{history.length}</span>
                <span className="stat-label">Total Detections</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{getHealthyCount()}</span>
                <span className="stat-label">Healthy</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{getDiseasedCount()}</span>
                <span className="stat-label">Diseased</span>
              </div>
            </div>

            <div className="history-grid">
              {history.map((item) => {
                const imageUrl = getImageUrl(item);

                return (
                  <div key={item.id} className="history-card">
                    <div className="history-card-header">
                      <div
                        className="disease-indicator"
                        style={{
                          backgroundColor: getDiseaseColor(
                            item.class || item.disease_name
                          ),
                        }}
                      ></div>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="delete-button"
                        aria-label={`Delete ${
                          item.class || item.disease_name
                        } detection`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {imageUrl ? (
                      <div className="history-image-container">
                        <img
                          src={imageUrl}
                          alt={`Detection result: ${
                            item.class || item.disease_name
                          }`}
                          className="history-image"
                          loading="lazy"
                          onError={(e) => {
                            console.error("Image failed to load:", imageUrl);
                            console.error("Image error event:", e);

                            // Test the URL to diagnose the issue
                            testImageUrl(imageUrl).then((result) => {
                              console.log("URL test after error:", result);
                            });

                            e.target.style.display = "none";

                            // Show detailed error information
                            const container = e.target.parentElement;
                            if (
                              container &&
                              !container.querySelector(".image-error")
                            ) {
                              const errorDiv = document.createElement("div");
                              errorDiv.className = "image-error";
                              errorDiv.style.cssText = `
                                height: 200px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                background: #f5f5f5; 
                                color: #666; 
                                border-radius: 12px;
                                flex-direction: column;
                                gap: 8px;
                                padding: 20px;
                                text-align: center;
                              `;
                              errorDiv.innerHTML = `
                                <div style="font-size: 32px;">📷</div>
                                <div style="font-size: 12px; font-weight: bold;">Image not found</div>
                                <div style="font-size: 10px; opacity: 0.7; word-break: break-all;">${imageUrl}</div>
                                <div style="font-size: 10px; opacity: 0.5;">Check console for details</div>
                              `;
                              container.appendChild(errorDiv);
                            }
                          }}
                          onLoad={() => {
                            console.log(
                              "✅ Image loaded successfully:",
                              imageUrl
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <div className="history-image-container">
                        <div
                          style={{
                            height: "200px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f5f5f5",
                            color: "#666",
                            borderRadius: "12px",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ fontSize: "32px" }}>📷</div>
                          <div style={{ fontSize: "12px" }}>
                            No image available
                          </div>
                          <div style={{ fontSize: "10px", opacity: "0.7" }}>
                            Path: {item.image_path || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="history-card-content">
                      <div className="disease-info">
                        <h3 className="disease-name">
                          {item.class || item.disease_name}
                        </h3>
                        <div className="confidence-section">
                          <div className="confidence-bar-bg">
                            <div
                              className="confidence-bar-fill"
                              style={{
                                width: `${Math.min(
                                  (item.confidence || 0) * 100,
                                  100
                                )}%`,
                                backgroundColor: getDiseaseColor(
                                  item.class || item.disease_name
                                ),
                              }}
                            ></div>
                          </div>
                          <span className="confidence-text">
                            {(Number(item.confidence || 0) * 100).toFixed(1)}%
                            confidence
                          </span>
                        </div>
                      </div>

                      <div className="timestamp-section">
                        <Calendar size={14} />
                        <span className="timestamp-text">
                          {formatDate(item.timestamp || item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
