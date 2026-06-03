import os
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton, 
                               QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox, QDialog)
from PyQt6.QtCore import Qt
from ui.preview_dialog import PreviewDialog

class HistoryView(QWidget):
    def __init__(self, db_manager, printer_manager, pdf_generator, excel_generator, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.printer_manager = printer_manager
        self.pdf_generator = pdf_generator
        self.excel_generator = excel_generator
        
        self.init_ui()
        self.load_data()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Search bar
        search_layout = QHBoxLayout()
        self.input_search = QLineEdit()
        self.input_search.setPlaceholderText("Search by Bill No or Customer Name...")
        self.input_search.textChanged.connect(self.load_data)
        
        self.btn_refresh = QPushButton("Refresh")
        self.btn_refresh.clicked.connect(self.load_data)
        
        search_layout.addWidget(self.input_search)
        search_layout.addWidget(self.btn_refresh)
        layout.addLayout(search_layout)
        
        # Table
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Date", "Bill Number", "Customer", "Total", "Actions"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

    def load_data(self):
        search_term = self.input_search.text().strip()
        bills = self.db_manager.get_all_bills(search_term)
        
        self.table.setRowCount(len(bills))
        for row, bill in enumerate(bills):
            self.table.setItem(row, 0, QTableWidgetItem(bill['date_time'].strftime('%Y-%m-%d %H:%M')))
            self.table.setItem(row, 1, QTableWidgetItem(bill['bill_number']))
            self.table.setItem(row, 2, QTableWidgetItem(bill['customer_name'] or ""))
            self.table.setItem(row, 3, QTableWidgetItem(f"{bill['grand_total']:.2f}"))
            
            # Action Buttons Layout
            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(0,0,0,0)
            
            btn_view = QPushButton("View/Print")
            btn_pdf = QPushButton("PDF")
            btn_excel = QPushButton("Excel")
            
            btn_view.clicked.connect(lambda checked, b_id=bill['id']: self.view_print(b_id))
            btn_pdf.clicked.connect(lambda checked, b_id=bill['id']: self.export_pdf(b_id))
            btn_excel.clicked.connect(lambda checked, b_id=bill['id']: self.export_excel(b_id))
            
            action_layout.addWidget(btn_view)
            action_layout.addWidget(btn_pdf)
            action_layout.addWidget(btn_excel)
            
            self.table.setCellWidget(row, 4, action_widget)

    def view_print(self, bill_id):
        bill = self.db_manager.get_bill_by_id(bill_id)
        if not bill:
            return
            
        template = self.db_manager.get_template()
        preview_text = self.printer_manager.get_preview_text(bill, template)
        
        dialog = PreviewDialog(self, preview_text)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            res = self.printer_manager.print_bill(bill, template)
            QMessageBox.information(self, "Print", res)

    def export_pdf(self, bill_id):
        bill = self.db_manager.get_bill_by_id(bill_id)
        if not bill: return
        template = self.db_manager.get_template()
        path = self.pdf_generator.generate_bill_pdf(bill, template)
        QMessageBox.information(self, "Exported", f"PDF exported to {os.path.abspath(path)}")

    def export_excel(self, bill_id):
        bill = self.db_manager.get_bill_by_id(bill_id)
        if not bill: return
        template = self.db_manager.get_template()
        path = self.excel_generator.generate_bill_excel(bill, template)
        QMessageBox.information(self, "Exported", f"Excel exported to {os.path.abspath(path)}")
