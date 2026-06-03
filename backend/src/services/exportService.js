const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const getExecutablePath = () => {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (let p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
};

const generateExcel = async (bill, template) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Invoice');

  // Business Details
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = template.business_name;
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A2').value = template.business_address;
  sheet.getCell('A3').value = template.business_contact;

  // Check if it's the new style
  const isNewStyle = bill.items && bill.items.length > 0 && ('name' in bill.items[0]);

  if (isNewStyle) {
    // Write out fields line-by-line
    let currentRow = 6;
    bill.items.forEach(field => {
      sheet.getCell(`A${currentRow}`).value = field.name + ':';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      let val = field.value || '';
      if (field.name === 'Reg No' && (!val || val.trim() === '')) {
        val = String(bill.bill_number);
      }
      sheet.getCell(`B${currentRow}`).value = val;
      currentRow++;
    });
  } else {
    // Old Style Table
    sheet.getCell('A5').value = 'Bill No:';
    sheet.getCell('B5').value = bill.bill_number;
    sheet.getCell('A6').value = 'Date:';
    sheet.getCell('B6').value = new Date(bill.created_at).toLocaleString();
    sheet.getCell('A7').value = 'Customer:';
    sheet.getCell('B7').value = bill.customer_name;

    sheet.getRow(9).values = ['Description', 'Quantity', 'Unit Price', 'Amount'];
    sheet.getRow(9).font = { bold: true };

    let currentRow = 10;
    bill.items.forEach(item => {
      sheet.getRow(currentRow).values = [item.description, item.quantity, item.unit_price, item.amount];
      currentRow++;
    });

    currentRow++;
    sheet.getCell(`C${currentRow}`).value = 'Subtotal';
    sheet.getCell(`D${currentRow}`).value = bill.subtotal;
    currentRow++;
    sheet.getCell(`C${currentRow}`).value = 'Tax';
    sheet.getCell(`D${currentRow}`).value = bill.tax_amount;
    currentRow++;
    sheet.getCell(`C${currentRow}`).value = 'Discount';
    sheet.getCell(`D${currentRow}`).value = bill.discount_amount;
    currentRow++;
    sheet.getCell(`C${currentRow}`).value = 'Grand Total';
    sheet.getCell(`D${currentRow}`).value = bill.grand_total;
    sheet.getCell(`C${currentRow}`).font = { bold: true };
    sheet.getCell(`D${currentRow}`).font = { bold: true };
  }

  sheet.columns.forEach(column => {
    column.width = 25;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const generatePDF = async (bill, template) => {
  const isNewStyle = bill.items && bill.items.length > 0 && ('name' in bill.items[0]);
  
  let contentHtml = '';
  if (isNewStyle) {
    contentHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        ${bill.items.map(item => {
          let val = item.value || '';
          if (item.name === 'Reg No' && (!val || val.trim() === '')) {
            val = String(bill.bill_number);
          }
          return `
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 35%; background-color: #f9f9f9;">${item.name}</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-size: 15px;">${val}</td>
            </tr>
          `;
        }).join('')}
      </table>
    `;
  } else {
    contentHtml = `
      <div class="details">
        <strong>Bill No:</strong> ${bill.bill_number}<br>
        <strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}<br>
        <strong>Customer:</strong> ${bill.customer_name || 'Cash'}
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.unit_price.toFixed(2)}</td>
              <td>${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="totals">
        <p>Subtotal: ${template.currency} ${bill.subtotal.toFixed(2)}</p>
        <p>Tax: ${template.currency} ${bill.tax_amount.toFixed(2)}</p>
        <p>Discount: ${template.currency} ${bill.discount_amount.toFixed(2)}</p>
        <h3>Grand Total: ${template.currency} ${bill.grand_total.toFixed(2)}</h3>
      </div>
    `;
  }

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; }
          .details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${template.business_name}</h2>
          <p>${template.business_address || ''}<br>${template.business_contact || ''}</p>
        </div>
        ${contentHtml}
        <div class="footer">
          ${template.footer_notes || ''}
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  return pdfBuffer;
};

const syncExcelDatabase = async (db) => {
  const dbPath = path.join(__dirname, '../../bills_database.xlsx');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Database');

  sheet.columns = [
    { header: 'Bill Number / Reg No', key: 'bill_number', width: 15 },
    { header: 'Date', key: 'date', width: 25 },
    { header: 'Patient / Customer Name', key: 'customer_name', width: 20 },
    { header: 'Age / Gender', key: 'customer_phone', width: 15 },
    { header: 'Address', key: 'customer_address', width: 25 },
    { header: 'Doctor Name', key: 'doctor_name', width: 20 },
    { header: 'Ref Doctor', key: 'ref_doctor', width: 20 },
    { header: 'Payment Mode', key: 'payment_mode', width: 15 },
    { header: 'Payment Type', key: 'payment_type', width: 20 },
    { header: 'Fees / Grand Total', key: 'grand_total', width: 15 },
    { header: 'Custom Fields', key: 'custom_fields', width: 40 }
  ];
  sheet.getRow(1).font = { bold: true };

  const [bills] = await db.query('SELECT * FROM bills ORDER BY created_at ASC');
  for (const bill of bills) {
    let itemsArray = bill.items;
    if (typeof itemsArray === 'string') {
      try {
        itemsArray = JSON.parse(itemsArray);
      } catch (e) {
        itemsArray = [];
      }
    }
    const isNewStyle = itemsArray.length > 0 && ('name' in itemsArray[0]);

    if (isNewStyle) {
      const getVal = (name) => itemsArray.find(item => item.name === name)?.value || '';
      const customItems = itemsArray.filter(item => 
        !['Reg No', 'Patient Name', 'Age / Gender', 'Address', 'Date', 'Dr. Name', 'Fee', 'Ref. Dr', 'Payment Mode', 'Payment Type'].includes(item.name)
      );
      const customSummary = customItems.map(item => `${item.name}: ${item.value}`).join(', ');

      sheet.addRow({
        bill_number: bill.bill_number,
        date: getVal('Date') || new Date(bill.created_at || Date.now()).toLocaleDateString(),
        customer_name: bill.customer_name,
        customer_phone: getVal('Age / Gender'),
        customer_address: bill.customer_address,
        doctor_name: getVal('Dr. Name'),
        ref_doctor: getVal('Ref. Dr'),
        payment_mode: getVal('Payment Mode'),
        payment_type: getVal('Payment Type'),
        grand_total: bill.grand_total,
        custom_fields: customSummary
      });
    } else {
      const itemsSummary = itemsArray.map(item => `${item.quantity}x ${item.description}`).join(', ');
      sheet.addRow({
        bill_number: bill.bill_number,
        date: new Date(bill.created_at || Date.now()).toLocaleString(),
        customer_name: bill.customer_name || 'Cash',
        customer_phone: bill.customer_phone || '',
        customer_address: bill.customer_address || '',
        doctor_name: 'N/A',
        ref_doctor: '',
        payment_mode: 'N/A',
        payment_type: 'N/A',
        grand_total: bill.grand_total,
        custom_fields: itemsSummary
      });
    }
  }

  try {
    await workbook.xlsx.writeFile(dbPath);
  } catch (err) {
    console.error('Could not sync Excel database. Is it open in Excel?', err);
  }
};

module.exports = { generateExcel, generatePDF, syncExcelDatabase };
