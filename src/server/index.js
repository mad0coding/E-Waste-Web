const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const fsSync = require('fs');
const https = require('https');
const path = require('path');
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Python script process
let pythonProcess = null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure allData directory exists
const DATA_DIR = path.join(__dirname, '../..', 'allData/userData');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Hash email to create folder name
function hashEmail(email) {
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}

// Get user folder path
function getUserFolderPath(email) {
  const hashedEmail = hashEmail(email);
  return path.join(DATA_DIR, hashedEmail);
}

// Get user info file path
function getUserInfoPath(email) {
  return path.join(getUserFolderPath(email), 'userInfo.json');
}

// Get photos folder path
function getPhotosFolderPath(email) {
  return path.join(getUserFolderPath(email), 'photos');
}

// Ensure user folder exists
async function ensureUserFolder(email) {
  const userFolder = getUserFolderPath(email);
  const photosFolder = getPhotosFolderPath(email);
  
  try {
    await fs.access(userFolder);
  } catch {
    await fs.mkdir(userFolder, { recursive: true });
  }
  
  try {
    await fs.access(photosFolder);
  } catch {
    await fs.mkdir(photosFolder, { recursive: true });
  }
}

// Get user info
async function getUserInfo(email) {
  const userInfoPath = getUserInfoPath(email);
  
  try {
    const data = await fs.readFile(userInfoPath, 'utf8');
    return JSON.parse(data);
  } catch {
    // Create default user info if file doesn't exist
    const defaultUserInfo = {
      email: email,
      points: 0,
      scannedBins: [],
      photos: [],
      pendingList: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    await ensureUserFolder(email);
    await fs.writeFile(userInfoPath, JSON.stringify(defaultUserInfo, null, 2));
    return defaultUserInfo;
  }
}

// Save user info
async function saveUserInfo(email, userInfo) {
  const userInfoPath = getUserInfoPath(email);
  await ensureUserFolder(email);
  
  userInfo.lastUpdatedAt = new Date().toISOString();
  await fs.writeFile(userInfoPath, JSON.stringify(userInfo, null, 2));
  return userInfo;
}

// Initialize Python script
function initPythonScript() {
  try {
    const pythonScriptPath = path.join(__dirname, '../../py_path/image_identify.py');
    
    console.log('Starting Python script:', pythonScriptPath);
    pythonProcess = spawn('python', [pythonScriptPath]);
    
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString().trim());
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      pythonProcess = null;
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python script:', error);
      pythonProcess = null;
    });
    
    console.log('Python script initialized successfully');
  } catch (error) {
    console.error('Error initializing Python script:', error);
  }
}

// Send image path to Python script and get identification result
function identifyImage(imagePath) {
  return new Promise((resolve, reject) => {
    if (!pythonProcess) {
      reject(new Error('Python script not initialized'));
      return;
    }
    
    console.log('Sending image path to Python:', imagePath);
    
    const timeout = setTimeout(() => {
      reject(new Error('Image identification timeout (5 seconds)'));
    }, 5000);
    
    // Buffer to collect data
    let responseBuffer = '';
    
    // Listen for response
    const onData = (data) => {
      responseBuffer += data.toString();
      
      // Check if we have a complete line (ending with newline)
      if (responseBuffer.includes('\n')) {
        clearTimeout(timeout);
        pythonProcess.stdout.removeListener('data', onData);
        
        try {
          const result = responseBuffer.trim();
          console.log('Identification result:', result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    };
    
    pythonProcess.stdout.on('data', onData);
    
    // Send image path to Python script
    pythonProcess.stdin.write(imagePath + '\n');
  });
}

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes

// User login/registration
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Simple validation - in production you'd want proper authentication
    const userInfo = await getUserInfo(email);
    userInfo.lastLoginAt = new Date().toISOString();
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      user: { 
        email: userInfo.email, 
        points: userInfo.points 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user data
app.get('/api/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const userInfo = await getUserInfo(email);
    
    res.json({
      email: userInfo.email,
      points: userInfo.points,
      scannedBins: userInfo.scannedBins || [],
      photoCount: (userInfo.photos || []).length,
      pendingList: userInfo.pendingList || []
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Add points for scanning BIN
app.post('/api/user/:email/scan-bin', async (req, res) => {
  try {
    const { email } = req.params;
    const { binId } = req.body;
    
    if (!binId || !binId.startsWith('Bin')) {
      return res.status(400).json({ error: 'Invalid BIN ID' });
    }
    
    const userInfo = await getUserInfo(email);
    
    // Check if BIN already scanned
    if (userInfo.scannedBins && userInfo.scannedBins.includes(binId)) {
      return res.status(400).json({ error: 'BIN already scanned' });
    }
    
    // Add points and record scanned BIN
    userInfo.points = (userInfo.points || 0) + 10;
    userInfo.scannedBins = userInfo.scannedBins || [];
    userInfo.scannedBins.push(binId);
    
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      points: userInfo.points,
      binId: binId
    });
  } catch (error) {
    console.error('Scan BIN error:', error);
    res.status(500).json({ error: 'Failed to process BIN scan' });
  }
});

// Upload photo
app.post('/api/user/:email/photos', upload.single('photo'), async (req, res) => {
  try {
    const { email } = req.params;
    const { binId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }
    
    const userInfo = await getUserInfo(email);
    const photosFolder = getPhotosFolderPath(email);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const filepath = path.join(photosFolder, filename);
    
    // Save photo to file
    await fs.writeFile(filepath, req.file.buffer);
    
    // Try to identify the image
    let identificationResult = null;
    try {
      if (pythonProcess) {
        console.log('Attempting image identification for:', filepath);
        identificationResult = await identifyImage(filepath);
        console.log('Image identification completed:', identificationResult);
      } else {
        console.log('Python process not available for identification');
      }
    } catch (identifyError) {
      console.error('Image identification error:', identifyError);
      // Continue without identification result
    }
    
    // Store photo info temporarily (without adding to userInfo yet)
    const photoInfo = {
      filename: filename,
      binId: binId || null,
      timestamp: new Date().toISOString(),
      size: req.file.size,
      identificationResult: identificationResult
    };
    
    res.json({ 
      success: true, 
      filename: filename,
      photoCount: (userInfo.photos || []).length,
      identificationResult: identificationResult,
      photoInfo: photoInfo
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get user photos list
app.get('/api/user/:email/photos', async (req, res) => {
  try {
    const { email } = req.params;
    const userInfo = await getUserInfo(email);
    
    res.json({
      photos: userInfo.photos || [],
      count: (userInfo.photos || []).length
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// Serve photo files
app.get('/api/user/:email/photos/:filename', async (req, res) => {
  try {
    const { email, filename } = req.params;
    const photosFolder = getPhotosFolderPath(email);
    const filepath = path.join(photosFolder, filename);
    
    // Check if file exists
    await fs.access(filepath);
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Serve photo error:', error);
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Confirm photo identification
app.post('/api/user/:email/photos/:filename/confirm', async (req, res) => {
  try {
    const { email, filename } = req.params;
    const { photoInfo } = req.body;
    
    if (!photoInfo) {
      return res.status(400).json({ error: 'Photo info required' });
    }
    
    const userInfo = await getUserInfo(email);
    
    // Add photo to user's photos array
    userInfo.photos = userInfo.photos || [];
    userInfo.photos.push({
      filename: photoInfo.filename,
      binId: photoInfo.binId,
      timestamp: photoInfo.timestamp,
      size: photoInfo.size,
      identificationResult: photoInfo.identificationResult
    });
    
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      photoCount: userInfo.photos.length
    });
  } catch (error) {
    console.error('Confirm photo error:', error);
    res.status(500).json({ error: 'Failed to confirm photo' });
  }
});

// Cancel photo identification (delete photo)
app.delete('/api/user/:email/photos/:filename/cancel', async (req, res) => {
  try {
    console.log("test")
    const { email, filename } = req.params;
    const photosFolder = getPhotosFolderPath(email);
    const filepath = path.join(photosFolder, filename);
    
    // Delete the photo file
    try {
      await fs.unlink(filepath);
    } catch (deleteError) {
      console.warn('Photo file may not exist:', deleteError);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel photo error:', error);
    res.status(500).json({ error: 'Failed to cancel photo' });
  }
});

// clear all photos
app.delete('/api/user/:email/photos/clear', async (req, res) => {
  console.log("called clear photos")
  const { email } = req.params;
  console.log(`Clear photos requested for user: ${email}`);

  try {
    const photosFolder = getPhotosFolderPath(email);
    console.log(`Photos folder path: ${photosFolder}`);

    const userInfo = await getUserInfo(email);
    console.log('User info loaded:', userInfo);

    if (fsSync.existsSync(photosFolder)) {
      const files = await fs.readdir(photosFolder);
      console.log(`Found ${files.length} files to delete`);
      for (const file of files) {
        console.log(`Deleting file: ${file}`);
        await fs.unlink(path.join(photosFolder, file));
      }
    } else {
      console.log('Photos folder does not exist.');
    }

    userInfo.photos = [];
    await saveUserInfo(email, userInfo);

    res.json({ success: true, message: 'All photos cleared' });
  } catch (error) {
    console.error('Clear photos error:', error);
    res.status(500).json({ error: 'Failed to clear photos', details: error.message });
  }
});

// Add item to pending list
app.post('/api/user/:email/pending-list', async (req, res) => {
  try {
    const { email } = req.params;
    const { item } = req.body;
    
    if (!item || typeof item !== 'string') {
      return res.status(400).json({ error: 'Valid item name required' });
    }
    
    const userInfo = await getUserInfo(email);
    userInfo.pendingList = userInfo.pendingList || [];
    
    // Add item if not already in list
    if (!userInfo.pendingList.includes(item)) {
      userInfo.pendingList.push(item);
      await saveUserInfo(email, userInfo);
    }
    
    res.json({ 
      success: true, 
      pendingList: userInfo.pendingList 
    });
  } catch (error) {
    console.error('Add to pending list error:', error);
    res.status(500).json({ error: 'Failed to add item to pending list' });
  }
});

// Remove item from pending list
app.delete('/api/user/:email/pending-list/:item', async (req, res) => {
  try {
    const { email, item } = req.params;
    
    const userInfo = await getUserInfo(email);
    userInfo.pendingList = userInfo.pendingList || [];
    
    // Remove item from list
    userInfo.pendingList = userInfo.pendingList.filter(pendingItem => pendingItem !== item);
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      pendingList: userInfo.pendingList 
    });
  } catch (error) {
    console.error('Remove from pending list error:', error);
    res.status(500).json({ error: 'Failed to remove item from pending list' });
  }
});

// Clear entire pending list
app.delete('/api/user/:email/pending-list', async (req, res) => {
  try {
    const { email } = req.params;
    
    const userInfo = await getUserInfo(email);
    userInfo.pendingList = [];
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      pendingList: userInfo.pendingList 
    });
  } catch (error) {
    console.error('Clear pending list error:', error);
    res.status(500).json({ error: 'Failed to clear pending list' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize server
async function startServer() {
  try {
    await ensureDataDir();
    
    // Initialize Python script
    initPythonScript();
    
    // get the certification
    const options = {
      key: fsSync.readFileSync('../../localhost-key.pem'),
      cert: fsSync.readFileSync('../../localhost-cert.pem')
    };
    // start HTTPS server
    https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
      console.log(`HTTPS backend running at https://0.0.0.0:${PORT}`);
      console.log(`Data directory: ${DATA_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

startServer();