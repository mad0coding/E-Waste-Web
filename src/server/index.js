const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure allData directory exists
const DATA_DIR = path.join(__dirname, '..', 'allData');

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
      photoCount: (userInfo.photos || []).length
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
    
    // Update user info
    userInfo.photos = userInfo.photos || [];
    userInfo.photos.push({
      filename: filename,
      binId: binId || null,
      timestamp: new Date().toISOString(),
      size: req.file.size
    });
    
    await saveUserInfo(email, userInfo);
    
    res.json({ 
      success: true, 
      filename: filename,
      photoCount: userInfo.photos.length
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize server
async function startServer() {
  try {
    await ensureDataDir();
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`E-waste backend server running on port ${PORT}`);
      console.log(`Data directory: ${DATA_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();