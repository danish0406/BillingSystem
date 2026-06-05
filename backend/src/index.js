require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { initDB, db } = require('./db/init');
const templateRoutes = require('./routes/templateRoutes');
const billRoutes = require('./routes/billRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
(async () => {
  try {
    await initDB();
    console.log('Database initialized successfully.');
    
    const { syncExcelDatabase } = require('./services/exportService');
    await syncExcelDatabase(db);
    console.log('Excel database synced on startup.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
})();

// Routes
app.use('/api/template', templateRoutes);
app.use('/api/bill', billRoutes); // using /api/bill for single bill operations
app.use('/api/bills', billRoutes); // we'll handle both in the same router
app.use('/api/bill', exportRoutes); // handles /api/bill/:id/print, /export/excel, etc.

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.send('Billing System Backend Running');
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
