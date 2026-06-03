from PyQt6.QtWidgets import QDialog, QVBoxLayout, QTextEdit, QPushButton, QHBoxLayout
from PyQt6.QtGui import QFont

class PreviewDialog(QDialog):
    def __init__(self, parent=None, preview_text=""):
        super().__init__(parent)
        self.setWindowTitle("Print Preview (80mm Receipt)")
        self.resize(400, 600)
        
        layout = QVBoxLayout(self)
        
        # We use a monospaced font so the columns align correctly for the preview
        self.text_edit = QTextEdit()
        font = QFont("Courier", 10)
        self.text_edit.setFont(font)
        self.text_edit.setReadOnly(True)
        self.text_edit.setPlainText(preview_text)
        layout.addWidget(self.text_edit)
        
        btn_layout = QHBoxLayout()
        self.btn_print = QPushButton("Print")
        self.btn_close = QPushButton("Close")
        
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_print)
        btn_layout.addWidget(self.btn_close)
        
        layout.addLayout(btn_layout)
        
        self.btn_close.clicked.connect(self.reject)
        self.btn_print.clicked.connect(self.accept)
