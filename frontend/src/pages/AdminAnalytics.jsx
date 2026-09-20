import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const navigate = useNavigate();

  const fetchAnalytics = (filter = activeFilter, date = customDate) => {
    let url = "/analytics/today/";
    if (filter === "custom" && date) {
      url = `/analytics/today/?filter=custom&date=${date}`;
    } else {
      url = `/analytics/today/?filter=${filter}`;
    }
    API.get(url)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Analytics error:", err));
  };

  const fetchFeedback = (filter = activeFilter, date = customDate) => {
    let url = "/feedback/";
    if (filter === "custom" && date) {
      url = `/feedback/?filter=custom&date=${date}`;
    } else {
      url = `/feedback/?filter=${filter}`;
    }
    API.get(url)
      .then((res) => setFeedbacks(res.data))
      .catch((err) => console.error("Feedback error:", err));
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchAnalytics();
    fetchFeedback();
  }, [activeFilter, customDate]);

  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
        ).toFixed(1)
      : null;

  const filters = [
    { key: "today", label: "📅 Today" },
    { key: "yesterday", label: "📆 Yesterday" },
    { key: "all", label: "🗂️ All" },
    { key: "custom", label: "🔍 Pick Date" },
  ];

  if (!data) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics</h1>
      </div>

      <div style={styles.content}>
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

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Orders</p>
            <p style={styles.statValue}>{data.total_orders}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Revenue (Paid)</p>
            <p style={styles.statValue}>₹{data.total_revenue}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Pending</p>
            <p style={styles.statValue}>₹{data.pending_payment_amount}</p>
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Top Selling Items</h2>
        {data.top_items.length === 0 ? (
          <p style={styles.emptyText}>Is period me koi order nahi hai.</p>
        ) : (
          data.top_items.map((item, index) => (
            <div key={index} style={styles.itemRow}>
              <span>{item.menu_item__name}</span>
              <span style={styles.qtyBadge}>{item.total_qty} sold</span>
            </div>
          ))
        )}

        <h2 style={styles.sectionTitle}>
          Customer Feedback{" "}
          {avgRating && `— ⭐ ${avgRating} avg (${feedbacks.length} reviews)`}
        </h2>
        {feedbacks.length === 0 ? (
          <p style={styles.emptyText}>Is period me koi feedback nahi mila.</p>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb.id} style={styles.feedbackCard}>
              <div style={styles.feedbackTop}>
                <span style={styles.stars}>
                  {"★".repeat(fb.rating)}
                  {"☆".repeat(5 - fb.rating)}
                </span>
                <span style={styles.feedbackOrder}>Order #{fb.order}</span>
              </div>
              {fb.items && fb.items.length > 0 && (
                <p style={styles.feedbackItems}>{fb.items.join(", ")}</p>
              )}
              {fb.comment && <p style={styles.feedbackComment}>{fb.comment}</p>}
            </div>
          ))
        )}
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
  title: { fontSize: "20px" },
  content: { padding: "20px", maxWidth: "640px", margin: "0 auto" },
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px 10px",
    textAlign: "center",
    border: "1px solid #2a2a2a",
  },
  statLabel: { fontSize: "11px", color: "#999", marginBottom: "6px" },
  statValue: { fontSize: "18px", fontWeight: 700, color: "#ef5350" },
  sectionTitle: { fontSize: "16px", margin: "24px 0 10px", color: "#fff" },
  emptyText: { color: "#999", fontSize: "14px" },
  itemRow: {
    background: "#1c1c1c",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#eee",
    border: "1px solid #2a2a2a",
  },
  qtyBadge: { color: "#ef5350", fontWeight: 600 },
  feedbackCard: {
    background: "#1c1c1c",
    borderRadius: "8px",
    padding: "14px 16px",
    marginBottom: "8px",
    border: "1px solid #2a2a2a",
  },
  feedbackTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stars: { color: "#fbc02d", fontSize: "16px" },
  feedbackOrder: { fontSize: "12px", color: "#999" },
  feedbackItems: { fontSize: "12px", color: "#999", marginTop: "6px" },
  feedbackComment: { fontSize: "13px", color: "#bbb", marginTop: "6px" },
};

export default AdminAnalytics;