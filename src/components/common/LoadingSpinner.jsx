import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-overlay">
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>{text}</p>
      </div>
    </div>
  );
}
