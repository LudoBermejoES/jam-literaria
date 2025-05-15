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
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../generated/prisma");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const prisma = new prisma_1.PrismaClient();
// Handler functions
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid name is required',
            });
        }
        // Create user in database
        const user = yield prisma.user.create({
            data: {
                name: name.trim(),
            },
        });
        return res.status(201).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
const validateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // User is already validated by authMiddleware
        return res.status(200).json({
            success: true,
            data: {
                id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                name: (_b = req.user) === null || _b === void 0 ? void 0 : _b.name,
            },
        });
    }
    catch (error) {
        console.error('Validate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
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
