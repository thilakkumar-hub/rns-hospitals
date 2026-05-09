import { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal, Form, Button } from 'react-bootstrap';
import { FiArrowLeft, FiPlus, FiEdit2 } from 'react-icons/fi';
import { FaBed } from 'react-icons/fa';

export default function WardDetail() {
  const { onMenuClick } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ward, setWard] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBeds, setShowAddBeds] = useState(false);
  const [newBedCount, setNewBedCount] = useState(5);
  const [showEdit, setShowEdit] = useState(false);
  const [editBed, setEditBed] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [wardRes, bedsRes] = await Promise.all([
      supabase.from('wards').select('*').eq('id', id).single(),
      supabase.from('beds').select('*, patient:patient_id(full_name, status)').eq('ward_id', id).order('bed_number'),
    ]);
    setWard(wardRes.data);
    setBeds(bedsRes.data || []);
    setLoading(false);
  };

  const handleAddBeds = async () => {
    const currentMax = beds.length;
    const prefix = ward.type.charAt(0).toUpperCase();
    const newBeds = Array.from({ length: newBedCount }, (_, i) => ({
      ward_id: id,
      bed_number: `${prefix}-${String(currentMax + i + 1).padStart(3, '0')}`,
      status: 'available'
    }));
    await supabase.from('beds').insert(newBeds);
    await supabase.from('wards').update({ total_beds: currentMax + newBedCount }).eq('id', id);
    setShowAddBeds(false);
    fetchData();
  };

  const handleStatusChange = async (bed, newStatus) => {
    await supabase.from('beds').update({ status: newStatus }).eq('id', bed.id);
    if (newStatus === 'available' && bed.patient_id) {
      await supabase.from('beds').update({ patient_id: null }).eq('id', bed.id);
    }
    fetchData();
  };

  if (loading) return <><TopNav title="Ward Detail" onMenuClick={onMenuClick} /><LoadingSpinner /></>;
  if (!ward) return <><TopNav title="Ward Not Found" onMenuClick={onMenuClick} /><div className="page-content"><p>Ward not found.</p></div></>;

  const available = beds.filter(b => b.status === 'available').length;
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const maintenance = beds.filter(b => b.status === 'maintenance').length;

  return (
    <>
      <TopNav
        title={ward.name}
        subtitle={`Floor ${ward.floor} · ${ward.type.charAt(0).toUpperCase() + ward.type.slice(1)} · ${beds.length} beds`}
        onMenuClick={onMenuClick}
      >
        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => navigate('/wards')}>
          <FiArrowLeft style={{ marginRight: 4 }} /> Back
        </button>
        <button className="btn btn-rns-primary btn-sm" onClick={() => setShowAddBeds(true)}>
          <FiPlus style={{ marginRight: 4 }} /> Add Beds
        </button>
      </TopNav>

      <div className="page-content">
        {/* Summary */}
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: '#27ae60' }}>{available}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: '#c0392b' }}>{occupied}</div>
              <div className="stat-label">Occupied</div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: '#f39c12' }}>{maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        </div>

        {/* Bed Grid */}
        <div className="data-card">
          <div className="card-header-custom">
            <h5><FaBed style={{ marginRight: 8 }} /> Bed Layout</h5>
            <div className="d-flex gap-3" style={{ fontSize: '0.78rem' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#27ae60', marginRight: 4 }}></span> Available</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#c0392b', marginRight: 4 }}></span> Occupied</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#f39c12', marginRight: 4 }}></span> Maintenance</span>
            </div>
          </div>
          <div className="card-body-custom">
            {beds.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FaBed /></div>
                <p>No beds configured. Add beds to this ward.</p>
              </div>
            ) : (
              <div className="row g-2">
                {beds.map(bed => (
                  <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={bed.id}>
                    <div
                      className={`bed-item ${bed.status}`}
                      onClick={() => { setEditBed(bed); setShowEdit(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="bed-number">{bed.bed_number}</div>
                      <div className="bed-status" style={{
                        color: bed.status === 'available' ? '#27ae60' : bed.status === 'occupied' ? '#c0392b' : '#f39c12'
                      }}>
                        {bed.status}
                      </div>
                      {bed.patient && (
                        <div style={{ fontSize: '0.68rem', color: '#7f8c8d', marginTop: 4 }}>{bed.patient.full_name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Beds Modal */}
      <Modal show={showAddBeds} onHide={() => setShowAddBeds(false)} centered size="sm">
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '1.1rem' }}>Add Beds</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Number of beds to add</Form.Label>
            <Form.Control type="number" value={newBedCount} onChange={e => setNewBedCount(parseInt(e.target.value))} min={1} max={50} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowAddBeds(false)}>Cancel</Button>
          <Button className="btn-rns-primary" onClick={handleAddBeds}>Add Beds</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Bed Status Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="sm">
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '1.1rem' }}>Bed {editBed?.bed_number}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={editBed?.status}
              onChange={e => {
                handleStatusChange(editBed, e.target.value);
                setShowEdit(false);
              }}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </Form.Select>
          </Form.Group>
          {editBed?.patient && (
            <div className="mt-3 p-2" style={{ background: '#f8f9fa', borderRadius: 8, fontSize: '0.85rem' }}>
              <strong>Patient:</strong> {editBed.patient.full_name}
              <br /><span className={`status-badge ${editBed.patient.status} mt-1`}>{editBed.patient.status}</span>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
