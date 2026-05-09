import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiUsers, FiGrid, FiUserPlus, FiAlertCircle,
  FiPhone, FiBell, FiKey, FiLogOut, FiActivity
} from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }) {
  const { staffProfile, isAdmin, signOut } = useAuth();

  const initials = staffProfile?.full_name
    ? staffProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const navItems = [
    { to: '/', icon: <FiHome />, label: 'Dashboard' },
    { to: '/wards', icon: <FiGrid />, label: 'Wards & Beds' },
    { to: '/staff', icon: <FiUsers />, label: 'Staff Directory' },
    { to: '/patients', icon: <FiUserPlus />, label: 'Patients' },
    { to: '/announcements', icon: <FiBell />, label: 'Announcements' },
    { to: '/emergency', icon: <FiPhone />, label: 'Emergency Contacts' },
  ];

  const adminItems = [
    { to: '/admin/codes', icon: <FiKey />, label: 'Code Generator' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <FiActivity />
        </div>
        <div>
          <h2>RNS Hospitals</h2>
          <small>Management System</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="nav-label" style={{ marginTop: 8 }}>Administration</div>
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{staffProfile?.full_name || 'Loading...'}</div>
            <div className="user-role">{staffProfile?.role || ''}</div>
          </div>
          <button
            className="btn btn-sm"
            onClick={signOut}
            title="Sign out"
            style={{ color: 'rgba(255,255,255,0.6)', padding: '4px' }}
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </div>
  );
}
