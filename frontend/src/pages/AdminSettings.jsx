import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const EMAIL_REGEX = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;

function AdminSettings() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1); // 1 = form, 2 = OTP verify
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [addError, setAddError] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchAdmins = () => {
    API.get("/admin/users/")
      .then((res) => {
        setAdmins(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Admins fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    fetchAdmins();
  }, []);

  const handleChangePassword = () => {
    setPasswordMsg("");
    setPasswordError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Saari fields bharo.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Naya password match nahi kar raha.");
      return;
    }

    setChangingPassword(true);
    API.post("/admin/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    })
      .then(() => {
        setPasswordMsg("✅ Password successfully change ho gaya.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((err) => {
        setPasswordError(
          err.response?.data?.error || "Password change nahi ho paya.",
        );
      })
      .finally(() => setChangingPassword(false));
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setAddStep(1);
    setNewUsername("");
    setNewEmail("");
    setNewUserPassword("");
    setOtp("");
    setAddError("");
    setAddMsg("");
  };

  // Step 1: Form submit -> OTP request
  const handleRequestOtp = () => {
    setAddError("");
    if (!newUsername || !newUserPassword) {
      setAddError("Username aur password zaroori hain.");
      return;
    }
    if (!newEmail) {
      setAddError("Email zaroori hai.");
      return;
    }
    if (!EMAIL_REGEX.test(newEmail.trim())) {
      setAddError("Ye email valid nahi hai. Sahi format daalo (jaise name@example.com).");
      return;
    }

    setAdding(true);
    API.post("/admin/users/", {
      username: newUsername.trim(),
      email: newEmail.trim(),
      password: newUserPassword,
    })
      .then((res) => {
        setAddMsg(res.data.message);
        setAddStep(2);
      })
      .catch((err) => {
        setAddError(err.response?.data?.error || "OTP bhejne me error aaya.");
      })
      .finally(() => setAdding(false));
  };

  // Step 2: OTP verify -> actual admin creation
  const handleVerifyOtp = () => {
    setAddError("");
    if (!otp.trim()) {
      setAddError("OTP daalo.");
      return;
    }

    setVerifying(true);
    API.post("/admin/users/verify-otp/", {
      email: newEmail.trim(),
      otp: otp.trim(),
    })
      .then(() => {
        resetAddModal();
        fetchAdmins();
      })
      .catch((err) => {
        setAddError(err.response?.data?.error || "OTP verify nahi ho paya.");
      })
      .finally(() => setVerifying(false));
  };

  const handleDeleteAdmin = (admin) => {
    if (
      !window.confirm(`${admin.username} ko admin panel se remove karna hai?`)
    )
      return;
    API.delete(`/admin/users/${admin.id}/`)
      .then(() => fetchAdmins())
      .catch((err) => {
        alert(err.response?.data?.error || "Remove nahi ho paya.");
      });
  };

  if (loading) {
    return <div style={styles.loading}>Loading settings...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Change Your Password</h2>

          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
          />

          {passwordError && <p style={styles.errorText}>{passwordError}</p>}
          {passwordMsg && <p style={styles.successText}>{passwordMsg}</p>}

          <button
            style={styles.saveBtn}
            onClick={handleChangePassword}
            disabled={changingPassword}
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>Admin Users</h2>
            <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
              + Add Admin
            </button>
          </div>

          {admins.map((admin) => (
            <div key={admin.id} style={styles.adminRow}>
              <div>
                <span style={styles.adminName}>
                  {admin.username}{" "}
                  {admin.is_you && <span style={styles.youTag}>(You)</span>}
                </span>
                {admin.email && <p style={styles.adminEmail}>{admin.email}</p>}
              </div>
              {!admin.is_you && (
                <button
                  style={styles.removeBtn}
                  onClick={() => handleDeleteAdmin(admin)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={resetAddModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {addStep === 1 ? (
              <>
                <h3 style={styles.modalTitle}>New Admin</h3>

                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={styles.input}
                />

                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.input}
                />

                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  style={styles.input}
                />

                {addError && <p style={styles.errorText}>{addError}</p>}

                <div style={styles.modalActions}>
                  <button style={styles.cancelBtn} onClick={resetAddModal}>
                    Cancel
                  </button>
                  <button
                    style={styles.saveBtn}
                    onClick={handleRequestOtp}
                    disabled={adding}
                  >
                    {adding ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={styles.modalTitle}>Verify OTP</h3>
                {addMsg && <p style={styles.successText}>{addMsg}</p>}

                <label style={styles.label}>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={styles.input}
                  placeholder="6-digit OTP"
                  maxLength={6}
                />

                {addError && <p style={styles.errorText}>{addError}</p>}

                <div style={styles.modalActions}>
                  <button
                    style={styles.cancelBtn}
                    onClick={() => setAddStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    style={styles.saveBtn}
                    onClick={handleVerifyOtp}
                    disabled={verifying}
                  >
                    {verifying ? "Verifying..." : "Verify & Add"}
                  </button>
                </div>
              </>
            )}
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
    borderBottom: "1px solid #2a2a2a",
  },
  title: { fontSize: "20px" },
  content: { padding: "20px", maxWidth: "500px", margin: "0 auto" },
  card: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid #2a2a2a",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  sectionTitle: { fontSize: "16px", color: "#fff", marginBottom: "14px" },
  label: {
    fontSize: "12px",
    color: "#999",
    display: "block",
    marginBottom: "4px",
    marginTop: "12px",
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
  errorText: { color: "#ef5350", fontSize: "13px", marginTop: "10px" },
  successText: { color: "#66bb6a", fontSize: "13px", marginTop: "10px" },
  saveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "8px 14px",
    fontSize: "12px",
    borderRadius: "6px",
  },
  adminRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderTop: "1px solid #2a2a2a",
  },
  adminName: { fontSize: "14px", fontWeight: 600, color: "#fff" },
  youTag: { fontSize: "11px", color: "#66bb6a", fontWeight: 500 },
  adminEmail: { fontSize: "12px", color: "#999", marginTop: "2px" },
  removeBtn: {
    background: "rgba(239,83,80,0.15)",
    color: "#ef5350",
    padding: "6px 12px",
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
  modalTitle: { fontSize: "17px", marginBottom: "4px", color: "#fff" },
  modalActions: { display: "flex", gap: "10px", marginTop: "20px" },
  cancelBtn: {
    flex: 1,
    background: "#2a2a2a",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

export default AdminSettings;