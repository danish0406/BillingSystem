const express = require('express');
const router = express.Router();
const { db } = require('../db/init');
const { syncExcelDatabase } = require('../services/exportService');

// GET /api/bills - Get all bills (with pagination, filters)
router.get('/', async (req, res) => {
  const { search, startDate, endDate, page = 1, limit = 50 } = req.query;
  try {
    let query = 'SELECT * FROM bills WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (customer_name LIKE ? OR bill_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (startDate) {
      query += ' AND date(created_at) >= date(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date(created_at) <= date(?)';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number((page - 1) * limit));

    const [bills] = await db.query(query, params);
    
    // Also get total count
    let countQuery = 'SELECT COUNT(*) as count FROM bills WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (customer_name LIKE ? OR bill_number LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (startDate) {
      countQuery += ' AND date(created_at) >= date(?)';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND date(created_at) <= date(?)';
      countParams.push(endDate);
    }
    
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].count;

    res.json({
      data: bills.map(b => ({ ...b, items: JSON.parse(b.items) })),
      total: total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve bills' });
  }
});

// GET /api/bill/export/open-database - Open master Excel database
router.get('/export/open-database', async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const { exec } = require('child_process');
  const dbPath = path.join(__dirname, '../../bills_database.xlsx');
  
  let syncFailed = false;
  try {
    await syncExcelDatabase(db);
  } catch (err) {
    syncFailed = true;
  }

  if (fs.existsSync(dbPath)) {
    exec(`start "" "${dbPath}"`, (err) => {
      if (err) console.error('Failed to open Excel:', err);
    });
    if (syncFailed) {
      res.json({ warning: 'Note: The Excel file was already open so we could not add the newest bills to it. Please close Excel and click the button again to see the latest updates.' });
    } else {
      res.json({ message: 'Opening master database...' });
    }
  } else {
    res.status(404).json({ error: 'Master database file not found. Create a bill first.' });
  }
});

// GET /api/bill/next-number - Get next bill number
router.get('/next-number', async (req, res) => {
  try {
    const [maxRows] = await db.query('SELECT MAX(bill_number) as maxNum FROM bills');
    const next_number = (maxRows[0].maxNum || 0) + 1;
    res.json({ next_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get next bill number' });
  }
});

// GET /api/bill/:id - Get single bill details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    const bill = rows[0];
    if (bill) {
      bill.items = JSON.parse(bill.items);
      res.json(bill);
    } else {
      res.status(404).json({ error: 'Bill not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve bill' });
  }
});

// POST /api/bill - Create new bill
router.post('/', async (req, res) => {
  console.log('POST /api/bill request body:', JSON.stringify(req.body, null, 2));
  const { customer_name, customer_address, customer_phone, subtotal, tax_amount, discount_amount, grand_total, items } = req.body;
  try {
    // Generate bill number (auto-increment based on max)
    const [maxRows] = await db.query('SELECT MAX(bill_number) as maxNum FROM bills');
    const bill_number = (maxRows[0].maxNum || 0) + 1;

    // Parse items to update Reg No and Date fields with the actual server values
    let parsedItems = [];
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
      parsedItems = items;
    }

    if (Array.isArray(parsedItems)) {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const localDateTime = `${day}-${month}-${year}`;

      parsedItems = parsedItems.map(f => {
        if (f.name === 'Reg No') return { ...f, value: String(bill_number) };
        if (f.name === 'Date') return { ...f, value: (f.value && f.value.trim()) ? f.value.trim() : localDateTime };
        return f;
      });
    }

    const [result] = await db.query(`
      INSERT INTO bills (bill_number, customer_name, customer_address, customer_phone, subtotal, tax_amount, discount_amount, grand_total, items, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bill_number, 
      customer_name, 
      customer_address, 
      customer_phone, 
      subtotal, 
      tax_amount, 
      discount_amount, 
      grand_total, 
      JSON.stringify(parsedItems),
      new Date()
    ]);
    
    // Sync the entire database to Excel
    try {
      await syncExcelDatabase(db);
    } catch (excelError) {
      console.error('Failed to sync Excel DB:', excelError);
    }
    
    res.status(201).json({ id: result.insertId, bill_number, message: 'Bill created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// PUT /api/bill/:id - Update bill
router.put('/:id', (req, res) => {
  res.status(501).json({ message: 'Update bill not fully implemented yet' });
});

// DELETE /api/bill/:id - Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM bills WHERE id = ?', [req.params.id]);
    if (result.affectedRows > 0) {
      try {
        await syncExcelDatabase(db);
      } catch (excelError) {
        console.error('Failed to sync Excel DB after delete:', excelError);
      }
      res.json({ message: 'Bill deleted successfully' });
    } else {
      res.status(404).json({ error: 'Bill not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

module.exports = router;
