"""
pdf_utils.py – PDF receipt generation optimized for 80mm thermal printers.

Paper specs:
  - Total width : 80 mm  ≈ 226.77 pt
  - Printable   : 72 mm  ≈ 204.09 pt  (4 mm margin each side ≈ 11.34 pt)
  - Monospace font (Courier) for column alignment
  - Black-and-white only
"""
import io
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import landscape
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors

# ── Page dimensions ────────────────────────────
PAGE_WIDTH = 80 * mm        # 226.77 pt
PRINTABLE = 72 * mm         # 204.09 pt
MARGIN_LR = 4 * mm          # 11.34 pt
RECEIPT_PAGE = (PAGE_WIDTH, 2000 * mm)  # tall "roll" page; trimmed by printer

SEPARATOR = '-' * 32  # Fits ~32 chars at 10 pt Courier


def _style(name, **kw):
    """Shortcut to build a ParagraphStyle using Courier."""
    defaults = dict(
        fontName='Courier',
        fontSize=10,
        leading=13,
        textColor=colors.black,
        alignment=0,  # left
    )
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


# Pre-built styles
S_CENTER      = _style('center',      alignment=1)
S_HEADER      = _style('header',      fontName='Courier-Bold', fontSize=14, leading=17, alignment=1)
S_SUB_HEADER  = _style('subheader',   fontSize=9, leading=11, alignment=1)
S_NORMAL      = _style('normal')
S_BOLD        = _style('bold',        fontName='Courier-Bold')
S_RIGHT       = _style('right',       alignment=2)
S_BOLD_RIGHT  = _style('boldRight',   fontName='Courier-Bold', alignment=2)
S_TOTAL       = _style('total',       fontName='Courier-Bold', fontSize=12, leading=15, alignment=2)
S_FOOTER      = _style('footer',      fontSize=9, leading=11, alignment=1)
S_SEP         = _style('sep',         fontSize=10, alignment=1)


def generate_receipt_pdf(bill):
    """
    Build a PDF receipt sized for 80 mm thermal paper.
    Returns a BytesIO buffer containing the PDF.
    """
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=RECEIPT_PAGE,
        leftMargin=MARGIN_LR,
        rightMargin=MARGIN_LR,
        topMargin=4 * mm,
        bottomMargin=4 * mm,
    )

    story = []
    tpl = bill.template

    # ── Header: company info ───────────────────
    story.append(Paragraph(tpl.company_name, S_HEADER))
    for line in tpl.company_address.split('\n'):
        story.append(Paragraph(line.strip(), S_SUB_HEADER))
    if tpl.phone:
        story.append(Paragraph(f'Tel: {tpl.phone}', S_SUB_HEADER))
    if tpl.email:
        story.append(Paragraph(tpl.email, S_SUB_HEADER))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(SEPARATOR, S_SEP))
    story.append(Spacer(1, 1 * mm))

    # ── Invoice meta ───────────────────────────
    story.append(Paragraph(f'Invoice: {bill.invoice_number}', S_NORMAL))
    story.append(Paragraph(f'Date   : {bill.bill_date}', S_NORMAL))
    story.append(Spacer(1, 1 * mm))
    story.append(Paragraph(f'Customer: {bill.customer_name}', S_NORMAL))
    for line in bill.customer_address.split('\n'):
        story.append(Paragraph(f'  {line.strip()}', S_NORMAL))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(SEPARATOR, S_SEP))
    story.append(Spacer(1, 1 * mm))

    # ── Items table ────────────────────────────
    # 204 pt total width for printable area
    col_w = [124, 30, 50]

    hdr_style = _style('thdr', fontName='Courier-Bold', fontSize=9, leading=11)
    hdr_r     = _style('thdrR', fontName='Courier-Bold', fontSize=9, leading=11, alignment=2)
    cell_s    = _style('tcell', fontName='Courier-Bold', fontSize=9, leading=11)
    cell_r    = _style('tcellR', fontName='Courier-Bold', fontSize=9, leading=11, alignment=2)
    cell_d    = _style('tcellD', fontSize=9, leading=11)

    data = [[
        Paragraph('NAME', hdr_style),
        Paragraph('QTY', hdr_r),
        Paragraph('PRICE', hdr_r),
    ]]

    for item in bill.items:
        # Build combined text for the first column
        name_text = item.item_name
        
        custom_fields_text = []
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
                custom_fields_text.append(f"{col.get('label').upper()}: {val}")
                
        if custom_fields_text:
            name_text += "<br/>" + "<br/>".join(f'<font name="Courier" size="8">{t}</font>' for t in custom_fields_text)

        data.append([
            Paragraph(name_text, cell_s),
            Paragraph(str(item.quantity), cell_r),
            Paragraph(f'{item.total:.2f}', cell_r),
        ])

    tbl = Table(data, colWidths=col_w)
    tbl.setStyle(TableStyle([
        ('VALIGN',      (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',  (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 1),
        ('RIGHTPADDING',(0, 0), (-1, -1), 1),
        ('LINEBELOW',   (0, 0), (1, 0), 0.5, colors.black),  # header underline
    ]))
    story.append(tbl)

    story.append(Spacer(1, 1 * mm))
    story.append(Paragraph(SEPARATOR, S_SEP))
    story.append(Spacer(1, 1 * mm))

    # ── Totals ─────────────────────────────────
    def _total_row(label, amount, style=S_RIGHT):
        return Paragraph(f'{label}: ${amount:,.2f}', style)

    story.append(_total_row('SUBTOTAL', bill.subtotal))
    story.append(_total_row(f'TAX (GST {bill.tax_rate}%)', bill.tax_amount))
    story.append(Spacer(1, 1 * mm))
    story.append(_total_row('TOTAL:', bill.grand_total, S_TOTAL))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(SEPARATOR, S_SEP))

    # ── Footer ─────────────────────────────────
    if tpl.footer_text:
        story.append(Spacer(1, 2 * mm))
        for line in tpl.footer_text.split('\n'):
            story.append(Paragraph(line.strip(), S_FOOTER))

    # Auto-feed: 3 blank lines at the bottom
    story.append(Spacer(1, 10 * mm))

    doc.build(story)
    buf.seek(0)
    return buf
