from PyQt6.QtWidgets import QMainWindow, QTabWidget, QVBoxLayout, QWidget
from ui.bill_form import BillForm
from ui.history_view import HistoryView
from ui.template_editor import TemplateEditor
from database.db_manager import DBManager
from core.printer_manager import PrinterManager
from core.pdf_generator import PDFGenerator
from core.excel_generator import ExcelGenerator

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Billing System")
        self.resize(1000, 700)
        
        # Initialize Core Components
        # Ensure we have data folder
        import os
        data_dir = "data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            
        self.db_manager = DBManager(os.path.join(data_dir, "billing.db"))
        self.printer_manager = PrinterManager(printer_type="dummy") # Replace with "usb" and args if needed
        self.pdf_generator = PDFGenerator(output_dir=os.path.join(data_dir, "exports"))
        self.excel_generator = ExcelGenerator(output_dir=os.path.join(data_dir, "exports"))
        
        # Setup UI
        self.tabs = QTabWidget()
        
        self.bill_form = BillForm(self.db_manager, self.printer_manager, self.pdf_generator, self.excel_generator)
        self.history_view = HistoryView(self.db_manager, self.printer_manager, self.pdf_generator, self.excel_generator)
        self.template_editor = TemplateEditor(self.db_manager)
        
        self.tabs.addTab(self.bill_form, "New Bill")
        self.tabs.addTab(self.history_view, "History")
        self.tabs.addTab(self.template_editor, "Settings / Template")
        
        # When History tab is clicked, refresh data
        self.tabs.currentChanged.connect(self.on_tab_change)
        
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.addWidget(self.tabs)
        self.setCentralWidget(container)
        
    def on_tab_change(self, index):
        if index == 1: # History tab
            self.history_view.load_data()
