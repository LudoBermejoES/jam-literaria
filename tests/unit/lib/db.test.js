const path = require('path');
const Database = require('better-sqlite3');

// Use actual implementation for this test, not mocks
jest.unmock('../../../src/lib/db');

// Mock better-sqlite3
jest.mock('better-sqlite3');

describe('Database Module', () => {
  let mockDb;
  let dbModule;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock implementations
    mockDb = {
      pragma: jest.fn(),
      prepare: jest.fn(),
      close: jest.fn(),
      transaction: jest.fn()
    };
    
    // Mock statement object
    const mockStatement = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn()
    };
    
    // Setup mock returns
    mockDb.prepare.mockReturnValue(mockStatement);
    Database.mockReturnValue(mockDb);
    
    // Load the module after setting up mocks
    dbModule = require('../../../src/lib/db');
  });
  
  afterEach(() => {
    // Clean up
    if (dbModule.closeConnection) {
      dbModule.closeConnection();
    }
    
    // Reset modules
    jest.resetModules();
  });
  
  test('getConnection should create a new connection if one doesn\'t exist', () => {
    const connection = dbModule.getConnection();
    
    expect(Database).toHaveBeenCalledWith(
      expect.stringContaining('jam-literaria.db'),
      expect.any(Object)
    );
    expect(connection).toBe(mockDb);
    expect(mockDb.pragma).toHaveBeenCalledTimes(2);
  });
  
  test('getConnection should return existing connection if one exists', () => {
    // First call creates the connection
    dbModule.getConnection();
    Database.mockClear();
    
    // Second call should reuse it
    const connection = dbModule.getConnection();
    
    expect(Database).not.toHaveBeenCalled();
    expect(connection).toBe(mockDb);
  });
  
  test('closeConnection should close the connection if one exists', () => {
    // Create a connection first
    dbModule.getConnection();
    
    // Then close it
    dbModule.closeConnection();
    
    expect(mockDb.close).toHaveBeenCalled();
  });
  
  test('get should prepare and execute a query', () => {
    const mockStatement = mockDb.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ id: 1 })
    });
    
    const result = dbModule.get('SELECT * FROM test WHERE id = ?', [1]);
    
    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?');
    expect(mockStatement.get).toHaveBeenCalledWith([1]);
    expect(result).toEqual({ id: 1 });
  });
  
  test('all should prepare and execute a query returning multiple rows', () => {
    const mockRows = [{ id: 1 }, { id: 2 }];
    const mockStatement = mockDb.prepare.mockReturnValue({
      all: jest.fn().mockReturnValue(mockRows)
    });
    
    const result = dbModule.all('SELECT * FROM test');
    
    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM test');
    expect(mockStatement.all).toHaveBeenCalledWith([]);
    expect(result).toEqual(mockRows);
  });
  
  test('run should prepare and execute an update query', () => {
    const mockResult = { changes: 1, lastInsertRowid: 1 };
    const mockStatement = mockDb.prepare.mockReturnValue({
      run: jest.fn().mockReturnValue(mockResult)
    });
    
    const result = dbModule.run('INSERT INTO test (name) VALUES (?)', ['test']);
    
    expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO test (name) VALUES (?)');
    expect(mockStatement.run).toHaveBeenCalledWith(['test']);
    expect(result).toEqual(mockResult);
  });
  
  test('transaction should execute callback in a transaction', () => {
    const mockTransactionFn = jest.fn().mockReturnValue(() => 'result');
    mockDb.transaction.mockReturnValue(mockTransactionFn);
    
    const callback = () => {};
    const result = dbModule.transaction(callback);
    
    expect(mockDb.transaction).toHaveBeenCalledWith(callback);
    expect(mockTransactionFn).toHaveBeenCalled();
    expect(result).toBe('result');
  });
}); 