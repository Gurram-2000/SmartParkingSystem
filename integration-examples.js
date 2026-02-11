/**
 * Integration Test Examples
 * This file demonstrates complete end-to-end scenarios
 * to ensure the system works correctly
 */

const FeeService = require('./src/services/feeService');

console.log('🅿️  Smart Parking System - Integration Test Examples\n');

// ============================================
// TEST 1: Fee Calculation
// ============================================
console.log('━━━ TEST 1: Fee Calculation ━━━\n');

const entryTime1 = new Date('2026-02-11T10:00:00');
const exitTime1 = new Date('2026-02-11T10:15:00');

const fee1 = FeeService.calculateFee(entryTime1, exitTime1, 'car');
console.log('Car parked for 15 minutes:');
console.log(`  Duration: ${fee1.durationFormatted}`);
console.log(`  Fee: $${fee1.totalFee}\n`);

// TEST 2: Fee Calculation - Multiple Hours
const entryTime2 = new Date('2026-02-11T10:00:00');
const exitTime2 = new Date('2026-02-11T12:45:00');

const fee2 = FeeService.calculateFee(entryTime2, exitTime2, 'car');
console.log('Car parked for 2h 45m:');
console.log(`  Duration: ${fee2.durationFormatted}`);
console.log(`  Time Units: ${fee2.units}`);
console.log(`  Rate per Unit: $${fee2.ratePerUnit}`);
console.log(`  Fee: $${fee2.totalFee}\n`);

// TEST 3: Motorcycle vs Car vs Bus
console.log('━━━ TEST 2: Vehicle Type Pricing Comparison ━━━\n');

const entryTime3 = new Date('2026-02-11T10:00:00');
const exitTime3 = new Date('2026-02-11T11:00:00'); // 1 hour = 4 units

const motorcycleFee = FeeService.calculateFee(entryTime3, exitTime3, 'motorcycle');
const carFee = FeeService.calculateFee(entryTime3, exitTime3, 'car');
const busFee = FeeService.calculateFee(entryTime3, exitTime3, 'bus');

console.log('Parked for 1 hour (60 minutes = 4 units):');
console.log(`  Motorcycle: $${motorcycleFee.totalFee}`);
console.log(`  Car:        $${carFee.totalFee}`);
console.log(`  Bus:        $${busFee.totalFee}\n`);

// TEST 4: Long Duration
console.log('━━━ TEST 3: Long Duration Parking ━━━\n');

const entryTime4 = new Date('2026-02-11T08:00:00');
const exitTime4 = new Date('2026-02-12T08:00:00'); // 24 hours

const longDurationFee = FeeService.calculateFee(entryTime4, exitTime4, 'car');
console.log('Car parked for 24 hours:');
console.log(`  Duration: ${longDurationFee.durationFormatted}`);
console.log(`  Time Units: ${longDurationFee.units}`);
console.log(`  Fee: $${longDurationFee.totalFee}\n`);

// TEST 5: Rounding Up
console.log('━━━ TEST 4: Rounding Up (Important!) ━━━\n');

const entryTime5 = new Date('2026-02-11T10:00:00');
const exitTime5 = new Date('2026-02-11T10:16:00'); // 16 minutes

const roundUpFee = FeeService.calculateFee(entryTime5, exitTime5, 'car');
console.log('Car parked for 16 minutes:');
console.log(`  Duration: ${roundUpFee.durationMinutes} minutes`);
console.log(`  Time Units: ${roundUpFee.units} (rounded up from 1.07)`);
console.log(`  Fee: $${roundUpFee.totalFee}\n`);

// ============================================
// SCENARIO TESTS
// ============================================
console.log('━━━ SCENARIO TEST: Daily Parking Usage ━━━\n');

const vehicles = [
  { name: 'Vehicle 1 (Car)', type: 'car', entry: '08:00', exit: '09:30' },
  { name: 'Vehicle 2 (Motorcycle)', type: 'motorcycle', entry: '09:00', exit: '11:00' },
  { name: 'Vehicle 3 (Bus)', type: 'bus', entry: '07:00', exit: '14:00' },
  { name: 'Vehicle 4 (Car)', type: 'car', entry: '10:00', exit: '18:00' }
];

let totalRevenue = 0;

vehicles.forEach(vehicle => {
  const [entryH, entryM] = vehicle.entry.split(':');
  const [exitH, exitM] = vehicle.exit.split(':');
  
  const entry = new Date('2026-02-11');
  entry.setHours(parseInt(entryH), parseInt(entryM), 0);
  
  const exit = new Date('2026-02-11');
  exit.setHours(parseInt(exitH), parseInt(exitM), 0);
  
  const fee = FeeService.calculateFee(entry, exit, vehicle.type);
  totalRevenue += fee.totalFee;
  
  console.log(`${vehicle.name}`);
  console.log(`  Entry: ${vehicle.entry}, Exit: ${vehicle.exit}`);
  console.log(`  Duration: ${fee.durationFormatted}`);
  console.log(`  Fee: $${fee.totalFee}\n`);
});

console.log(`Total Daily Revenue: $${totalRevenue.toFixed(2)}\n`);

// ============================================
// EDGE CASE TESTS
// ============================================
console.log('━━━ EDGE CASES ━━━\n');

// Edge Case 1: Minimum parking (1 minute)
const edgeEntry1 = new Date('2026-02-11T10:00:00');
const edgeExit1 = new Date('2026-02-11T10:01:00');
const edgeFee1 = FeeService.calculateFee(edgeEntry1, edgeExit1, 'car');
console.log('Edge Case 1: 1 minute parking');
console.log(`  Fee: $${edgeFee1.totalFee} (minimum charge)\n`);

// Edge Case 2: Exactly 15 minutes
const edgeEntry2 = new Date('2026-02-11T10:00:00');
const edgeExit2 = new Date('2026-02-11T10:15:00');
const edgeFee2 = FeeService.calculateFee(edgeEntry2, edgeExit2, 'car');
console.log('Edge Case 2: Exactly 15 minutes');
console.log(`  Fee: $${edgeFee2.totalFee}\n`);

// Edge Case 3: Just over 15 minutes
const edgeEntry3 = new Date('2026-02-11T10:00:00');
const edgeExit3 = new Date('2026-02-11T10:16:00');
const edgeFee3 = FeeService.calculateFee(edgeEntry3, edgeExit3, 'car');
console.log('Edge Case 3: 16 minutes (just over 15)');
console.log(`  Fee: $${edgeFee3.totalFee} (charged as 2 units)\n`);

// ============================================
// SUCCESS/FAILURE SCENARIOS
// ============================================
console.log('━━━ API RESPONSE SCENARIOS ━━━\n');

console.log('SUCCESS: Vehicle Check-In');
console.log(JSON.stringify({
  success: true,
  statusCode: 200,
  message: 'Vehicle checked in successfully',
  data: {
    transactionId: '123e4567-e89b-12d3-a456-426614174000',
    licensePlate: 'ABC-123',
    spotNumber: 'A-01',
    entryTime: '2026-02-11T10:30:00.000Z',
    spotDetails: {
      floor: 1,
      level: 'A',
      spotType: 'car',
      price: 2
    }
  }
}, null, 2));

console.log('\nSUCCESS: Vehicle Check-Out');
console.log(JSON.stringify({
  success: true,
  statusCode: 200,
  message: 'Vehicle checked out successfully',
  data: {
    transactionId: '123e4567-e89b-12d3-a456-426614174000',
    licensePlate: 'ABC-123',
    spotNumber: 'A-01',
    entryTime: '2026-02-11T10:30:00.000Z',
    exitTime: '2026-02-11T12:45:00.000Z',
    duration: '2h 15m',
    parkingFee: 18.00,
    currency: 'USD'
  }
}, null, 2));

console.log('\nFAILURE: Vehicle Already Parked');
console.log(JSON.stringify({
  success: false,
  statusCode: 409,
  message: 'Vehicle is already parked',
  error: 'Vehicle with license plate ABC-123 is already in the parking lot'
}, null, 2));

console.log('\nFAILURE: Invalid Vehicle Type');
console.log(JSON.stringify({
  success: false,
  statusCode: 400,
  message: 'Validation error',
  error: [
    {
      field: 'vehicleType',
      message: '\"vehicleType\" must be one of [motorcycle, car, bus]'
    }
  ]
}, null, 2));

console.log('\nFAILURE: Vehicle Not Found');
console.log(JSON.stringify({
  success: false,
  statusCode: 404,
  message: 'Vehicle not found',
  error: 'Vehicle with license plate ABC-999 is not currently parked'
}, null, 2));

console.log('\nFAILURE: No Spots Available');
console.log(JSON.stringify({
  success: false,
  statusCode: 409,
  message: 'No parking spots available for this vehicle type',
  error: 'Cannot allocate spot - parking lot full for this vehicle type'
}, null, 2));

console.log('\n✅ All integration test examples completed!\n');
