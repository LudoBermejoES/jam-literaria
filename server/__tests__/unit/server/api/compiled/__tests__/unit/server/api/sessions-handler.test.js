"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../server/routes/sessions/index");
// Mock PrismaClient
jest.mock('@prisma/client', function () {
    var mockPrismaClient = {
        session: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(function () { return mockPrismaClient; })
    };
});
// Mock Socket.io
jest.mock('../../../../index', function () { return ({
    io: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }
}); });
describe('Session Handlers', function () {
    // Mock express request and response
    var mockReq;
    var mockRes;
    var prisma;
    beforeEach(function () {
        jest.clearAllMocks();
        // Initialize mocks for each test
        mockReq = {
            body: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        // Get Prisma instance
        var PrismaClient = require('@prisma/client').PrismaClient;
        prisma = new PrismaClient();
    });
    test('should successfully generate a unique session code', function () { return __awaiter(void 0, void 0, void 0, function () {
        var code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // First call, no existing session with this code
                    prisma.session.findUnique.mockResolvedValueOnce(null);
                    return [4 /*yield*/, (0, index_1.generateSessionCode)()];
                case 1:
                    code = _a.sent();
                    // Code should be 6 characters
                    expect(code).toHaveLength(6);
                    expect(prisma.session.findUnique).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should regenerate code if a collision occurs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // First code exists, second doesn't
                    prisma.session.findUnique.mockResolvedValueOnce({ id: 'existing' });
                    prisma.session.findUnique.mockResolvedValueOnce(null);
                    return [4 /*yield*/, (0, index_1.generateSessionCode)()];
                case 1:
                    code = _a.sent();
                    // Code should have been regenerated
                    expect(code).toHaveLength(6);
                    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should create a session with user as owner and participant', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockReq.body = { userId: 'test-user' };
                    mockSession = {
                        id: 'session-id',
                        code: 'ABCDEF',
                        ownerId: 'test-user',
                        participants: [{ id: 'test-user' }]
                    };
                    prisma.session.create.mockResolvedValue(mockSession);
                    return [4 /*yield*/, (0, index_1.createSession)(mockReq, mockRes)];
                case 1:
                    _a.sent();
                    expect(prisma.session.create).toHaveBeenCalled();
                    expect(mockRes.status).toHaveBeenCalledWith(201);
                    expect(mockRes.json).toHaveBeenCalledWith(mockSession);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should join an existing session', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockSession, updatedSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockReq.body = { userId: 'test-user', code: 'ABCDEF' };
                    mockSession = {
                        id: 'session-id',
                        code: 'ABCDEF',
                        ownerId: 'owner-id',
                        participants: [{ id: 'owner-id' }]
                    };
                    updatedSession = __assign(__assign({}, mockSession), { participants: __spreadArray(__spreadArray([], mockSession.participants, true), [{ id: 'test-user' }], false) });
                    prisma.session.findUnique.mockResolvedValue(mockSession);
                    prisma.session.update.mockResolvedValue(updatedSession);
                    return [4 /*yield*/, (0, index_1.joinSession)(mockReq, mockRes)];
                case 1:
                    _a.sent();
                    expect(prisma.session.findUnique).toHaveBeenCalledWith({
                        where: { code: 'ABCDEF' },
                        include: { participants: true }
                    });
                    expect(prisma.session.update).toHaveBeenCalled();
                    expect(mockRes.status).toHaveBeenCalledWith(200);
                    expect(mockRes.json).toHaveBeenCalledWith(updatedSession);
                    return [2 /*return*/];
            }
        });
    }); });
});
