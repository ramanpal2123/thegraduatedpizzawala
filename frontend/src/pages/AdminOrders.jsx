import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("live");
  const [customDate, setCustomDate] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const navigate = useNavigate();
  const previousOrderCount = useRef(null);
  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  // Browser autoplay policy: AudioContext tab tak "suspended" rehta hai
  // jab tak page pe ek real user interaction (click/tap) na ho jaye.
  // Ye ek baar page pe click/tap hote hi context ko resume/unlock kar deta hai.
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = getAudioCtx();

      const fireTone = () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.5,
        );
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);

        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1046, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.5,
          );
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 200);
      };

      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(fireTone);
      } else {
        fireTone();
      }
    } catch (e) {
      console.error("Beep error:", e);
    }
  };

  const fetchOrders = (filter = activeFilter, date = customDate) => {
    let url = "/orders/";
    if (filter === "custom" && date) {
      url = `/orders/?filter=custom&date=${date}`;
    } else {
      url = `/orders/?filter=${filter}`;
    }

    API.get(url)
      .then((response) => {
        const newOrders = response.data;

        if (
          filter === "live" &&
          previousOrderCount.current !== null &&
          newOrders.length > previousOrderCount.current
        ) {
          playBeep();
        }
        if (filter === "live") {
          previousOrderCount.current = newOrders.length;
        }

        setOrders(newOrders);
      })
      .catch((error) => console.error("Orders fetch error:", error));
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 5000);
    return () => clearInterval(interval);
  }, [activeFilter, customDate]);

  const updateStatus = (orderId, newStatus) => {
    API.patch(`/order/${orderId}/update/`, { status: newStatus })
      .then(() => fetchOrders())
      .catch((error) => console.error("Status update error:", error));
  };

  const markPaid = (orderId) => {
    API.patch(`/order/${orderId}/update/`, { payment_status: "paid" })
      .then(() => fetchOrders())
      .catch((error) => console.error("Payment update error:", error));
  };

  const handleOrderSearch = () => {
    if (!searchOrderId.trim()) return;
    navigate(`/admin/dashboard/order/${searchOrderId.trim()}`);
  };

  const statusStyles = {
    pending: { bg: "rgba(255,152,0,0.15)", text: "#ffb74d" },
    preparing: { bg: "rgba(3,169,244,0.15)", text: "#4fc3f7" },
    ready: { bg: "rgba(76,175,80,0.15)", text: "#66bb6a" },
    served: { bg: "rgba(158,158,158,0.15)", text: "#bbb" },
    cancelled: { bg: "rgba(239,83,80,0.15)", text: "#ef5350" },
  };

  const nextStatus = {
    pending: "preparing",
    preparing: "ready",
    ready: "served",
  };
  const nextLabel = {
    pending: "Start preparing",
    preparing: "Mark ready",
    ready: "Mark served",
  };

  const filters = [
    { key: "live", label: "🔴 Live" },
    { key: "today", label: "📅 Today" },
    { key: "yesterday", label: "📆 Yesterday" },
    { key: "all", label: "🗂️ All" },
    { key: "custom", label: "🔍 Pick Date" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Orders</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.searchRow}>
          <input
            type="number"
            placeholder="Order ID se search kare"
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleOrderSearch()}
            style={styles.searchInput}
          />
          <button style={styles.searchBtn} onClick={handleOrderSearch}>
            🔍 Search
          </button>
        </div>

        <div style={styles.filterRow}>
          {filters.map((f) => (
            <button
              key={f.key}
              style={
                activeFilter === f.key
                  ? styles.filterBtnActive
                  : styles.filterBtn
              }
              onClick={() => {
                setActiveFilter(f.key);
                if (f.key !== "custom") setCustomDate("");
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {activeFilter === "custom" && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            style={styles.dateInput}
          />
        )}

        {orders.length === 0 ? (
          <p style={styles.emptyText}>Is filter me koi order nahi hai.</p>
        ) : (
          orders.map((order) => {
            const st = statusStyles[order.status] || statusStyles.pending;
            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderTop}>
                  <h3
                    style={{
                      ...styles.orderTitle,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() =>
                      navigate(`/admin/dashboard/order/${order.id}`)
                    }
                  >
                    Order #{order.id} — Table {order.table} —{" "}
                    {order.customer_name}
                  </h3>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: st.bg,
                      color: st.text,
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <div style={styles.itemsList}>
                  {order.items.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                      <div>
                        <span>
                          {item.quantity} × {item.menu_item_name}
                          {item.size ? ` (${item.size})` : ""}
                        </span>
                        {item.toppings && item.toppings.length > 0 && (
                          <div style={{ fontSize: "12px", color: "#ef5350" }}>
                            + {item.toppings.map((t) => t.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <span>₹{item.price_at_order}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.orderFooter}>
                  <div style={styles.totalPayment}>
                    <span style={styles.totalText}>₹{order.total_amount}</span>
                    <span style={styles.paymentText}>
                      {order.payment_method} ·{" "}
                      <span
                        style={{
                          color:
                            order.payment_status === "paid"
                              ? "#66bb6a"
                              : "#ef5350",
                          fontWeight: 600,
                        }}
                      >
                        {order.payment_status}
                      </span>
                    </span>
                  </div>

                  <div style={styles.actions}>
                    {nextStatus[order.status] && (
                      <button
                        style={styles.actionBtn}
                        onClick={() =>
                          updateStatus(order.id, nextStatus[order.status])
                        }
                      >
                        {nextLabel[order.status]}
                      </button>
                    )}
                    {order.payment_status === "pending" && (
                      <button
                        style={styles.paidBtn}
                        onClick={() => markPaid(order.id)}
                      >
                        Mark as paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0d0d0d" },
  header: {
    background: "linear-gradient(180deg, #1c1c1c, #0d0d0d)",
    color: "#fff",
    padding: "18px 20px",
    borderBottom: "1px solid #2a2a2a",
  },
  title: { fontSize: "20px" },
  content: { padding: "20px", maxWidth: "640px", margin: "0 auto" },
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  searchInput: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #333",
    borderRadius: "8px",
    outline: "none",
    background: "#1c1c1c",
    color: "#fff",
  },
  searchBtn: {
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "10px 16px",
    fontSize: "13px",
    borderRadius: "8px",
    whiteSpace: "nowrap",
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  filterBtn: {
    background: "#1c1c1c",
    color: "#ccc",
    padding: "8px 14px",
    fontSize: "13px",
    borderRadius: "20px",
    border: "1px solid #333",
  },
  filterBtnActive: {
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "8px 14px",
    fontSize: "13px",
    borderRadius: "20px",
    border: "1px solid #d32f2f",
  },
  dateInput: {
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #333",
    borderRadius: "8px",
    marginBottom: "16px",
    outline: "none",
    background: "#1c1c1c",
    color: "#fff",
  },
  emptyText: { textAlign: "center", color: "#999", marginTop: "40px" },
  orderCard: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "14px",
    border: "1px solid #2a2a2a",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "8px",
  },
  orderTitle: { fontSize: "15px", fontWeight: 600, color: "#fff" },
  statusBadge: {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "20px",
    textTransform: "capitalize",
  },
  itemsList: {
    borderTop: "1px solid #2a2a2a",
    borderBottom: "1px solid #2a2a2a",
    padding: "10px 0",
    marginBottom: "10px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#ccc",
    marginBottom: "4px",
  },
  orderFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  totalPayment: { display: "flex", flexDirection: "column" },
  totalText: { fontSize: "16px", fontWeight: 700, color: "#fff" },
  paymentText: { fontSize: "12px", color: "#999", textTransform: "capitalize" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  actionBtn: {
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "8px 14px",
    fontSize: "13px",
    borderRadius: "6px",
  },
  paidBtn: {
    background: "#2e7d32",
    color: "#fff",
    padding: "8px 14px",
    fontSize: "13px",
    borderRadius: "6px",
  },
};

export default AdminOrders;