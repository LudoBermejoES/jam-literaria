// Load dotenv at the top to ensure environment variables are available
import dotenv from 'dotenv';
dotenv.config();

// Import from the generated location instead of @prisma/client
import { PrismaClient } from '../generated/prisma';

// Log the database URL for debugging
console.log('Database URL from env:', process.env.DATABASE_URL);

// Declare global variable to avoid multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient with verbose logging
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// In development, save the instance to the global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma; 