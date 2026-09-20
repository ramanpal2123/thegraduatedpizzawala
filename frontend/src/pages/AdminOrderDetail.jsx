import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    API.get(`/order/${orderId}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Order nahi mila."));
  }, [orderId]);

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div style={styles.content}>
          <p style={styles.loading}>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>Order #{order.id}</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Customer</span>
            <span style={styles.infoValue}>{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Mobile</span>
              <span style={styles.infoValue}>{order.customer_phone}</span>
            </div>
          )}
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Table</span>
            <span style={styles.infoValue}>{order.table}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Status</span>
            <span style={styles.infoValue}>{order.status}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Payment</span>
            <span style={styles.infoValue}>
              {order.payment_method} ({order.payment_status})
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Placed At</span>
            <span style={styles.infoValue}>
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Items</h3>
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

        <div style={styles.totalRow}>
          <span>Total</span>
          <span style={styles.totalAmount}>₹{order.total_amount}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0d0d0d" },
  loading: { padding: "40px", textAlign: "center", color: "#999" },
  header: {
    background: "linear-gradient(180deg, #1c1c1c, #0d0d0d)",
    color: "#fff",
    padding: "18px 20px",
    borderBottom: "1px solid #2a2a2a",
  },
  backBtn: {
    background: "transparent",
    color: "#fff",
    border: "1px solid #333",
    padding: "6px 14px",
    fontSize: "13px",
    borderRadius: "6px",
    marginBottom: "10px",
  },
  title: { fontSize: "20px" },
  content: { padding: "20px", maxWidth: "500px", margin: "0 auto" },
  infoCard: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px",
    border: "1px solid #2a2a2a",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #2a2a2a",
    fontSize: "14px",
  },
  infoLabel: { color: "#999" },
  infoValue: { fontWeight: 600, textTransform: "capitalize", color: "#fff" },
  sectionTitle: { fontSize: "15px", marginBottom: "10px", color: "#fff" },
  itemRow: {
    background: "#1c1c1c",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#ccc",
    border: "1px solid #2a2a2a",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: 700,
    marginTop: "16px",
    padding: "14px",
    background: "#1c1c1c",
    borderRadius: "10px",
    color: "#fff",
    border: "1px solid #2a2a2a",
  },
  totalAmount: { color: "#ef5350" },
};

export default AdminOrderDetail;
