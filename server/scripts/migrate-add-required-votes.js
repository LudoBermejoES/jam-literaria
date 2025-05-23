import { getDatabase } from '../models/db.js';

/**
 * Migration script to add required_votes column to session_metadata table
 */
function migrateAddRequiredVotes() {
  console.log('Starting migration: Add required_votes column to session_metadata');
  
  try {
    const db = getDatabase();
    console.log('Database connection established');
    
    // Check if the column already exists
    const tableInfo = db.prepare(`PRAGMA table_info(session_metadata)`).all();
    console.log('Table info retrieved:', tableInfo.map(col => col.name));
    
    const hasRequiredVotes = tableInfo.some(column => column.name === 'required_votes');
    
    if (hasRequiredVotes) {
      console.log('Column required_votes already exists, skipping migration');
      return;
    }
    
    console.log('Adding required_votes column...');
    
    // Add the required_votes column
    db.prepare(`
      ALTER TABLE session_metadata 
      ADD COLUMN required_votes INTEGER
    `).run();
    
    console.log('Successfully added required_votes column to session_metadata');
    
    // Verify the column was added
    const updatedTableInfo = db.prepare(`PRAGMA table_info(session_metadata)`).all();
    console.log('Updated table info:', updatedTableInfo.map(col => col.name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Always run the migration when this script is executed
console.log('Migration script starting...');
migrateAddRequiredVotes();
console.log('Migration script completed.'); 