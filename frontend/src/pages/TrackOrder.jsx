import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import logo from '../assets/GPW.png';

function TrackOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [table, setTable] = useState(searchParams.get('table') || '');
  const [name, setName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!name || !orderId) {
      setError('Naam aur Order ID dono zaroori hain.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const params = new URLSearchParams({ name, order_id: orderId });
    if (table) params.append('table', table);

    API.get(`/order-search/?${params.toString()}`)
      .then((res) => setResults(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Order nahi mila.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={styles.titleRow}>
          <img src={logo} alt="The Graduated Pizza Wala Logo" style={styles.logoImg} />
          <h1 style={styles.title}>Track Your Order</h1>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.formBox}>
          <label style={styles.label}>Table Number</label>
          <input
            type="number"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            style={styles.input}
            placeholder="e.g. 5"
          />

          <label style={styles.label}>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Jo naam order karte waqt diya tha"
          />

          <label style={styles.label}>Order ID</label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={styles.input}
            placeholder="e.g. 12"
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={styles.searchBtn} onClick={handleSearch} disabled={loading}>
            {loading ? 'Dhoond rahe hain...' : 'Order Dhoondo'}
          </button>
        </div>

        {results && (
          <div style={styles.results}>
            <h3 style={styles.resultsTitle}>Aapke Orders</h3>
            {results.map((order) => (
              <div
                key={order.id}
                style={styles.resultCard}
                onClick={() =>
                  navigate(`/order-success?orderId=${order.id}&table=${table}`)
                }
              >
                <span>Order #{order.id}</span>
                <span style={styles.statusText}>{order.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: '40px' },
  header: {
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
  },
  backBtn: {
    background: 'transparent',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '10px',
    padding: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  logoImg: { height: '32px', width: '32px', objectFit: 'contain', borderRadius: '8px' },
  title: { fontSize: '22px' },
  content: { padding: '20px', maxWidth: '400px', margin: '0 auto' },
  formBox: {
    background: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  label: { fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px', marginTop: '12px' },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
  },
  errorText: { color: '#d32f2f', fontSize: '13px', marginTop: '10px' },
  searchBtn: {
    width: '100%',
    background: '#d32f2f',
    color: '#fff',
    padding: '12px',
    fontSize: '15px',
    borderRadius: '8px',
    marginTop: '18px',
  },
  results: { marginTop: '18px' },
  resultsTitle: { fontSize: '14px', marginBottom: '10px', color: '#444' },
  resultCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  statusText: { color: '#d32f2f', fontWeight: 600, textTransform: 'capitalize' },
};

export default TrackOrder;