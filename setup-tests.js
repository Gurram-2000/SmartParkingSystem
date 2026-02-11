#!/usr/bin/env node
/**
 * Test Setup Script
 * Sets up database for testing
 */

require('dotenv').config();
const pool = require('./src/database/connection');
const logger = require('./src/utils/logger');

const setupTestDatabase = async () => {
  const client = await pool.connect();

  try {
    logger.info('Setting up test database...');

    // Drop existing tables (for fresh test runs)
    await client.query('DROP TABLE IF EXISTS parking_transactions CASCADE;');
    await client.query('DROP TABLE IF EXISTS parking_spots CASCADE;');
    await client.query('DROP TABLE IF EXISTS vehicles CASCADE;');
    await client.query('DROP TYPE IF EXISTS vehicle_type CASCADE;');
    await client.query('DROP TYPE IF EXISTS parking_status CASCADE;');
    await client.query('DROP TYPE IF EXISTS transaction_status CASCADE;');

    // Run migrations to create fresh tables
    const { runMigrations } = require('./src/database/migrations');
    await runMigrations();

    logger.info('Test database setup complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

setupTestDatabase();
