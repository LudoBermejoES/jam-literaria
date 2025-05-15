"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const sessions_1 = __importDefault(require("./sessions"));
const router = express_1.default.Router();
// Mount auth routes
router.use('/auth', auth_1.default);
// Mount session routes
router.use('/sessions', sessions_1.default);
// Add additional route groups here as they are implemented
exports.default = router;
