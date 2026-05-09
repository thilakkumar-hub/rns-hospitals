import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import TopNav from '../../components/layout/TopNav';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiKey, FiCopy, FiCheck, FiClock } from 'react-icons/fi';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function CodeGenerator() {
  const { onMenuClick } = useOutletContext();
  const { staffProfile } = useAuth();
  const [maxUses, setMaxUses] = useState(1);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('registration_codes')
      .select('*, creator:created_by(full_name)')
      .order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const code = generateCode();
    const { error } = await supabase.from('registration_codes').insert({
      code,
      max_uses: maxUses,
      created_by: staffProfile.id,
    });
    if (!error) {
      setGeneratedCode(code);
      fetchCodes();
    }
    setGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = (date) => new Date(date) < new Date();
  const isExhausted = (code) => code.used_count >= code.max_uses;

  const getStatus = (code) => {
    if (isExpired(code.expires_at)) return { label: 'Expired', class: 'off_duty' };
    if (isExhausted(code)) return { label: 'Used Up', class: 'busy' };
    return { label: 'Active', class: 'available' };
  };

  if (loading) return <><TopNav title="Code Generator" onMenuClick={onMenuClick} /><LoadingSpinner /></>;

  return (
    <>
      <TopNav title="Registration Code Generator" subtitle="Generate invite codes for new staff" onMenuClick={onMenuClick} />

      <div className="page-content">
        {/* Generator Card */}
        <div className="data-card mb-4">
          <div className="card-header-custom">
            <h5><FiKey style={{ marginRight: 8 }} /> Generate New Code</h5>
          </div>
          <div className="card-body-custom">
            <div className="row align-items-end g-3">
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  Max Registrations Allowed
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={maxUses}
                  onChange={e => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={100}
                />
                <div className="form-text">How many staff can use this code</div>
              </div>
              <div className="col-md-4">
                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: 8 }}>
                  <FiClock size={13} style={{ marginRight: 4 }} /> Expires in 24 hours
                </div>
                <button
                  className="btn btn-rns-secondary w-100"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
            </div>

            {generatedCode && (
              <div className="code-display">
                <div className="code-text">{generatedCode}</div>
                <div className="code-info">Share this code with new staff members</div>
                <button
                  className={`btn btn-sm mt-2 ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={copyToClipboard}
                >
                  {copied ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy Code</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Code History */}
        <div className="data-card">
          <div className="card-header-custom">
            <h5>Generated Codes History</h5>
          </div>
          <div className="card-body-custom p-0">
            {codes.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p>No codes generated yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Uses</th>
                      <th>Created By</th>
                      <th>Created</th>
                      <th>Expires</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map(c => {
                      const status = getStatus(c);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{c.code}</td>
                          <td>{c.used_count} / {c.max_uses}</td>
                          <td>{c.creator?.full_name || '—'}</td>
                          <td style={{ fontSize: '0.82rem' }}>{new Date(c.created_at).toLocaleString()}</td>
                          <td style={{ fontSize: '0.82rem' }}>{new Date(c.expires_at).toLocaleString()}</td>
                          <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
