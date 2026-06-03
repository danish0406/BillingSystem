const express = require('express');
const router = express.Router();
const { db } = require('../db/init');
const printerService = require('../services/printerService');
const exportService = require('../services/exportService');

// POST /api/bill/:id/print - Trigger 80mm print
router.post('/:id/print', async (req, res) => {
  try {
    const [billRows] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    const bill = billRows[0];
    const [tplRows] = await db.query('SELECT * FROM templates ORDER BY id DESC LIMIT 1');
    const template = tplRows[0];
    
    if (!bill || !template) {
      return res.status(404).json({ error: 'Bill or template not found' });
    }

    bill.items = JSON.parse(bill.items);
    
    // Send to printer
    await printerService.printReceipt(bill, template);
    
    res.json({ message: 'Print job sent successfully' });
  } catch (error) {
    console.error('Print Error:', error);
    res.status(500).json({ error: 'Failed to print receipt. Please check printer connection.' });
  }
});

// GET /api/bill/:id/export/excel - Export bill as Excel
router.get('/:id/export/excel', async (req, res) => {
  try {
    const [billRows] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    const bill = billRows[0];
    const [tplRows] = await db.query('SELECT * FROM templates ORDER BY id DESC LIMIT 1');
    const template = tplRows[0];
    
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.items = JSON.parse(bill.items);

    const buffer = await exportService.generateExcel(bill, template);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Bill_${bill.bill_number}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel Export Error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

// GET /api/bill/:id/export/pdf - Export bill as PDF
router.get('/:id/export/pdf', async (req, res) => {
  try {
    const [billRows] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    const bill = billRows[0];
    const [tplRows] = await db.query('SELECT * FROM templates ORDER BY id DESC LIMIT 1');
    const template = tplRows[0];
    
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.items = JSON.parse(bill.items);

    const pdfBuffer = await exportService.generatePDF(bill, template);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bill_${bill.bill_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF file' });
  }
});

module.exports = router;
