# Clean-In Testing Checklist

## Manual Testing Checklist

### Authentication
- [ ] User registration with valid data
- [ ] User registration with duplicate email (should fail)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials (should fail)
- [ ] Admin registration with valid access code
- [ ] Admin registration with invalid access code (should fail)
- [ ] Token expiration handling
- [ ] Logout functionality

### Waste Reporting
- [ ] Submit report with image upload
- [ ] Submit report without image
- [ ] Submit report with geolocation
- [ ] View user's own reports
- [ ] Report validation (required fields)

### Admin Dashboard
- [ ] View pending reports
- [ ] View verified reports
- [ ] Approve a report (triggers notification)
- [ ] Reject a report
- [ ] Zone statistics display
- [ ] Real-time report notifications

### Route Optimization
- [ ] Generate optimized route with zone filter
- [ ] Generate optimized route for all zones
- [ ] View route on map with numbered markers
- [ ] View route summary (distance, time, stops)
- [ ] Stop sequence display

### Analytics Dashboard
- [ ] View daily reports trend chart
- [ ] View waste type distribution
- [ ] View status distribution pie chart
- [ ] View participation trends
- [ ] Zone-wise statistics table
- [ ] Date range filtering
- [ ] CSV export functionality

### Rewards System
- [ ] View available rewards
- [ ] Redeem reward with sufficient points
- [ ] Attempt redeem with insufficient points (should fail)
- [ ] View redemption history
- [ ] Points update after redemption
- [ ] Real-time points notification

### Leaderboard
- [ ] View top 10 users by points
- [ ] Monthly ranking display
- [ ] Medal icons for top 3

### Real-time Features
- [ ] User receives notification when report is verified
- [ ] Admin receives notification when new report is submitted
- [ ] Socket connection on login
- [ ] Socket disconnection on logout

## Automated Testing

### Unit Tests
```bash
npm run test:unit
```
- [ ] Distance calculation (Haversine formula)
- [ ] Route optimization algorithm
- [ ] Efficiency calculation
- [ ] Date formatting utilities

### Integration Tests
```bash
npm run test:integration
```
- [ ] Authentication API
- [ ] Waste Report API
- [ ] Analytics API

### Full Test Suite with Coverage
```bash
npm test
```

## API Endpoints Testing

### Auth Routes
- POST /api/auth/register
- POST /api/auth/login

### Report Routes
- POST /api/reports
- GET /api/reports/user/:userId
- GET /api/reports/pending (admin)
- GET /api/reports/verified (admin)
- PATCH /api/reports/:id/verify (admin)
- GET /api/reports/zones (admin)
- POST /api/reports/optimize (admin)

### Analytics Routes
- GET /api/reports/analytics/daily (admin)
- GET /api/reports/analytics/waste-type (admin)
- GET /api/reports/analytics/efficiency (admin)
- GET /api/reports/analytics/participation (admin)

### Reward Routes
- GET /api/rewards
- POST /api/rewards/redeem
- GET /api/rewards/me
- GET /api/rewards/leaderboard

## Environment Setup for Testing

1. Ensure MongoDB is running
2. Create test database (optional)
3. Set environment variables in `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/cleanin_test
   JWT_SECRET=test_secret_key
   ADMIN_ACCESS_CODE=ADMIN123
   ```

## Test Coverage Goals

- Controllers: >80%
- Middleware: >70%
- Utilities: >90%
- Overall: >75%

## CI/CD Integration

Test commands for CI pipeline:
```bash
npm install
npm run lint
npm test
```

Exit codes:
- 0: All tests passed
- 1: Tests failed or coverage threshold not met
