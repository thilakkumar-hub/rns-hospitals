import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal, Form, Button } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiPhone } from 'react-icons/fi';
import { FaAmbulance, FaFireExtinguisher, FaShieldAlt, FaTint, FaSkullCrossbones, FaHospital, FaPhoneAlt } from 'react-icons/fa';

const catIcons = {
  ambulance: <FaAmbulance />, fire: <FaFireExtinguisher />, police: <FaShieldAlt />,
  blood_bank: <FaTint />, poison_control: <FaSkullCrossbones />, internal: <FaHospital />, other: <FaPhoneAlt />
};
const catColors = {
  ambulance: '#c0392b', fire: '#e67e22', police: '#2c3e50',
  blood_bank: '#e74c3c', poison_control: '#8e44ad', internal: '#27ae60', other: '#3498db'
};

export default function EmergencyContacts() {
  const { onMenuClick } = useOutletContext();
  const { isAdmin } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', category: 'internal', description: '' });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('emergency_contacts').select('*').eq('is_active', true).order('category');
    setContacts(data || []);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', category: 'internal', description: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone, category: c.category, description: c.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (editing) {
      await supabase.from('emergency_contacts').update(form).eq('id', editing.id);
    } else {
      await supabase.from('emergency_contacts').insert(form);
    }
    setShowModal(false);
    fetchContacts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    await supabase.from('emergency_contacts').delete().eq('id', id);
    fetchContacts();
  };

  // Group by category
  const grouped = contacts.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  if (loading) return <><TopNav title="Emergency Contacts" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="Emergency Contacts" subtitle="Important numbers at a glance" onMenuClick={onMenuClick}>
        {isAdmin && (
          <button className="btn btn-rns-primary btn-sm" onClick={openAdd}><FiPlus style={{ marginRight: 4 }} /> Add Contact</button>
        )}
      </TopNav>

      <div className="page-content">
        {contacts.length === 0 ? (
          <div className="data-card">
            <div className="empty-state">
              <div className="empty-icon"><FiPhone /></div>
              <p>No emergency contacts configured yet.</p>
              {isAdmin && <button className="btn btn-rns-primary mt-2" onClick={openAdd}><FiPlus /> Add Contact</button>}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-4">
              <h6 style={{ textTransform: 'capitalize', fontWeight: 700, color: catColors[cat] || '#333', marginBottom: 12, fontSize: '0.95rem' }}>
                {cat.replace('_', ' ')}
              </h6>
              <div className="row g-3">
                {items.map(c => (
                  <div className="col-6 col-md-4 col-lg-3" key={c.id}>
                    <div className="emergency-card">
                      <div className="ec-icon" style={{ background: catColors[c.category] || '#3498db' }}>
                        {catIcons[c.category] || <FaPhoneAlt />}
                      </div>
                      <div className="ec-name">{c.name}</div>
                      <div className="ec-phone">{c.phone}</div>
                      {c.description && <div style={{ fontSize: '0.78rem', color: '#7f8c8d', marginTop: 4 }}>{c.description}</div>}
                      <div className="ec-category">{c.category.replace('_', ' ')}</div>
                      {isAdmin && (
                        <div className="mt-2">
                          <button className="btn btn-sm" onClick={() => openEdit(c)} style={{ color: '#3498db' }}><FiEdit2 size={13} /></button>
                          <button className="btn btn-sm" onClick={() => handleDelete(c.id)} style={{ color: '#c0392b' }}><FiTrash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '1.1rem' }}>{editing ? 'Edit' : 'Add'} Contact</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. City Ambulance" required /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Phone Number</Form.Label><Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 108" required /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Category</Form.Label>
            <Form.Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="ambulance">Ambulance</option><option value="fire">Fire</option><option value="police">Police</option>
              <option value="blood_bank">Blood Bank</option><option value="poison_control">Poison Control</option>
              <option value="internal">Internal</option><option value="other">Other</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" /></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button className="btn-rns-primary" onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button></Modal.Footer>
      </Modal>
    </>
  );
}
