import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp, Users, Trash2, Sun, Moon } from 'lucide-react';

const Dashboard = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const toggleTheme = (newTheme) => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    recentBills: []
  });
  const [loading, setLoading] = useState(true);

  const handleOpenDB = async () => {
    try {
      const response = await axios.get('/api/bill/export/open-database');
      if (response.data.warning) {
        alert(response.data.warning);
      }
    } catch (err) {
      alert('Could not open file. Make sure it exists.');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/bills?limit=5');
        const bills = response.data.data;
        
        // In a real app, you might want a specific stats endpoint
        const allResponse = await axios.get('/api/bills?limit=1000');
        const allBills = allResponse.data.data;
        const revenue = allBills.reduce((sum, bill) => sum + bill.grand_total, 0);

        setStats({
          totalBills: allResponse.data.total,
          totalRevenue: revenue,
          recentBills: bills
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await axios.delete(`/api/bill/${id}`);
      setStats(prev => ({
        ...prev,
        totalBills: prev.totalBills - 1,
        recentBills: prev.recentBills.filter(b => b.id !== id)
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill');
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div 
          className={`theme-toggle-pill ${theme === 'dark' ? 'dark' : ''}`}
          onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <div className="theme-toggle-indicator" />
          <button 
            type="button" 
            className={`theme-toggle-pill-btn sun-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleTheme('light'); }}
          >
            <Sun size={14} fill={theme === 'light' ? 'currentColor' : 'none'} />
          </button>
          <button 
            type="button" 
            className={`theme-toggle-pill-btn moon-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleTheme('dark'); }}
          >
            <Moon size={14} fill={theme === 'dark' ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      
      <div className="dashboard-grid mb-6">
        <div className="card flex items-center gap-4">
          <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
            <FileText size={32} />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total Records</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalBills}</p>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success-color)' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total Revenue</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2>Recent Records</h2>
          <div className="flex gap-4">
            <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenDB}>
              <FileText size={16} /> Open Master DB in Excel
            </button>
            <Link to="/history" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center' }}>View All</Link>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Date</th>
                <th>Patient Name</th>
                <th>Fees</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No records yet. Create one!</td>
                </tr>
              ) : (
                stats.recentBills.map(bill => (
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
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(bill.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
