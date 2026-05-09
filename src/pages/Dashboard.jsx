import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiUsers, FiActivity, FiAlertCircle, FiBell, FiArrowRight } from 'react-icons/fi';
import { FaBed, FaUserInjured, FaStethoscope } from 'react-icons/fa';

export default function Dashboard() {
  const { onMenuClick } = useOutletContext();
  const { staffProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchDashboardData() {
      try {
        const fetchPromise = Promise.all([
          supabase.from('patients').select('*', { count: 'exact' }),
          supabase.from('beds').select('status'),
          supabase.from('staff').select('status'),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Dashboard fetch timed out')), 5000)
        );

        const [patientsRes, bedsRes, staffRes, annRes] = await Promise.race([fetchPromise, timeoutPromise]);

        if (isMounted) {
          const totalPatients = patientsRes.count || 0;
          const admittedPatients = patientsRes.data?.filter(p => p.status === 'admitted' || p.status === 'critical').length || 0;
          const availableBeds = bedsRes.data?.filter(b => b.status === 'available').length || 0;
          const totalBeds = bedsRes.data?.length || 0;
          const onDutyStaff = staffRes.data?.filter(s => s.status === 'available').length || 0;
          const totalStaff = staffRes.data?.length || 0;

          setStats({
            totalPatients,
            admittedPatients,
            availableBeds,
            totalBeds,
            onDutyStaff,
            totalStaff,
            criticalPatients: patientsRes.data?.filter(p => p.status === 'critical').length || 0,
          });

          // Recent patients
          const { data: recent } = await supabase
            .from('patients')
            .select('*, staff:assigned_doctor_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(5);
          setRecentPatients(recent || []);

          setAnnouncements(annRes.data || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);



  if (loading) return <><TopNav title="Dashboard" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      <TopNav
        title={`${greeting()}, ${staffProfile?.full_name?.split(' ')[0] || 'Staff'}`}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        onMenuClick={onMenuClick}
      />
      <div className="page-content">
        {/* Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="stat-card" onClick={() => navigate('/patients')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)' }}>
                <FaUserInjured />
              </div>
              <div className="stat-value">{stats?.admittedPatients || 0}</div>
              <div className="stat-label">Admitted Patients</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card" onClick={() => navigate('/wards')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}>
                <FaBed />
              </div>
              <div className="stat-value">{stats?.availableBeds || 0}<span style={{ fontSize: '0.9rem', color: '#95a5a6' }}>/{stats?.totalBeds || 0}</span></div>
              <div className="stat-label">Available Beds</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card" onClick={() => navigate('/staff')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                <FaStethoscope />
              </div>
              <div className="stat-value">{stats?.onDutyStaff || 0}<span style={{ fontSize: '0.9rem', color: '#95a5a6' }}>/{stats?.totalStaff || 0}</span></div>
              <div className="stat-label">Staff On Duty</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}>
                <FiAlertCircle />
              </div>
              <div className="stat-value">{stats?.criticalPatients || 0}</div>
              <div className="stat-label">Critical Patients</div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          {/* Recent Patients */}
          <div className="col-lg-8">
            <div className="data-card">
              <div className="card-header-custom">
                <h5>Recent Patients</h5>
                <button className="btn btn-sm btn-rns-primary" onClick={() => navigate('/patients')}>
                  View All <FiArrowRight style={{ marginLeft: 4 }} />
                </button>
              </div>
              <div className="card-body-custom p-0">
                {recentPatients.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><FaUserInjured /></div>
                    <p>No patients recorded yet</p>
                  </div>
                ) : (
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Diagnosis</th>
                        <th>Doctor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPatients.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.full_name}</td>
                          <td>{p.age || '—'}</td>
                          <td>{p.diagnosis || '—'}</td>
                          <td>{p.staff?.full_name || '—'}</td>
                          <td><span className={`status-badge ${p.status}`}>{p.status?.replace('_', ' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="col-lg-4">
            <div className="data-card">
              <div className="card-header-custom">
                <h5><FiBell style={{ marginRight: 6 }} /> Announcements</h5>
              </div>
              <div className="card-body-custom p-0">
                {announcements.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div className="empty-icon"><FiBell /></div>
                    <p>No announcements yet</p>
                  </div>
                ) : (
                  announcements.map(a => (
                    <div key={a.id} className="announcement-item">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`priority-badge ${a.priority}`}>{a.priority}</span>
                        <span className="ann-title">{a.title}</span>
                      </div>
                      <div className="ann-content">{a.content?.substring(0, 100)}{a.content?.length > 100 ? '...' : ''}</div>
                      <div className="ann-meta">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
