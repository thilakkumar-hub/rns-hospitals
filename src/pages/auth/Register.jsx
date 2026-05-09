import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { FiActivity, FiUser, FiMail, FiLock, FiPhone, FiKey, FiBriefcase } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({
    username: '', full_name: '', email: '', password: '',
    phone: '', role: 'doctor', department: '', code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validate the registration code
      const { data: codeData, error: codeErr } = await supabase
        .from('registration_codes')
        .select('*')
        .eq('code', form.code.toUpperCase())
        .single();

      if (codeErr || !codeData) {
        setError('Invalid registration code');
        setLoading(false);
        return;
      }

      if (new Date(codeData.expires_at) < new Date()) {
        setError('This registration code has expired');
        setLoading(false);
        return;
      }

      if (codeData.used_count >= codeData.max_uses) {
        setError('This registration code has reached its maximum uses');
        setLoading(false);
        return;
      }

      // 2. Check if username is taken
      const { data: existingUser } = await supabase
        .from('staff')
        .select('id')
        .eq('username', form.username.toLowerCase())
        .single();

      if (existingUser) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      // 3. Create user in Supabase Auth
      const { data: authData, error: authErr } = await signUp(form.email, form.password, {
        full_name: form.full_name,
        username: form.username.toLowerCase()
      });

      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        return;
      }

      // 4. Create staff profile
      const userId = authData.user.id;
      const { error: staffErr } = await supabase
        .from('staff')
        .insert({
          id: userId,
          username: form.username.toLowerCase(),
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: form.department,
          registration_code_id: codeData.id
        });

      if (staffErr) {
        setError('Account created but profile setup failed: ' + staffErr.message);
        setLoading(false);
        return;
      }

      // 5. Increment code used_count
      await supabase
        .from('registration_codes')
        .update({ used_count: codeData.used_count + 1 })
        .eq('id', codeData.id);

      navigate('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="logo-section">
          <div className="hospital-icon">
            <FiActivity />
          </div>
          <h1>Staff Registration</h1>
          <p>Create your RNS Hospitals account</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Username</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiUser size={15} color="#7f8c8d" /></span>
                <input type="text" className="form-control" name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} required />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Full Name</label>
              <input type="text" className="form-control" name="full_name" placeholder="Your full name" value={form.full_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Email</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiMail size={15} color="#7f8c8d" /></span>
                <input type="email" className="form-control" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Password</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiLock size={15} color="#7f8c8d" /></span>
                <input type="password" className="form-control" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Phone</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiPhone size={15} color="#7f8c8d" /></span>
                <input type="tel" className="form-control" name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Department</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiBriefcase size={15} color="#7f8c8d" /></span>
                <input type="text" className="form-control" name="department" placeholder="e.g. Cardiology" value={form.department} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Role</label>
              <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="surgeon">Surgeon</option>
                <option value="receptionist">Receptionist</option>
                <option value="lab_tech">Lab Technician</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Registration Code</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8f9fa' }}><FiKey size={15} color="#7f8c8d" /></span>
                <input
                  type="text"
                  className="form-control"
                  name="code"
                  placeholder="Enter invite code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}
                />
              </div>
              <div className="form-text" style={{ fontSize: '0.75rem' }}>Ask your administrator for a code</div>
            </div>
          </div>

          <button type="submit" className="btn btn-rns-primary w-100 mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-3">
          <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--rns-primary)', fontWeight: 600 }}>Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
