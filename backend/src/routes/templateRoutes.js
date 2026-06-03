const express = require('express');
const router = express.Router();
const { db } = require('../db/init');

// GET /api/template - Get current template
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM templates ORDER BY id DESC LIMIT 1');
    const template = rows[0];
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve template' });
  }
});

// POST /api/template - Create new template
router.post('/', async (req, res) => {
  const { business_name, business_address, business_contact, footer_notes, tax_rate, currency } = req.body;
  try {
    const [result] = await db.query(`
      INSERT INTO templates (business_name, business_address, business_contact, footer_notes, tax_rate, currency)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [business_name, business_address, business_contact, footer_notes, tax_rate, currency]);
    res.status(201).json({ id: result.insertId, message: 'Template created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/template - Update template
router.put('/', async (req, res) => {
  const { id, business_name, business_address, business_contact, footer_notes, tax_rate, currency } = req.body;
  try {
    // If id is not provided, update the latest one
    let targetId = id;
    if (!targetId) {
      const [latestRows] = await db.query('SELECT id FROM templates ORDER BY id DESC LIMIT 1');
      if (latestRows.length === 0) return res.status(404).json({ error: 'No template to update' });
      targetId = latestRows[0].id;
    }

    const [result] = await db.query(`
      UPDATE templates 
      SET business_name = ?, business_address = ?, business_contact = ?, footer_notes = ?, tax_rate = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [business_name, business_address, business_contact, footer_notes, tax_rate, currency, targetId]);
    
    if (result.affectedRows > 0) {
      res.json({ message: 'Template updated successfully' });
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

module.exports = router;
