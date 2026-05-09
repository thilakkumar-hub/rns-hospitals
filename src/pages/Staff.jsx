import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiFilter } from 'react-icons/fi';
import { FaStethoscope, FaSyringe, FaUserMd, FaFlask, FaDesktop, FaCut } from 'react-icons/fa';

const roleIcons = {
  doctor: <FaStethoscope />, nurse: <FaSyringe />, surgeon: <FaCut />,
  receptionist: <FaDesktop />, lab_tech: <FaFlask />, admin: <FaUserMd />
};
const roleColors = {
  doctor: '#3498db', nurse: '#27ae60', surgeon: '#e74c3c',
  receptionist: '#9b59b6', lab_tech: '#f39c12', admin: '#1a5276'
};

export default function Staff() {
  const { onMenuClick } = useOutletContext();
  const { staffProfile, refreshProfile } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchStaff(); }, []);
  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('full_name');
    setStaffList(data || []);
    setLoading(false);
  };

  const updateMyStatus = async (s) => {
    await supabase.from('staff').update({ status: s }).eq('id', staffProfile.id);
    fetchStaff();
    refreshProfile();
  };

  const filtered = staffList.filter(s =>
    (filterRole === 'all' || s.role === filterRole) &&
    (filterStatus === 'all' || s.status === filterStatus)
  );

  if (loading) return <><TopNav title="Staff Directory" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="Staff Directory" subtitle={`${staffList.length} staff`} onMenuClick={onMenuClick} />
      <div className="page-content">
        {staffProfile && (
          <div className="data-card mb-4">
            <div className="card-body-custom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <div style={{ width:48,height:48,borderRadius:12,background:roleColors[staffProfile.role]||'#3498db',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1.1rem' }}>
                  {roleIcons[staffProfile.role]||<FaUserMd/>}
                </div>
                <div>
                  <div style={{fontWeight:700}}>Your Status</div>
                  <span className={`status-badge ${staffProfile.status}`}>{staffProfile.status?.replace('_',' ')}</span>
                </div>
              </div>
              <div className="d-flex gap-2">
                {['available','busy','off_duty'].map(s=>(
                  <button key={s} className={`btn btn-sm ${staffProfile.status===s?'btn-rns-primary':'btn-outline-secondary'}`} onClick={()=>updateMyStatus(s)} style={{textTransform:'capitalize',fontSize:'0.82rem'}}>{s.replace('_',' ')}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
          <FiFilter size={14} color="#7f8c8d"/>
          <select className="form-select form-select-sm" style={{width:'auto'}} value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {Object.keys(roleIcons).map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{width:'auto'}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="off_duty">Off Duty</option>
          </select>
        </div>
        <div className="row g-3">
          {filtered.map(s=>(
            <div className="col-md-6 col-lg-4" key={s.id}>
              <div className="data-card"><div className="card-body-custom d-flex align-items-start gap-3">
                <div style={{width:44,height:44,borderRadius:10,background:roleColors[s.role]||'#3498db',display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0}}>{roleIcons[s.role]||<FaUserMd/>}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'0.95rem'}}>{s.full_name}</div>
                  <div style={{fontSize:'0.78rem',color:'#95a5a6',textTransform:'capitalize'}}>{s.role?.replace('_',' ')}{s.department?` · ${s.department}`:''}</div>
                  <span className={`status-badge ${s.status} mt-1`}>{s.status?.replace('_',' ')}</span>
                  {s.phone&&<div style={{fontSize:'0.78rem',color:'#7f8c8d',marginTop:4}}>📞 {s.phone}</div>}
                  <div style={{fontSize:'0.75rem',color:'#bdc3c7',marginTop:2}}>@{s.username}</div>
                </div>
              </div></div>
            </div>
          ))}
          {filtered.length===0&&<div className="col-12"><div className="data-card"><div className="empty-state"><p>No staff match filters.</p></div></div></div>}
        </div>
      </div>
    </>
  );
}
