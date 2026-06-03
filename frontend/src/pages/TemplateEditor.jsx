import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

const TemplateEditor = () => {
  const [template, setTemplate] = useState({
    business_name: '',
    business_address: '',
    business_contact: '',
    footer_notes: '',
    tax_rate: 0,
    currency: 'USD'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/template')
      .then(res => {
        if (res.data) setTemplate(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (template.id) {
        await axios.put('/api/template', template);
      } else {
        await axios.post('/api/template', template);
      }
      setMessage('Template saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error saving template.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="mb-6">Edit Bill Template</h1>
      <div className="card">
        {message && <div style={{ padding: '12px', marginBottom: '16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px' }}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input type="text" className="form-input" name="business_name" value={template.business_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Business Address</label>
            <textarea className="form-input" name="business_address" value={template.business_address} onChange={handleChange} rows="3" />
          </div>
          <div className="form-group">
            <label className="form-label">Business Contact Info (Phone/Email)</label>
            <input type="text" className="form-input" name="business_contact" value={template.business_contact} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Default Tax Rate (%)</label>
              <input type="number" step="0.01" className="form-input" name="tax_rate" value={template.tax_rate} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Currency Symbol</label>
              <input type="text" className="form-input" name="currency" value={template.currency} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Footer Notes</label>
            <textarea className="form-input" name="footer_notes" value={template.footer_notes} onChange={handleChange} rows="3" />
          </div>
          <button type="submit" className="btn btn-primary mt-4 w-full" style={{ width: '100%' }}>
            <Save size={18} /> Save Template
          </button>
        </form>
      </div>
    </div>
  );
};

export default TemplateEditor;
