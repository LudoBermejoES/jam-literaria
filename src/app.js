const express = require('express');
const path = require('path');
const session = require('express-session');
const { setupSocket } = require('./lib/socket');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'jam-literaria-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes (will be added in future steps)
// app.use('/', require('./routes/index'));
// app.use('/auth', require('./routes/auth'));
// app.use('/session', require('./routes/session'));
// app.use('/ideas', require('./routes/ideas'));
// app.use('/voting', require('./routes/voting'));

// Basic route for now
app.get('/', (req, res) => {
  res.render('index', { title: 'Jam Literaria' });
});

// Function to start server (useful for testing)
const startServer = (port = PORT) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
  // Setup Socket.io
  // setupSocket(server);
  
  return server;
};

// Function to stop server (useful for testing)
const stopServer = (server) => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing purposes
module.exports = { app, startServer, stopServer }; 