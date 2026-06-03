from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QFormLayout, 
                               QLineEdit, QPushButton, QTableWidget, QTableWidgetItem,
                               QHeaderView, QLabel, QMessageBox, QGroupBox, QDialog)
from PyQt6.QtCore import Qt
from ui.preview_dialog import PreviewDialog
import os

class BillForm(QWidget):
    def __init__(self, db_manager, printer_manager, pdf_generator, excel_generator, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.printer_manager = printer_manager
        self.pdf_generator = pdf_generator
        self.excel_generator = excel_generator
        
        self.items_data = [] # List of dicts
        self.current_bill = None # Store the generated bill if saved
        
        self.init_ui()
        
    def init_ui(self):
        main_layout = QVBoxLayout(self)
        
        # Customer Info
        cust_group = QGroupBox("Customer Details")
        cust_layout = QFormLayout()
        self.input_cust_name = QLineEdit()
        self.input_cust_phone = QLineEdit()
        self.input_cust_address = QLineEdit()
        cust_layout.addRow("Name:", self.input_cust_name)
        cust_layout.addRow("Phone:", self.input_cust_phone)
        cust_layout.addRow("Address:", self.input_cust_address)
        cust_group.setLayout(cust_layout)
        main_layout.addWidget(cust_group)
        
        # Item Entry
        item_group = QGroupBox("Add Item")
        item_layout = QHBoxLayout()
        self.input_desc = QLineEdit()
        self.input_desc.setPlaceholderText("Description")
        self.input_qty = QLineEdit()
        self.input_qty.setPlaceholderText("Qty")
        self.input_price = QLineEdit()
        self.input_price.setPlaceholderText("Unit Price")
        self.btn_add_item = QPushButton("Add")
        self.btn_add_item.clicked.connect(self.add_item)
        
        item_layout.addWidget(self.input_desc)
        item_layout.addWidget(self.input_qty)
        item_layout.addWidget(self.input_price)
        item_layout.addWidget(self.btn_add_item)
        item_group.setLayout(item_layout)
        main_layout.addWidget(item_group)
        
        # Items Table
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Description", "Qty", "Price", "Amount", "Action"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        main_layout.addWidget(self.table)
        
        # Totals
        totals_layout = QFormLayout()
        self.lbl_subtotal = QLabel("0.00")
        self.lbl_tax = QLabel("0.00")
        self.input_discount = QLineEdit("0")
        self.input_discount.textChanged.connect(self.update_totals)
        self.lbl_grand_total = QLabel("0.00")
        self.lbl_grand_total.setStyleSheet("font-weight: bold; font-size: 16px;")
        
        totals_layout.addRow("Subtotal:", self.lbl_subtotal)
        totals_layout.addRow("Tax:", self.lbl_tax)
        totals_layout.addRow("Discount:", self.input_discount)
        totals_layout.addRow("Grand Total:", self.lbl_grand_total)
        main_layout.addLayout(totals_layout)
        
        # Actions
        actions_layout = QHBoxLayout()
        self.btn_save = QPushButton("Save Bill")
        self.btn_print = QPushButton("Preview && Print")
        self.btn_pdf = QPushButton("Export PDF")
        self.btn_excel = QPushButton("Export Excel")
        self.btn_new = QPushButton("Clear / New Bill")
        
        self.btn_save.clicked.connect(self.save_bill)
        self.btn_print.clicked.connect(self.preview_print)
        self.btn_pdf.clicked.connect(self.export_pdf)
        self.btn_excel.clicked.connect(self.export_excel)
        self.btn_new.clicked.connect(self.clear_form)
        
        self.btn_print.setEnabled(False)
        self.btn_pdf.setEnabled(False)
        self.btn_excel.setEnabled(False)
        
        actions_layout.addWidget(self.btn_save)
        actions_layout.addWidget(self.btn_print)
        actions_layout.addWidget(self.btn_pdf)
        actions_layout.addWidget(self.btn_excel)
        actions_layout.addWidget(self.btn_new)
        main_layout.addLayout(actions_layout)
        
    def add_item(self):
        desc = self.input_desc.text().strip()
        try:
            qty = int(self.input_qty.text())
            price = float(self.input_price.text())
        except ValueError:
            QMessageBox.warning(self, "Error", "Invalid quantity or price.")
            return
            
        if not desc:
            QMessageBox.warning(self, "Error", "Description cannot be empty.")
            return
            
        amount = qty * price
        item = {
            "description": desc,
            "quantity": qty,
            "unit_price": price,
            "amount": amount
        }
        self.items_data.append(item)
        self.refresh_table()
        
        self.input_desc.clear()
        self.input_qty.clear()
        self.input_price.clear()
        self.input_desc.setFocus()
        
    def refresh_table(self):
        self.table.setRowCount(len(self.items_data))
        for row, item in enumerate(self.items_data):
            self.table.setItem(row, 0, QTableWidgetItem(item['description']))
            self.table.setItem(row, 1, QTableWidgetItem(str(item['quantity'])))
            self.table.setItem(row, 2, QTableWidgetItem(f"{item['unit_price']:.2f}"))
            self.table.setItem(row, 3, QTableWidgetItem(f"{item['amount']:.2f}"))
            
            btn_remove = QPushButton("Remove")
            btn_remove.clicked.connect(lambda checked, r=row: self.remove_item(r))
            self.table.setCellWidget(row, 4, btn_remove)
            
        self.update_totals()
        
    def remove_item(self, index):
        if 0 <= index < len(self.items_data):
            self.items_data.pop(index)
            self.refresh_table()
            
    def update_totals(self):
        subtotal = sum(item['amount'] for item in self.items_data)
        
        template = self.db_manager.get_template()
        tax_rate = template.tax_rate if template else 0.0
        tax_amount = subtotal * (tax_rate / 100)
        
        try:
            discount = float(self.input_discount.text())
        except ValueError:
            discount = 0.0
            
        grand_total = subtotal + tax_amount - discount
        
        self.lbl_subtotal.setText(f"{subtotal:.2f}")
        self.lbl_tax.setText(f"{tax_amount:.2f}")
        self.lbl_grand_total.setText(f"{grand_total:.2f}")
        
    def save_bill(self):
        if not self.items_data:
            QMessageBox.warning(self, "Error", "Add at least one item to save the bill.")
            return
            
        try:
            discount = float(self.input_discount.text())
        except ValueError:
            discount = 0.0
            
        bill_data = {
            "customer_name": self.input_cust_name.text(),
            "customer_address": self.input_cust_address.text(),
            "customer_phone": self.input_cust_phone.text(),
            "subtotal": float(self.lbl_subtotal.text()),
            "tax_amount": float(self.lbl_tax.text()),
            "discount_amount": discount,
            "grand_total": float(self.lbl_grand_total.text()),
        }
        
        self.current_bill = self.db_manager.save_bill(bill_data, self.items_data)
        QMessageBox.information(self, "Success", f"Bill {self.current_bill['bill_number']} saved!")
        
        # Enable print/export buttons
        self.btn_save.setEnabled(False)
        self.btn_print.setEnabled(True)
        self.btn_pdf.setEnabled(True)
        self.btn_excel.setEnabled(True)

    def preview_print(self):
        if not self.current_bill:
            return
            
        template = self.db_manager.get_template()
        preview_text = self.printer_manager.get_preview_text(self.current_bill, template)
        
        dialog = PreviewDialog(self, preview_text)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            # User clicked Print
            res = self.printer_manager.print_bill(self.current_bill, template)
            QMessageBox.information(self, "Print", res)

    def export_pdf(self):
        if not self.current_bill: return
        template = self.db_manager.get_template()
        path = self.pdf_generator.generate_bill_pdf(self.current_bill, template)
        QMessageBox.information(self, "Exported", f"PDF exported to {os.path.abspath(path)}")

    def export_excel(self):
        if not self.current_bill: return
        template = self.db_manager.get_template()
        path = self.excel_generator.generate_bill_excel(self.current_bill, template)
        QMessageBox.information(self, "Exported", f"Excel exported to {os.path.abspath(path)}")

    def clear_form(self):
        self.items_data = []
        self.current_bill = None
        self.input_cust_name.clear()
        self.input_cust_phone.clear()
        self.input_cust_address.clear()
        self.input_discount.setText("0")
        self.refresh_table()
        
        self.btn_save.setEnabled(True)
        self.btn_print.setEnabled(False)
        self.btn_pdf.setEnabled(False)
        self.btn_excel.setEnabled(False)
