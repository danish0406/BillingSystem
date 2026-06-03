import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2 } from 'lucide-react';

const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBills = async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await axios.get('/api/bills', { params });
      setBills(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await axios.delete(`/api/bill/${id}`);
      fetchBills(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill');
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, search, startDate, endDate]);

  return (
    <div>
      <h1 className="mb-6">Bill History</h1>
      
      <div className="card mb-6">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by Reg No or Patient..." 
                value={search}
                onChange={e => {setSearch(e.target.value); setPage(1);}}
                style={{ paddingLeft: '40px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={startDate} onChange={e => {setStartDate(e.target.value); setPage(1);}} />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={endDate} onChange={e => {setEndDate(e.target.value); setPage(1);}} />
          </div>
        </div>
      </div>
 
      <div className="card">
        <div className="table-container mb-4">
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Date / Time</th>
                <th>Patient Name</th>
                <th>Fees</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No records found.</td></tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.id}>
                    <td>#{bill.bill_number}</td>
                    <td>{(() => {
                      const d = new Date(bill.created_at);
                      if (isNaN(d.getTime())) return '-';
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return `${day}-${month}-${year}`;
                    })()}</td>
                    <td>{bill.customer_name || '-'}</td>
                    <td>₹{bill.grand_total.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Link to={`/bill/${bill.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                        <Eye size={16} /> View
                      </Link>
                      <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(bill.id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center">
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Showing {bills.length} of {total} records
          </div>
          <div className="flex gap-4">
            <button 
              className="btn btn-secondary" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-secondary" 
              disabled={page * 10 >= total} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillHistory;
