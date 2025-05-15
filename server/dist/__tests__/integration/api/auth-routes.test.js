"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../../routes/auth"));
// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient)
    };
});
// Mock auth middleware
jest.mock('../../../middleware/auth', () => {
    return {
        authMiddleware: jest.fn((req, res, next) => {
            const userId = req.headers['x-user-id'];
            if (userId === 'valid-user-id') {
                req.user = {
                    id: 'valid-user-id',
                    name: 'Test User'
                };
                next();
            }
            else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid authentication'
                });
            }
        })
    };
});
describe('Auth API Routes', () => {
    let app;
    let prisma;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Create Express app
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/auth', auth_1.default);
        // Get Prisma instance
        prisma = new client_1.PrismaClient();
    });
    describe('POST /api/auth/register', () => {
        it('should return 400 if name is not provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Valid name is required'
            });
        }));
        it('should return 400 if name is empty', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ name: '' });
            expect(response.status).toBe(400);
        }));
        it('should create a user and return 201 if name is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                id: 'user123',
                name: 'Test User'
            };
            prisma.user.create.mockResolvedValue(mockUser);
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ name: 'Test User' });
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: { name: 'Test User' }
            });
            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                success: true,
                data: mockUser
            });
        }));
        it('should handle database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            prisma.user.create.mockRejectedValue(new Error('Database error'));
            // Mock console.error
            console.error = jest.fn();
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ name: 'Test User' });
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Internal server error'
            });
            expect(console.error).toHaveBeenCalled();
        }));
    });
    describe('GET /api/auth/validate', () => {
        it('should return 401 if user ID is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/auth/validate')
                .set('x-user-id', 'invalid-user-id');
            expect(response.status).toBe(401);
        }));
        it('should return user data if user ID is valid', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/auth/validate')
                .set('x-user-id', 'valid-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    id: 'valid-user-id',
                    name: 'Test User'
                }
            });
        }));
    });
});
