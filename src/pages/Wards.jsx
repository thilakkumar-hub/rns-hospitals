import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal, Form, Button } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaBed, FaHospital } from 'react-icons/fa';

const wardColors = {
  general: '#3498db', icu: '#e74c3c', emergency: '#c0392b',
  maternity: '#9b59b6', pediatrics: '#f39c12', surgical: '#1abc9c'
};

export default function Wards() {
  const { onMenuClick } = useOutletContext();
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [bedCounts, setBedCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', floor: 1, type: 'general', total_beds: 10, description: '' });

  useEffect(() => { fetchWards(); }, []);

  const fetchWards = async () => {
    const { data } = await supabase.from('wards').select('*').order('name');
    setWards(data || []);

    // Fetch bed counts per ward
    const { data: beds } = await supabase.from('beds').select('ward_id, status');
    const counts = {};
    (beds || []).forEach(b => {
      if (!counts[b.ward_id]) counts[b.ward_id] = { total: 0, occupied: 0, available: 0, maintenance: 0 };
      counts[b.ward_id].total++;
      counts[b.ward_id][b.status]++;
    });
    setBedCounts(counts);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', floor: 1, type: 'general', total_beds: 10, description: '' });
    setShowModal(true);
  };

  const openEdit = (w, e) => {
    e.stopPropagation();
    setEditing(w);
    setForm({ name: w.name, floor: w.floor, type: w.type, total_beds: w.total_beds, description: w.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editing) {
      await supabase.from('wards').update(form).eq('id', editing.id);
    } else {
      const { data } = await supabase.from('wards').insert(form).select().single();
      // Auto-create beds
      if (data) {
        const beds = Array.from({ length: form.total_beds }, (_, i) => ({
          ward_id: data.id,
          bed_number: `${form.type.charAt(0).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          status: 'available'
        }));
        await supabase.from('beds').insert(beds);
      }
    }
    setShowModal(false);
    fetchWards();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this ward and all its beds?')) {
      await supabase.from('beds').delete().eq('ward_id', id);
      await supabase.from('wards').delete().eq('id', id);
      fetchWards();
    }
  };

  if (loading) return <><TopNav title="Wards & Beds" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="Wards & Beds" subtitle={`${wards.length} wards configured`} onMenuClick={onMenuClick}>
        <button className="btn btn-rns-primary btn-sm" onClick={openAdd}>
          <FiPlus style={{ marginRight: 4 }} /> Add Ward
        </button>
      </TopNav>

      <div className="page-content">
        {wards.length === 0 ? (
          <div className="data-card">
            <div className="empty-state">
              <div className="empty-icon"><FaHospital /></div>
              <p>No wards configured yet. Add your first ward to get started.</p>
              <button className="btn btn-rns-primary mt-2" onClick={openAdd}><FiPlus /> Add Ward</button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {wards.map(w => {
              const bc = bedCounts[w.id] || { total: 0, occupied: 0, available: 0, maintenance: 0 };
              const occupancy = bc.total > 0 ? Math.round((bc.occupied / bc.total) * 100) : 0;
              const color = wardColors[w.type] || '#3498db';
              return (
                <div className="col-md-6 col-lg-4" key={w.id}>
                  <div className="ward-card" onClick={() => navigate(`/wards/${w.id}`)}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="ward-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                        <FaHospital />
                      </div>
                      <div>
                        <button className="btn btn-sm" onClick={(e) => openEdit(w, e)} style={{ color: '#7f8c8d' }}><FiEdit2 size={14} /></button>
                        <button className="btn btn-sm" onClick={(e) => handleDelete(w.id, e)} style={{ color: '#c0392b' }}><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                    <h6 style={{ fontWeight: 700, marginBottom: 2 }}>{w.name}</h6>
                    <div style={{ fontSize: '0.78rem', color: '#95a5a6', marginBottom: 12 }}>
                      Floor {w.floor} · <span style={{ textTransform: 'capitalize' }}>{w.type}</span>
                    </div>
                    <div className="d-flex gap-3" style={{ fontSize: '0.82rem' }}>
                      <span style={{ color: '#27ae60', fontWeight: 600 }}>{bc.available} free</span>
                      <span style={{ color: '#c0392b', fontWeight: 600 }}>{bc.occupied} used</span>
                      <span style={{ color: '#f39c12', fontWeight: 600 }}>{bc.maintenance} maint.</span>
                    </div>
                    <div className="occupancy-bar">
                      <div className="fill" style={{
                        width: `${occupancy}%`,
                        background: occupancy > 80 ? '#c0392b' : occupancy > 50 ? '#f39c12' : '#27ae60'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#bdc3c7', marginTop: 4 }}>{occupancy}% occupied · {bc.total} beds</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Ward Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>{editing ? 'Edit Ward' : 'Add New Ward'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Ward Name</Form.Label>
            <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. General Ward A" />
          </Form.Group>
          <div className="row">
            <div className="col-6">
              <Form.Group className="mb-3">
                <Form.Label>Floor</Form.Label>
                <Form.Control type="number" value={form.floor} onChange={e => setForm({ ...form, floor: parseInt(e.target.value) })} min={1} />
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="icu">ICU</option>
                  <option value="emergency">Emergency</option>
                  <option value="maternity">Maternity</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="surgical">Surgical</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          {!editing && (
            <Form.Group className="mb-3">
              <Form.Label>Number of Beds</Form.Label>
              <Form.Control type="number" value={form.total_beds} onChange={e => setForm({ ...form, total_beds: parseInt(e.target.value) })} min={1} max={100} />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button className="btn-rns-primary" onClick={handleSave}>{editing ? 'Update' : 'Create Ward'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
