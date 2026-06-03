import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Printer, FileDown, ArrowLeft } from 'lucide-react';
import PrintPreview from '../components/PrintPreview';

const BillDetail = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billRes, tplRes] = await Promise.all([
          axios.get(`/api/bill/${id}`),
          axios.get('/api/template')
        ]);
        setBill(billRes.data);
        setTemplate(tplRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = async () => {
    try {
      await axios.post(`/api/bill/${id}/print`);
      alert('Print job sent!');
    } catch (err) {
      alert('Failed to print');
    }
  };

  const handleExcel = () => {
    window.open(`http://localhost:3000/api/bill/${id}/export/excel`);
  };

  const handlePDF = () => {
    window.open(`http://localhost:3000/api/bill/${id}/export/pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (!bill) return <div>Bill not found</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/history" className="btn btn-secondary" style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ margin: 0 }}>Record #{bill.bill_number}</h1>
      </div>
      
      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1 }}>
          <div className="card mb-6">
            <h3>Record Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <p className="form-label mb-2">Patient Name</p>
                <p>{bill.customer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="form-label mb-2">Date</p>
                <p>{new Date(bill.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="form-label mb-2">Total Fees</p>
                <p style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{bill.grand_total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <h3>Actions</h3>
            <div className="flex gap-4 mt-4">
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={18} /> Print Receipt (80mm)</button>
              <button className="btn btn-secondary" onClick={handlePDF}><FileDown size={18} /> Download PDF</button>
              <button className="btn btn-secondary" onClick={handleExcel}><FileDown size={18} /> Download Excel</button>
            </div>
          </div>
        </div>
        
        <div style={{ width: '350px' }}>
          <h3 className="mb-4">Receipt Preview</h3>
          <PrintPreview bill={bill} template={template} />
        </div>
      </div>
    </div>
  );
};

export default BillDetail;
