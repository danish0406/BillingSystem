"""
export_utils.py – Excel (A4 format) generation for bills using openpyxl.
"""
import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


def generate_excel(bill):
    """
    Generate an A4-format Excel spreadsheet for a bill.
    Returns a BytesIO stream containing the XLSX file.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = f"Invoice {bill.invoice_number}"

    # ── Style definitions ──────────────────────
    fam = 'Segoe UI'
    company_font = Font(name=fam, size=16, bold=True, color='1E293B')
    title_font = Font(name=fam, size=18, bold=True, color='4F46E5')
    section_font = Font(name=fam, size=11, bold=True, color='475569')
    regular_font = Font(name=fam, size=10, color='334155')
    bold_font = Font(name=fam, size=10, bold=True, color='1E293B')
    header_font = Font(name=fam, size=11, bold=True, color='FFFFFF')
    footer_font = Font(name=fam, size=9, italic=True, color='64748B')

    header_fill = PatternFill(start_color='4F46E5', end_color='4F46E5', fill_type='solid')
    subtotal_fill = PatternFill(start_color='F1F5F9', end_color='F1F5F9', fill_type='solid')
    total_fill = PatternFill(start_color='EEF2FF', end_color='EEF2FF', fill_type='solid')

    thin = Side(border_style='thin', color='CBD5E1')
    thin_border = Border(left=thin, right=thin, top=thin, bottom=thin)
    total_border = Border(top=thin, bottom=Side(border_style='double', color='1E293B'))

    # ── 1. Company header ──────────────────────
    ws['A1'] = bill.template.company_name
    ws['A1'].font = company_font

    ws['D1'] = 'INVOICE'
    ws['D1'].font = title_font
    ws['D1'].alignment = Alignment(horizontal='right')

    addr_lines = bill.template.company_address.split('\n')
    for i, line in enumerate(addr_lines):
        c = ws.cell(row=2 + i, column=1, value=line)
        c.font = regular_font

    # Phone / Email under address
    info_row = 2 + len(addr_lines)
    if bill.template.phone:
        ws.cell(row=info_row, column=1, value=f'Phone: {bill.template.phone}').font = regular_font
        info_row += 1
    if bill.template.email:
        ws.cell(row=info_row, column=1, value=f'Email: {bill.template.email}').font = regular_font
        info_row += 1

    # ── 2. Invoice meta ────────────────────────
    detail_row = max(info_row + 1, 5)
    ws.cell(row=detail_row, column=4, value=f'Invoice No: {bill.invoice_number}').font = bold_font
    ws.cell(row=detail_row, column=4).alignment = Alignment(horizontal='right')
    ws.cell(row=detail_row + 1, column=4, value=f'Date: {bill.bill_date}').font = regular_font
    ws.cell(row=detail_row + 1, column=4).alignment = Alignment(horizontal='right')

    # ── 3. Bill-To ─────────────────────────────
    bt = detail_row + 3
    ws.cell(row=bt, column=1, value='BILL TO:').font = section_font
    ws.cell(row=bt + 1, column=1, value=bill.customer_name).font = bold_font
    for i, line in enumerate(bill.customer_address.split('\n')):
        ws.cell(row=bt + 2 + i, column=1, value=line).font = regular_font

    # ── 4. Items table ─────────────────────────
    hdr_row = bt + 3 + len(bill.customer_address.split('\n'))
    
    headers = []
    col_types = []
    for col in bill.template.columns:
        headers.append(col.get('label', ''))
        col_types.append(col)
    headers.append('Total')
    
    num_cols = len(headers)

    for ci, h in enumerate(headers, 1):
        c = ws.cell(row=hdr_row, column=ci, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal='left' if ci == 1 else 'right', vertical='center')
        c.border = thin_border

    row = hdr_row + 1
    for item in bill.items:
        ci = 1
        for col in col_types:
            if col.get('system') == 'item_name':
                ws.cell(row=row, column=ci, value=item.item_name).font = regular_font
            elif col.get('system') == 'quantity':
                ws.cell(row=row, column=ci, value=item.quantity).font = regular_font
            elif col.get('system') == 'price':
                c = ws.cell(row=row, column=ci, value=item.price_per_unit)
                c.font = regular_font
                c.number_format = '$#,##0.00'
            else:
                val = item.custom_fields.get(col.get('key'), '')
                if col.get('type') == 'number':
                    try:
                        c = ws.cell(row=row, column=ci, value=float(val))
                        c.number_format = '#,##0.00'
                    except ValueError:
                        c = ws.cell(row=row, column=ci, value=val)
                else:
                    c = ws.cell(row=row, column=ci, value=str(val))
                c.font = regular_font
            ci += 1
            
        # Total column
        c = ws.cell(row=row, column=ci, value=item.total)
        c.font = regular_font
        c.number_format = '$#,##0.00'
        
        for c_idx in range(1, num_cols + 1):
            ws.cell(row=row, column=c_idx).border = thin_border
            ws.cell(row=row, column=c_idx).alignment = Alignment(
                horizontal='left' if c_idx == 1 else 'right'
            )
        row += 1

    # ── 5. Summary ─────────────────────────────
    row += 1
    for label, val, fill, brd in [
        ('Subtotal', bill.subtotal, subtotal_fill, thin_border),
        (f'Tax ({bill.tax_rate}%)', bill.tax_amount, subtotal_fill, thin_border),
        ('Grand Total', bill.grand_total, total_fill, total_border),
    ]:
        ws.cell(row=row, column=num_cols - 1, value=label).font = bold_font
        ws.cell(row=row, column=num_cols - 1).alignment = Alignment(horizontal='right')
        ws.cell(row=row, column=num_cols, value=val).font = bold_font
        ws.cell(row=row, column=num_cols).alignment = Alignment(horizontal='right')
        ws.cell(row=row, column=num_cols).number_format = '$#,##0.00'
        for ci in (num_cols - 1, num_cols):
            ws.cell(row=row, column=ci).fill = fill
            ws.cell(row=row, column=ci).border = brd
        row += 1

    # ── 6. Footer ──────────────────────────────
    if bill.template.footer_text:
        row += 1
        ws.cell(row=row, column=1, value=bill.template.footer_text).font = footer_font
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=4)
        ws.cell(row=row, column=1).alignment = Alignment(horizontal='center')

    # Auto-fit columns
    for col in ws.columns:
        letter = get_column_letter(col[0].column)
        max_len = max(
            (len(str(c.value or '')) for c in col if c.coordinate not in ws.merged_cells),
            default=8,
        )
        ws.column_dimensions[letter].width = max(max_len + 3, 12)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
