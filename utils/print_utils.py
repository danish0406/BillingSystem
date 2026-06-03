"""
print_utils.py – Generate print-ready HTML optimised for 80mm thermal printers.

The returned HTML is a self-contained document with embedded CSS that:
  • Sets @page size to 80mm × auto
  • Uses Courier monospace for column alignment
  • Prints black-on-white only
  • Includes 2-3 blank lines at the bottom for auto-feed
"""

SEPARATOR = '-' * 32


def generate_print_html(bill):
    """
    Return a complete HTML string representing a receipt
    ready for 80mm thermal printing.
    """
    tpl = bill.template

    # Build item rows with NAME, QTY, PRICE layout
    item_rows = ''
    for item in bill.items:
        # Build custom fields HTML
        custom_fields_html = ''
        for col in tpl.columns:
            if col.get('system') in ['item_name', 'quantity', 'price']:
                continue
                
            val = item.custom_fields.get(col.get('key'), '')
            if col.get('type') == 'number':
                try:
                    val = f'{float(val):.2f}'
                except ValueError:
                    pass
            if val or val == 0:
                custom_fields_html += f'<br>{col.get("label").upper()}: {val}'
                
        row_html = f'''
        <tr>
          <td class="item-name" style="padding-top: 4px; font-weight: bold;">
            {item.item_name}
            <span style="font-weight: normal; font-size: 9pt;">{custom_fields_html}</span>
          </td>
          <td class="num" style="padding-top: 4px; vertical-align: top;">{item.quantity}</td>
          <td class="num" style="padding-top: 4px; vertical-align: top;">{item.total:.2f}</td>
        </tr>'''
        item_rows += row_html

    # Contact info lines
    contact = ''
    if tpl.phone:
        contact += f'<div>Tel: {tpl.phone}</div>'
    if tpl.email:
        contact += f'<div>{tpl.email}</div>'

    # Footer
    footer = ''
    if tpl.footer_text:
        footer_lines = '<br>'.join(tpl.footer_text.split('\n'))
        footer = f'''
        <div class="separator"></div>
        <div class="footer">{footer_lines}</div>'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{bill.invoice_number}</title>
<style>
  @page {{
    size: 80mm auto;
    margin: 0;
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 72mm;
    margin: 0 auto;
    padding: 4mm 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
    color: #000;
    -webkit-print-color-adjust: exact;
  }}
  .header {{
    text-align: center;
    font-weight: bold;
    font-size: 14pt;
    margin-bottom: 2px;
  }}
  .sub-header {{
    text-align: center;
    font-size: 9pt;
    line-height: 1.3;
  }}
  .separator {{
    text-align: center;
    margin: 4px 0;
    letter-spacing: 1px;
  }}
  .meta {{ margin: 2px 0; font-size: 10pt; }}
  .items-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin: 2px 0;
  }}
  .items-table th {{
    font-weight: bold;
    text-align: left;
    border-bottom: 1px solid #000;
    padding: 2px 1px;
  }}
  .items-table th.num,
  .items-table td.num {{
    text-align: right;
  }}
  .items-table td {{
    padding: 2px 1px;
    vertical-align: top;
  }}
  .item-name {{ text-align: left; }}
  .totals {{ margin: 2px 0; }}
  .total-line {{
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    padding: 1px 0;
  }}
  .grand-total {{
    font-weight: bold;
    font-size: 12pt;
    margin-top: 2px;
  }}
  .footer {{
    text-align: center;
    font-size: 9pt;
    margin-top: 4px;
  }}
  .feed {{ height: 10mm; }}
</style>
</head>
<body>

  <div class="header">{tpl.company_name}</div>
  <div class="sub-header">
    {('<br>'.join(tpl.company_address.split(chr(10))))}
    {contact}
  </div>

  <div class="separator">{SEPARATOR}</div>

  <div class="meta">Invoice: {bill.invoice_number}</div>
  <div class="meta">Date   : {bill.bill_date}</div>
  <div class="meta">Customer: {bill.customer_name}</div>
  <div class="meta">&nbsp; {bill.customer_address.replace(chr(10), '<br>&nbsp; ')}</div>

  <div class="separator">{SEPARATOR}</div>

  <table class="items-table">
    <thead>
      <tr>
        <th>NAME</th>
        <th class="num" style="width: 30px;">QTY</th>
        <th class="num" style="width: 45px;">PRICE</th>
      </tr>
    </thead>
    <tbody>
      {item_rows}
    </tbody>
  </table>

  <div class="separator">{SEPARATOR}</div>

  <div class="totals">
    <div class="total-line"><span>Subtotal</span><span>${bill.subtotal:,.2f}</span></div>
    <div class="total-line"><span>Tax ({bill.tax_rate}%)</span><span>${bill.tax_amount:,.2f}</span></div>
    <div class="total-line grand-total"><span>GRAND TOTAL</span><span>${bill.grand_total:,.2f}</span></div>
  </div>

  {footer}

  <!-- Auto-feed blank space -->
  <div class="feed"></div>

</body>
</html>'''

    return html
