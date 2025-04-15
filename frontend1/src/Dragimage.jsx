import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Wifi, WifiOff } from 'lucide-react';
import "./App.css";

const Dragimage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/predict";
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [dropAble, seTdropAble] = useState(1);
  const [n, setN] = useState(0);

  
  useEffect(() => {
    const interval = setInterval(() => {
      checkApiStatus()
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);

  // Check API status
  const checkApiStatus = async () => {
    try {
      const response = await axios.get(API_URL.replace("/predict", "/ping"));
      setApiStatus("healthy");
    }
    catch (err)
    {
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
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
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
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000
        });

        if (response.data.class && response.data.confidence) {
          setPrediction({
            class: response.data.class,
            timestamp: new Date().toLocaleString(),
            confidence: response.data.confidence
          });
          seTdropAble(0);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        let errorMessage = "Failed to analyze image. Please try again.";
        seTdropAble(0)
        if (err.response) {
          errorMessage = err.response.data?.detail || errorMessage;
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Network Error")) {
          errorMessage = "Cannot connect to the server. Please check your connection.";
        }
        
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    };
    predictDisease();
  }, [file, API_URL]);

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setPrediction(null);
    setError(null);
    seTdropAble(1);
  };

  const getDiseaseColor = () => {
    return prediction?.info?.color || '#21c654';
  };

  return (
    <div className="upload-container">
      
      
      <h1 className="title">
        {apiStatus && (
        <div className={`api-status ${apiStatus === 'healthy' ? 'online' : 'offline'}`}>
          {apiStatus === 'offline' ? <WifiOff /> : <Wifi/>}
        </div>
      )}
       <span>Apple Disease Detection</span> 
       {/* {n}  */}
       </h1>
      {
        dropAble ? (
          <div
        {...getRootProps()}
        className={`dropzone ${dragActive ? "active" : ""} ${isLoading ? "disabled" : ""}`}
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
        ) : (
          ""
        )
      }
      

      {preview && !isLoading && (
        <div className="preview-section">
          <div className="image-preview">
            <img src={preview} alt="Selected apple leaf" />
            <button onClick={resetAll} className="clear-btn">X</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={resetAll} className="retry-btn">Try Again</button>
        </div>
      )}

      {prediction && (
        <div className="results-section">
          <div 
            className="result-card"
            style={{ borderLeft: `5px solid ${getDiseaseColor(prediction.class)}` }}
          >
            <p className="disease-name">{prediction.class}</p>
            
            <div className="confidence-meter">
              <div 
                className="confidence-bar"
                style={{ 
                  width: `${Math.min(prediction.confidence * 100, 100)}%`,
                  backgroundColor: getDiseaseColor(prediction.class)
                }}
              />
            </div>

            <p className="confidence-value">
              Confidence: {(Number(prediction.confidence) * 100).toFixed(2)}%
            </p>
            <p className="preview-section">Analyzed at: {prediction.timestamp}</p>
          </div>

          

          <div className="result-footer">
            <button onClick={resetAll} className="new-analysis-btn">
              Analyze Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dragimage;