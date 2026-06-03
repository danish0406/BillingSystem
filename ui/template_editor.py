from PyQt6.QtWidgets import QWidget, QVBoxLayout, QFormLayout, QLineEdit, QTextEdit, QDoubleSpinBox, QPushButton, QMessageBox

class TemplateEditor(QWidget):
    def __init__(self, db_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        
        layout = QVBoxLayout(self)
        form_layout = QFormLayout()
        
        self.input_company_name = QLineEdit()
        self.input_company_address = QTextEdit()
        self.input_company_address.setMaximumHeight(80)
        
        self.input_phone = QLineEdit()
        self.input_email = QLineEdit()
        
        self.input_footer_text = QTextEdit()
        self.input_footer_text.setMaximumHeight(80)
        
        self.input_tax_rate = QDoubleSpinBox()
        self.input_tax_rate.setRange(0, 100)
        self.input_tax_rate.setSuffix(" %")
        
        form_layout.addRow("Company Name:", self.input_company_name)
        form_layout.addRow("Company Address:", self.input_company_address)
        form_layout.addRow("Phone:", self.input_phone)
        form_layout.addRow("Email:", self.input_email)
        form_layout.addRow("Footer Text:", self.input_footer_text)
        form_layout.addRow("Tax Rate:", self.input_tax_rate)
        
        layout.addLayout(form_layout)
        
        self.btn_save = QPushButton("Save Template")
        self.btn_save.clicked.connect(self.save_template)
        layout.addWidget(self.btn_save)
        layout.addStretch()
        
        self.load_template()

    def load_template(self):
        template = self.db_manager.get_template()
        if template:
            self.input_company_name.setText(template.company_name)
            self.input_company_address.setPlainText(template.company_address)
            self.input_phone.setText(template.phone)
            self.input_email.setText(template.email)
            self.input_footer_text.setPlainText(template.footer_text)
            self.input_tax_rate.setValue(template.tax_rate)

    def save_template(self):
        data = {
            "company_name": self.input_company_name.text(),
            "company_address": self.input_company_address.toPlainText(),
            "phone": self.input_phone.text(),
            "email": self.input_email.text(),
            "footer_text": self.input_footer_text.toPlainText(),
            "tax_rate": self.input_tax_rate.value()
        }
        self.db_manager.update_template(data)
        QMessageBox.information(self, "Success", "Template saved successfully!")
