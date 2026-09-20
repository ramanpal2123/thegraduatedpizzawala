import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const PRESETS = {
  sml: ["Small", "Medium", "Large"],
  halfFull: ["Half", "Full"],
};

function AdminMenu() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);

  const [showFabMenu, setShowFabMenu] = useState(false);

  // Category order edit ke liye local state (typed value save hone se pehle yahin rehta hai)
  const [orderEdits, setOrderEdits] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_veg: true,
    is_available: true,
    allow_toppings: false,
    image: null,
  });

  const [hasSizes, setHasSizes] = useState(false);
  const [variants, setVariants] = useState([]);

  const fetchMenu = () => {
    API.get("/admin/categories/")
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => a.display_order - b.display_order);
        setCategories(sorted);
        const edits = {};
        sorted.forEach((c) => {
          edits[c.id] = c.display_order;
        });
        setOrderEdits(edits);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Menu fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchMenu();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: categories[0]?.id || "",
      is_veg: true,
      is_available: true,
      allow_toppings: false,
      image: null,
    });
    setHasSizes(false);
    setVariants([]);
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setForm((prev) => ({ ...prev, category: categories[0]?.id || "" }));
    setShowItemModal(true);
    setShowFabMenu(false);
  };

  const openCategoryModal = () => {
    setShowCategoryModal(true);
    setShowFabMenu(false);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      is_veg: item.is_veg,
      is_available: item.is_available,
      allow_toppings: item.allow_toppings,
      image: null,
    });

    if (item.variants && item.variants.length > 0) {
      setHasSizes(true);
      setVariants(
        item.variants.map((v) => ({ id: v.id, size: v.size, price: v.price }))
      );
    } else {
      setHasSizes(false);
      setVariants([]);
    }

    setShowItemModal(true);
  };

  const applyPreset = (presetKey) => {
    const labels = PRESETS[presetKey];
    setVariants((prev) => {
      return labels.map((label) => {
        const existing = prev.find((v) => v.size === label);
        return existing || { id: null, size: label, price: "" };
      });
    });
  };

  const addCustomVariantRow = () => {
    setVariants((prev) => [...prev, { id: null, size: "", price: "" }]);
  };

  const updateVariantField = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const removeVariantRow = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveItem = async () => {
    if (!form.name || !form.category) {
      alert("Naam aur category zaroori hain.");
      return;
    }

    if (hasSizes) {
      if (variants.length === 0) {
        alert("Kam se kam ek size/portion add karo, ya 'Multiple sizes' uncheck karo.");
        return;
      }
      const invalid = variants.some((v) => !v.size.trim() || !v.price);
      if (invalid) {
        alert("Har variant ka naam aur price bharo.");
        return;
      }
    } else {
      if (!form.price) {
        alert("Price zaroori hai.");
        return;
      }
    }

    setSaving(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", hasSizes ? variants[0].price : form.price);
    formData.append("category", form.category);
    formData.append("is_veg", form.is_veg);
    formData.append("is_available", form.is_available);
    formData.append("allow_toppings", form.allow_toppings);
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      let itemId;
      if (editingItem) {
        const res = await API.patch(`/admin/menu-items/${editingItem.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        itemId = res.data.id;
      } else {
        const res = await API.post("/admin/menu-items/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        itemId = res.data.id;
      }

      const keepIds = variants.filter((v) => v.id).map((v) => v.id);
      const originalIds = (editingItem?.variants || []).map((v) => v.id);
      const toDelete = originalIds.filter((id) => !keepIds.includes(id));
      for (const id of toDelete) {
        await API.delete(`/admin/variants/${id}/`);
      }

      if (hasSizes) {
        for (const v of variants) {
          if (v.id) {
            await API.patch(`/admin/variants/${v.id}/`, {
              size: v.size,
              price: v.price,
            });
          } else {
            await API.post("/admin/variants/", {
              menu_item: itemId,
              size: v.size,
              price: v.price,
            });
          }
        }
      } else if (editingItem) {
        for (const id of originalIds) {
          await API.delete(`/admin/variants/${id}/`);
        }
      }

      setShowItemModal(false);
      fetchMenu();
    } catch (err) {
      console.error("Save error:", err.response?.data || err);
      alert("Save nahi ho paya. Console check karo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("Ye item delete karna hai?")) return;
    API.delete(`/admin/menu-items/${itemId}/`)
      .then(() => fetchMenu())
      .catch((err) => console.error("Delete error:", err));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    API.post("/admin/categories/", {
      name: newCategoryName.trim(),
      display_order: categories.length + 1,
    })
      .then(() => {
        setNewCategoryName("");
        setShowCategoryModal(false);
        fetchMenu();
      })
      .catch((err) => console.error("Category add error:", err));
  };

  const handleDeleteCategory = (categoryId) => {
    if (
      !window.confirm(
        "Ye poori category delete karna hai? Iske andar ke saare items bhi delete ho jayenge.",
      )
    )
      return;
    API.delete(`/admin/categories/${categoryId}/`)
      .then(() => fetchMenu())
      .catch((err) => console.error("Category delete error:", err));
  };

  // Number input ka value type karte waqt sirf local state update karo
  const handleOrderInputChange = (categoryId, value) => {
    setOrderEdits((prev) => ({ ...prev, [categoryId]: value }));
  };

  // Input se bahar click (blur) hote hi ya Enter dabate hi backend ko save karo
  const saveOrder = async (category) => {
    const newValue = parseInt(orderEdits[category.id], 10);

    if (isNaN(newValue)) {
      // Invalid input -> purani value pe wapas reset karo
      setOrderEdits((prev) => ({ ...prev, [category.id]: category.display_order }));
      return;
    }

    if (newValue === category.display_order) return; // Kuch badla nahi

    setSavingOrderId(category.id);
    try {
      await API.patch(`/admin/categories/${category.id}/`, { display_order: newValue });
      fetchMenu();
    } catch (err) {
      console.error("Order save error:", err);
      alert("Order number save nahi ho paya.");
      setOrderEdits((prev) => ({ ...prev, [category.id]: category.display_order }));
    } finally {
      setSavingOrderId(null);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading menu...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Menu Management</h1>
      </div>

      <div style={styles.content}>
        {categories.length === 0 ? (
          <p style={styles.emptyText}>
            Koi category nahi hai. Pehle ek category add karo.
          </p>
        ) : (
          categories.map((category) => (
            <div key={category.id} style={{ marginBottom: "24px" }}>
              <div style={styles.categoryHeader}>
                <div style={styles.orderInputWrap}>
                  <span style={styles.orderInputLabel}>Order</span>
                  <input
                    type="number"
                    value={orderEdits[category.id] ?? category.display_order}
                    onChange={(e) => handleOrderInputChange(category.id, e.target.value)}
                    onBlur={() => saveOrder(category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.target.blur();
                    }}
                    style={styles.orderInput}
                    disabled={savingOrderId === category.id}
                  />
                </div>
                <h2 style={styles.categoryTitle}>{category.name}</h2>
                <button
                  style={styles.categoryDeleteBtn}
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Delete category
                </button>
              </div>

              {category.items.length === 0 ? (
                <p style={styles.emptyItemText}>
                  Is category me koi item nahi hai.
                </p>
              ) : (
                category.items.map((item) => (
                  <div key={item.id} style={styles.itemRow}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={styles.itemThumb}
                      />
                    )}
                    <div style={styles.itemInfo}>
                      <div style={styles.itemNameRow}>
                        <span
                          style={item.is_veg ? styles.vegDot : styles.nonVegDot}
                        />
                        <span style={styles.itemName}>{item.name}</span>
                        {!item.is_available && (
                          <span style={styles.unavailableTag}>Unavailable</span>
                        )}
                      </div>
                      {item.variants && item.variants.length > 0 ? (
                        <span style={styles.itemPrice}>
                          {item.variants.map((v) => `${v.size}: ₹${v.price}`).join(" · ")}
                        </span>
                      ) : (
                        <span style={styles.itemPrice}>₹{item.price}</span>
                      )}
                    </div>
                    <div style={styles.itemActions}>
                      <button
                        style={styles.editBtn}
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - hamesha fixed, scroll se independent */}
      <div style={styles.fabWrap}>
        {showFabMenu && (
          <>
            <div
              style={styles.fabOverlay}
              onClick={() => setShowFabMenu(false)}
            />
            <div style={styles.fabMenu}>
              <button style={styles.fabMenuItem} onClick={openCategoryModal}>
                📁 Add Category
              </button>
              <button
                style={styles.fabMenuItem}
                onClick={openAddModal}
                disabled={categories.length === 0}
              >
                🍕 Add Item
              </button>
            </div>
          </>
        )}
        <button
          style={styles.fabBtn}
          onClick={() => setShowFabMenu((prev) => !prev)}
        >
          {showFabMenu ? "✕" : "+"}
        </button>
      </div>

      {showCategoryModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowCategoryModal(false)}
        >
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>New Category</h3>
            <input
              type="text"
              placeholder="Category name (e.g. Starters)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={styles.input}
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleAddCategory}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowItemModal(false)}
        >
          <div
            style={styles.modalBoxLarge}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>
              {editingItem ? "Edit Item" : "New Item"}
            </h3>

            <label style={styles.label}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={styles.input}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />

            <label style={styles.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ ...styles.input, minHeight: "60px" }}
            />

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={hasSizes}
                onChange={(e) => {
                  setHasSizes(e.target.checked);
                  if (!e.target.checked) setVariants([]);
                }}
              />
              Ye item multiple sizes/portions mein aata hai
            </label>

            {hasSizes ? (
              <>
                <div style={styles.presetRow}>
                  <button
                    type="button"
                    style={styles.presetBtn}
                    onClick={() => applyPreset("sml")}
                  >
                    Small / Medium / Large
                  </button>
                  <button
                    type="button"
                    style={styles.presetBtn}
                    onClick={() => applyPreset("halfFull")}
                  >
                    Half / Full
                  </button>
                </div>

                {variants.map((v, index) => (
                  <div key={index} style={styles.variantRow}>
                    <input
                      type="text"
                      placeholder="Label (e.g. Small, Half...)"
                      value={v.size}
                      onChange={(e) =>
                        updateVariantField(index, "size", e.target.value)
                      }
                      style={{ ...styles.input, flex: 1, marginTop: 0 }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={v.price}
                      onChange={(e) =>
                        updateVariantField(index, "price", e.target.value)
                      }
                      style={{ ...styles.input, width: "110px", marginTop: 0 }}
                    />
                    <button
                      type="button"
                      style={styles.removeVariantBtn}
                      onClick={() => removeVariantRow(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  style={styles.addVariantBtn}
                  onClick={addCustomVariantRow}
                >
                  + Add variant
                </button>
              </>
            ) : (
              <>
                <label style={styles.label}>Price (₹)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={styles.input}
                />
              </>
            )}

            <label style={styles.label}>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
              style={styles.input}
            />

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.is_veg}
                onChange={(e) => setForm({ ...form, is_veg: e.target.checked })}
              />
              Veg
            </label>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
              />
              Available
            </label>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.allow_toppings}
                onChange={(e) =>
                  setForm({ ...form, allow_toppings: e.target.checked })
                }
              />
              Allow toppings customization
            </label>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowItemModal(false)}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleSaveItem} disabled={saving}>
                {saving ? "Saving..." : "Save"}
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
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "1px solid #2a2a2a",
  },
  title: { fontSize: "20px" },
  content: { padding: "20px", maxWidth: "700px", margin: "0 auto", paddingBottom: "100px" },
  emptyText: { textAlign: "center", color: "#999", marginTop: "40px" },
  emptyItemText: { color: "#777", fontSize: "13px", padding: "10px 0" },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  orderInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#1c1c1c",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "4px 8px",
  },
  orderInputLabel: {
    fontSize: "10px",
    color: "#777",
  },
  orderInput: {
    width: "44px",
    background: "#0d0d0d",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "4px 6px",
    fontSize: "13px",
    textAlign: "center",
    outline: "none",
  },
  categoryTitle: {
    fontSize: "17px",
    color: "#ef5350",
    borderBottom: "2px solid #ef5350",
    display: "inline-block",
    paddingBottom: "3px",
    flex: 1,
  },
  categoryDeleteBtn: {
    background: "transparent",
    color: "#ef5350",
    fontSize: "12px",
    textDecoration: "underline",
  },
  itemRow: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #2a2a2a",
  },
  itemThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  itemInfo: { flex: 1 },
  itemNameRow: { display: "flex", alignItems: "center", gap: "6px" },
  vegDot: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    border: "1.5px solid #388e3c",
    background: "#4caf50",
    display: "inline-block",
  },
  nonVegDot: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    border: "1.5px solid #c62828",
    background: "#e53935",
    display: "inline-block",
  },
  itemName: { fontSize: "14px", fontWeight: 600, color: "#fff" },
  unavailableTag: {
    fontSize: "10px",
    background: "rgba(239,83,80,0.15)",
    color: "#ef5350",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  itemPrice: { fontSize: "12px", color: "#999" },
  itemActions: { display: "flex", gap: "6px" },
  editBtn: {
    background: "rgba(33,150,243,0.15)",
    color: "#64b5f6",
    padding: "6px 12px",
    fontSize: "12px",
    borderRadius: "6px",
  },
  deleteBtn: {
    background: "rgba(239,83,80,0.15)",
    color: "#ef5350",
    padding: "6px 12px",
    fontSize: "12px",
    borderRadius: "6px",
  },

  // ---- FAB styles ----
  fabWrap: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    zIndex: 500,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  fabBtn: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    fontSize: "26px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 20px rgba(211,47,47,0.5)",
    border: "none",
  },
  fabOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "transparent",
    zIndex: 499,
  },
  fabMenu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "14px",
    zIndex: 500,
    position: "relative",
  },
  fabMenuItem: {
    background: "#1c1c1c",
    color: "#fff",
    border: "1px solid #333",
    padding: "12px 18px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
    whiteSpace: "nowrap",
    textAlign: "left",
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
  modalBoxLarge: {
    background: "#1c1c1c",
    borderRadius: "14px",
    padding: "24px",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "85vh",
    overflowY: "auto",
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
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    marginTop: "10px",
    color: "#ccc",
  },
  presetRow: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  presetBtn: {
    background: "#2a2a2a",
    color: "#ccc",
    padding: "8px 12px",
    fontSize: "12px",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
  },
  variantRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    alignItems: "center",
  },
  removeVariantBtn: {
    background: "rgba(239,83,80,0.15)",
    color: "#ef5350",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
  },
  addVariantBtn: {
    background: "transparent",
    color: "#64b5f6",
    fontSize: "13px",
    marginTop: "10px",
    padding: "6px 0",
    textDecoration: "underline",
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

export default AdminMenu;