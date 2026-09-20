import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    discount_percent: "",
    code: "",
    is_active: true,
  });

  const fetchOffers = () => {
    API.get("/admin/offers/")
      .then((res) => {
        setOffers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Offers fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchOffers();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      discount_percent: "",
      code: "",
      is_active: true,
    });
  };

  const handleSave = () => {
    if (!form.title || !form.discount_percent || !form.code) {
      alert("Title, discount % aur code zaroori hain.");
      return;
    }

    API.post("/admin/offers/", form)
      .then(() => {
        setShowModal(false);
        resetForm();
        fetchOffers();
      })
      .catch((err) => {
        console.error("Save error:", err.response?.data || err);
        const errorMsg = err.response?.data?.code
          ? "Ye code already exist karta hai, alag code use karo."
          : "Save nahi ho paya.";
        alert(errorMsg);
      });
  };

  const toggleActive = (offer) => {
    API.patch(`/admin/offers/${offer.id}/`, { is_active: !offer.is_active })
      .then(() => fetchOffers())
      .catch((err) => console.error("Toggle error:", err));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Ye offer delete karna hai?")) return;
    API.delete(`/admin/offers/${id}/`)
      .then(() => fetchOffers())
      .catch((err) => console.error("Delete error:", err));
  };

  if (loading) {
    return <div style={styles.loading}>Loading offers...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Offers Management</h1>
        <button
          style={styles.headerBtn}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Offer
        </button>
      </div>

      <div style={styles.content}>
        {offers.length === 0 ? (
          <p style={styles.emptyText}>Koi offer nahi hai abhi.</p>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} style={styles.offerCard}>
              <div style={styles.offerTop}>
                <h3 style={styles.offerTitle}>{offer.title}</h3>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: offer.is_active
                      ? "rgba(102,187,106,0.15)"
                      : "rgba(158,158,158,0.15)",
                    color: offer.is_active ? "#66bb6a" : "#999",
                  }}
                >
                  {offer.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {offer.description && (
                <p style={styles.offerDesc}>{offer.description}</p>
              )}

              <div style={styles.offerMeta}>
                <span style={styles.codeTag}>{offer.code}</span>
                <span style={styles.discountText}>
                  {offer.discount_percent}% OFF
                </span>
              </div>

              <div style={styles.offerActions}>
                <button
                  style={styles.toggleBtn}
                  onClick={() => toggleActive(offer)}
                >
                  {offer.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(offer.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>New Offer</h3>

            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
              placeholder="e.g. Weekend Special"
            />

            <label style={styles.label}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ ...styles.input, minHeight: "50px" }}
            />

            <label style={styles.label}>Discount (%)</label>
            <input
              type="number"
              value={form.discount_percent}
              onChange={(e) =>
                setForm({ ...form, discount_percent: e.target.value })
              }
              style={styles.input}
              placeholder="e.g. 10"
            />

            <label style={styles.label}>Offer Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              style={styles.input}
              placeholder="e.g. SAVE10"
            />

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #2a2a2a",
  },
  title: { fontSize: "20px" },
  headerBtn: {
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "9px 16px",
    fontSize: "13px",
    borderRadius: "6px",
  },
  content: { padding: "20px", maxWidth: "600px", margin: "0 auto" },
  emptyText: { textAlign: "center", color: "#999", marginTop: "40px" },
  offerCard: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #2a2a2a",
  },
  offerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  offerTitle: { fontSize: "15px", fontWeight: 600, color: "#fff" },
  statusBadge: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "12px",
  },
  offerDesc: { fontSize: "13px", color: "#999", marginBottom: "8px" },
  offerMeta: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "12px",
  },
  codeTag: {
    background: "rgba(211,47,47,0.15)",
    color: "#ef5350",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  discountText: { fontSize: "14px", fontWeight: 700, color: "#66bb6a" },
  offerActions: { display: "flex", gap: "8px" },
  toggleBtn: {
    background: "rgba(33,150,243,0.15)",
    color: "#64b5f6",
    padding: "7px 14px",
    fontSize: "12px",
    borderRadius: "6px",
  },
  deleteBtn: {
    background: "rgba(239,83,80,0.15)",
    color: "#ef5350",
    padding: "7px 14px",
    fontSize: "12px",
    borderRadius: "6px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalBox: {
    background: "#1c1c1c",
    borderRadius: "14px",
    padding: "24px",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid #2a2a2a",
  },
  modalTitle: { fontSize: "17px", marginBottom: "16px", color: "#fff" },
  label: {
    fontSize: "12px",
    color: "#999",
    display: "block",
    marginBottom: "4px",
    marginTop: "10px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #333",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    background: "#0d0d0d",
    color: "#fff",
    boxSizing: "border-box",
  },
  modalActions: { display: "flex", gap: "10px", marginTop: "20px" },
  cancelBtn: {
    flex: 1,
    background: "#2a2a2a",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  saveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

export default AdminOffers;
