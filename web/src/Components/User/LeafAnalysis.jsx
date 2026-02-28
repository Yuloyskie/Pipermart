import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../shared/Header';

const LeafAnalysis = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const colors = {
    primary: '#1B4D3E',
    primaryDark: '#0D2818',
    primaryLight: '#27AE60',
    secondary: '#FFFFFF',
    background: '#F8FAF7',
    text: '#1B4D3E',
    textLight: '#5A7A73',
    border: '#D4E5DD',
    accent: '#D4AF37',
    warning: '#F39C12',
    danger: '#E74C3C',
    success: '#27AE60',
  };

  const diseaseRecommendations = {
    'Healthy': {
      icon: '✅',
      title: 'Plant is Healthy',
      description: 'Your pepper plant shows no signs of disease.',
      actions: ['Continue regular watering', 'Monitor weekly', 'Maintain proper spacing'],
      color: colors.success
    },
    'Footrot': {
      icon: '⚠️',
      title: 'Footrot Disease Detected',
      description: 'This is a fungal disease affecting the base of the plant.',
      actions: ['Remove infected plant parts', 'Improve soil drainage', 'Apply fungicide treatment', 'Avoid waterlogging'],
      color: colors.danger
    },
    'Pollu_Disease': {
      icon: '🚨',
      title: 'Pollu Disease Detected',
      description: 'Viral infection causing leaf curling and discoloration.',
      actions: ['Isolate affected plant', 'Remove diseased leaves', 'Control aphid vectors', 'Use insecticide if needed'],
      color: colors.warning
    },
    'Slow-Decline': {
      icon: '📉',
      title: 'Slow Decline Detected',
      description: 'Progressive weakening of plant vigor.',
      actions: ['Check soil moisture', 'Test soil pH and nutrients', 'Improve fertilization', 'Ensure proper drainage'],
      color: colors.warning
    },
    'Slow_Decline': {
      icon: '📉',
      title: 'Slow Decline Detected',
      description: 'Progressive weakening of plant vigor.',
      actions: ['Check soil moisture', 'Test soil pH and nutrients', 'Improve fertilization', 'Ensure proper drainage'],
      color: colors.warning
    },
    'Leaf_Blight': {
      icon: '🍂',
      title: 'Leaf Blight Detected',
      description: 'Fungal infection causing leaf spots and browning.',
      actions: ['Remove affected leaves', 'Improve air circulation', 'Reduce leaf wetness', 'Apply copper fungicide'],
      color: colors.danger
    },
    'Yellow_Mottle_Virus': {
      icon: '💛',
      title: 'Yellow Mottle Virus Detected',
      description: 'Viral infection causing yellow patterns on leaves.',
      actions: ['Remove infected plant if severe', 'Control insect vectors', 'Sanitize tools', 'Avoid spreading to other plants'],
      color: colors.danger
    }
  };

  const normalizeDiseaseeName = (diseaseName) => {
    const diseaseMapping = {
      'healthy': 'Healthy',
      'footrot': 'Footrot',
      'pollu': 'Pollu_Disease',
      'pollu_disease': 'Pollu_Disease',
      'slow-decline': 'Slow-Decline',
      'slow_decline': 'Slow_Decline',
      'slowdecline': 'Slow_Decline',
      'leaf-blight': 'Leaf_Blight',
      'leaf_blight': 'Leaf_Blight',
      'leafblight': 'Leaf_Blight',
      'yellow-mottle': 'Yellow_Mottle_Virus',
      'yellow_mottle': 'Yellow_Mottle_Virus',
      'yellow_mottle_virus': 'Yellow_Mottle_Virus',
      'ymv': 'Yellow_Mottle_Virus'
    };
    const lowerName = (diseaseName || '').toLowerCase().trim();
    return diseaseMapping[lowerName] || diseaseName;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
      setResult(null);
    }
  };

  const handlePredict = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const startTime = Date.now();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', image);

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/predict/disease`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.data) {
        if (response.data.success === false) {
          setError(response.data.error || 'Prediction failed');
        } else if (response.data.disease) {
          const normalizedDisease = normalizeDiseaseeName(response.data.disease);
          setResult({ ...response.data, disease: normalizedDisease, processingTime: duration });
          setProcessingTime(duration);
        } else {
          setError('No disease detected in response');
        }
      } else {
        setError('No response from server');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMsg = 'Failed to analyze image. Please try again.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message === 'Network Error') {
        errorMsg = 'Network error. Make sure backend is running.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getDiseaseInfo = (diseaseName) => {
    const normalized = normalizeDiseaseeName(diseaseName);
    return diseaseRecommendations[normalized] || {
      icon: '❓',
      title: `${diseaseName || 'Unknown'} Disease`,
      description: 'Unable to identify the disease.',
      actions: ['Consult agricultural expert', 'Get professional diagnosis'],
      color: colors.textLight
    };
  };

  const resultInfo = result ? getDiseaseInfo(result.disease) : null;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Header />
      {/* Background matching home screen style */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '100vh',
        zIndex: -1,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(0, 40, 20, 0.85) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(10, 30, 15, 0.75) 0%, transparent 50%),
          linear-gradient(180deg, rgba(10, 10, 10, 0.9) 0%, rgba(13, 26, 18, 0.85) 50%, rgba(10, 10, 10, 0.9) 100%),
          url('../../../paminta.webp')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} />
      <div style={{
        minHeight: '100vh',
        padding: '80px 20px 20px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: result ? '1fr 1fr' : '1fr',
          gap: '24px'
        }}>
          {/* Upload Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.5s ease'
          }}>
            <h2 style={{ color: colors.text, fontSize: '24px', fontWeight: '800', margin: '0 0 24px 0' }}>
              🔬 Pepper Leaf Disease Detector
            </h2>
            <p style={{ color: colors.textLight, fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              Upload a clear image of your pepper plant leaf. Our AI model will analyze it and detect any diseases.
            </p>

            {preview ? (
              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '12px', border: `2px solid ${colors.border}`, maxHeight: '300px', objectFit: 'cover' }} />
                <button onClick={() => { setImage(null); setPreview(null); setResult(null); setError(null); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: colors.danger, color: colors.secondary, border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '24px', backgroundColor: colors.background }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍃</div>
                <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No image selected</div>
                <div style={{ color: colors.textLight, fontSize: '13px' }}>Upload a leaf image to analyze</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading}
                style={{ padding: '12px 16px', background: colors.primary, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: loading ? 0.6 : 1 }}>
                📁 {preview ? 'Change' : 'Upload'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading}
                style={{ padding: '12px 16px', background: colors.primaryLight, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: loading ? 0.6 : 1 }}>
                📷 Camera
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: 'none' }} />

            {error && (
              <div style={{ background: '#FDF2F2', border: '2px solid #E74C3C', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#E74C3C', fontSize: '14px' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            <button onClick={handlePredict} disabled={!image || loading}
              style={{ width: '100%', padding: '16px', background: image ? colors.primary : '#B8D4C8', color: colors.secondary, border: 'none', borderRadius: '12px', cursor: image && !loading ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '16px' }}>
              {loading ? '🔄 Analyzing...' : '🔍 Analyze Leaf'}
            </button>
          </div>

          {/* Results Section */}
          {result && resultInfo && (
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', borderLeft: `4px solid ${resultInfo.color}` }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>{resultInfo.icon}</div>
                <h2 style={{ color: resultInfo.color, fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0' }}>{resultInfo.title}</h2>
                <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary, marginBottom: '12px' }}>Confidence: {result.confidence}%</div>
              </div>

              <div style={{ background: colors.background, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ height: '12px', background: colors.border, borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${result.confidence}%`, background: result.confidence > 85 ? colors.success : colors.warning, borderRadius: '6px' }} />
                </div>
              </div>

              <p style={{ color: colors.textLight, fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' }}>{resultInfo.description}</p>

              <div style={{ background: colors.background, borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${resultInfo.color}` }}>
                <h4 style={{ color: colors.text, fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0' }}>📋 Recommended Actions</h4>
                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                  {resultInfo.actions.map((action, idx) => (
                    <li key={idx} style={{ color: colors.text, fontSize: '13px', marginBottom: '12px', paddingLeft: '28px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0', color: resultInfo.color }}>✓</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={() => { setImage(null); setPreview(null); setResult(null); setError(null); }}
                style={{ width: '100%', padding: '14px', marginTop: '24px', background: colors.primaryLight, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                🔄 Analyze Another Leaf
              </button>
            </div>
          )}
        </div>

        <div style={{ maxWidth: '1000px', margin: '40px auto 0', textAlign: 'center', color: 'white', opacity: '0.8' }}>
          <p style={{ fontSize: '12px', margin: '0' }}>Model Accuracy: 99.22% | 6 Disease Classes</p>
        </div>
      </div>
    </div>
  );
};

export default LeafAnalysis;
