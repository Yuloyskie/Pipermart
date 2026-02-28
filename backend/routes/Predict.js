const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { isAuthenticatedUser } = require('../middlewares/auth');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

/**
 * POST /api/v1/predict/disease
 * Predict pepper leaf disease from image
 */
router.post('/disease', isAuthenticatedUser, upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  const requestId = req.query.requestId || req.body.requestId || `unknown_${Date.now()}`;
  
  console.log(`\n🔵 [${requestId}] NEW DISEASE PREDICTION REQUEST RECEIVED`);
  
  try {
    if (!req.file) {
      console.error(`❌ [${requestId}] No image file provided`);
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please upload an image.',
        requestId
      });
    }

    console.log(`📸 [${requestId}] Image received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save image temporarily - use requestId for unique filename
    const tempImagePath = path.join(tempDir, `${requestId}.jpg`);
    fs.writeFileSync(tempImagePath, req.file.buffer);

    console.log(`💾 [${requestId}] Temp file saved: ${tempImagePath}`);

    // Call Python prediction script
    const result = await new Promise((resolve, reject) => {
      // Python script path - Use YOLOv8 model
      const pythonScriptPath = path.join(__dirname, '../utils/predict_disease_yolov8.py');
      const leafDiseaseModelPath = path.join(__dirname, '../ml_models/leaf/train/weights/best.pt');
      const pythonExe = process.env.PYTHON_EXE || 'python';
      
      console.log(`🐍 [${requestId}] Spawning Python inference...`);
      console.log(`🐍 [${requestId}] Script: ${pythonScriptPath}`);
      console.log(`🐍 [${requestId}] Model: leaf/train/weights/best.pt`);
      
      // Use spawn without shell: true - Node.js handles paths with spaces correctly
      const python = spawn(pythonExe, [pythonScriptPath, tempImagePath, leafDiseaseModelPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log(`[${requestId}] Python: ${data.toString().trim()}`);
      });

      python.on('close', (code) => {
        // Clean up temp file
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            console.log(`🗑️ [${requestId}] Temp file deleted`);
          }
        } catch (e) {
          console.error(`[${requestId}] Error deleting temp file:`, e);
        }

        if (code === 0) {
          try {
            const parsedOutput = JSON.parse(output.trim());
            console.log(`✅ [${requestId}] Python returned valid JSON`);
            resolve(parsedOutput);
          } catch (e) {
            console.error(`❌ [${requestId}] Error parsing Python output:`, e.message);
            reject(new Error('Invalid prediction output'));
          }
        } else {
          console.error(`❌ [${requestId}] Python process exited with code ${code}`);
          console.error(`[${requestId}] Error output: ${errorOutput}`);
          reject(new Error(`Prediction failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      python.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {}
        reject(new Error('Failed to start prediction service'));
      });
    });

    if (result.error) {
      const duration = Date.now() - startTime;
      console.log(`⚠️ [${requestId}] Disease prediction failed (took ${duration}ms):`, result.error);
      return res.status(400).json({
        success: false,
        error: result.error,
        processingTime: duration,
        requestId
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Disease prediction completed in ${duration}ms`);
    console.log(`📊 Result:`, JSON.stringify(result, null, 2));
    res.status(200).json({
      success: true,
      processingTime: duration,
      requestId,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Prediction error (${duration}ms):`, error.message);

    // Try to clean up temp file - use requestId-based filename
    try {
      const tempDir = path.join(__dirname, '../temp');
      const tempFile = path.join(tempDir, `${requestId}.jpg`);
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log(`[${requestId}] Cleaned up temp file on error`);
      }
    } catch (e) {
      console.error(`[${requestId}] Error cleaning temp file:`, e.message);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image. Please try again.',
      requestId,
      processingTime: duration
    });
  }
});

/**
 * POST /api/v1/predict/bunga-ripeness
 * Predict black pepper bunga ripeness from image
 */
router.post('/bunga-ripeness', isAuthenticatedUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please upload an image.'
      });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save image temporarily
    const tempImagePath = path.join(tempDir, `temp_${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempImagePath, req.file.buffer);

    console.log(`📸 Processing bunga image: ${tempImagePath}`);

    // Call Python prediction script (ensemble v1 + v2)
    const result = await new Promise((resolve, reject) => {
      // Python script path - Use ensemble model (v1 + v2)
      const pythonScriptPath = path.join(__dirname, '../utils/predict_bunga_ripeness_ensemble.py');
      const pythonExe = 'C:\\Users\\admin\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
      
      // Use spawn without shell: true - Node.js handles paths with spaces correctly
      const python = spawn(pythonExe, [pythonScriptPath, tempImagePath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`⚠️ Python stderr: ${data}`);
      });

      python.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }

        if (code === 0) {
          try {
            // Extract JSON from output (skip any non-JSON lines like TensorFlow warnings)
            const lines = output.trim().split('\n');
            let jsonLine = '';
            for (let line of lines) {
              line = line.trim();
              if (line.startsWith('{')) {
                jsonLine = line;
                break;
              }
            }
            
            if (!jsonLine) {
              throw new Error('No JSON output found from Python script');
            }
            
            const parsedOutput = JSON.parse(jsonLine);
            resolve(parsedOutput);
          } catch (e) {
            console.error('Error parsing Python output:', e);
            reject(new Error('Invalid prediction output'));
          }
        } else {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error: ${errorOutput}`);
          reject(new Error(`Prediction failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      python.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {}
        reject(new Error('Failed to start prediction service'));
      });
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    console.log(`✅ Bunga ripeness prediction - Result: ${result.ripeness}, Confidence: ${result.confidence}%`);
    res.status(200).json({
      ...result
    });

  } catch (error) {
    console.error('❌ Bunga ripeness prediction error:', error);

    // Try to clean up temp file if it exists
    if (req.file) {
      try {
        const tempDir = path.join(__dirname, '../temp');
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          if (file.startsWith('temp_')) {
            fs.unlinkSync(path.join(tempDir, file));
          }
        });
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze bunga. Please try again.'
    });
  }
});

/**
 * POST /api/v1/predict/bunga-with-objects
 * Predict bunga with UNIFIED model (Ripe/Unripe + Health A/B/C/D)
 * Optimized for SPEED - single model inference
 */
router.post('/bunga-with-objects', isAuthenticatedUser, upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      });
    }

    console.log(`\n📸 [BUNGA-WITH-OBJECTS] Processing request...`);

    // Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save image temporarily
    const tempImagePath = path.join(tempDir, `temp_${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempImagePath, req.file.buffer);

    // Unified model path
    const unifiedModelPath = path.join(__dirname, '../ml_models/bunga/train/weights/best.pt');

    // Call Python prediction script
    const result = await new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(__dirname, '../utils/predict_bunga_dual_models.py');
      // Use 'python' to let system find it, or specify full path
      const pythonExe = process.env.PYTHON_EXE || 'python';  // Falls back to 'python' command
      
      console.log(`🐍 Spawning Python: ${pythonScriptPath}`);
      
      // Use spawn without shell: true - Node.js handles paths with spaces correctly
      const python = spawn(pythonExe, [pythonScriptPath, tempImagePath, unifiedModelPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120000  // 120s timeout for first run (COCO model download)
      });

      let output = '';
      let timeoutId;

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        // Log all debug output from Python
        console.log(data.toString());
      });

      python.on('close', (code) => {
        clearTimeout(timeoutId);
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {}

        if (code === 0 || code === null) {  // Accept null code during shutdown
          try {
            const lines = output.trim().split('\n');
            let jsonLine = '';
            for (let line of lines) {
              line = line.trim();
              if (line.startsWith('{')) {
                jsonLine = line;
                break;
              }
            }
            
            if (jsonLine) {
              const parsed = JSON.parse(jsonLine);
              resolve(parsed);
            } else {
              console.error('❌ No JSON output from Python');
              reject(new Error('No JSON output'));
            }
          } catch (e) {
            console.error('❌ Parse error:', e.message, 'Output:', output.substring(0, 500));
            reject(new Error('Parse error: ' + e.message));
          }
        } else {
          console.error('❌ Python exited with code:', code);
          reject(new Error('Python failed'));
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeoutId);
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {}
        console.error('❌ Process error:', err.message);
        reject(new Error('Process error: ' + err.message));
      });

      // First load: 90 second timeout (model initialization + COCO download)
      // Subsequent loads: 80 second timeout (COCO model needs time to load into memory)
      const timeoutMs = global.pythonModelLoaded ? 80000 : 90000;
      
      timeoutId = setTimeout(() => {
        python.kill('SIGKILL');
        console.error(`❌ Process timeout after ${timeoutMs}ms`);
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const duration = Date.now() - startTime;

    // Mark models as loaded after first successful run
    if (result.ripeness && !global.pythonModelLoaded) {
      global.pythonModelLoaded = true;
      console.log('🚀 Models loaded - subsequent requests will use faster timeout (40s)');
    }

    // NEW: Send partial results as they become available (progressive display)
    // Even if health/objects not detected, show what we have
    const hasAnyDetection = result && result.ripeness;
    
    // console.log(`✅ [COMPLETE] Class: ${result.class || 'None'} | Ripeness: ${result.ripeness || 'None'} | Health: ${result.health_class || 'Pending'} | Objects: ${result.other_objects?.length || 0} (${duration}ms)\n`);
    console.log(`✅ [COMPLETE] Class: ${result.class || 'None'} | Ripeness: ${result.ripeness || 'None'} | Health: ${result.health_class || 'Pending'} (${duration}ms)\n`);
    
    res.status(200).json({
      success: hasAnyDetection,
      class: result.class || null,
      ripeness: result.ripeness || null,
      ripeness_confidence: result.ripeness_confidence || 0,
      health_class: result.health_class || null,
      health_percentage: result.health_percentage || 0,
      health_range: result.health_range || null,
      bunga_detections: result.bunga_detections || [],
      other_objects: result.other_objects || [],
      image_size: result.image_size,
      processingTime: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Error:', error.message);
    if (error.message.includes('Timeout')) {
      console.error('⏱️ First run timeout detected - COCO model may still be downloading. Try again in 1-2 minutes.');
    }
    
    try {
      const tempDir = path.join(__dirname, '../temp');
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        if (file.startsWith('temp_')) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      });
    } catch (e) {}

    res.status(200).json({
      success: false,
      class: null,
      ripeness: null,
      health_class: null,
      ripeness_confidence: 0,
      health_percentage: 0,
      bunga_detections: [],
      other_objects: [],
      processingTime: duration,
      error: error.message.includes('Timeout') 
        ? 'Processing taking too long - COCO model may be downloading. Please try again.'
        : error.message
    });
  }
});

/**
 * GET /api/v1/predict/health
 * Check if prediction service is available
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Disease prediction service is running',
    disease_model: 'YOLOv8 (Leaf Disease Detection - leaf/train/weights/best.pt)',
    bunga_model: 'YOLOv8 Unified (Single Model - Ripe/Unripe + A/B/C/D Health)',
    object_detection: 'YOLOv8 + COCO (all objects)',
    accuracy: '99.22%',
    classes: [
      'Healthy',
      'Footrot',
      'Pollu_Disease',
      'Slow-Decline',
      'Leaf_Blight',
      'Yellow_Mottle_Virus'
    ],
    bunga_classes: [
      'Ripe Class A',
      'Ripe Class B',
      'Ripe Class C',
      'Ripe Class D',
      'Unripe Class A',
      'Unripe Class B',
      'Unripe Class C',
      'Unripe Class D'
    ]
  });
});

module.exports = router;
