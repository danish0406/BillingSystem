const escpos = require('escpos');
// install escpos-usb adapter
escpos.USB = require('escpos-usb');

const printReceipt = async (bill, template) => {
  return new Promise((resolve, reject) => {
    try {
      // Find the USB printer
      // Note: In a real app, you might want to make VID/PID configurable or use other adapters (Network, Serial)
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      device.open((error) => {
        if (error) {
          console.error("Printer connection error:", error);
          return reject(error);
        }

        printer
          .font('a')
          .align('ct')
          .style('b')
          .size(1, 1)
          .text(template.business_name || 'RECEIPT')
          .style('normal')
          .text(template.business_address || '')
          .text(template.business_contact || '')
          .align('lt');

        const isNewStyle = bill.items && bill.items.length > 0 && ('name' in bill.items[0]);
        if (isNewStyle) {
          printer.text('--------------------------------');
          bill.items.forEach(field => {
            const label = (field.name + ':').padEnd(14, ' ');
            const val = String(field.value || '');
            printer.text(`${label} ${val}`);
          });
          printer.text('--------------------------------');
          printer
            .align('rt')
            .style('b')
            .text(`Total: ${template.currency} ${bill.grand_total.toFixed(2)}`)
            .style('normal')
            .align('ct')
            .text('--------------------------------')
            .text(template.footer_notes || 'Thank You!')
            .cut()
            .close();
        } else {
          printer
            .text(`Bill No : ${bill.bill_number}`)
            .text(`Date    : ${new Date(bill.created_at).toLocaleString()}`)
            .text(`Customer: ${bill.customer_name || 'Cash'}`)
            .text('--------------------------------')
            .text('Item          Qty  Price  Amount');
          
          bill.items.forEach(item => {
            const name = item.description.substring(0, 12).padEnd(12, ' ');
            const qty = String(item.quantity).padStart(3, ' ');
            const price = String(item.unit_price).padStart(6, ' ');
            const amt = String(item.amount).padStart(7, ' ');
            printer.text(`${name} ${qty} ${price} ${amt}`);
          });

          printer
            .text('--------------------------------')
            .align('rt')
            .text(`Subtotal: ${template.currency} ${bill.subtotal.toFixed(2)}`)
            .text(`Tax: ${template.currency} ${bill.tax_amount.toFixed(2)}`)
            .text(`Discount: ${template.currency} ${bill.discount_amount.toFixed(2)}`)
            .style('b')
            .text(`Total: ${template.currency} ${bill.grand_total.toFixed(2)}`)
            .style('normal')
            .align('ct')
            .text('--------------------------------')
            .text(template.footer_notes || 'Thank You!')
            .cut()
            .close();
        }
          
        resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = { printReceipt };
