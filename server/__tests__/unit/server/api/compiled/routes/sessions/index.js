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
exports.getSessionResults = exports.startVoting = exports.startSession = exports.getSessionStatus = exports.joinSession = exports.createSession = exports.generateSessionCode = void 0;
var express_1 = require("express");
var client_1 = require("@prisma/client");
var index_1 = require("../../index");
var router = express_1.default.Router();
var prisma = new client_1.PrismaClient();
// Helper function to generate a random session code
var generateSessionCode = function () { return __awaiter(void 0, void 0, void 0, function () {
    var characters, code, i, existingSession;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                code = '';
                for (i = 0; i < 6; i++) {
                    code += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { code: code }
                    })];
            case 1:
                existingSession = _a.sent();
                // If code exists, generate a new one recursively
                if (existingSession) {
                    return [2 /*return*/, (0, exports.generateSessionCode)()];
                }
                return [2 /*return*/, code];
        }
    });
}); };
exports.generateSessionCode = generateSessionCode;
// Create a new session
var createSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sessionCode, session, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.body.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ error: 'User ID is required' })];
                }
                return [4 /*yield*/, (0, exports.generateSessionCode)()];
            case 1:
                sessionCode = _a.sent();
                return [4 /*yield*/, prisma.session.create({
                        data: {
                            code: sessionCode,
                            ownerId: userId,
                            participants: {
                                connect: { id: userId }
                            }
                        },
                        include: {
                            participants: true
                        }
                    })];
            case 2:
                session = _a.sent();
                return [2 /*return*/, res.status(201).json(session)];
            case 3:
                error_1 = _a.sent();
                console.error('Error creating session:', error_1);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to create session' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createSession = createSession;
// Join a session with code
var joinSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId_1, code, session, isParticipant, updatedSession, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, userId_1 = _a.userId, code = _a.code;
                if (!userId_1 || !code) {
                    return [2 /*return*/, res.status(400).json({ error: 'User ID and session code are required' })];
                }
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { code: code },
                        include: { participants: true }
                    })];
            case 1:
                session = _b.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: 'Session not found' })];
                }
                isParticipant = session.participants.some(function (p) { return p.id === userId_1; });
                if (!!isParticipant) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.session.update({
                        where: { id: session.id },
                        data: {
                            participants: {
                                connect: { id: userId_1 }
                            }
                        },
                        include: { participants: true }
                    })];
            case 2:
                updatedSession = _b.sent();
                // Notify other participants via Socket.io
                index_1.io.to("session-".concat(session.id)).emit('user-joined', {
                    userId: userId_1,
                    sessionId: session.id
                });
                return [2 /*return*/, res.status(200).json(updatedSession)];
            case 3: 
            // User is already a participant
            return [2 /*return*/, res.status(200).json(session)];
            case 4: return [3 /*break*/, 6];
            case 5:
                error_2 = _b.sent();
                console.error('Error joining session:', error_2);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to join session' })];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.joinSession = joinSession;
// Get session status
var getSessionStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = req.params.sessionId;
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { id: sessionId },
                        include: {
                            participants: true,
                            ideas: true,
                            owner: true
                        }
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: 'Session not found' })];
                }
                return [2 /*return*/, res.status(200).json(session)];
            case 2:
                error_3 = _a.sent();
                console.error('Error getting session status:', error_3);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to get session status' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getSessionStatus = getSessionStatus;
// Start session (move from WAITING to COLLECTING_IDEAS)
var startSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, updatedSession, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                sessionId = req.params.sessionId;
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { id: sessionId },
                        include: { participants: true }
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: 'Session not found' })];
                }
                // Only owner can start the session
                if (req.body.userId !== session.ownerId) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only session owner can start the session' })];
                }
                return [4 /*yield*/, prisma.session.update({
                        where: { id: sessionId },
                        data: {
                            status: 'COLLECTING_IDEAS'
                        },
                        include: { participants: true }
                    })];
            case 2:
                updatedSession = _a.sent();
                // Notify participants via Socket.io
                index_1.io.to("session-".concat(sessionId)).emit('session-started', {
                    sessionId: sessionId,
                    status: 'COLLECTING_IDEAS'
                });
                return [2 /*return*/, res.status(200).json(updatedSession)];
            case 3:
                error_4 = _a.sent();
                console.error('Error starting session:', error_4);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to start session' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.startSession = startSession;
// Start voting (move from COLLECTING_IDEAS to VOTING)
var startVoting = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, updatedSession, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                sessionId = req.params.sessionId;
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { id: sessionId },
                        include: {
                            participants: true,
                            ideas: true
                        }
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: 'Session not found' })];
                }
                // Only owner can start voting
                if (req.body.userId !== session.ownerId) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only session owner can start voting' })];
                }
                // Check if there are ideas to vote
                if (session.ideas.length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: 'No ideas submitted for voting' })];
                }
                return [4 /*yield*/, prisma.session.update({
                        where: { id: sessionId },
                        data: {
                            status: 'VOTING',
                            currentRound: 1
                        },
                        include: {
                            participants: true,
                            ideas: true
                        }
                    })];
            case 2:
                updatedSession = _a.sent();
                // Notify participants via Socket.io
                index_1.io.to("session-".concat(sessionId)).emit('voting-started', {
                    sessionId: sessionId,
                    status: 'VOTING',
                    round: 1,
                    ideas: updatedSession.ideas
                });
                return [2 /*return*/, res.status(200).json(updatedSession)];
            case 3:
                error_5 = _a.sent();
                console.error('Error starting voting:', error_5);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to start voting' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.startVoting = startVoting;
// Process results and handle next steps (finalizing or starting new round)
var getSessionResults = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = req.params.sessionId;
                return [4 /*yield*/, prisma.session.findUnique({
                        where: { id: sessionId },
                        include: {
                            ideas: true,
                            votes: {
                                where: {
                                    round: prisma.session.findUnique({
                                        where: { id: sessionId },
                                        select: { currentRound: true }
                                    }).currentRound
                                }
                            }
                        }
                    })];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: 'Session not found' })];
                }
                // TODO: Implement the vote counting and idea selection logic
                // For now, return a simplified response
                return [2 /*return*/, res.status(200).json({
                        status: session.status,
                        ideas: session.ideas,
                        // Additional fields would be populated based on voting results
                    })];
            case 2:
                error_6 = _a.sent();
                console.error('Error processing results:', error_6);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to process results' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getSessionResults = getSessionResults;
// Register routes
router.post('/create', exports.createSession);
router.post('/join', exports.joinSession);
router.get('/:sessionId/status', exports.getSessionStatus);
router.post('/:sessionId/start', exports.startSession);
router.post('/:sessionId/voting', exports.startVoting);
router.post('/:sessionId/results', exports.getSessionResults);
exports.default = router;
