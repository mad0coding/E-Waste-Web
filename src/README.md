# E-Waste Collection App

A mobile-first web application for e-waste collection with backend storage, user management, and photo archiving.

## Features

- **User Authentication**: Simple email/password login system
- **Points System**: Earn points by scanning BIN QR codes (10 points per scan)
- **Camera Integration**: Take photos and upload them with automatic QR code scanning
- **Photo Storage**: All photos are stored on the backend with metadata
- **Interactive Map**: Real GPS location tracking with Melbourne streets
- **Search Functionality**: UI for searching e-waste information
- **Data Persistence**: All user data, points, and photos are stored in files

## Architecture

### Frontend (React + TypeScript)
- Built with Vite for fast development
- Mobile-first responsive design
- Camera API integration with HTTPS support
- Real-time QR code scanning using jsQR
- Interactive maps with Leaflet.js

### Backend (Express.js + Node.js)
- RESTful API endpoints
- File-based storage system
- User data organized in hashed email folders
- Photo upload and serving
- No database required - uses JSON files

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with camera support
- HTTPS for camera access on mobile devices

### Installation

1. Clone the repository and install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

3. Start both frontend and backend servers:
```bash
npm run start:all
```

This will start:
- Frontend development server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

### Individual Server Commands

Start only the backend:
```bash
npm run server
```

Start only the frontend:
```bash
npm run dev
```

## Data Storage Structure

```
allData/
├── {hashed-email-1}/
│   ├── userInfo.json
│   └── photos/
│       ├── photo_1635789123456.jpg
│       └── photo_1635789234567.jpg
└── {hashed-email-2}/
    ├── userInfo.json
    └── photos/
        └── photo_1635789345678.jpg
```

### User Info Structure
```json
{
  "email": "user@example.com",
  "points": 150,
  "scannedBins": ["Bin001", "Bin002"],
  "photos": [
    {
      "filename": "photo_1635789123456.jpg",
      "binId": "Bin001",
      "timestamp": "2023-11-01T10:30:00.000Z",
      "size": 1024576
    }
  ],
  "createdAt": "2023-11-01T09:00:00.000Z",
  "lastLoginAt": "2023-11-01T10:00:00.000Z",
  "lastUpdatedAt": "2023-11-01T10:30:00.000Z"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login/registration

### User Management
- `GET /api/user/:email` - Get user data
- `POST /api/user/:email/scan-bin` - Process BIN scan and award points

### Photo Management
- `POST /api/user/:email/photos` - Upload photo
- `GET /api/user/:email/photos` - Get user's photos list
- `GET /api/user/:email/photos/:filename` - Serve photo file

### System
- `GET /api/health` - Health check endpoint

## Development

### Project Structure
```
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── CameraComponent.tsx
│   ├── LoginPage.tsx
│   ├── MainInterface.tsx
│   ├── MapComponent.tsx
│   └── SearchComponent.tsx
├── server/              # Backend Express server
│   ├── index.js         # Main server file
│   └── package.json     # Backend dependencies
├── utils/               # Utility functions
│   └── api.ts           # API client
├── styles/              # Global styles
│   └── globals.css      # Tailwind CSS configuration
└── allData/             # User data storage (created automatically)
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js, Multer (file uploads)
- **Camera**: WebRTC getUserMedia API
- **QR Scanning**: jsQR library
- **Maps**: Leaflet.js with OpenStreetMap
- **Storage**: File system with JSON

## Features in Detail

### BIN ID Validation
- QR codes must start with "Bin" prefix
- Each BIN can only be scanned once per user
- Successful scans award 10 points

### Photo Management
- Photos are automatically resized and compressed
- Each photo is linked to a BIN ID if scanned
- Photos are served directly from the backend
- Supports both camera capture and file upload

### Mobile Optimization
- HTTPS required for camera access
- Touch-friendly interface
- Responsive design for all screen sizes
- Optimized for mobile browsers

## Security Considerations

⚠️ **Important**: This application is designed for demonstration purposes. For production use, consider:

- Proper user authentication and session management
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload validation
- HTTPS encryption in production
- Database instead of file storage for scalability

## License

This project is for educational and demonstration purposes.