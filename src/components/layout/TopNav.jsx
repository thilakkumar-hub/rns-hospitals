import { FiMenu } from 'react-icons/fi';

export default function TopNav({ title, subtitle, onMenuClick, children }) {
  return (
    <div className="top-nav">
      <div>
        <button
          className="btn btn-sm d-md-none me-2"
          onClick={onMenuClick}
          style={{ border: 'none', fontSize: '1.2rem' }}
        >
          <FiMenu />
        </button>
        <span className="page-title">{title}</span>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div className="nav-actions">
        {children}
      </div>
    </div>
  );
}
