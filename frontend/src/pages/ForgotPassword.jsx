import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import logo from '../assets/GPW.png';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = identifier, 2 = otp+password

  const [identifier, setIdentifier] = useState('');
  const [resolvedUsername, setResolvedUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = () => {
    if (!identifier.trim()) {
      setError('Username ya email daalo.');
      return;
    }
    setLoading(true);
    setError('');
    API.post('/admin/request-otp/', { identifier: identifier.trim() })
      .then((res) => {
        setMessage(res.data.message);
        setResolvedUsername(res.data.username);
        setStep(2);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'OTP bhejne me error aaya.');
      })
      .finally(() => setLoading(false));
  };

  const handleResetPassword = () => {
    if (!otp || !newPassword || !confirmPassword) {
      setError('Saari fields bharo.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password match nahi kar raha.');
      return;
    }
    setLoading(true);
    setError('');
    API.post('/admin/verify-otp-reset/', {
      username: resolvedUsername,
      otp: otp.trim(),
      new_password: newPassword,
    })
      .then(() => {
        setMessage('✅ Password reset ho gaya! Login page pe ja rahe hain...');
        setTimeout(() => navigate('/admin'), 2000);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Reset nahi ho paya.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="Pizza Wala Logo" style={styles.logoImg} />
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>The Graduated Pizza Wala — Admin</p>

        {step === 1 ? (
          <>
            <label style={styles.label}>Username ya Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
              placeholder="Apna admin username ya email daalo"
            />
            {error && <p style={styles.errorText}>{error}</p>}
            <button style={styles.btn} onClick={handleRequestOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            {message && <p style={styles.successText}>{message}</p>}

            <label style={styles.label}>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={styles.input}
              placeholder="6-digit OTP"
              maxLength={6}
            />

            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />

            {error && <p style={styles.errorText}>{error}</p>}

            <button style={styles.btn} onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button style={styles.linkBtn} onClick={() => setStep(1)}>
              ← Wrong details? Go back
            </button>
          </>
        )}

        <button style={styles.linkBtn} onClick={() => navigate('/admin')}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0d0d0d',
    padding: '20px',
  },
  card: {
    background: '#1c1c1c',
    borderRadius: '16px',
    padding: '40px 30px',
    textAlign: 'center',
    maxWidth: '360px',
    width: '100%',
    border: '1px solid #2a2a2a',
  },
  logoImg: {
    height: '56px',
    width: '56px',
    objectFit: 'contain',
    borderRadius: '50%',
    margin: '0 auto 16px',
    display: 'block',
  },
  title: { fontSize: '22px', marginBottom: '4px', color: '#fff' },
  subtitle: { fontSize: '13px', color: '#999', marginBottom: '24px' },
  label: { fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px', marginTop: '12px', textAlign: 'left' },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #333',
    borderRadius: '8px',
    outline: 'none',
    background: '#0d0d0d',
    color: '#fff',
    boxSizing: 'border-box',
  },
  errorText: { color: '#ef5350', fontSize: '13px', marginTop: '10px' },
  successText: { color: '#66bb6a', fontSize: '13px', marginBottom: '10px' },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '12px',
    fontSize: '15px',
    borderRadius: '8px',
    marginTop: '18px',
  },
  linkBtn: {
    background: 'transparent',
    color: '#999',
    fontSize: '13px',
    marginTop: '14px',
    textDecoration: 'underline',
  },
};

export default ForgotPassword;