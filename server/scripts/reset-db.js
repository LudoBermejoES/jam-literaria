import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, '../../database/jam_literaria.db');
// Path to the schema file
const schemaPath = path.join(__dirname, '../../database/schema.sql');

console.log('Starting database reset process...');

// Delete the existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log(`Deleting existing database file: ${dbPath}`);
  fs.unlinkSync(dbPath);
  console.log('Database file deleted successfully.');
} else {
  console.log('No existing database file found.');
}

// Create a new database and initialize with schema
console.log('Creating new database...');
const db = new Database(dbPath);

// Read and execute the schema SQL
const schema = fs.readFileSync(schemaPath, 'utf8');
console.log('Applying database schema...');
db.exec(schema);

console.log('Database reset completed successfully!');
db.close();

console.log(`New database created at: ${dbPath}`);
console.log('You can now restart the server to use the fresh database.'); 