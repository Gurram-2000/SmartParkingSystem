#!/usr/bin/env node

/**
 * Quick Start Testing Script
 * Tests all main API endpoints with sample data
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/parking';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            body: parsed
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  log(colors.cyan, '\n🅿️  Smart Parking System - API Test Suite\n');

  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const res = await makeRequest('GET', '/health');
        return res.status === 200 && res.body.success;
      }
    },
    {
      name: 'Check Parking Status',
      test: async () => {
        const res = await makeRequest('GET', '/status');
        return res.status === 200 && res.body.success && res.body.data.totalSpots;
      }
    },
    {
      name: 'Check-In Vehicle (Car)',
      test: async () => {
        const res = await makeRequest('POST', '/check-in', {
          licensePlate: 'TEST-001',
          vehicleType: 'car',
          entryPoint: 'Gate-A',
          ownerName: 'Test User'
        });
        return res.status === 200 && res.body.success && res.body.data.spotNumber;
      }
    },
    {
      name: 'Check-In Vehicle (Motorcycle)',
      test: async () => {
        const res = await makeRequest('POST', '/check-in', {
          licensePlate: 'TEST-002',
          vehicleType: 'motorcycle',
          entryPoint: 'Gate-B'
        });
        return res.status === 200 && res.body.success;
      }
    },
    {
      name: 'Check-In Vehicle (Bus)',
      test: async () => {
        const res = await makeRequest('POST', '/check-in', {
          licensePlate: 'TEST-003',
          vehicleType: 'bus',
          entryPoint: 'Gate-C'
        });
        return res.status === 200 && res.body.success;
      }
    },
    {
      name: 'Get Vehicle Status (Parked)',
      test: async () => {
        const res = await makeRequest('GET', '/vehicle/TEST-001');
        return res.status === 200 && res.body.success && res.body.data.parked === true;
      }
    },
    {
      name: 'Check-Out Vehicle',
      test: async () => {
        const res = await makeRequest('POST', '/check-out', {
          licensePlate: 'TEST-001'
        });
        return res.status === 200 && res.body.success && res.body.data.parkingFee;
      }
    },
    {
      name: 'Get Vehicle Status (Not Parked)',
      test: async () => {
        const res = await makeRequest('GET', '/vehicle/TEST-001');
        return res.status === 200 && res.body.success && res.body.data.parked === false;
      }
    },
    {
      name: 'Parking History',
      test: async () => {
        const res = await makeRequest('GET', '/history');
        return res.status === 200 && res.body.success && Array.isArray(res.body.data);
      }
    },
    {
      name: 'Daily Revenue Report',
      test: async () => {
        const res = await makeRequest('GET', '/reports/daily-revenue');
        return res.status === 200 && res.body.success && res.body.data.totalRevenue >= 0;
      }
    },
    {
      name: 'Vehicle Statistics Report',
      test: async () => {
        const res = await makeRequest('GET', '/reports/vehicle-stats');
        return res.status === 200 && res.body.success && res.body.data.byType;
      }
    },
    {
      name: 'Error: Invalid Vehicle Type',
      test: async () => {
        const res = await makeRequest('POST', '/check-in', {
          licensePlate: 'ERR-001',
          vehicleType: 'invalid'
        });
        return res.status === 400 && res.body.success === false;
      }
    },
    {
      name: 'Error: Vehicle Not Found',
      test: async () => {
        const res = await makeRequest('POST', '/check-out', {
          licensePlate: 'NOTFOUND-999'
        });
        return res.status === 404 && res.body.success === false;
      }
    },
    {
      name: 'Error: Vehicle Already Parked',
      test: async () => {
        // First check-in
        await makeRequest('POST', '/check-in', {
          licensePlate: 'DUPE-001',
          vehicleType: 'car'
        });
        // Second check-in with same license
        const res = await makeRequest('POST', '/check-in', {
          licensePlate: 'DUPE-001',
          vehicleType: 'car'
        });
        return res.status === 409 && res.body.success === false;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        log(colors.green, `✓ ${test.name}`);
        passed++;
      } else {
        log(colors.red, `✗ ${test.name}`);
        failed++;
      }
    } catch (error) {
      log(colors.red, `✗ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  log(colors.cyan, `\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    log(colors.green, '✓ All tests passed! 🎉\n');
  } else {
    log(colors.red, `✗ ${failed} test(s) failed\n`);
  }
}

// Main execution
(async () => {
  try {
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    await runTests();
  } catch (error) {
    log(colors.red, `\n❌ Error running tests: ${error.message}\n`);
    log(colors.yellow, 'Make sure the server is running: npm start\n');
    process.exit(1);
  }
})();
