"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
var express_1 = require("express");
var cors_1 = require("cors");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var routes_1 = require("./routes");
var dotenv_1 = require("dotenv");
// Cargar variables de entorno
dotenv_1.default.config();
// Initialize Express app
var app = (0, express_1.default)();
var httpServer = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api', routes_1.default);
// Health check endpoint
app.get('/health', function (req, res) {
    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Socket.io setup
io.on('connection', function (socket) {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', function () {
        console.log('Client disconnected:', socket.id);
    });
    // Additional socket event handlers will be added here
});
// Start server
var PORT = process.env.PORT || 4000;
httpServer.listen(PORT, function () {
    console.log("Server running in ".concat(process.env.NODE_ENV || 'development', " mode on port ").concat(PORT));
});
