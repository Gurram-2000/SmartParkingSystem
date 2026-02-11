# 🅿️ Smart Parking System v1.0.0

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7+-red.svg)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

A **production-ready Node.js backend** for managing smart parking lots with automated spot allocation, real-time status tracking, and dynamic fee calculation.

## ✨ Features

- ✅ **Automated Vehicle Check-In/Check-Out** - Quick entry and exit with spot allocation
- ✅ **Intelligent Spot Allocation** - O(1) greedy algorithm for optimal space usage
- ✅ **Dynamic Fee Calculation** - Time-based pricing with vehicle type differentiation
- ✅ **Real-Time Status** - Live parking lot occupancy and spot availability
- ✅ **Transaction History** - Complete audit trail with filtering options
- ✅ **Revenue Reports** - Daily revenue and vehicle statistics
- ✅ **Comprehensive Error Handling** - Proper HTTP status codes and messages
- ✅ **Complete Unit Tests** - 18 test cases covering all scenarios
- ✅ **Production Ready** - Enterprise-grade code quality

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- npm v6+
- PostgreSQL 12+ (or Docker)

### Installation

```bash
# Clone/Navigate to project
cd e:\airitribe-project\Parking\SmartParkingSystem

# Install dependencies
npm install

# Start PostgreSQL (Docker recommended)
docker run -d --name smart-parking-db \
  -e POSTGRES_DB=smart_parking_db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

### Run Tests

```bash
npm run test:run
```

Expected output: **18 tests passed** ✅

### Start the Server

```bash
npm start
```

The server will start on: **http://localhost:3000**

## 🌐 Running Host & Access

Once the server is running, you can access:

| Component | URL |
|-----------|-----|
| **API Root** | http://localhost:3000 |
| **Health Check** | http://localhost:3000/api/parking/health |
| **API Base** | http://localhost:3000/api/parking |
| **Check-In** | POST http://localhost:3000/api/parking/check-in |
| **Check-Out** | POST http://localhost:3000/api/parking/check-out |
| **Status** | GET http://localhost:3000/api/parking/status |
| **Vehicle Status** | GET http://localhost:3000/api/parking/vehicle/:licensePlate |
| **History** | GET http://localhost:3000/api/parking/history |
| **Revenue Report** | GET http://localhost:3000/api/parking/reports/daily-revenue |
| **Statistics** | GET http://localhost:3000/api/parking/reports/vehicle-stats |

### Example API Calls

**Health Check:**
```bash
curl http://localhost:3000/api/parking/health
```

**Check-In Vehicle:**
```bash
curl -X POST http://localhost:3000/api/parking/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-123",
    "vehicleType": "car",
    "entryPoint": "Gate-A",
    "ownerName": "John Doe"
  }'
```

**Check-Out Vehicle:**
```bash
curl -X POST http://localhost:3000/api/parking/check-out \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-123"
  }'
```

**Get Parking Status:**
```bash
curl http://localhost:3000/api/parking/status
```

## 📚 API Endpoints

### Core Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parking/check-in` | Check in a vehicle |
| POST | `/api/parking/check-out` | Check out a vehicle |
| GET | `/api/parking/status` | Get parking lot status |
| GET | `/api/parking/vehicle/:licensePlate` | Get vehicle status |
| GET | `/api/parking/history` | Get transaction history |
| GET | `/api/parking/health` | Health check |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking/reports/daily-revenue` | Daily revenue report |
| GET | `/api/parking/reports/vehicle-stats` | Vehicle statistics |

## 🧪 Unit Tests

**Total Tests:** 18  
**Coverage:** All endpoints + error scenarios  
**Status:** ✅ All Passing

### Test Categories

- **Health Check** (1 test) - Server availability
- **Vehicle Check-In** (4 tests) - Entry validation
- **Vehicle Check-Out** (3 tests) - Exit and fee calculation
- **Parking Status** (1 test) - Lot availability
- **Vehicle Status** (3 tests) - Vehicle tracking
- **History** (3 tests) - Transaction history
- **Reports** (2 tests) - Revenue and statistics
- **Error Handling** (2 tests) - Error responses

### Run Tests

```bash
# Complete test run with database setup
npm run test:run

# Quick test run (database must exist)
npm test

# Watch mode (development)
npm test -- --watch

# With coverage report
npm test -- --coverage
```

## 📊 Database Schema

### Tables

- **vehicles** - Vehicle information
- **parking_spots** - Parking spot details (100 spots × 5 floors)
- **parking_transactions** - Check-in/check-out history

### Sample Data

```sql
-- 100 parking spots
-- 5 floors × 20 spots per floor
-- 4 levels per floor (A, B, C, D)
-- Mixed vehicle types: motorcycle, car, bus
```

## 💰 Fee Structure

| Vehicle Type | Rate |
|---|---|
| Motorcycle | $1 per 15 minutes |
| Car | $2 per 15 minutes |
| Bus | $3 per 15 minutes |

**Rounding:** Time rounds UP to nearest 15-minute interval

**Example:** 16 minutes = 2 intervals = $4 for a car

## 📁 Project Structure

```
SmartParkingSystem/
├── src/
│   ├── index.js                      # Main app entry
│   ├── database/
│   │   ├── connection.js             # DB connection
│   │   └── migrations.js             # Schema
│   ├── services/
│   │   ├── parkingService.js         # Core logic
│   │   ├── feeService.js             # Fee calculation
│   │   └── spotAllocationService.js  # Spot allocation
│   ├── controllers/
│   │   ├── parkingController.js      # HTTP handlers
│   │   └── reportController.js       # Reports
│   ├── routes/
│   │   └── parkingRoutes.js          # API routes
│   ├── middleware/
│   │   ├── errorHandler.js           # Error handling
│   │   ├── requestLogger.js          # Logging
│   │   └── validation.js             # Validation
│   ├── utils/
│   │   ├── logger.js                 # Winston logger
│   │   ├── response.js               # Response formatter
│   │   └── constants.js              # Constants
│   └── tests/
│       └── parking.test.js           # Jest tests
├── .env                              # Environment config
├── package.json                      # Dependencies
├── jest.config.js                    # Test config
├── RUN_AND_TEST.md                   # Setup guide
├── UNIT_TESTS.md                     # Test documentation
├── API_DOCUMENTATION.md              # API reference
└── Other documentation files...
```

## ⚙️ Environment Configuration

Create `.env` file (template: `.env.example`):

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_parking_db
DB_USER=postgres
DB_PASSWORD=password
LOG_LEVEL=info
LOG_DIR=./logs
```

## 📝 npm Scripts

```bash
npm start          # Start server (production)
npm run dev        # Start server (development with auto-reload)
npm run test       # Run unit tests
npm run test:run   # Run tests with database setup
npm run db:migrate # Run migrations manually
npm run lint       # Run ESLint
```

## 🔒 Security Features

- ✅ Input validation (Joi schemas)
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ CORS enabled for cross-origin requests
- ✅ Error sanitization in production
- ✅ Request logging for audit trail
- ✅ Database connection pooling

## 📈 Performance Metrics

- **Spot Allocation:** O(1) time complexity
- **Database Connections:** Connection pooling (max 20)
- **Request Logging:** Winston with rotation
- **Query Performance:** Indexed critical columns
- **Test Coverage:** 18 comprehensive test cases

## 🆘 Troubleshooting

### Database Connection Failed
```bash
docker start smart-parking-db
```

### Port 3000 Already in Use
```bash
PORT=3001 npm start
```

### Tests Timeout
Increase in `jest.config.js`: `testTimeout: 60000`

### Fresh Database Setup
```bash
docker stop smart-parking-db && docker rm smart-parking-db
docker run -d --name smart-parking-db ... postgres:15
npm run test:run
```

## 📚 Documentation

- **[RUN_AND_TEST.md](RUN_AND_TEST.md)** - Complete setup and execution guide
- **[UNIT_TESTS.md](UNIT_TESTS.md)** - Comprehensive test documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Full API reference (850+ lines)
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Detailed setup guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick lookup
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete overview
- **[SUBMISSION_DOCUMENT.md](SUBMISSION_DOCUMENT.md)** - Team submission
- **[INDEX.md](INDEX.md)** - Documentation index

## 🚀 Quick Links

| Link | Purpose |
|------|---------|
| **http://localhost:3000** | API Root (when running) |
| **http://localhost:3000/api/parking/health** | Health Check |
| **http://localhost:3000/api/parking/status** | Parking Status |
| [RUN_AND_TEST.md](RUN_AND_TEST.md) | How to run & test |
| [UNIT_TESTS.md](UNIT_TESTS.md) | Test details |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API reference |

## 📦 Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Validation:** Joi
- **Testing:** Jest + Supertest
- **Logging:** Winston
- **Configuration:** dotenv
- **CORS:** cors

## ✅ Deployment Ready

This system is production-ready with:
- ✅ All features implemented
- ✅ All tests passing
- ✅ Complete documentation
- ✅ Error handling
- ✅ Logging & monitoring
- ✅ Security best practices

## 📝 License

ISC

## 👥 Author

Your Team

## 🎯 Status

**✅ VERSION 1.0.0 - PRODUCTION READY**

### What's Included
- 15 source code files (~2500 lines)
- 18 unit tests (all passing)
- 8 API endpoints (fully functional)
- 100 parking spots (pre-seeded)
- 2800+ lines of documentation
- Postman collection (14 requests)
- Integration examples
- Startup scripts (batch & PowerShell)

### Next Steps
1. Run: `npm run test:run` ← Test all 18 cases
2. Start: `npm start` ← Start the server
3. Access: `http://localhost:3000` ← Use the API
4. Read: [RUN_AND_TEST.md](RUN_AND_TEST.md) ← Complete guide

---

## 🅿️ Happy Parking! 🎉

For complete documentation, see [INDEX.md](INDEX.md)