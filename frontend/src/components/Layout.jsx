import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Settings, Edit3 } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-bill', label: 'New Record', icon: FileText },
    { path: '/history', label: 'Record History', icon: History },
    { path: '/template', label: 'Edit Template', icon: Edit3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <FileText size={32} />
          <span>BillingPro</span>
        </div>
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
