// import { useState, useEffect } from "react";
// import { useDropzone } from "react-dropzone";
// import axios from "axios";
// import "./App.css"; // Create this CSS file (contents provided below)

// const Dragimage = () => {
//   // Configuration
//   const API_URL = process.env.REACT_APP_API_URL?.trim() || "http://localhost:8000/predict";

//   // State management
//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [prediction, setPrediction] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [dragActive, setDragActive] = useState(false);

//   // Handle file drop/selection
//   const onDrop = (acceptedFiles) => {
//     setDragActive(false);
//     if (acceptedFiles.length === 0) return;
    
//     setFile(acceptedFiles[0]);
//     setError(null);
//     setPrediction(null);
//   };

//   // Configure dropzone
//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop,
//     onDragEnter: () => setDragActive(true),
//     onDragLeave: () => setDragActive(false),
//     accept: {
//       "image/*": [".jpeg", ".jpg", ".png"],
//     },
//     maxFiles: 1,
//     disabled: isLoading,
//   });

//   // Generate preview URL
//   useEffect(() => {
//     if (!file) {
//       setPreview(null);
//       return;
//     }
    
//     const objectUrl = URL.createObjectURL(file);
//     setPreview(objectUrl);
    
//     return () => URL.revokeObjectURL(objectUrl);
//   }, [file]);

//   // Submit to API when file changes
//   useEffect(() => {
//     if (!file) return;

//     const predictDisease = async () => {
//       setIsLoading(true);
//       const formData = new FormData();
//       formData.append("file", file);

//       try {
//         const response = await axios.post(API_URL, formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//           timeout: 30000, // 30-second timeout
//         });

//         if (response.data?.class) {
//           setPrediction(response.data);
//         } else {
//           throw new Error("Invalid response from server");
//         }
//       } catch (err) {
//         console.error("Prediction error:", err);
//         setError(
//           err.response?.data?.detail || 
//           err.message || 
//           "Failed to analyze image. Please try again."
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     predictDisease();
//   }, [file, API_URL]);

//   // Reset all state
//   const resetAll = () => {
//     setFile(null);
//     setPreview(null);
//     setPrediction(null);
//     setError(null);
//   };

//   return (
//     <div className="upload-container">
//       <h1>Apple Disease Detection</h1>
      
//       {/* Dropzone Area */}
//       <div
//         {...getRootProps()}
//         className={`dropzone ${dragActive ? "active" : ""} ${isLoading ? "disabled" : ""}`}
//       >
//         <input {...getInputProps()} />
//         {isLoading ? (
//           <div className="upload-status">
//             <div className="spinner"></div>
//             <p>Analyzing your image...</p>
//           </div>
//         ) : (
//           <>
//             {dragActive ? (
//               <p>Drop the image here</p>
//             ) : (
//               <p>Drag & drop apple leaf image, or click to browse</p>
//             )}
//             <p className="formats">Supports: JPG, PNG, JPEG</p>
//           </>
//         )}
//       </div>

//       {/* Preview Section */}
//       {preview && (
//         <div className="preview-section">
//           <h3>Selected Image</h3>
//           <div className="image-preview">
//             <img src={preview} alt="Selected apple leaf" />
//             <button onClick={resetAll} className="clear-btn">
//               × Clear
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Error Display */}
//       {error && (
//         <div className="error-message">
//           <p>⚠️ {error}</p>
//           <button onClick={resetAll} className="retry-btn">
//             Try Again
//           </button>
//         </div>
//       )}

//       {/* Results Section */}
//       {prediction && (
//         <div className="results-section">
//           <h2>Diagnosis Results</h2>
//           <div className="result-card">
//             <p className="disease-name">
//               {prediction.class}
//             </p>
//             <div className="confidence-meter">
//               <div 
//                 className="confidence-bar"
//                 style={{ width: `${prediction.confidence * 100}%` }}
//               ></div>
//             </div>
//             <p className="confidence-value">
//               {(prediction.confidence * 100).toFixed(2)}% confidence
//             </p>
//           </div>
//           <button onClick={resetAll} className="new-analysis-btn">
//             Analyze Another Image
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dragimage;




import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import "./App2.css";

const Dragimage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/predict";

  // State
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles) => {
    setDragActive(false);
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    if (!selectedFile.type.match(/image\/(jpeg|jpg|png)/)) {
      setError("Please upload a valid image (JPEG, JPG, PNG)");
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
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    disabled: isLoading,
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
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data && response.data.class) {
          setPrediction(response.data);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(
          err.response?.data?.detail || 
          err.message || 
          "Failed to analyze image. Please try again."
        );
      } finally {
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
  };

  return (
    <div className="upload-container">
      <h1>Apple Disease Detection</h1>
      
      {/* Dropzone */}
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
            <p className="formats">Supports: JPG, PNG, JPEG</p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && !isLoading && (
        <div className="preview-section">
          <h3>Selected Image</h3>
          <div className="image-preview">
            <img src={preview} alt="Selected apple leaf" />
            <button onClick={resetAll} className="clear-btn">
              × Clear
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={resetAll} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {prediction && (
        <div className="results-section">
          <h2>Diagnosis Results</h2>
          <div className="result-card">
            <p className="disease-name">
              {prediction.class}
            </p>
            <div className="confidence-meter">
              <div 
                className="confidence-bar"
                style={{ width: `${Math.min(prediction.confidence * 100, 100)}%` }}
              ></div>
            </div>
            <p className="confidence-value">
              {(prediction.confidence * 100).toFixed(2)}% confidence
            </p>
          </div>
          <button onClick={resetAll} className="new-analysis-btn">
            Analyze Another Image
          </button>
        </div>
      )}
    </div>
  );
};

export default Dragimage;