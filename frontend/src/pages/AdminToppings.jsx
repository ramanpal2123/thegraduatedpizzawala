import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminToppings() {
  const navigate = useNavigate();
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price_small: "",
    price_medium: "",
    price_large: "",
  });

  const fetchToppings = () => {
    API.get("/admin/toppings/")
      .then((res) => {
        setToppings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Toppings fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchToppings();
  }, []);

  const resetForm = () => {
    setForm({ name: "", price_small: "", price_medium: "", price_large: "" });
  };

  const handleSave = () => {
    if (
      !form.name ||
      !form.price_small ||
      !form.price_medium ||
      !form.price_large
    ) {
      alert("Saari fields bharo.");
      return;
    }

    API.post("/admin/toppings/", form)
      .then(() => {
        setShowModal(false);
        resetForm();
        fetchToppings();
      })
      .catch((err) => {
        console.error("Save error:", err.response?.data || err);
        alert("Save nahi ho paya.");
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Ye topping delete karna hai?")) return;
    API.delete(`/admin/toppings/${id}/`)
      .then(() => fetchToppings())
      .catch((err) => console.error("Delete error:", err));
  };

  if (loading) {
    return <div style={styles.loading}>Loading toppings...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Toppings Management</h1>
        <button
          style={styles.headerBtn}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Topping
        </button>
      </div>

      <div style={styles.content}>
        {toppings.length === 0 ? (
          <p style={styles.emptyText}>Koi topping nahi hai abhi.</p>
        ) : (
          toppings.map((topping) => (
            <div key={topping.id} style={styles.toppingRow}>
              <div style={styles.toppingInfo}>
                <span style={styles.toppingName}>{topping.name}</span>
                <span style={styles.toppingPrices}>
                  S: ₹{topping.price_small} · M: ₹{topping.price_medium} · L: ₹
                  {topping.price_large}
                </span>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(topping.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>New Topping</h3>

            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
              placeholder="e.g. Extra Cheese"
            />

            <label style={styles.label}>Small Price (₹)</label>
            <input
              type="number"
              value={form.price_small}
              onChange={(e) =>
                setForm({ ...form, price_small: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Medium Price (₹)</label>
            <input
              type="number"
              value={form.price_medium}
              onChange={(e) =>
                setForm({ ...form, price_medium: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Large Price (₹)</label>
            <input
              type="number"
              value={form.price_large}
              onChange={(e) =>
                setForm({ ...form, price_large: e.target.value })
              }
              style={styles.input}
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
  toppingRow: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #2a2a2a",
  },
  toppingInfo: { display: "flex", flexDirection: "column", gap: "4px" },
  toppingName: { fontSize: "14px", fontWeight: 600, color: "#fff" },
  toppingPrices: { fontSize: "12px", color: "#999" },
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

export default AdminToppings;
