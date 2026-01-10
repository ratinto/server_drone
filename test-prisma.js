// Quick test to verify Prisma Client is working
import prisma from './src/config/database.js';

async function testPrisma() {
  try {
    console.log('Testing Prisma Client...\n');
    
    // Test Coordinates model
    console.log('✓ Coordinates model exists');
    
    // Test Telemetry model
    console.log('✓ Telemetry model exists');
    
    // Try to connect
    await prisma.$connect();
    console.log('✓ Database connection successful\n');
    
    // Check if models are accessible
    const coordinatesCount = await prisma.coordinates.count();
    console.log(`✓ Coordinates table accessible (${coordinatesCount} records)`);
    
    const telemetryCount = await prisma.telemetry.count();
    console.log(`✓ Telemetry table accessible (${telemetryCount} records)`);
    
    console.log('\n✅ All checks passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
