import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewBill from './pages/NewBill';
import BillHistory from './pages/BillHistory';
import BillDetail from './pages/BillDetail';
import TemplateEditor from './pages/TemplateEditor';
import Settings from './pages/Settings';

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-bill" element={<NewBill />} />
          <Route path="history" element={<BillHistory />} />
          <Route path="bill/:id" element={<BillDetail />} />
          <Route path="template" element={<TemplateEditor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
