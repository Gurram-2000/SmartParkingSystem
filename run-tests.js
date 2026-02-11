#!/usr/bin/env node
/**
 * Smart Parking System - Test Runner
 * Complete test runner with database setup and cleanup
 */

require('dotenv').config();
const { spawn } = require('child_process');
const pool = require('./src/database/connection');
const logger = require('./src/utils/logger');

const setupTestDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('\n🗄️  Setting up test database...\n');

    // Drop existing tables (for fresh test runs)
    await client.query('DROP TABLE IF EXISTS parking_transactions CASCADE;');
    await client.query('DROP TABLE IF EXISTS parking_spots CASCADE;');
    await client.query('DROP TABLE IF EXISTS vehicles CASCADE;');
    await client.query('DROP TYPE IF EXISTS vehicle_type CASCADE;');
    await client.query('DROP TYPE IF EXISTS parking_status CASCADE;');
    await client.query('DROP TYPE IF EXISTS transaction_status CASCADE;');

    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_type AS ENUM ('motorcycle', 'car', 'bus');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE parking_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE transaction_status AS ENUM ('active', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type vehicle_type NOT NULL,
        owner_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create parking_spots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parking_spots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        floor INTEGER NOT NULL,
        level VARCHAR(10) NOT NULL,
        spot_number VARCHAR(50) NOT NULL,
        vehicle_type vehicle_type NOT NULL,
        is_occupied BOOLEAN DEFAULT FALSE,
        current_vehicle_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(floor, level, spot_number),
        FOREIGN KEY (current_vehicle_id) REFERENCES vehicles(id)
      );
    `);

    // Create parking_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parking_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL,
        spot_id UUID,
        entry_time TIMESTAMP NOT NULL,
        exit_time TIMESTAMP,
        parking_fee DECIMAL(10, 2),
        status transaction_status DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_license_plate ON vehicles(license_plate);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parking_spot_occupied ON parking_spots(is_occupied);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parking_spot_vehicle_type ON parking_spots(vehicle_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parking_spot_floor ON parking_spots(floor);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transaction_vehicle_id ON parking_transactions(vehicle_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transaction_status ON parking_transactions(status);`);

    // Seed parking spots
    const spotsCount = await client.query(`SELECT COUNT(*) as count FROM parking_spots;`);

    if (spotsCount.rows[0].count === 0) {
      console.log('  🌱 Seeding parking spots...');
      const floors = 5;
      const spotsPerFloor = 20;
      const levels = ['A', 'B', 'C', 'D'];
      const vehicleTypes = ['motorcycle', 'car', 'bus'];

      for (let floor = 1; floor <= floors; floor++) {
        for (let spot = 1; spot <= spotsPerFloor; spot++) {
          const level = levels[(spot - 1) % levels.length];
          const spotNum = Math.ceil(spot / levels.length);
          const vehicleType = vehicleTypes[(spot - 1) % vehicleTypes.length];
          const spotNumber = `${level}-${String(spotNum).padStart(2, '0')}`;

          await client.query(`
            INSERT INTO parking_spots (floor, level, spot_number, vehicle_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (floor, level, spot_number) DO NOTHING;
          `, [floor, level, spotNumber, vehicleType]);
        }
      }
    }

    console.log('✅ Database setup complete!\n');

  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const runTests = () => {
  return new Promise((resolve, reject) => {
    const jest = spawn('npm', ['test', '--', '--detectOpenHandles'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    jest.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Jest exited with code ${code}`));
      } else {
        resolve();
      }
    });

    jest.on('error', (error) => {
      reject(error);
    });
  });
};

const cleanupDatabase = async () => {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const main = async () => {
  try {
    // Setup database
    await setupTestDatabase();

    // Run tests
    console.log('🧪 Running tests...\n');
    await runTests();

    console.log('\n✅ All tests completed!');
    await cleanupDatabase();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test run failed:', error.message);
    await cleanupDatabase();
    process.exit(1);
  }
};

main();
