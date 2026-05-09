import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal, Form, Button } from 'react-bootstrap';
import { FiPlus, FiTrash2, FiBell, FiClock } from 'react-icons/fi';

export default function Announcements() {
  const { onMenuClick } = useOutletContext();
  const { isAdmin, staffProfile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium' });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    // Delete expired announcements first
    await supabase.from('announcements').delete().lt('auto_delete_at', new Date().toISOString());
    const { data } = await supabase
      .from('announcements')
      .select('*, author:created_by(full_name)')
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    await supabase.from('announcements').insert({
      ...form,
      created_by: staffProfile.id,
    });
    setShowModal(false);
    setForm({ title: '', content: '', priority: 'medium' });
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const expiresIn = (date) => {
    const diff = new Date(date) - new Date();
    if (diff <= 0) return 'Expired';
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m left`;
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.floor(hrs / 24)}d left`;
  };

  const priorityColors = { urgent: '#c0392b', high: '#e67e22', medium: '#3498db', low: '#95a5a6' };

  if (loading) return <><TopNav title="Announcements" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="Announcements" subtitle={`${announcements.length} active`} onMenuClick={onMenuClick}>
        {isAdmin && (
          <button className="btn btn-rns-primary btn-sm" onClick={() => setShowModal(true)}>
            <FiPlus style={{ marginRight: 4 }} /> New Announcement
          </button>
        )}
      </TopNav>

      <div className="page-content">
        {announcements.length === 0 ? (
          <div className="data-card">
            <div className="empty-state">
              <div className="empty-icon"><FiBell /></div>
              <p>No announcements right now. Check back later!</p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {announcements.map(a => (
              <div className="col-12" key={a.id}>
                <div className="data-card" style={{ borderLeft: `4px solid ${priorityColors[a.priority]}` }}>
                  <div className="card-body-custom">
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: 1 }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className={`priority-badge ${a.priority}`}>{a.priority}</span>
                          <h6 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{a.title}</h6>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {a.content}
                        </p>
                        <div className="d-flex gap-3" style={{ fontSize: '0.78rem', color: '#95a5a6' }}>
                          <span>By {a.author?.full_name || 'Admin'}</span>
                          <span><FiClock size={12} style={{ marginRight: 2 }} /> {timeAgo(a.created_at)}</span>
                          <span style={{ color: '#e67e22' }}>⏳ {expiresIn(a.auto_delete_at)}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <button className="btn btn-sm" onClick={() => handleDelete(a.id)} style={{ color: '#c0392b' }}>
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>New Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control as="textarea" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement..." required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Form.Select>
          </Form.Group>
          <div className="form-text">Announcement will auto-delete after 2 days unless manually removed.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button className="btn-rns-primary" onClick={handleCreate} disabled={!form.title || !form.content}>Publish</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
