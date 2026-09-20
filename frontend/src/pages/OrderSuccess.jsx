import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import logo from "../assets/GPW.png";

const STATUS_STEPS = ["pending", "preparing", "ready", "served"];
const STATUS_LABELS = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
};

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const table = searchParams.get("table");

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchOrder = () => {
    if (!orderId) {
      setError("Order ID missing.");
      return;
    }
    API.get(`/order/${orderId}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Order nahi mila."));
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = () => {
    if (!window.confirm("Order cancel karna hai?")) return;
    setCancelling(true);
    setCancelError("");
    API.post(`/order/${orderId}/cancel/`)
      .then(() => fetchOrder())
      .catch((err) => {
        setCancelError(err.response?.data?.error || "Cancel nahi ho paya.");
      })
      .finally(() => setCancelling(false));
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      setFeedbackError("Rating do pehle.");
      return;
    }
    setFeedbackError("");
    API.post("/feedback/create/", { order: orderId, rating, comment })
      .then(() => setFeedbackSubmitted(true))
      .catch((err) => {
        setFeedbackError(
          err.response?.data?.error || "Feedback submit nahi ho paya.",
        );
      });
  };

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img src={logo} alt="Logo" style={styles.logoImg} />
          <p style={styles.errorText}>{error}</p>
          <button
            style={styles.backBtn}
            onClick={() => navigate(`/?table=${table || ""}`)}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img src={logo} alt="Logo" style={styles.logoImg} />
          <p style={{ color: "#999" }}>Loading order...</p>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="The Graduated Pizza Wala Logo" style={styles.logoImg} />

        {!isCancelled && <div style={styles.checkCircle}>✓</div>}

        <h1 style={styles.title}>
          {isCancelled ? "Order Cancelled" : "Order Placed!"}
        </h1>
        <p style={styles.subText}>
          Order #{order.id} — Table {table}
        </p>
        <p style={styles.subText}>{order.customer_name}</p>

        <div style={styles.reminderBox}>
          📌 Apna <strong>Order ID (#{order.id})</strong> aur{" "}
          <strong>naam ({order.customer_name})</strong> yaad rakhe — order
          track karne ke liye ye dono zaroori hain.
        </div>

        {isCancelled ? (
          <p style={styles.cancelledText}>Ye order cancel ho chuka hai.</p>
        ) : (
          <div style={styles.progressWrap}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index <= currentStepIndex;
              return (
                <div key={step} style={styles.progressStep}>
                  {index > 0 && (
                    <div
                      style={{
                        ...styles.progressLine,
                        background:
                          index <= currentStepIndex ? "#2e7d32" : "#333",
                      }}
                    />
                  )}
                  <div
                    style={{
                      ...styles.progressDot,
                      background: isDone ? "#2e7d32" : "#333",
                    }}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  <span style={styles.progressLabel}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {order.status === "pending" && !isCancelled && cancelError && (
          <p style={styles.errorText}>{cancelError}</p>
        )}

        {order.status === "served" && !feedbackSubmitted && (
          <div style={styles.feedbackBox}>
            <h3 style={styles.feedbackTitle}>Kaisa laga khana?</h3>
            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    ...styles.star,
                    color: n <= rating ? "#fbc02d" : "#555",
                  }}
                  onClick={() => setRating(n)}
                >
                  {n <= rating ? "★" : "☆"}
                </span>
              ))}
            </div>
            <textarea
              placeholder="Koi comment? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={styles.textarea}
            />
            {feedbackError && <p style={styles.errorText}>{feedbackError}</p>}
            <button style={styles.submitBtn} onClick={handleSubmitFeedback}>
              Submit Feedback
            </button>
          </div>
        )}

        {feedbackSubmitted && (
          <p style={styles.thanksText}>✅ Feedback ke liye shukriya!</p>
        )}

        <div style={styles.actionRow}>
          {order.status === "pending" && !isCancelled && (
            <button
              style={styles.cancelBtn}
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          <button
            style={styles.backBtn}
            onClick={() => navigate(`/?table=${table || ""}`)}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0d0d0d",
    padding: "20px",
  },
  card: {
    background: "#1c1c1c",
    borderRadius: "16px",
    padding: "40px 30px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    maxWidth: "380px",
    width: "100%",
    border: "1px solid #2a2a2a",
  },
  logoImg: {
    height: "48px",
    width: "48px",
    objectFit: "contain",
    borderRadius: "10px",
    marginBottom: "14px",
  },
  checkCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#2e7d32",
    color: "#fff",
    fontSize: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 16px",
  },
  title: { fontSize: "22px", marginBottom: "10px", color: "#fff" },
  subText: { fontSize: "14px", color: "#999", marginBottom: "4px" },
  reminderBox: {
    background: "rgba(255,183,77,0.15)",
    border: "1px solid rgba(255,183,77,0.4)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#ffcc80",
    margin: "16px 0",
    lineHeight: "1.5",
    textAlign: "left",
  },
  progressWrap: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    margin: "28px 0",
  },
  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  progressDot: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    color: "#fff",
    fontSize: "13px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
    zIndex: 2,
  },
  progressLabel: { fontSize: "10px", color: "#999", marginTop: "6px" },
  progressLine: {
    position: "absolute",
    top: "13px",
    left: "-50%",
    width: "100%",
    height: "2px",
    zIndex: 1,
  },
  feedbackBox: {
    marginTop: "20px",
    padding: "16px",
    background: "#0d0d0d",
    borderRadius: "10px",
    textAlign: "left",
    border: "1px solid #2a2a2a",
  },
  feedbackTitle: {
    fontSize: "14px",
    marginBottom: "10px",
    textAlign: "center",
    color: "#fff",
  },
  stars: { textAlign: "center", marginBottom: "10px" },
  star: { fontSize: "28px", cursor: "pointer", margin: "0 4px" },
  textarea: {
    width: "100%",
    padding: "10px",
    fontSize: "13px",
    border: "1px solid #333",
    borderRadius: "8px",
    minHeight: "60px",
    marginBottom: "10px",
    outline: "none",
    fontFamily: "inherit",
    background: "#1c1c1c",
    color: "#fff",
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  thanksText: { color: "#66bb6a", fontSize: "14px", margin: "16px 0" },
  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  backBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
  },
  cancelBtn: {
    flex: 1,
    background: "transparent",
    color: "#ef5350",
    border: "1.5px solid #ef5350",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  errorText: { color: "#ef5350", fontSize: "12px", marginTop: "6px" },
  cancelledText: {
    color: "#ef5350",
    fontSize: "14px",
    margin: "16px 0",
    fontWeight: 600,
  },
};

export default OrderSuccess;