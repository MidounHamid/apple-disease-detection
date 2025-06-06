import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Dragimage = () => {
  const navigate = useNavigate();
  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:8000/predict";

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [dropAble, seTdropAble] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check authentication on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkApiStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check API status
  const checkApiStatus = async () => {
    try {
      const response = await axios.get(API_URL.replace("/predict", "/ping"));
      setApiStatus("healthy");
    } catch (err) {
      setApiStatus("offline");
      console.error("API health check failed:", err);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    setDragActive(false);
    if (acceptedFiles.length === 0) return;

    const selectedFile = acceptedFiles[0];

    if (!selectedFile.type.match(/image\/(jpeg|jpg|png)/)) {
      setError("Please upload a valid image (JPEG, JPG, PNG)");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setPrediction(null);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => {
      console.log("Drag entered");
      setDragActive(true);
    },
    onDragLeave: () => {
      console.log("Drag left");
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

  // Submit to API
  useEffect(() => {
    if (!file) return;

    const predictDisease = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          timeout: 30000,
        });

        if (response.data.class && response.data.confidence) {
          setPrediction({
            class: response.data.class,
            timestamp: new Date().toLocaleString(),
            confidence: response.data.confidence,
          });
          seTdropAble(0);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        let errorMessage = "Failed to analyze image. Please try again.";
        seTdropAble(0);

        // Check for authentication errors
        if (err.response && err.response.status === 401) {
          // Token might be expired or invalid
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("is_admin");
          navigate("/login");
          return;
        }

        if (err.response) {
          errorMessage = err.response.data?.detail || errorMessage;
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Network Error")) {
          errorMessage =
            "Cannot connect to the server. Please check your connection.";
        }

        setError(errorMessage);
        console.error("Prediction error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    predictDisease();
  }, [file, API_URL, navigate]);

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

      // Ensure video is ready
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Cannot access camera.";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera access was denied. Please allow camera permissions.";
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

      // Use video's natural resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Compress and resize if needed
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
      ); // 80% quality
    } catch (err) {
      console.error("Photo capture error:", err);
      setError("Failed to capture photo. Please try again.");
    }
  };

  // Add cleanup effect for camera
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Add console logs for debugging
  useEffect(() => {
    console.log("File state changed:", file);
    console.log("Preview state:", preview);
  }, [file, preview]);

  // Add method to toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-container">
      {/* Left Side - History */}
      <div className={`left-panel ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {isSidebarCollapsed ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
        {!isSidebarCollapsed && (
          <div className="history-container">
            <h2 className="history-title">Detection History</h2>
            {history.length === 0 ? (
              <p className="empty-history">No detections yet.</p>
            ) : (
              <ul className="history-list">
                {history.map((item, index) => (
                  <li key={index} className="history-item">
                    <div className="history-item-header">
                      <span className="history-disease">{item.class}</span>
                      <span className="history-confidence">
                        {(Number(item.confidence) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="history-timestamp">{item.timestamp}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right Side - Main Content */}
      <div className="right-panel">
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

          {/* Rest of the existing component remains the same */}
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
                      <p>Drag & drop apple leaf image, or click to browse</p>
                    )}
                    <p className="formats">
                      Supports: JPG, PNG, JPEG (Max 10MB)
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={startCamera}
                className="camera-btn take-photo-btn"
              >
                Take Photo
              </button>
            </>
          ) : null}

          {/* Rest of the component remains the same */}
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
            <div
              className="error"
              style={{ color: "red", marginBottom: "1rem" }}
            >
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
                  Confidence: {(Number(prediction.confidence) * 100).toFixed(2)}
                  %
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
                <button
                  onClick={capturePhoto}
                  className="camera-btn capture-btn"
                >
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
  );
};

export default Dragimage;
