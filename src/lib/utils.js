const db = require('./db');

// List of famous authors and books for generating session codes
const famousAuthorsAndBooks = [
  'Cervantes', 'Quijote', 'Borges', 'Cortazar', 'CienAnos', 'Rulfo', 'Lorca',
  'Benedetti', 'Neruda', 'Mistral', 'Paz', 'Sabato', 'Bolaño', 'Allende',
  'GarciaMarquez', 'Darío', 'Fuentes', 'Vargas', 'Machado', 'Galeano',
  'Asturias', 'Quiroga', 'Bombal', 'Donoso', 'Edwards', 'Parra', 'Alegria',
  'Carpentier', 'Vallejo', 'Onetti', 'Guiraldes', 'Huidobro', 'Hernandez',
  'Castellanos', 'Poniatowska', 'Puig', 'Aridjis', 'Bioy', 'Belli'
];

/**
 * Generate a random session code
 * @returns {Promise<string>} - Generated code
 */
async function generateSessionCode() {
  // Try up to 10 times to generate a unique code
  for (let attempt = 0; attempt < 10; attempt++) {
    const index = Math.floor(Math.random() * famousAuthorsAndBooks.length);
    const code = famousAuthorsAndBooks[index];
    
    // Add random number for more uniqueness
    const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const fullCode = `${code}${randomDigits}`;
    
    // Check if code already exists
    const existing = await db.get('SELECT 1 FROM sessions WHERE code = ?', [fullCode]);
    if (!existing) {
      return fullCode;
    }
  }
  
  // If all attempts failed, use UUID-based approach
  const randomBytes = require('crypto').randomBytes(3);
  return randomBytes.toString('hex').toUpperCase();
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncate a text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} html - HTML to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(html) {
  if (!html) return '';
  
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  generateSessionCode,
  formatDate,
  truncate,
  escapeHtml
}; 