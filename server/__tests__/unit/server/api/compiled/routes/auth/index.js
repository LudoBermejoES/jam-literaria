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
var express_1 = require("express");
var prisma_1 = require("../../generated/prisma");
var auth_1 = require("../../middleware/auth");
var router = express_1.default.Router();
var prisma = new prisma_1.PrismaClient();
// Handler functions
var registerUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var name_1, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                name_1 = req.body.name;
                if (!name_1 || typeof name_1 !== 'string' || name_1.trim().length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Valid name is required',
                        })];
                }
                return [4 /*yield*/, prisma.user.create({
                        data: {
                            name: name_1.trim(),
                        },
                    })];
            case 1:
                user = _a.sent();
                return [2 /*return*/, res.status(201).json({
                        success: true,
                        data: {
                            id: user.id,
                            name: user.name,
                        },
                    })];
            case 2:
                error_1 = _a.sent();
                console.error('Register error:', error_1);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
var validateUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        try {
            // User is already validated by authMiddleware
            return [2 /*return*/, res.status(200).json({
                    success: true,
                    data: {
                        id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                        name: (_b = req.user) === null || _b === void 0 ? void 0 : _b.name,
                    },
                })];
        }
        catch (error) {
            console.error('Validate error:', error);
            return [2 /*return*/, res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                })];
        }
        return [2 /*return*/];
    });
}); };
// Routes
/**
 * Register a new user with a name
 *
 * @route POST /api/auth/register
 * @param {string} name - The user's display name
 * @returns {Object} Object containing user ID and name
 */
// @ts-ignore: TypeScript tiene problemas con estas rutas pero funcionan correctamente
router.post('/register', registerUser);
/**
 * Validate a user session
 *
 * @route GET /api/auth/validate
 * @param {string} x-user-id - The user's ID (header)
 * @returns {Object} User object if valid
 */
// @ts-ignore: TypeScript tiene problemas con estas rutas pero funcionan correctamente
router.get('/validate', auth_1.authMiddleware, validateUser);
exports.default = router;
