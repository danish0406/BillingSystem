import os
from reportlab.lib.pagesizes import A4, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFGenerator:
    def __init__(self, output_dir="exports"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_bill_pdf(self, bill, template) -> str:
        """
        Generate a PDF bill.
        bill: dictionary containing bill details
        template: Template object
        """
        file_path = os.path.join(self.output_dir, f"{bill['bill_number']}.pdf")
        
        doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            alignment=1, # Center
            fontSize=18,
            spaceAfter=10
        )
        normal_style = styles['Normal']
        
        elements = []
        
        # Header (Company Info)
        elements.append(Paragraph(f"<b>{template.company_name}</b>", title_style))
        address_lines = template.company_address.replace('\n', '<br/>')
        elements.append(Paragraph(address_lines, styles['Normal']))
        elements.append(Paragraph(f"Phone: {template.phone} | Email: {template.email}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Bill Info
        elements.append(Paragraph(f"<b>INVOICE</b>", styles['Heading2']))
        elements.append(Paragraph(f"<b>Bill Number:</b> {bill['bill_number']}", normal_style))
        elements.append(Paragraph(f"<b>Date:</b> {bill['date_time'].strftime('%Y-%m-%d %H:%M')}", normal_style))
        if bill['customer_name']:
            elements.append(Paragraph(f"<b>Customer:</b> {bill['customer_name']}", normal_style))
        if bill['customer_phone']:
            elements.append(Paragraph(f"<b>Phone:</b> {bill['customer_phone']}", normal_style))
        elements.append(Spacer(1, 20))
        
        # Table of items
        data = [['Description', 'Qty', 'Unit Price', 'Amount']]
        for item in bill['items']:
            data.append([
                item['description'],
                str(item['quantity']),
                f"{item['unit_price']:.2f}",
                f"{item['amount']:.2f}"
            ])
            
        data.append(['', '', 'Subtotal:', f"{bill['subtotal']:.2f}"])
        if bill['tax_amount'] > 0:
            data.append(['', '', 'Tax:', f"{bill['tax_amount']:.2f}"])
        if bill['discount_amount'] > 0:
            data.append(['', '', 'Discount:', f"-{bill['discount_amount']:.2f}"])
        data.append(['', '', 'Grand Total:', f"{bill['grand_total']:.2f}"])

        table = Table(data, colWidths=[250, 50, 100, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Bold totals
            ('FONTNAME', (2, -4), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 30))
        
        # Footer
        footer_lines = template.footer_text.replace('\n', '<br/>')
        elements.append(Paragraph(footer_lines, ParagraphStyle('Footer', parent=styles['Normal'], alignment=1)))
        
        doc.build(elements)
        return file_path
