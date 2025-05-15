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
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../../middleware/auth");
const prisma_1 = require("../../../../generated/prisma");
// Mock PrismaClient
jest.mock('../../../../server/generated/prisma', () => {
    // Create mock implementation
    const mockPrismaClient = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        session: {
            findFirst: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient)
    };
});
describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;
    let prisma;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Get Prisma instance
        prisma = new prisma_1.PrismaClient();
        // Setup request and response mocks
        mockReq = {
            headers: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });
    describe('authMiddleware', () => {
        it('should return 401 if no user ID is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Execute
            yield (0, auth_1.authMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        }));
        it('should return 401 if user is not found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'non-existent-id' };
            prisma.user.findUnique.mockResolvedValue(null);
            // Execute
            yield (0, auth_1.authMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'non-existent-id' }
            });
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid authentication'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        }));
        it('should call next() and add user to request if user is valid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const mockUser = { id: 'valid-user-id', name: 'Test User' };
            mockReq.headers = { 'x-user-id': 'valid-user-id' };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.update.mockResolvedValue(mockUser);
            // Execute
            yield (0, auth_1.authMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'valid-user-id' }
            });
            expect(prisma.user.update).toHaveBeenCalled();
            expect(mockReq.user).toEqual(mockUser);
            expect(nextFunction).toHaveBeenCalled();
        }));
        it('should handle database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'valid-user-id' };
            prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
            // Mock console.error
            console.error = jest.fn();
            // Execute
            yield (0, auth_1.authMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error'
            });
            expect(console.error).toHaveBeenCalled();
        }));
    });
    describe('sessionMemberMiddleware', () => {
        it('should return 400 if user ID or session ID is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'user-id' };
            // No sessionId in params
            // Execute
            yield (0, auth_1.sessionMemberMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User ID and session ID are required'
            });
        }));
        it('should return 403 if user is not a member of the session', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'user-id' };
            mockReq.params = { sessionId: 'session-id' };
            prisma.session.findFirst.mockResolvedValue(null);
            // Execute
            yield (0, auth_1.sessionMemberMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(prisma.session.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'session-id',
                    OR: [
                        { ownerId: 'user-id' },
                        { participants: { some: { id: 'user-id' } } }
                    ]
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User is not a member of this session'
            });
        }));
        it('should call next() and add session to request if user is a member', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const mockSession = { id: 'session-id', ownerId: 'other-user', name: 'Test Session' };
            mockReq.headers = { 'x-user-id': 'user-id' };
            mockReq.params = { sessionId: 'session-id' };
            prisma.session.findFirst.mockResolvedValue(mockSession);
            // Execute
            yield (0, auth_1.sessionMemberMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockReq.session).toEqual(mockSession);
            expect(nextFunction).toHaveBeenCalled();
        }));
    });
    describe('sessionOwnerMiddleware', () => {
        it('should return 400 if user ID or session ID is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'user-id' };
            // No sessionId in params
            // Execute
            yield (0, auth_1.sessionOwnerMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
        }));
        it('should return 403 if user is not the owner of the session', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            mockReq.headers = { 'x-user-id': 'user-id' };
            mockReq.params = { sessionId: 'session-id' };
            prisma.session.findFirst.mockResolvedValue(null);
            // Execute
            yield (0, auth_1.sessionOwnerMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(prisma.session.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'session-id',
                    ownerId: 'user-id'
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User is not the owner of this session'
            });
        }));
        it('should call next() and add session to request if user is the owner', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const mockSession = { id: 'session-id', ownerId: 'user-id', name: 'Test Session' };
            mockReq.headers = { 'x-user-id': 'user-id' };
            mockReq.params = { sessionId: 'session-id' };
            prisma.session.findFirst.mockResolvedValue(mockSession);
            // Execute
            yield (0, auth_1.sessionOwnerMiddleware)(mockReq, mockRes, nextFunction);
            // Assert
            expect(mockReq.session).toEqual(mockSession);
            expect(nextFunction).toHaveBeenCalled();
        }));
    });
});
