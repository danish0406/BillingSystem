from escpos.printer import Dummy, Usb, Network
import textwrap

class PrinterManager:
    def __init__(self, printer_type="dummy", **kwargs):
        """
        Initialize the printer connection.
        printer_type: "dummy", "usb", "network"
        kwargs: args needed for specific printer connection
        """
        self.printer_type = printer_type
        self.width = 48 # Typical 80mm printer width in characters
        
        try:
            if printer_type == "usb":
                self.printer = Usb(kwargs.get("idVendor"), kwargs.get("idProduct"))
            elif printer_type == "network":
                self.printer = Network(kwargs.get("ip"))
            else:
                self.printer = Dummy()
        except Exception as e:
            print(f"Failed to connect to printer: {e}. Falling back to Dummy.")
            self.printer = Dummy()

    def _center(self, text):
        if not text:
            return ""
        lines = text.split('\n')
        centered_lines = [line.strip().center(self.width) for line in lines]
        return "\n".join(centered_lines)
        
    def _left_right(self, left, right):
        """Format two strings on opposite ends of a line"""
        space_len = self.width - len(left) - len(right)
        if space_len > 0:
            return f"{left}{' ' * space_len}{right}"
        return f"{left} {right}"

    def print_bill(self, bill, template):
        p = self.printer
        
        # Header
        p.set(align="center", bold=True, double_height=True, double_width=True)
        p.text(f"{template.company_name}\n")
        
        p.set(align="center", bold=False, double_height=False, double_width=False)
        p.text(f"{template.company_address}\n")
        p.text(f"Phone: {template.phone}\n")
        p.text(f"Email: {template.email}\n")
        p.text("-" * self.width + "\n")
        
        # Bill Info
        p.set(align="left")
        p.text(f"Bill No: {bill['bill_number']}\n")
        p.text(f"Date:    {bill['date_time'].strftime('%Y-%m-%d %H:%M')}\n")
        if bill.get('customer_name'):
            p.text(f"Cust:    {bill['customer_name']}\n")
        p.text("-" * self.width + "\n")
        
        # Items Header
        # Format: Desc(22) Qty(6) Price(9) Amt(9) = 46 + 2 spaces = 48
        p.text(f"{'Description':<22} {'Qty':>6} {'Price':>9} {'Amt':>9}\n")
        p.text("-" * self.width + "\n")
        
        # Items
        for item in bill['items']:
            desc = textwrap.shorten(item['description'], width=22, placeholder="..")
            p.text(f"{desc:<22} {item['quantity']:>6} {item['unit_price']:>9.2f} {item['amount']:>9.2f}\n")
            
        p.text("-" * self.width + "\n")
        
        # Totals
        p.set(align="right")
        p.text(f"Subtotal: {bill['subtotal']:.2f}\n")
        if bill['tax_amount'] > 0:
            p.text(f"Tax: {bill['tax_amount']:.2f}\n")
        if bill['discount_amount'] > 0:
            p.text(f"Discount: -{bill['discount_amount']:.2f}\n")
        
        p.set(align="right", bold=True, double_height=True)
        p.text(f"TOTAL: {bill['grand_total']:.2f}\n")
        
        p.set(align="center", bold=False, double_height=False)
        p.text("-" * self.width + "\n")
        
        # Footer
        p.text(f"{template.footer_text}\n")
        p.text("\n\n\n")
        p.cut()
        
        if isinstance(self.printer, Dummy):
            print("--- DUMMY PRINTER OUTPUT ---")
            print(self.printer.output.decode('utf-8'))
            print("----------------------------")
            return self.printer.output.decode('utf-8')
        
        return "Printed Successfully"

    def get_preview_text(self, bill, template):
        """Generate a plain text version for print preview."""
        old_printer = self.printer
        self.printer = Dummy()
        text_output = self.print_bill(bill, template)
        self.printer = old_printer
        return text_output
