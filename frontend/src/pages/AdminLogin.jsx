import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import logo from '../assets/GPW.png';

function AdminLogin() {
  const [isOn, setIsOn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!username || !password) {
      setError('Username aur password dono daalo.');
      return;
    }

    setLoading(true);
    setError('');

    API.post('/admin-login/', { username, password })
      .then((response) => {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUsername', response.data.username);
        navigate('/admin/dashboard/orders');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Login fail ho gaya.');
        setLoading(false);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={styles.page}>
      <div style={styles.lampSide}>
        <div style={styles.lampWire} />

        <motion.div
          style={styles.lampHead}
          animate={{ rotate: isOn ? [0, 8, -6, 4, -2, 0] : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={() => setIsOn((prev) => !prev)}
        >
          <div style={{ ...styles.bulb, background: isOn ? '#ffd54f' : '#555' }} />
          {isOn && <div style={styles.glow} />}
        </motion.div>

        <motion.div
          style={styles.pullString}
          animate={{ rotate: isOn ? [0, 10, -8, 5, 0] : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={() => setIsOn((prev) => !prev)}
        >
          <div style={styles.stringLine} />
          <div style={styles.stringKnob} />
        </motion.div>

        <p style={styles.hint}>{isOn ? 'Click lamp to turn off' : 'Click lamp to turn on'}</p>
      </div>

      <div style={styles.formSide}>
        <AnimatePresence mode="wait">
          {isOn ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35 }}
              style={styles.card}
            >
              <img src={logo} alt="Pizza Wala Logo" style={styles.logoImg} />
              <h1 style={styles.title}>Welcome Back</h1>
              <p style={styles.subtitle}>The Graduated Pizza Wala — Admin</p>

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.input}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.input}
              />

              {error && <p style={styles.errorText}>{error}</p>}

              <button style={styles.loginBtn} onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
              <button
                style={{ background: 'transparent', color: '#888', fontSize: '13px', marginTop: '14px', textDecoration: 'underline' }}
                onClick={() => navigate('/admin/forgot-password')}
              >
                Forgot Password?
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="dark-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              style={styles.darkHint}
            >
              Turn on the light to sign in
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0d0d0d',
    flexWrap: 'wrap',
  },
  lampSide: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '60px',
    position: 'relative',
  },
  lampWire: {
    width: '2px',
    height: '80px',
    background: '#555',
  },
  lampHead: {
    width: '90px',
    height: '50px',
    background: '#2a2a2a',
    borderRadius: '4px 4px 40px 40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: '6px',
    cursor: 'pointer',
    position: 'relative',
  },
  bulb: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    transition: 'background 0.3s ease',
  },
  glow: {
    position: 'absolute',
    top: '50px',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,79,0.35) 0%, rgba(255,213,79,0) 70%)',
    pointerEvents: 'none',
  },
  pullString: {
    marginTop: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  stringLine: {
    width: '1.5px',
    height: '36px',
    background: '#666',
  },
  stringKnob: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#888',
    marginTop: '-2px',
  },
  hint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '30px',
  },
  formSide: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
  },
  card: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    maxWidth: '340px',
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
  subtitle: { fontSize: '13px', color: '#888', marginBottom: '24px' },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #333',
    borderRadius: '8px',
    marginBottom: '10px',
    outline: 'none',
    background: '#0d0d0d',
    color: '#fff',
  },
  errorText: { color: '#ef5350', fontSize: '13px', marginBottom: '10px' },
  loginBtn: {
    width: '100%',
    background: '#d32f2f',
    color: '#fff',
    padding: '12px',
    fontSize: '15px',
    borderRadius: '8px',
    marginTop: '6px',
  },
  darkHint: {
    color: '#555',
    fontSize: '14px',
    fontStyle: 'italic',
  },
};

export default AdminLogin;