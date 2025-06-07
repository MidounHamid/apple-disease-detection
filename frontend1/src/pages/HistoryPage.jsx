import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, Target } from 'lucide-react';
import '../HistoryPage.css'; // Import the CSS file

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem('detection_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('detection_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.setItem('detection_history', JSON.stringify([]));
  };

  const getDiseaseColor = (diseaseClass) => {
    // Color mapping for different diseases
    const colorMap = {
      'healthy': '#4CAF50',
      'apple scab': '#FF9800',
      'apple rust': '#F44336',
      'black rot': '#9C27B0',
      'cedar apple rust': '#FF5722',
      'default': '#2196F3'
    };
    return colorMap[diseaseClass?.toLowerCase()] || colorMap.default;
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getHealthyCount = () => {
    return history.filter(item => 
      item.class.toLowerCase().includes('healthy')
    ).length;
  };

  const getDiseasedCount = () => {
    return history.filter(item => 
      !item.class.toLowerCase().includes('healthy')
    ).length;
  };

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
      {/* Header */}
      <div className="history-page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
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

      {/* Content */}
      <div className="history-content">
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">
              <Target size={64} />
            </div>
            <h2>No Detections Yet</h2>
            <p>Upload an apple leaf image to start building your detection history!</p>
            <button 
              className="start-detecting-btn"
              onClick={() => navigate('/')}
            >
              Start Detecting
            </button>
          </div>
        ) : (
          <>
            {/* Statistics */}
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

            {/* History Grid */}
            <div className="history-grid">
              {history.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-header">
                    <div 
                      className="disease-indicator"
                      style={{ backgroundColor: getDiseaseColor(item.class) }}
                    ></div>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="delete-button"
                      aria-label={`Delete ${item.class} detection`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {item.imageUrl && (
                    <div className="history-image-container">
                      <img
                        src={item.imageUrl}
                        alt={`Detection result: ${item.class}`}
                        className="history-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="history-card-content">
                    <div className="disease-info">
                      <h3 className="disease-name">{item.class}</h3>
                      <div className="confidence-section">
                        <div className="confidence-bar-bg">
                          <div 
                            className="confidence-bar-fill"
                            style={{ 
                              width: `${Math.min(item.confidence * 100, 100)}%`,
                              backgroundColor: getDiseaseColor(item.class)
                            }}
                          ></div>
                        </div>
                        <span className="confidence-text">
                          {(Number(item.confidence) * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="timestamp-section">
                      <Calendar size={14} />
                      <span className="timestamp-text">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;