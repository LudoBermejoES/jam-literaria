"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("./auth");
var sessions_1 = require("./sessions");
var router = express_1.default.Router();
// Mount auth routes
router.use('/auth', auth_1.default);
// Mount session routes
router.use('/sessions', sessions_1.default);
// Add additional route groups here as they are implemented
exports.default = router;
