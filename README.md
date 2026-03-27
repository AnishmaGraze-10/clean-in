# 🌱 Clean-In Smart City Waste Management System

A comprehensive full-stack waste management platform for smart cities, built with the MERN stack (MongoDB, Express.js, React, Node.js).

[![CI](https://github.com/yourusername/clean-in/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/clean-in/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based auth with role-based access control (Citizen/Admin)
- **Waste Reporting**: Submit waste reports with image upload, GPS location, and descriptions
- **Authority Dashboard**: Real-time waste report verification and management
- **Rewards System**: Points-based gamification with leaderboard
- **Route Optimization**: AI-powered waste collection route optimization
- **Analytics Dashboard**: Comprehensive data visualization and insights
- **Real-time Notifications**: Socket.io-powered live updates
- **Gamification**: Challenges, badges, and weekly missions

### Advanced Features
- **AI Waste Detection**: Google Vision API integration for automatic waste classification
- **Interactive Maps**: Leaflet.js integration for waste report visualization
- **CSV Export**: Analytics data export for reporting
- **Swagger API Docs**: Complete API documentation at `/api/docs`
- **Postman Collection**: Ready-to-use API collection
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Leaflet.js for maps
- Recharts for analytics
- React Context API for state management
- Axios for API calls
- Socket.io-client for real-time features

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- Cloudinary for image upload
- Socket.io for real-time notifications
- Swagger for API documentation

**DevOps:**
- GitHub Actions CI/CD
- Jest + Supertest for testing
- ESLint for code quality

## 📁 Project Structure

```
clean-in/
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── __tests__/       # Test files
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios configurations
│   │   ├── components/  # React components
│   │   ├── context/     # React contexts
│   │   ├── pages/       # Page components
│   │   └── App.jsx
│   └── index.html
├── docs/               # Documentation
└── .github/workflows/  # CI/CD workflows
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Cloudinary account (for image upload)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/clean-in.git
cd clean-in
```

2. **Setup Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Variables

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cleanin
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:5000/api/docs
```

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Waste Reports Endpoints
- `POST /api/reports` - Create waste report
- `GET /api/reports/user` - Get user's reports
- `GET /api/reports/pending` - Get pending reports (Admin)
- `PATCH /api/reports/:id/verify` - Verify report (Admin)
- `GET /api/reports/nearby` - Get nearby reports

### Rewards Endpoints
- `GET /api/rewards` - Get rewards catalog
- `POST /api/rewards/redeem` - Redeem reward
- `GET /api/rewards/leaderboard` - Get leaderboard

### Analytics Endpoints (Admin)
- `GET /api/analytics/daily` - Daily statistics
- `GET /api/analytics/waste-types` - Waste type distribution
- `GET /api/analytics/heatmap` - Activity heatmap

### Challenges & Badges
- `GET /api/challenges/active` - Active challenges
- `GET /api/challenges/user-progress` - User progress
- `POST /api/challenges/complete` - Complete challenge
- `GET /api/badges` - All badges
- `GET /api/badges/my-badges` - User's earned badges

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
The project maintains >60% code coverage across all modules.

## 🔄 CI/CD Pipeline

GitHub Actions workflow includes:
- Lint checking
- Unit tests
- Build verification
- Automatic deployment (configurable)

## 🎨 UI/UX Design

### Design Principles
- **Color Theme**: Green (#16a34a) - represents eco-friendliness
- **Card Layout**: Rounded corners (12px radius) with soft shadows
- **Responsive**: Mobile-first design with breakpoints at 640px, 768px, 1024px
- **Typography**: Clean sans-serif with proper hierarchy

### Key Components
- **Dashboard Layout**: Sidebar navigation with collapsible menu
- **Stats Cards**: Visual representation of key metrics
- **Interactive Maps**: Leaflet.js with custom markers
- **Charts**: Recharts for data visualization

## 🔒 Security

### Implemented Security Measures
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt (salt rounds: 10)
- Input validation and sanitization
- Role-based access control (RBAC)
- CORS configuration
- Rate limiting (configurable)
- Secure image upload with Cloudinary

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

### Docker Deployment (Optional)
```bash
docker-compose up -d
```

## 📈 Performance

### Optimizations
- MongoDB indexing on frequently queried fields
- Image compression before upload
- Lazy loading of map components
- React code splitting
- Socket.io connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint rules
- Write tests for new features
- Update documentation
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Leaflet.js for map functionality
- Recharts for data visualization
- Tailwind CSS for styling
- MongoDB for database
- Express.js team for the framework

## 📞 Support

For support, email support@clean-in.com or join our Slack channel.

## 🔗 Links

- [Live Demo](https://clean-in-demo.com)
- [API Documentation](https://clean-in-demo.com/api/docs)
- [Postman Collection](./docs/CleanIn-API-Collection.json)

---

Built with ❤️ for cleaner cities 🌱
