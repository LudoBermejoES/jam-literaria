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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionOwnerMiddleware = exports.sessionMemberMiddleware = exports.authMiddleware = void 0;
var prisma_1 = require("../generated/prisma");
var prisma = new prisma_1.PrismaClient();
/**
 * Middleware to check if user is authenticated with a valid session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
var authMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.headers['x-user-id'];
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Authentication required',
                        })];
                }
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Invalid authentication',
                        })];
                }
                // Update user's last active timestamp
                return [4 /*yield*/, prisma.user.update({
                        where: { id: userId },
                        data: { lastActive: new Date() },
                    })];
            case 2:
                // Update user's last active timestamp
                _a.sent();
                // Add user to request for use in route handlers
                req.user = user;
                next();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('Auth middleware error:', error_1);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.authMiddleware = authMiddleware;
/**
 * Middleware to check if user is a member of the specified session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
var sessionMemberMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sessionId, session, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.headers['x-user-id'];
                sessionId = req.params.sessionId;
                if (!userId || !sessionId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID and session ID are required',
                        })];
                }
                return [4 /*yield*/, prisma.session.findFirst({
                        where: {
                            id: sessionId,
                            OR: [
                                { ownerId: userId },
                                { participants: { some: { id: userId } } }
                            ]
                        },
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'User is not a member of this session',
                        })];
                }
                // Add session to request for use in route handlers
                req.session = session;
                next();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Session member middleware error:', error_2);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.sessionMemberMiddleware = sessionMemberMiddleware;
/**
 * Middleware to check if user is the owner of the specified session
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
var sessionOwnerMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sessionId, session, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.headers['x-user-id'];
                sessionId = req.params.sessionId;
                if (!userId || !sessionId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID and session ID are required',
                        })];
                }
                return [4 /*yield*/, prisma.session.findFirst({
                        where: {
                            id: sessionId,
                            ownerId: userId
                        },
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'User is not the owner of this session',
                        })];
                }
                // Add session to request for use in route handlers
                req.session = session;
                next();
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Session owner middleware error:', error_3);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.sessionOwnerMiddleware = sessionOwnerMiddleware;
