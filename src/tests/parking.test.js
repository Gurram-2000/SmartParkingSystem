const request = require('supertest');
const pool = require('../database/connection');

// Mock Express app for testing
let app;

describe('Smart Parking System API', () => {
  
  beforeAll(async () => {
    // Setup test database
    app = require('../index');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Health Check', () => {
    test('GET /api/parking/health should return OK status', async () => {
      const response = await request(app).get('/api/parking/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('OK');
    });
  });

  describe('Vehicle Check-In', () => {
    test('POST /api/parking/check-in should successfully check in a valid vehicle', async () => {
      const response = await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate: 'ABC-123',
          vehicleType: 'car',
          entryPoint: 'Gate-A',
          ownerName: 'John Doe'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vehicle checked in successfully');
      expect(response.body.data.licensePlate).toBe('ABC-123');
      expect(response.body.data.spotNumber).toBeDefined();
      expect(response.body.data.entryTime).toBeDefined();
    });

    test('POST /api/parking/check-in should fail with invalid vehicle type', async () => {
      const response = await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate: 'XYZ-789',
          vehicleType: 'airplane',
          entryPoint: 'Gate-A'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    test('POST /api/parking/check-in should fail with missing license plate', async () => {
      const response = await request(app)
        .post('/api/parking/check-in')
        .send({
          vehicleType: 'car',
          entryPoint: 'Gate-A'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/parking/check-in should fail when vehicle already parked', async () => {
      const licensePlate = 'DUP-123';
      
      // First check-in
      await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate,
          vehicleType: 'car',
          entryPoint: 'Gate-A'
        });

      // Second check-in with same license plate
      const response = await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate,
          vehicleType: 'car',
          entryPoint: 'Gate-B'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Vehicle Check-Out', () => {
    test('POST /api/parking/check-out should successfully check out a parked vehicle', async () => {
      const licensePlate = 'OUT-123';
      
      // First check-in
      await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate,
          vehicleType: 'car',
          entryPoint: 'Gate-A'
        });

      // Then check-out
      const response = await request(app)
        .post('/api/parking/check-out')
        .send({
          licensePlate
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vehicle checked out successfully');
      expect(response.body.data.licensePlate).toBe(licensePlate);
      expect(response.body.data.parkingFee).toBeDefined();
      expect(response.body.data.duration).toBeDefined();
      expect(response.body.data.exitTime).toBeDefined();
    });

    test('POST /api/parking/check-out should fail with non-existent vehicle', async () => {
      const response = await request(app)
        .post('/api/parking/check-out')
        .send({
          licensePlate: 'NOTFOUND-999'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/parking/check-out should fail with invalid license plate format', async () => {
      const response = await request(app)
        .post('/api/parking/check-out')
        .send({
          licensePlate: 'invalid@plate'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Parking Status', () => {
    test('GET /api/parking/status should return parking lot status', async () => {
      const response = await request(app).get('/api/parking/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpots).toBeDefined();
      expect(response.body.data.occupiedSpots).toBeDefined();
      expect(response.body.data.availableSpots).toBeDefined();
      expect(response.body.data.occupancyRate).toBeDefined();
      expect(response.body.data.spotsByType).toBeDefined();
      expect(response.body.data.spotsByType.motorcycle).toBeDefined();
      expect(response.body.data.spotsByType.car).toBeDefined();
      expect(response.body.data.spotsByType.bus).toBeDefined();
    });
  });

  describe('Vehicle Status', () => {
    test('GET /api/parking/vehicle/:licensePlate should return vehicle status if parked', async () => {
      const licensePlate = 'STATUS-123';
      
      // Check-in vehicle
      await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate,
          vehicleType: 'motorcycle',
          entryPoint: 'Gate-A'
        });

      const response = await request(app)
        .get(`/api/parking/vehicle/${licensePlate}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.licensePlate).toBe(licensePlate);
      expect(response.body.data.parked).toBe(true);
      expect(response.body.data.spotNumber).toBeDefined();
      expect(response.body.data.entryTime).toBeDefined();
      expect(response.body.data.estimatedFee).toBeDefined();
    });

    test('GET /api/parking/vehicle/:licensePlate should return parked=false if not parked', async () => {
      const licensePlate = 'NOTPARKED-123';
      
      // Check-in and then check-out
      await request(app)
        .post('/api/parking/check-in')
        .send({
          licensePlate,
          vehicleType: 'car',
          entryPoint: 'Gate-A'
        });

      await request(app)
        .post('/api/parking/check-out')
        .send({ licensePlate });

      const response = await request(app)
        .get(`/api/parking/vehicle/${licensePlate}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.parked).toBe(false);
    });

    test('GET /api/parking/vehicle/:licensePlate should return 404 for unknown vehicle', async () => {
      const response = await request(app)
        .get('/api/parking/vehicle/UNKNOWN-999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Parking History', () => {
    test('GET /api/parking/history should return parking history', async () => {
      const response = await request(app).get('/api/parking/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/parking/history?status=completed should filter by status', async () => {
      const response = await request(app)
        .get('/api/parking/history')
        .query({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/parking/history?vehicleType=car should filter by vehicle type', async () => {
      const response = await request(app)
        .get('/api/parking/history')
        .query({ vehicleType: 'car' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Reports', () => {
    test('GET /api/parking/reports/daily-revenue should return daily revenue report', async () => {
      const response = await request(app)
        .get('/api/parking/reports/daily-revenue');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTransactions).toBeDefined();
      expect(response.body.data.totalRevenue).toBeDefined();
      expect(response.body.data.averageFee).toBeDefined();
      expect(response.body.data.transactionsByVehicleType).toBeDefined();
    });

    test('GET /api/parking/reports/vehicle-stats should return vehicle statistics', async () => {
      const response = await request(app)
        .get('/api/parking/reports/vehicle-stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVehicles).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
      expect(response.body.data.byType.motorcycle).toBeDefined();
      expect(response.body.data.byType.car).toBeDefined();
      expect(response.body.data.byType.bus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('GET /invalid-endpoint should return 404', async () => {
      const response = await request(app).get('/api/parking/invalid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('POST with invalid JSON should return 400', async () => {
      const response = await request(app)
        .post('/api/parking/check-in')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
