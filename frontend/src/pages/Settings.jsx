import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Printer } from 'lucide-react';

const Settings = () => {
  const [printerType, setPrinterType] = useState('USB');
  
  useEffect(() => {
    const savedPrinter = localStorage.getItem('printerType');
    if (savedPrinter) {
      setPrinterType(savedPrinter);
    }
  }, []);
  
  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('printerType', printerType);
    alert('Settings saved successfully.');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <SettingsIcon size={32} />
        <h1 style={{ margin: 0 }}>System Settings</h1>
      </div>
      
      <div className="card">
        <h3 className="mb-4 flex items-center gap-2"><Printer size={20} /> Printer Configuration</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Connection Type</label>
            <select 
              className="form-input" 
              value={printerType} 
              onChange={(e) => setPrinterType(e.target.value)}
            >
              <option value="USB">USB (Default)</option>
              <option value="Network">Network / LAN</option>
              <option value="Serial">Serial / COM</option>
            </select>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Note: The backend currently defaults to USB connection using `escpos-usb`. Changing to Network or Serial will require updating the backend `printerService.js` configuration.
            </p>
          </div>
          
          <button type="submit" className="btn btn-primary mt-4 w-full" style={{ width: '100%' }}>
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
