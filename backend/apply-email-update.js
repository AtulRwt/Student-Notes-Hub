/**
 * Script to update feedback email address
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating feedback email addresses...');
  
  try {
    // Set default for new records via Prisma's schema
    console.log('Schema has been updated to use studentnoteshub@gmail.com as default');
    
    // Update existing records
    const result = await prisma.$executeRaw`
      UPDATE "Feedback" 
      SET "emailTo" = 'studentnoteshub@gmail.com' 
      WHERE "emailTo" = 'atulrajput5968@gmail.com'
    `;
    
    console.log(`Updated ${result} feedback records to use the new email address`);
    console.log('Email update completed successfully!');
  } catch (error) {
    console.error('Error updating email addresses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 