import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useCart } from '../context/CartContext';
import TiltCard from '../components/TiltCard';
import logo from '../assets/GPW.png';

function Menu() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const navigate = useNavigate();

  const { cart, addToCart, removeFromCart, getItemQuantity, getTotal } = useCart();
  const getToppingsItemQuantity = (itemId) => {
    return cart.filter((c) => c.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const handleRemoveToppingsItem = (itemId) => {
    const matches = cart.filter((c) => c.id === itemId && c.quantity > 0);
    if (matches.length === 0) return;
    const last = matches[matches.length - 1];
    removeFromCart(itemId, last.size, last.toppings);
  };

  const [selectedSize, setSelectedSize] = useState({});
  const [toppings, setToppings] = useState([]);
  const [toppingModal, setToppingModal] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    API.get('/menu/')
      .then((response) => {
        setCategories(response.data);
        setLoading(false);

        const defaults = {};
        response.data.forEach((cat) => {
          cat.items.forEach((item) => {
            if (item.variants.length > 0) {
              defaults[item.id] = item.variants[0].size;
            }
          });
        });
        setSelectedSize(defaults);
      })
      .catch((error) => {
        console.error('Menu fetch error:', error);
        setLoading(false);
      });

    API.get('/toppings/')
      .then((res) => setToppings(res.data))
      .catch((err) => console.error('Toppings fetch error:', err));

    const stored = JSON.parse(localStorage.getItem('myOrders') || '[]');
    const recent = stored.filter((o) => Date.now() - o.timestamp < 3 * 60 * 60 * 1000);
    setMyOrders(recent);
  }, []);

  const getToppingPrice = (topping, size) => {
    if (size === 'Small') return topping.price_small;
    if (size === 'Medium') return topping.price_medium;
    if (size === 'Large') return topping.price_large;
    return topping.price_small;
  };

  const handleAdd = (item) => {
    if (item.allow_toppings) {
      setToppingModal(item);
      setSelectedToppings([]);
      return;
    }
    if (item.variants.length > 0) {
      const size = selectedSize[item.id];
      const variant = item.variants.find((v) => v.size === size);
      addToCart(item, size, variant.price);
    } else {
      addToCart(item);
    }
  };

  const handleRemove = (item) => {
    if (item.variants.length > 0) {
      removeFromCart(item.id, selectedSize[item.id]);
    } else {
      removeFromCart(item.id);
    }
  };

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) return prev.filter((t) => t.id !== topping.id);
      return [...prev, topping];
    });
  };

  const confirmAddWithToppings = () => {
    const item = toppingModal;
    if (!item) return;

    const hasVariants = item.variants.length > 0;
    const size = hasVariants ? selectedSize[item.id] : null;
    const variant = hasVariants
      ? item.variants.find((v) => v.size === size) || item.variants[0]
      : null;

    const basePrice = hasVariants ? variant.price : item.price;

    const toppingsWithPrice = selectedToppings.map((t) => ({
      id: t.id,
      name: t.name,
      price: getToppingPrice(t, size),
    }));

    addToCart(item, size, basePrice, toppingsWithPrice);
    setToppingModal(null);
    setSelectedToppings([]);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div className="header-content">
          <div style={styles.titleRow}>
            <img src={logo} alt="The Graduated Pizza Wala Logo" style={styles.logoImg} />
            <h1 style={styles.title}>The Graduated Pizza Wala</h1>
          </div>
          {tableNumber ? (
            <span style={styles.tableBadge}>Table {tableNumber}</span>
          ) : (
            <p style={styles.errorText}>Table number nahi mila. QR code se scan karo.</p>
          )}

          <button
            style={styles.trackLinkBtn}
            onClick={() => navigate(`/track-order?table=${tableNumber}`)}
          >
            🔍 Track an order
          </button>

          {myOrders.length > 0 && (
            <div style={styles.myOrdersBar}>
              {myOrders.map((o) => (
                <button
                  key={o.orderId}
                  style={styles.trackBtn}
                  onClick={() => navigate(`/order-success?orderId=${o.orderId}&table=${o.table}`)}
                >
                  📦 {o.customerName || 'Order'} #{o.orderId}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="page-wrapper" style={styles.content}>
        {categories.map((category) => (
          <div key={category.id} style={{ marginBottom: '28px' }}>
            <h2 style={styles.categoryTitle}>{category.name}</h2>

            <div className="items-grid">
              {category.items.map((item) => {
                const hasVariants = item.variants.length > 0;
                const currentSize = selectedSize[item.id];
                const quantity = item.allow_toppings
                  ? getToppingsItemQuantity(item.id)
                  : hasVariants
                  ? getItemQuantity(item.id, currentSize)
                  : getItemQuantity(item.id);
                const displayPrice = hasVariants
                  ? item.variants.find((v) => v.size === currentSize)?.price
                  : item.price;

                return (
                  <TiltCard key={item.id} style={styles.itemCard} maxTilt={6}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={styles.itemImage} />
                    )}

                    <div style={styles.itemBody}>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemNameRow}>
                          <span style={item.is_veg ? styles.vegDot : styles.nonVegDot} />
                          <h3 style={styles.itemName}>{item.name}</h3>
                        </div>
                        {item.description && (
                          <p style={styles.itemDesc}>{item.description}</p>
                        )}

                        {hasVariants && (
                          <div style={styles.sizeRow}>
                            {item.variants.map((variant) => (
                              <button
                                key={variant.id}
                                style={
                                  currentSize === variant.size
                                    ? styles.sizeBtnActive
                                    : styles.sizeBtn
                                }
                                onClick={() =>
                                  setSelectedSize((prev) => ({
                                    ...prev,
                                    [item.id]: variant.size,
                                  }))
                                }
                              >
                                {variant.size}
                              </button>
                            ))}
                          </div>
                        )}

                        <p style={styles.itemPrice}>₹{displayPrice}</p>
                        {item.allow_toppings && (
                          <p style={styles.customizeHint}>+ Customizable</p>
                        )}
                      </div>

                      <div style={styles.itemAction}>
                        {quantity === 0 ? (
                          <button style={styles.addBtn} onClick={() => handleAdd(item)}>
                            Add
                          </button>
                        ) : (
                          <div style={styles.qtyControl}>
                            <button
                              style={styles.qtyBtn}
                              onClick={() =>
                                item.allow_toppings
                                  ? handleRemoveToppingsItem(item.id)
                                  : handleRemove(item)
                              }
                            >
                              −
                            </button>
                            <span style={styles.qtyText}>{quantity}</span>
                            <button style={styles.qtyBtn} onClick={() => handleAdd(item)}>
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {toppingModal && (
        <div style={styles.modalOverlay} onClick={() => setToppingModal(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{toppingModal.name}</h3>
            <p style={styles.modalSub}>Extra toppings add karna chahte ho?</p>

            {toppings.map((topping) => {
              const size = selectedSize[toppingModal.id];
              const price = getToppingPrice(topping, size);
              const isSelected = selectedToppings.find((t) => t.id === topping.id);

              return (
                <label key={topping.id} style={styles.toppingRow}>
                  <span>
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleTopping(topping)}
                      style={{ marginRight: '8px' }}
                    />
                    {topping.name}
                  </span>
                  <span style={styles.toppingPrice}>+₹{price}</span>
                </label>
              );
            })}

            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setToppingModal(null)}>
                Cancel
              </button>
              <button style={styles.modalAddBtn} onClick={confirmAddWithToppings}>
                {selectedToppings.length > 0
                  ? `Add to Cart (+${selectedToppings.length} topping${selectedToppings.length > 1 ? 's' : ''})`
                  : 'Add to Cart (No toppings)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div style={styles.cartBar}>
          <span>
            {cart.reduce((sum, i) => sum + i.quantity, 0)} items | ₹{getTotal()}
          </span>
          <button
            style={styles.viewCartBtn}
            onClick={() => navigate(`/cart?table=${tableNumber}`)}
          >
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: '90px', background: '#0d0d0d' },
  loadingScreen: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#888',
    background: '#0d0d0d',
  },
  header: {
    background: 'linear-gradient(180deg, #1c1c1c, #0d0d0d)',
    color: '#fff',
    padding: '28px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #2a2a2a',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoImg: { height: '44px', width: '44px', objectFit: 'contain', borderRadius: '10px' },
  title: { fontSize: '24px', fontWeight: 700, letterSpacing: '0.3px' },
  tableBadge: {
    background: 'rgba(211,47,47,0.15)',
    color: '#ff8a80',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid rgba(211,47,47,0.3)',
  },
  errorText: { color: '#ffab91', fontSize: '14px' },
  trackLinkBtn: {
    background: 'transparent',
    color: '#999',
    fontSize: '12px',
    textDecoration: 'underline',
    marginTop: '10px',
    padding: '2px',
    display: 'block',
    margin: '10px auto 0',
  },
  myOrdersBar: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '10px',
  },
  trackBtn: {
    background: '#1c1c1c',
    color: '#fff',
    padding: '5px 12px',
    fontSize: '12px',
    borderRadius: '14px',
    border: '1px solid #333',
  },
  content: { padding: '20px' },
  categoryTitle: {
    fontSize: '18px',
    marginBottom: '12px',
    color: '#ef5350',
    borderBottom: '2px solid #ef5350',
    display: 'inline-block',
    paddingBottom: '4px',
  },
  itemCard: {
    background: '#1c1c1c',
    borderRadius: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    animation: 'fadeIn 0.4s ease',
    border: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
  },
  itemImage: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  itemBody: {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  itemInfo: { flex: 1 },
  itemNameRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  vegDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    border: '2px solid #388e3c',
    background: '#4caf50',
    display: 'inline-block',
    flexShrink: 0,
  },
  nonVegDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    border: '2px solid #c62828',
    background: '#e53935',
    display: 'inline-block',
    flexShrink: 0,
  },
  itemName: { fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: '1.3' },
  itemDesc: { fontSize: '12px', color: '#999', margin: '4px 0' },
  sizeRow: { display: 'flex', gap: '5px', margin: '6px 0', flexWrap: 'wrap' },
  sizeBtn: {
    background: '#2a2a2a',
    color: '#bbb',
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '14px',
    textTransform: 'capitalize',
  },
  sizeBtnActive: {
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '14px',
    textTransform: 'capitalize',
  },
  itemPrice: { fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' },
  customizeHint: { fontSize: '10px', color: '#ef5350', marginTop: '2px', fontWeight: 600 },
  itemAction: { width: '100%' },
  addBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow: '0 2px 10px rgba(211,47,47,0.4)',
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    borderRadius: '8px',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(211,47,47,0.4)',
    width: '100%',
  },
  qtyBtn: { background: 'transparent', color: '#fff', padding: '6px 12px', fontSize: '16px' },
  qtyText: { padding: '0 8px', fontWeight: 600 },
  cartBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1c1c1c',
    color: '#fff',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: 600,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
    borderTop: '1px solid #2a2a2a',
  },
  viewCartBtn: {
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '10px 20px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  modalBox: {
    background: '#1c1c1c',
    borderRadius: '16px 16px 0 0',
    padding: '24px 20px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '70vh',
    overflowY: 'auto',
    border: '1px solid #2a2a2a',
    borderBottom: 'none',
  },
  modalTitle: { fontSize: '18px', marginBottom: '4px', color: '#fff' },
  modalSub: { fontSize: '13px', color: '#999', marginBottom: '16px' },
  toppingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #2a2a2a',
    fontSize: '14px',
    color: '#eee',
  },
  toppingPrice: { color: '#ef5350', fontWeight: 600 },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  modalCancelBtn: {
    flex: 1,
    background: '#2a2a2a',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  modalAddBtn: {
    flex: 2,
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
  },
};

export default Menu;