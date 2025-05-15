const crypto = require('crypto');

// Save the original randomBytes function to restore later
const originalRandomBytes = crypto.randomBytes;

describe('Generate Keys Script', () => {
  beforeEach(() => {
    // Mock the randomBytes function before each test
    const mockBuffer = Buffer.from('mock-generated-key-buffer');
    crypto.randomBytes = jest.fn(() => mockBuffer);
    
    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Clear modules cache to ensure clean require
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore the original randomBytes function
    crypto.randomBytes = originalRandomBytes;
    
    // Restore console.log
    jest.restoreAllMocks();
  });
  
  it('should generate a random secret key', () => {
    // Execute the script
    require('../../../../scripts/generate-keys');
    
    // Check that randomBytes was called with the correct size
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
  });
  
  it('should log the generated key in the correct format', () => {
    // Execute the script
    require('../../../../scripts/generate-keys');
    
    // Check that console.log was called with the correct values
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('=== JWT Secret Key para Producción ==='));
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/JWT_SECRET=.+/));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Agrega esta línea a tu archivo .env'));
  });
}); 