import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Printer, Save, FileDown, PlusCircle } from 'lucide-react';
import PrintPreview from '../components/PrintPreview';

const NewBill = () => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState({});
  const [savedBillId, setSavedBillId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Custom Fields Add State
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Auto-loaded lists
  const [doctorsList, setDoctorsList] = useState([]);

  // Date formatted helper
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Main Fields configuration
  const [fields, setFields] = useState([
    { name: 'Reg No', value: '', type: 'text', readOnly: true },
    { name: 'Patient Name', value: '', type: 'text', required: true },
    { name: 'Age / Gender', value: '', type: 'text' },
    { name: 'Address', value: '', type: 'text' },
    { name: 'Date', value: '', type: 'text' },
    { name: 'Dr. Name', value: '', type: 'doctor' },
    { name: 'Fee', value: '0.00', type: 'number' },
    { name: 'Ref. Dr', value: '', type: 'text' },
    { name: 'Payment Mode', value: 'CASH', type: 'select', options: ['CASH', 'ONLINE'] },
    { name: 'Payment Type', value: 'ULTRASOUND FEE', type: 'select', options: ['ULTRASOUND FEE', 'CONSULTING FEE'] }
  ]);

  const fetchNextRegNo = async () => {
    try {
      const res = await axios.get('/api/bill/next-number');
      const nextRegNo = res.data.next_number;
      setFields(prev => prev.map(f => {
        if (f.name === 'Reg No') return { ...f, value: String(nextRegNo) };
        if (f.name === 'Date') return { ...f, value: getFormattedDate() };
        return f;
      }));
    } catch (err) {
      console.error('Failed to fetch next reg no', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/bills?limit=1000');
      const uniqueDocs = new Set();
      res.data.data.forEach(bill => {
        if (Array.isArray(bill.items)) {
          const drField = bill.items.find(item => item.name === 'Dr. Name');
          if (drField && drField.value) {
            uniqueDocs.add(drField.value.trim());
          }
        }
      });
      const savedDocs = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
      savedDocs.forEach(d => uniqueDocs.add(d.trim()));
      setDoctorsList(Array.from(uniqueDocs));
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  useEffect(() => {
    axios.get('/api/template').then(res => setTemplate(res.data)).catch(console.error);
    fetchNextRegNo();
    fetchDoctors();
  }, []);

  const handleFieldChange = (index, val) => {
    const updated = [...fields];
    updated[index].value = val;
    setFields(updated);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      alert('Please enter a field name.');
      return;
    }
    if (fields.some(f => f.name.toLowerCase() === newFieldName.trim().toLowerCase())) {
      alert('A field with this name already exists.');
      return;
    }
    const newField = {
      name: newFieldName.trim(),
      value: newFieldType === 'select' ? newFieldOptions.split(',')[0]?.trim() || '' : '',
      type: newFieldType,
      isCustom: true
    };
    if (newFieldType === 'select') {
      newField.options = newFieldOptions.split(',').map(o => o.trim()).filter(Boolean);
    }
    setFields([...fields, newField]);
    setNewFieldName('');
    setNewFieldOptions('');
    setShowAddField(false);
  };

  const handleRemoveField = (fieldName) => {
    setFields(fields.filter(f => f.name !== fieldName));
  };

  const handleSaveOnly = async () => {
    const patientNameField = fields.find(f => f.name === 'Patient Name');
    if (!patientNameField || !patientNameField.value.trim()) {
      alert("Please enter Patient Name.");
      return;
    }

    // Save Dr. Name to local storage if entered
    const drName = fields.find(f => f.name === 'Dr. Name')?.value;
    if (drName && drName.trim()) {
      const savedDocs = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
      if (!savedDocs.includes(drName.trim())) {
        savedDocs.push(drName.trim());
        localStorage.setItem('savedDoctors', JSON.stringify(savedDocs));
        setDoctorsList(prev => [...prev, drName.trim()]);
      }
    }

    try {
      const feeVal = Number(fields.find(f => f.name === 'Fee')?.value) || 0;
      const patientNameVal = fields.find(f => f.name === 'Patient Name')?.value || '';
      const addressVal = fields.find(f => f.name === 'Address')?.value || '';
      const ageGenderVal = fields.find(f => f.name === 'Age / Gender')?.value || '';

      const billData = {
        customer_name: patientNameVal,
        customer_address: addressVal,
        customer_phone: ageGenderVal,
        subtotal: feeVal,
        tax_amount: 0,
        discount_amount: 0,
        grand_total: feeVal,
        items: fields
      };

      const res = await axios.post('/api/bill', billData);
      setSavedBillId(res.data.id);
      
      // Update Reg No value to the saved bill number
      setFields(prev => prev.map(f => {
        if (f.name === 'Reg No') return { ...f, value: String(res.data.bill_number) };
        return f;
      }));

      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save record');
    }
  };

  const handlePrint = async () => {
    if (!savedBillId) return;
    try {
      await axios.post(`/api/bill/${savedBillId}/print`);
      alert('Print job sent successfully!');
    } catch (err) {
      alert('Failed to print');
    }
  };

  const handleExcel = () => {
    if (!savedBillId) return;
    window.open(`http://localhost:3000/api/bill/${savedBillId}/export/excel`);
  };

  const handlePDF = () => {
    if (!savedBillId) return;
    window.open(`http://localhost:3000/api/bill/${savedBillId}/export/pdf`);
  };

  const resetForm = () => {
    setFields([
      { name: 'Reg No', value: '', type: 'text', readOnly: true },
      { name: 'Patient Name', value: '', type: 'text', required: true },
      { name: 'Age / Gender', value: '', type: 'text' },
      { name: 'Address', value: '', type: 'text' },
      { name: 'Date', value: '', type: 'text' },
      { name: 'Dr. Name', value: '', type: 'doctor' },
      { name: 'Fee', value: '0.00', type: 'number' },
      { name: 'Ref. Dr', value: '', type: 'text' },
      { name: 'Payment Mode', value: 'CASH', type: 'select', options: ['CASH', 'ONLINE'] },
      { name: 'Payment Type', value: 'ULTRASOUND FEE', type: 'select', options: ['ULTRASOUND FEE', 'CONSULTING FEE'] }
    ]);
    setSavedBillId(null);
    setShowModal(false);
    fetchNextRegNo();
  };

  // Preview bill data
  const feeVal = Number(fields.find(f => f.name === 'Fee')?.value) || 0;
  const patientName = fields.find(f => f.name === 'Patient Name')?.value || '';
  const address = fields.find(f => f.name === 'Address')?.value || '';
  
  const previewBill = {
    bill_number: fields.find(f => f.name === 'Reg No')?.value || 'NEW',
    customer_name: patientName,
    customer_address: address,
    subtotal: feeVal,
    tax_amount: 0,
    discount_amount: 0,
    grand_total: feeVal,
    items: fields
  };

  return (
    <div style={{ display: 'flex', gap: '32px' }}>
      <div style={{ flex: 1 }}>
        <h1 className="mb-6">Create New Record</h1>
        <div className="card mb-6">
          <h3 className="mb-4">Patient Log Form</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fields.map((field, idx) => (
              <div key={idx} className="form-group" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label className="form-label" style={{ width: '150px', marginBottom: 0, flexShrink: 0 }}>
                  {field.name} {field.required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                </label>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {field.type === 'select' ? (
                    <select
                      className="form-input"
                      value={field.value}
                      onChange={e => handleFieldChange(idx, e.target.value)}
                    >
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'doctor' ? (
                    <>
                      <input
                        type="text"
                        className="form-input"
                        list={`datalist-doc-${idx}`}
                        value={field.value}
                        onChange={e => handleFieldChange(idx, e.target.value)}
                        placeholder="Enter Dr. Name"
                      />
                      <datalist id={`datalist-doc-${idx}`}>
                        {doctorsList.map((doc, docIdx) => (
                          <option key={docIdx} value={doc} />
                        ))}
                      </datalist>
                    </>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      className="form-input"
                      value={field.value}
                      onChange={e => handleFieldChange(idx, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={field.value}
                      onChange={e => handleFieldChange(idx, e.target.value)}
                      readOnly={field.readOnly}
                      tabIndex={field.readOnly ? -1 : 0}
                      style={{
                        backgroundColor: field.readOnly ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
                        cursor: field.readOnly ? 'not-allowed' : 'auto',
                        opacity: field.readOnly ? 0.8 : 1
                      }}
                      placeholder={`Enter ${field.name}`}
                    />
                  )}

                  {field.isCustom && (
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '8px', borderRadius: 'var(--radius-md)' }} 
                      onClick={() => handleRemoveField(field.name)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Field section */}
          {showAddField ? (
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <h4 className="mb-3">Add Custom Field</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Field Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFieldName}
                    onChange={e => setNewFieldName(e.target.value)}
                    placeholder="e.g. Weight, Remarks"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Field Type</label>
                  <select
                    className="form-input"
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value)}
                  >
                    <option value="text">Text Box</option>
                    <option value="number">Number Box</option>
                    <option value="select">Dropdown Select</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div className="form-group">
                  <label className="form-label">Dropdown Options (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddField(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddField}>Confirm Add</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddField(true)}>
                <PlusCircle size={16} /> Add Custom Field
              </button>
            </div>
          )}
        </div>

        {/* Buttons layout from photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 24px', fontSize: '16px', width: '100%', fontWeight: 'bold' }} 
            onClick={handleSaveOnly}
          >
            <Save size={20} /> Save Record
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: '16px', width: '100%' }} 
            onClick={resetForm}
          >
            <Plus size={20} /> Add Record
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: '16px', width: '100%' }} 
            onClick={handlePrint}
            disabled={!savedBillId}
          >
            <Printer size={20} /> Print Receipt
          </button>
        </div>
      </div>
      
      <div style={{ width: '350px' }}>
        <h3 className="mb-4">Receipt Preview</h3>
        <PrintPreview bill={previewBill} template={template} />
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--success-color)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h2 className="mb-2">Record Saved Successfully!</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>What would you like to do with this record?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={18} /> Print Receipt (80mm)</button>
              <button className="btn btn-secondary" onClick={handlePDF}><FileDown size={18} /> Download PDF</button>
              <button className="btn btn-secondary" onClick={handleExcel}><FileDown size={18} /> Download Excel</button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>OK</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>Create Another</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBill;
