import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Wifi, WifiOff, Upload, Camera, Menu, X, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Dragimage = ({ onDetectionComplete }) => {
  const navigate = useNavigate();
  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:8000/predict";

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [dropAble, seTdropAble] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [history, setHistory] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login");
      return;
    }

    // Load history from localStorage on component mount
    const savedHistory = localStorage.getItem("detection_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkApiStatus();
    }, 5000); // Reduced frequency to avoid too many requests

    return () => clearInterval(interval);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("detection_history", JSON.stringify(history));
    }
  }, [history]);

  // Check API status
  const checkApiStatus = async () => {
    try {
      const response = await axios.get(API_URL.replace("/predict", "/ping"), {
        timeout: 5000
      });
      setApiStatus("healthy");
    } catch (err) {
      setApiStatus("offline");
      console.error("API health check failed:", err);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    setDragActive(false);
    setError(null); // Clear previous errors
    
    if (acceptedFiles.length === 0) {
      setError("No valid image file selected");
      return;
    }

    const selectedFile = acceptedFiles[0];

    // Validate file type
    if (!selectedFile.type.match(/image\/(jpeg|jpg|png)/)) {
      setError("Please upload a valid image (JPEG, JPG, PNG)");
      return;
    }

    // Validate file size
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size);
    setFile(selectedFile);
    setPrediction(null); // Clear previous prediction
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => {
      setDragActive(true);
    },
    onDragLeave: () => {
      setDragActive(false);
    },
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxFiles: 1,
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024,
  });

  // Generate preview URL
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Submit to API - Fixed to prevent duplicate history entries
  useEffect(() => {
    if (!file || isLoading) return;

    const predictDisease = async () => {
      setIsLoading(true);
      setError(null);
      seTdropAble(0);

      try {
        console.log("Starting prediction for file:", file.name);
        
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          timeout: 30000,
        });

        console.log("API Response:", response.data);

        if (response.data && response.data.class && response.data.confidence !== undefined) {
          const newPrediction = {
            id: Date.now(),
            class: response.data.class,
            timestamp: new Date().toLocaleString(),
            confidence: response.data.confidence,
            imageUrl: URL.createObjectURL(file),
          };

          setPrediction(newPrediction);
          
          // Add to history only once here
          setHistory((prevHistory) => {
            // Check if this prediction already exists to prevent duplicates
            const exists = prevHistory.some(item => 
              item.timestamp === newPrediction.timestamp && 
              item.class === newPrediction.class
            );
            
            if (!exists) {
              return [newPrediction, ...prevHistory];
            }
            return prevHistory;
          });

          if (onDetectionComplete) {
            onDetectionComplete(newPrediction);
          }
        } else {
          throw new Error("Invalid response from server - missing class or confidence");
        }
      } catch (err) {
        console.error("Prediction error:", err);
        
        let errorMessage = "Failed to analyze image. Please try again.";

        // Handle different error types
        if (err.response) {
          console.error("Error response:", err.response.data);
          
          if (err.response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("is_admin");
            navigate("/login");
            return;
          } else if (err.response.status === 413) {
            errorMessage = "Image file is too large. Please use a smaller image.";
          } else if (err.response.status === 422) {
            errorMessage = "Invalid image format. Please use JPEG, JPG, or PNG.";
          } else {
            errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
          }
        } else if (err.code === 'ECONNABORTED' || err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("Network Error")) {
          errorMessage = "Cannot connect to the server. Please check your connection.";
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    predictDisease();
  }, [file, API_URL, navigate, onDetectionComplete]);

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setPrediction(null);
    setError(null);
    seTdropAble(1);
  };

  const getDiseaseColor = () => {
    return prediction?.info?.color || "#21c654";
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Cannot access camera.";

      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access was denied. Please allow camera permissions.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera does not meet required constraints.";
      }

      setError(errorMessage);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = canvas.width;
      let height = canvas.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      const resizedCanvas = document.createElement("canvas");
      resizedCanvas.width = width;
      resizedCanvas.height = height;
      const resizedContext = resizedCanvas.getContext("2d");
      resizedContext.drawImage(canvas, 0, 0, width, height);

      resizedCanvas.toBlob(
        (blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          setFile(file);
          stopCamera();
        },
        "image/jpeg",
        0.8
      );
    } catch (err) {
      console.error("Photo capture error:", err);
      setError("Failed to capture photo. Please try again.");
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("detection_history");
  };

  const deleteHistoryItem = (id) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
  };

  // Cleanup effect for camera
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="app-container">
      {/* Left Panel - History */}
      <div className={`left-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
        
        {!sidebarCollapsed && (
          <div className="history-container">
            <div className="history-title">
              Detection History
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  style={{
                    marginLeft: '10px',
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="empty-history">
                No detections yet. Upload an image to get started!
              </div>
            ) : (
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.id} className="history-item">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt="Detection"
                        className="history-image"
                      />
                    )}
                    <div className="history-item-header">
                      <span className="history-disease">{item.class}</span>
                      <span className="history-confidence">
                        {(Number(item.confidence) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="history-timestamp">{item.timestamp}</div>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      style={{
                        marginTop: '5px',
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Main Content */}
      <div className="right-panel">
        <div className="drag-container">
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user_id");
              localStorage.removeItem("is_admin");
              localStorage.removeItem("detection_history");
              navigate("/login");
            }}
            style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
          >
            Logout
          </button>
          
        {/* Add this button for mobile */}
        <button 
          className="mobile-history-button"
          onClick={() => navigate('/history')}
          aria-label="View History"
          style={{ position: "absolute", top: 10, zIndex: 1000 }}
        >
          <History size={24} />
        </button>

          <div className="upload-container">
            <h1 className="title">
              {apiStatus && (
                <div
                  className={`api-status ${
                    apiStatus === "healthy" ? "online" : "offline"
                  }`}
                >
                  {apiStatus === "offline" ? <WifiOff /> : <Wifi />}
                </div>
              )}
              <span>Apple Disease Detection</span>
            </h1>
            
            {dropAble && !showCamera ? (
              <>
                <div
                  {...getRootProps()}
                  className={`dropzone ${dragActive ? "active" : ""} ${
                    isLoading ? "disabled" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {isLoading ? (
                    <div className="upload-status">
                      <div className="spinner"></div>
                      <p>Analyzing your image...</p>
                    </div>
                  ) : (
                    <>
                      {dragActive ? (
                        <p>Drop the image here</p>
                      ) : (
                        <div className="drop-zone-text">
                          <Upload size={50} />
                          <p>Drag & drop apple leaf image, or click to browse</p>
                          <p>Supports JPG, PNG, JPEG (Max 10MB)</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button onClick={startCamera} className="camera-btn take-photo-btn">
                  Take Photo
                </button>
              </>
            ) : null}

            {preview && !isLoading && (
              <div className="preview-section">
                <div className="image-preview">
                  <img
                    src={preview}
                    alt="Selected apple leaf"
                    onError={(e) => {
                      console.error("Image preview error:", e);
                      setError("Failed to load image preview");
                    }}
                  />
                  <button onClick={resetAll} className="clear-btn">
                    X
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error" style={{ color: "red", marginBottom: "1rem" }}>
                {error}
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}

            {prediction && (
              <div className="results-section">
                <div
                  className="result-card"
                  style={{
                    borderLeft: `5px solid ${getDiseaseColor(prediction.class)}`,
                  }}
                >
                  <p className="disease-name">{prediction.class}</p>

                  <div className="confidence-meter">
                    <div
                      className="confidence-bar"
                      style={{
                        width: `${Math.min(prediction.confidence * 100, 100)}%`,
                        backgroundColor: getDiseaseColor(prediction.class),
                      }}
                    />
                  </div>

                  <p className="confidence-value">
                    Confidence: {(Number(prediction.confidence) * 100).toFixed(2)}%
                  </p>
                  <p className="preview-section">
                    Analyzed at: {prediction.timestamp}
                  </p>
                </div>

                <div className="result-footer">
                  <button onClick={resetAll} className="new-analysis-btn">
                    Analyze Another Image
                  </button>
                </div>
              </div>
            )}

            {showCamera && (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-video"
                />
                <div className="camera-controls">
                  <button onClick={capturePhoto} className="camera-btn capture-btn">
                    Capture
                  </button>
                  <button onClick={stopCamera} className="camera-btn cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dragimage;