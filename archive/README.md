# Desktop Billing System

A single-user desktop billing system application built with Python and PyQt6. This application allows you to create professional bills, manage bill templates, save bills to a local SQLite database, and export them to PDF, Excel, or print directly to an 80mm thermal receipt printer.

## Features
- **Native GUI:** Built with PyQt6 for a modern and responsive desktop experience.
- **Bill Template Management:** Easily customize your business name, address, tax rates, and receipt footers.
- **Bill Generation:** Add items, calculate totals with tax/discount, and save to the database.
- **Export Options:** 
  - Save as Excel (`.xlsx`)
  - Save as PDF (`.pdf`)
  - Print immediately or later as an 80mm receipt.
- **History Tracking:** Search and filter old bills, reprint, or re-export them.
- **Local Storage:** All data is safely stored in a local SQLite database (`data/billing.db`).

---

## Setup Instructions

### Prerequisites
- **Python 3.8+** installed on your system.
- Standard libraries plus those listed in `requirements.txt`.

### Installation
1. Clone or download this repository.
2. Open a terminal or command prompt in the project directory.
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application
To start the billing system, simply run:
```bash
python main.py
```

---

## Configuring the 80mm Printer

By default, the application is configured to use a **Dummy Printer** which simply outputs the receipt text to the console (useful for testing without a real printer).

To configure a real USB thermal receipt printer:
1. Open `ui/main_window.py`.
2. Locate the line initializing `PrinterManager`:
   ```python
   self.printer_manager = PrinterManager(printer_type="dummy")
   ```
3. Change it to use `"usb"` and provide your printer's Vendor ID (idVendor) and Product ID (idProduct) in hexadecimal:
   ```python
   self.printer_manager = PrinterManager(printer_type="usb", idVendor=0x04b8, idProduct=0x0202)
   ```
   *(Note: You can find your Vendor and Product IDs in your OS Device Manager or using a tool like `lsusb`).*

For network printers, use:
```python
self.printer_manager = PrinterManager(printer_type="network", ip="192.168.1.100")
```

---

## How to Use the App

1. **First Run & Settings:** Go to the **"Settings / Template"** tab. Fill in your business details, tax rate, and footer text, then click **Save Template**.
2. **Creating a Bill:** 
   - Go to the **"New Bill"** tab.
   - Enter Customer details (optional).
   - Enter item Description, Quantity, and Unit Price, then click **Add**.
   - Review the calculated Subtotal, Tax, and Grand Total. You can apply a discount if needed.
   - Click **Save Bill**.
3. **Exporting & Printing:** Once saved, you can click **Preview & Print** to see how the 80mm receipt will look before sending it to the printer. You can also export the bill to PDF or Excel. All exports are saved in the `data/exports` directory.
4. **History:** Go to the **"History"** tab to view all past bills. You can search by Bill Number or Customer Name. From here, you can also re-print or re-export any old bill.

---

## Packaging into an Executable (.exe)

To convert this Python application into a standalone Windows `.exe` file so it can be run without installing Python:

1. Install `PyInstaller`:
   ```bash
   pip install pyinstaller
   ```
2. Run PyInstaller in the project root:
   ```bash
   pyinstaller --noconfirm --onedir --windowed --name "BillingSystem"  "main.py"
   ```
3. **Important:** The application requires the `data/` directory to store the database and exports. When you distribute your `.exe` (found in the `dist/BillingSystem/` folder), make sure the `data` folder gets created beside the executable when it runs (the code already handles this automatically).
4. Run your application by double-clicking `dist/BillingSystem/BillingSystem.exe`.
