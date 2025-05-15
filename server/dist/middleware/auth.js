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
exports.sessionOwnerMiddleware = exports.sessionMemberMiddleware = exports.authMiddleware = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to check if user is authenticated with a valid session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get user ID from request headers
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        // Find user in database
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication',
            });
        }
        // Update user's last active timestamp
        yield prisma.user.update({
            where: { id: userId },
            data: { lastActive: new Date() },
        });
        // Add user to request for use in route handlers
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.authMiddleware = authMiddleware;
/**
 * Middleware to check if user is a member of the specified session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
const sessionMemberMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { sessionId } = req.params;
        if (!userId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and session ID are required',
            });
        }
        // Check if user is a member of the session
        const session = yield prisma.session.findFirst({
            where: {
                id: sessionId,
                OR: [
                    { ownerId: userId },
                    { participants: { some: { id: userId } } }
                ]
            },
        });
        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'User is not a member of this session',
            });
        }
        // Add session to request for use in route handlers
        req.session = session;
        next();
    }
    catch (error) {
        console.error('Session member middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.sessionMemberMiddleware = sessionMemberMiddleware;
/**
 * Middleware to check if user is the owner of the specified session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
const sessionOwnerMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { sessionId } = req.params;
        if (!userId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and session ID are required',
            });
        }
        // Check if user is the owner of the session
        const session = yield prisma.session.findFirst({
            where: {
                id: sessionId,
                ownerId: userId
            },
        });
        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'User is not the owner of this session',
            });
        }
        // Add session to request for use in route handlers
        req.session = session;
        next();
    }
    catch (error) {
        console.error('Session owner middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.sessionOwnerMiddleware = sessionOwnerMiddleware;
