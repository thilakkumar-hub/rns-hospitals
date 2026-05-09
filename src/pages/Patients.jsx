import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal, Form, Button, Tabs, Tab } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiFileText } from 'react-icons/fi';
import { FaUserInjured } from 'react-icons/fa';

export default function Patients() {
  const { onMenuClick } = useOutletContext();
  const { staffProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [medHistory, setMedHistory] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [form, setForm] = useState({
    full_name:'',age:'',gender:'male',phone:'',address:'',blood_group:'',
    ward_id:'',bed_id:'',diagnosis:'',status:'admitted',notes:'',assigned_doctor_id:''
  });
  // Medical history form
  const [mhForm, setMhForm] = useState({condition:'',treatment:'',diagnosed_date:'',notes:''});
  // Billing form
  const [billForm, setBillForm] = useState({description:'',amount:'',status:'pending',payment_method:'',notes:''});

  useEffect(()=>{fetchAll();},[]);

  const fetchAll = async () => {
    const [pRes,wRes,dRes] = await Promise.all([
      supabase.from('patients').select('*, ward:ward_id(name), staff:assigned_doctor_id(full_name)').order('created_at',{ascending:false}),
      supabase.from('wards').select('id,name'),
      supabase.from('staff').select('id,full_name').in('role',['doctor','surgeon']),
    ]);
    setPatients(pRes.data||[]);
    setWards(wRes.data||[]);
    setDoctors(dRes.data||[]);
    setLoading(false);
  };

  const fetchBedsForWard = async (wardId) => {
    if(!wardId){setBeds([]);return;}
    const {data}=await supabase.from('beds').select('id,bed_number,status').eq('ward_id',wardId).eq('status','available');
    setBeds(data||[]);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({full_name:'',age:'',gender:'male',phone:'',address:'',blood_group:'',ward_id:'',bed_id:'',diagnosis:'',status:'admitted',notes:'',assigned_doctor_id:''});
    setBeds([]);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({full_name:p.full_name,age:p.age||'',gender:p.gender||'male',phone:p.phone||'',address:p.address||'',blood_group:p.blood_group||'',ward_id:p.ward_id||'',bed_id:p.bed_id||'',diagnosis:p.diagnosis||'',status:p.status,notes:p.notes||'',assigned_doctor_id:p.assigned_doctor_id||''});
    if(p.ward_id)fetchBedsForWard(p.ward_id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {...form, age: form.age?parseInt(form.age):null, ward_id:form.ward_id||null, bed_id:form.bed_id||null, assigned_doctor_id:form.assigned_doctor_id||null};
    if(editing){
      await supabase.from('patients').update(payload).eq('id',editing.id);
      // Update bed status
      if(form.bed_id && form.bed_id !== editing.bed_id){
        await supabase.from('beds').update({status:'occupied',patient_id:editing.id}).eq('id',form.bed_id);
        if(editing.bed_id) await supabase.from('beds').update({status:'available',patient_id:null}).eq('id',editing.bed_id);
      }
    } else {
      const {data}=await supabase.from('patients').insert(payload).select().single();
      if(data && form.bed_id){
        await supabase.from('beds').update({status:'occupied',patient_id:data.id}).eq('id',form.bed_id);
      }
    }
    setShowModal(false);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this patient record?'))return;
    const p = patients.find(x=>x.id===id);
    if(p?.bed_id) await supabase.from('beds').update({status:'available',patient_id:null}).eq('id',p.bed_id);
    await supabase.from('medical_history').delete().eq('patient_id',id);
    await supabase.from('billing').delete().eq('patient_id',id);
    await supabase.from('patients').delete().eq('id',id);
    fetchAll();
  };

  const openDetail = async (p) => {
    setShowDetail(p);
    const [mh,bl] = await Promise.all([
      supabase.from('medical_history').select('*').eq('patient_id',p.id).order('created_at',{ascending:false}),
      supabase.from('billing').select('*').eq('patient_id',p.id).order('created_at',{ascending:false}),
    ]);
    setMedHistory(mh.data||[]);
    setBillingRecords(bl.data||[]);
  };

  const addMedHistory = async () => {
    await supabase.from('medical_history').insert({...mhForm,patient_id:showDetail.id,recorded_by:staffProfile.id});
    setMhForm({condition:'',treatment:'',diagnosed_date:'',notes:''});
    const {data}=await supabase.from('medical_history').select('*').eq('patient_id',showDetail.id).order('created_at',{ascending:false});
    setMedHistory(data||[]);
  };

  const addBilling = async () => {
    await supabase.from('billing').insert({...billForm,amount:parseFloat(billForm.amount)||0,patient_id:showDetail.id,created_by:staffProfile.id});
    setBillForm({description:'',amount:'',status:'pending',payment_method:'',notes:''});
    const {data}=await supabase.from('billing').select('*').eq('patient_id',showDetail.id).order('created_at',{ascending:false});
    setBillingRecords(data||[]);
  };

  const filtered = patients.filter(p=>{
    if(statusFilter!=='all'&&p.status!==statusFilter)return false;
    if(search&&!p.full_name.toLowerCase().includes(search.toLowerCase())&&!p.diagnosis?.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  if(loading)return<><TopNav title="Patients" onMenuClick={onMenuClick}/><LoadingSpinner/></>;

  return(
    <>
      <TopNav title="Patients" subtitle={`${patients.length} total`} onMenuClick={onMenuClick}>
        <button className="btn btn-rns-primary btn-sm" onClick={openAdd}><FiPlus style={{marginRight:4}}/>Add Patient</button>
      </TopNav>
      <div className="page-content">
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div className="input-group" style={{maxWidth:280}}>
            <span className="input-group-text" style={{background:'#f8f9fa'}}><FiSearch size={14}/></span>
            <input className="form-control form-control-sm" placeholder="Search name or diagnosis..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-select form-select-sm" style={{width:'auto'}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="critical">Critical</option>
            <option value="under_observation">Under Observation</option>
          </select>
        </div>

        <div className="data-card">
          <div className="card-body-custom p-0">
            {filtered.length===0?(
              <div className="empty-state"><div className="empty-icon"><FaUserInjured/></div><p>No patients found.</p></div>
            ):(
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Ward</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(p=>(
                      <tr key={p.id}>
                        <td style={{fontWeight:600,cursor:'pointer',color:'var(--rns-primary)'}} onClick={()=>openDetail(p)}>{p.full_name}</td>
                        <td>{p.age||'—'}</td>
                        <td style={{textTransform:'capitalize'}}>{p.gender||'—'}</td>
                        <td>{p.ward?.name||'—'}</td>
                        <td>{p.staff?.full_name||'—'}</td>
                        <td><span className={`status-badge ${p.status}`}>{p.status?.replace('_',' ')}</span></td>
                        <td>
                          <button className="btn btn-sm" onClick={()=>openEdit(p)} style={{color:'#3498db'}}><FiEdit2 size={14}/></button>
                          <button className="btn btn-sm" onClick={()=>handleDelete(p.id)} style={{color:'#c0392b'}}><FiTrash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Patient Modal */}
      <Modal show={showModal} onHide={()=>setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title style={{fontSize:'1.1rem'}}>{editing?'Edit Patient':'Add Patient'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 mb-3"><Form.Label>Full Name*</Form.Label><Form.Control value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/></div>
            <div className="col-md-3 mb-3"><Form.Label>Age</Form.Label><Form.Control type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/></div>
            <div className="col-md-3 mb-3"><Form.Label>Gender</Form.Label><Form.Select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Form.Select></div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3"><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="col-md-4 mb-3"><Form.Label>Blood Group</Form.Label><Form.Control value={form.blood_group} onChange={e=>setForm({...form,blood_group:e.target.value})} placeholder="e.g. O+"/></div>
            <div className="col-md-4 mb-3"><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="admitted">Admitted</option><option value="critical">Critical</option><option value="under_observation">Under Observation</option><option value="discharged">Discharged</option></Form.Select></div>
          </div>
          <div className="mb-3"><Form.Label>Address</Form.Label><Form.Control value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          <div className="row">
            <div className="col-md-4 mb-3"><Form.Label>Ward</Form.Label><Form.Select value={form.ward_id} onChange={e=>{setForm({...form,ward_id:e.target.value,bed_id:''});fetchBedsForWard(e.target.value);}}><option value="">None</option>{wards.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</Form.Select></div>
            <div className="col-md-4 mb-3"><Form.Label>Bed</Form.Label><Form.Select value={form.bed_id} onChange={e=>setForm({...form,bed_id:e.target.value})} disabled={!form.ward_id}><option value="">None</option>{beds.map(b=><option key={b.id} value={b.id}>{b.bed_number}</option>)}</Form.Select></div>
            <div className="col-md-4 mb-3"><Form.Label>Doctor</Form.Label><Form.Select value={form.assigned_doctor_id} onChange={e=>setForm({...form,assigned_doctor_id:e.target.value})}><option value="">None</option>{doctors.map(d=><option key={d.id} value={d.id}>{d.full_name}</option>)}</Form.Select></div>
          </div>
          <div className="mb-3"><Form.Label>Diagnosis</Form.Label><Form.Control as="textarea" rows={2} value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})}/></div>
          <div className="mb-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </Modal.Body>
        <Modal.Footer><Button variant="light" onClick={()=>setShowModal(false)}>Cancel</Button><Button className="btn-rns-primary" onClick={handleSave}>{editing?'Update':'Add Patient'}</Button></Modal.Footer>
      </Modal>

      {/* Patient Detail Modal */}
      <Modal show={!!showDetail} onHide={()=>setShowDetail(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title style={{fontSize:'1.1rem'}}>{showDetail?.full_name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row mb-3" style={{fontSize:'0.85rem'}}>
            <div className="col-4"><strong>Age:</strong> {showDetail?.age||'—'}</div>
            <div className="col-4"><strong>Gender:</strong> <span style={{textTransform:'capitalize'}}>{showDetail?.gender||'—'}</span></div>
            <div className="col-4"><strong>Blood:</strong> {showDetail?.blood_group||'—'}</div>
          </div>
          <div className="mb-3" style={{fontSize:'0.85rem'}}><strong>Diagnosis:</strong> {showDetail?.diagnosis||'—'}</div>

          <Tabs defaultActiveKey="history" className="mb-3">
            <Tab eventKey="history" title={<><FiFileText size={13}/> Medical History</>}>
              <div className="mb-3">
                <div className="row g-2">
                  <div className="col-md-4"><Form.Control size="sm" placeholder="Condition" value={mhForm.condition} onChange={e=>setMhForm({...mhForm,condition:e.target.value})}/></div>
                  <div className="col-md-4"><Form.Control size="sm" placeholder="Treatment" value={mhForm.treatment} onChange={e=>setMhForm({...mhForm,treatment:e.target.value})}/></div>
                  <div className="col-md-3"><Form.Control size="sm" type="date" value={mhForm.diagnosed_date} onChange={e=>setMhForm({...mhForm,diagnosed_date:e.target.value})}/></div>
                  <div className="col-md-1"><Button size="sm" className="btn-rns-primary w-100" onClick={addMedHistory} disabled={!mhForm.condition}>+</Button></div>
                </div>
              </div>
              {medHistory.length===0?<p className="text-muted" style={{fontSize:'0.85rem'}}>No medical history recorded.</p>:(
                <table className="table table-sm table-custom"><thead><tr><th>Condition</th><th>Treatment</th><th>Date</th></tr></thead><tbody>
                  {medHistory.map(m=><tr key={m.id}><td>{m.condition}</td><td>{m.treatment||'—'}</td><td>{m.diagnosed_date||'—'}</td></tr>)}
                </tbody></table>
              )}
            </Tab>
            <Tab eventKey="billing" title={<><FiDollarSign size={13}/> Billing</>}>
              <div className="mb-3">
                <div className="row g-2">
                  <div className="col-md-4"><Form.Control size="sm" placeholder="Description" value={billForm.description} onChange={e=>setBillForm({...billForm,description:e.target.value})}/></div>
                  <div className="col-md-2"><Form.Control size="sm" type="number" placeholder="Amount" value={billForm.amount} onChange={e=>setBillForm({...billForm,amount:e.target.value})}/></div>
                  <div className="col-md-2"><Form.Select size="sm" value={billForm.status} onChange={e=>setBillForm({...billForm,status:e.target.value})}><option value="pending">Pending</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="waived">Waived</option></Form.Select></div>
                  <div className="col-md-3"><Form.Control size="sm" placeholder="Payment method" value={billForm.payment_method} onChange={e=>setBillForm({...billForm,payment_method:e.target.value})}/></div>
                  <div className="col-md-1"><Button size="sm" className="btn-rns-primary w-100" onClick={addBilling} disabled={!billForm.description}>+</Button></div>
                </div>
              </div>
              {billingRecords.length===0?<p className="text-muted" style={{fontSize:'0.85rem'}}>No billing records.</p>:(
                <table className="table table-sm table-custom"><thead><tr><th>Description</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead><tbody>
                  {billingRecords.map(b=><tr key={b.id}><td>{b.description}</td><td>₹{b.amount}</td><td><span className={`status-badge ${b.status}`}>{b.status}</span></td><td>{b.payment_method||'—'}</td></tr>)}
                </tbody></table>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </>
  );
}
