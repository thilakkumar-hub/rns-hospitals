import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/layout/TopNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiUser, FiLock, FiPhone, FiBriefcase, FiMail, FiCheck } from 'react-icons/fi';

export default function Profile() {
  const { onMenuClick } = useOutletContext();
  const { staffProfile, user, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    department: ''
  });
  
  const [pwdForm, setPwdForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (staffProfile) {
      setProfileForm({
        full_name: staffProfile.full_name || '',
        phone: staffProfile.phone || '',
        department: staffProfile.department || ''
      });
    }
  }, [staffProfile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          department: profileForm.department
        })
        .eq('id', staffProfile.id);

      if (error) throw error;
      
      await refreshProfile();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setProfileMsg({ type: 'danger', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'danger', text: 'Passwords do not match!' });
      return;
    }
    
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg({ type: 'danger', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: pwdForm.newPassword
      });

      if (error) throw error;

      setPwdForm({ newPassword: '', confirmPassword: '' });
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => setPwdMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setPwdMsg({ type: 'danger', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  if (!staffProfile) return <><TopNav title="My Profile" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="My Profile" subtitle="Manage your personal information and security" onMenuClick={onMenuClick} />
      
      <div className="page-content">
        <div className="row g-4">
          
          {/* Profile Details Section */}
          <div className="col-lg-6">
            <div className="data-card">
              <div className="card-header-custom">
                <h5><FiUser style={{ marginRight: 8 }} /> Personal Details</h5>
              </div>
              <div className="card-body-custom">
                {profileMsg.text && (
                  <div className={`alert alert-${profileMsg.type} py-2`} style={{ fontSize: '0.85rem' }}>
                    {profileMsg.type === 'success' && <FiCheck style={{ marginRight: 6 }} />}
                    {profileMsg.text}
                  </div>
                )}
                
                <form onSubmit={handleProfileUpdate}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Username</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background: '#f8f9fa' }}>@</span>
                      <input type="text" className="form-control" value={staffProfile.username} disabled />
                    </div>
                    <div className="form-text" style={{ fontSize: '0.75rem' }}>Username cannot be changed.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiMail size={14} /></span>
                      <input type="email" className="form-control" value={user?.email || ''} disabled />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profileForm.full_name} 
                      onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiPhone size={14} /></span>
                      <input 
                        type="tel" 
                        className="form-control" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Department</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiBriefcase size={14} /></span>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={profileForm.department} 
                        onChange={e => setProfileForm({...profileForm, department: e.target.value})} 
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-rns-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="col-lg-6">
            <div className="data-card">
              <div className="card-header-custom">
                <h5><FiLock style={{ marginRight: 8 }} /> Change Password</h5>
              </div>
              <div className="card-body-custom">
                {pwdMsg.text && (
                  <div className={`alert alert-${pwdMsg.type} py-2`} style={{ fontSize: '0.85rem' }}>
                    {pwdMsg.type === 'success' && <FiCheck style={{ marginRight: 6 }} />}
                    {pwdMsg.text}
                  </div>
                )}
                
                <form onSubmit={handlePasswordUpdate}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Min 6 characters"
                      value={pwdForm.newPassword} 
                      onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} 
                      required 
                      minLength={6}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Repeat new password"
                      value={pwdForm.confirmPassword} 
                      onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} 
                      required 
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="btn btn-rns-secondary" disabled={loading || !pwdForm.newPassword}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
