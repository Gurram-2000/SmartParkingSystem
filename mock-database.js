/**
 * Mock Database Setup for Testing
 * Use this to simulate database without PostgreSQL installed
 */

const mockDatabase = {
  vehicles: [],
  parking_spots: [],
  parking_transactions: [],
  
  // Initialize with 100 parking spots
  initialize: function() {
    const floors = 5;
    const spotsPerFloor = 20;
    const levels = ['A', 'B', 'C', 'D'];
    const vehicleTypes = ['motorcycle', 'car', 'bus'];
    let spotId = 1;

    for (let floor = 1; floor <= floors; floor++) {
      for (let spot = 1; spot <= spotsPerFloor; spot++) {
        const level = levels[(spot - 1) % levels.length];
        const spotNum = Math.ceil(spot / levels.length);
        const vehicleType = vehicleTypes[(spot - 1) % vehicleTypes.length];
        const spotNumber = `${level}-${String(spotNum).padStart(2, '0')}`;

        this.parking_spots.push({
          id: `spot-${spotId++}`,
          floor,
          level,
          spot_number: spotNumber,
          vehicle_type: vehicleType,
          is_occupied: false,
          current_vehicle_id: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    console.log(`✅ Mock database initialized with ${this.parking_spots.length} parking spots`);
  },

  // Check-in vehicle
  checkIn: function(licensePlate, vehicleType, ownerName = null) {
    // Check if vehicle already exists
    const existingVehicle = this.vehicles.find(v => v.license_plate === licensePlate);
    if (existingVehicle) {
      throw new Error('Vehicle is already parked');
    }

    // Find available spot for vehicle type
    const availableSpot = this.parking_spots.find(
      s => s.vehicle_type === vehicleType && !s.is_occupied
    );
    if (!availableSpot) {
      throw new Error('No parking spots available for this vehicle type');
    }

    // Create vehicle
    const vehicle = {
      id: `vehicle-${Date.now()}`,
      license_plate: licensePlate,
      vehicle_type: vehicleType,
      owner_name: ownerName,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.vehicles.push(vehicle);

    // Occupy spot
    availableSpot.is_occupied = true;
    availableSpot.current_vehicle_id = vehicle.id;
    availableSpot.updated_at = new Date();

    // Create transaction
    const transaction = {
      id: `trans-${Date.now()}`,
      vehicle_id: vehicle.id,
      spot_id: availableSpot.id,
      entry_time: new Date(),
      exit_time: null,
      parking_fee: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    this.parking_transactions.push(transaction);

    return {
      transactionId: transaction.id,
      licensePlate: vehicle.license_plate,
      spotNumber: availableSpot.spot_number,
      entryTime: transaction.entry_time,
      spotDetails: {
        floor: availableSpot.floor,
        level: availableSpot.level,
        vehicleType: availableSpot.vehicle_type
      }
    };
  },

  // Check-out vehicle
  checkOut: function(licensePlate) {
    // Find vehicle
    const vehicle = this.vehicles.find(v => v.license_plate === licensePlate);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Find active transaction
    const transaction = this.parking_transactions.find(
      t => t.vehicle_id === vehicle.id && t.status === 'active'
    );
    if (!transaction) {
      throw new Error('No active parking transaction found');
    }

    // Find spot
    const spot = this.parking_spots.find(s => s.id === transaction.spot_id);

    // Calculate fee (in USD)
    const exitTime = new Date();
    const durationMinutes = Math.ceil((exitTime - transaction.entry_time) / (1000 * 60));
    const timeUnits = Math.ceil(durationMinutes / 15);
    const rates = { motorcycle: 1, car: 2, bus: 3 };
    const parkingFee = (timeUnits * rates[vehicle.vehicle_type]).toFixed(2);

    // Update transaction
    transaction.exit_time = exitTime;
    transaction.parking_fee = parseFloat(parkingFee);
    transaction.status = 'completed';
    transaction.updated_at = exitTime;

    // Free spot
    spot.is_occupied = false;
    spot.current_vehicle_id = null;
    spot.updated_at = exitTime;

    // Format duration
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      transactionId: transaction.id,
      licensePlate: vehicle.license_plate,
      spotNumber: spot.spot_number,
      parkingFee: parseFloat(parkingFee),
      duration,
      entryTime: transaction.entry_time,
      exitTime: exitTime
    };
  },

  // Get parking status
  getStatus: function() {
    const totalSpots = this.parking_spots.length;
    const occupiedSpots = this.parking_spots.filter(s => s.is_occupied).length;
    const availableSpots = totalSpots - occupiedSpots;

    const spotsByType = {
      motorcycle: {
        total: this.parking_spots.filter(s => s.vehicle_type === 'motorcycle').length,
        occupied: this.parking_spots.filter(s => s.vehicle_type === 'motorcycle' && s.is_occupied).length,
        available: this.parking_spots.filter(s => s.vehicle_type === 'motorcycle' && !s.is_occupied).length
      },
      car: {
        total: this.parking_spots.filter(s => s.vehicle_type === 'car').length,
        occupied: this.parking_spots.filter(s => s.vehicle_type === 'car' && s.is_occupied).length,
        available: this.parking_spots.filter(s => s.vehicle_type === 'car' && !s.is_occupied).length
      },
      bus: {
        total: this.parking_spots.filter(s => s.vehicle_type === 'bus').length,
        occupied: this.parking_spots.filter(s => s.vehicle_type === 'bus' && s.is_occupied).length,
        available: this.parking_spots.filter(s => s.vehicle_type === 'bus' && !s.is_occupied).length
      }
    };

    return {
      totalSpots,
      occupiedSpots,
      availableSpots,
      occupancyRate: Math.round((occupiedSpots / totalSpots) * 100),
      spotsByType
    };
  },

  // Get daily revenue
  getDailyRevenue: function() {
    const completedTransactions = this.parking_transactions.filter(t => t.status === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.parking_fee || 0), 0);
    const averageFee = completedTransactions.length > 0 ? totalRevenue / completedTransactions.length : 0;

    const byType = {
      motorcycle: {
        count: completedTransactions.filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'motorcycle').length,
        revenue: completedTransactions
          .filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'motorcycle')
          .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
      },
      car: {
        count: completedTransactions.filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'car').length,
        revenue: completedTransactions
          .filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'car')
          .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
      },
      bus: {
        count: completedTransactions.filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'bus').length,
        revenue: completedTransactions
          .filter(t => this.vehicles.find(v => v.id === t.vehicle_id)?.vehicle_type === 'bus')
          .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
      }
    };

    return {
      date: new Date().toISOString().split('T')[0],
      totalTransactions: completedTransactions.length,
      totalRevenue: totalRevenue.toFixed(2),
      averageFee: averageFee.toFixed(2),
      transactionsByVehicleType: byType
    };
  }
};

// Example usage
if (require.main === module) {
  mockDatabase.initialize();

  try {
    // Test check-in
    console.log('\n✅ Check-In Test:');
    const checkIn1 = mockDatabase.checkIn('ABC-001', 'car', 'John Doe');
    console.log(checkIn1);

    // Test parking status
    console.log('\n✅ Parking Status:');
    console.log(mockDatabase.getStatus());

    // Test check-out (wait 1 second first)
    setTimeout(() => {
      console.log('\n✅ Check-Out Test:');
      const checkOut1 = mockDatabase.checkOut('ABC-001');
      console.log(checkOut1);

      // Test revenue report
      console.log('\n✅ Revenue Report:');
      console.log(mockDatabase.getDailyRevenue());
    }, 1000);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

module.exports = mockDatabase;
