import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import API from "../api/axios";
import TiltCard from "../components/TiltCard";
import logo from "../assets/GPW.png";

function Cart() {
  const { cart, addToCart, removeFromCart, getTotal, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table");
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("counter");

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [tableId, setTableId] = useState(null);
  const [tableError, setTableError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Verify table
  useEffect(() => {
    if (!tableNumber) {
      setTableError("Table number missing. QR code se scan karo.");
      return;
    }

    API.get(`/table/${tableNumber}/`)
      .then((response) => {
        setTableId(response.data.id);
        setTableError("");
      })
      .catch(() => {
        setTableError("Ye table valid nahi hai. Admin se contact karo.");
      });
  }, [tableNumber]);

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;

    setCheckingCoupon(true);
    setCouponError("");

    API.post("/offers/validate/", { code: couponCode.trim() })
      .then((res) => {
        setAppliedOffer(res.data);
      })
      .catch((err) => {
        setCouponError(
          err.response?.data?.error || "Invalid code."
        );
        setAppliedOffer(null);
      })
      .finally(() => {
        setCheckingCoupon(false);
      });
  };

  const removeCoupon = () => {
    setAppliedOffer(null);
    setCouponCode("");
    setCouponError("");
  };

  // Final total
  const getFinalTotal = () => {
    const total = getTotal();

    if (appliedOffer) {
      return (
        total -
        (total * appliedOffer.discount_percent) / 100
      ).toFixed(2);
    }

    return total;
  };

  // Place Order
  const handlePlaceOrder = () => {
    if (!tableId) {
      setError("Table verify nahi hua. Page refresh karo.");
      return;
    }

    if (!customerName.trim()) {
      setError("Apna naam daalo.");
      return;
    }

    if (cart.length === 0) {
      setError("Cart khaali hai.");
      return;
    }

    setPlacing(true);
    setError("");

    const finalAmount = getFinalTotal();

    const orderData = {
      table: tableId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      payment_method: paymentMethod,
      payment_status: "pending",
      total_amount: finalAmount,

      items: cart.map((item) => ({
        menu_item: item.id,
        size: item.size || "",
        quantity: item.quantity,
        price_at_order: item.price,

        toppings: (item.toppings || []).map((t) => ({
          name: t.name,
          price: t.price,
        })),
      })),
    };

    API.post("/order/create/", orderData)
      .then((response) => {
        const orderId = response.data.id;

        // Save order locally
        const existingOrders = JSON.parse(
          localStorage.getItem("myOrders") || "[]"
        );
        existingOrders.push({
          orderId: orderId,
          table: tableNumber,
          customerName: customerName.trim(),
          timestamp: Date.now(),
        });
        localStorage.setItem("myOrders", JSON.stringify(existingOrders));

        if (paymentMethod === "online") {
          // Razorpay order banao backend se
          API.post("/razorpay/create-order/", { order_id: orderId })
            .then((res) => {
              const { razorpay_order_id, razorpay_key_id, amount, currency } = res.data;

              const options = {
                key: razorpay_key_id,
                amount: amount,
                currency: currency,
                name: "The Graduated Pizza Wala",
                description: `Order #${orderId}`,
                order_id: razorpay_order_id,
                handler: function (razorpayResponse) {
                  // Payment hua — ab backend se verify karo
                  API.post("/razorpay/verify-payment/", {
                    razorpay_order_id: razorpayResponse.razorpay_order_id,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                  })
                    .then(() => {
                      clearCart();
                      navigate(`/order-success?orderId=${orderId}&table=${tableNumber}`);
                    })
                    .catch(() => {
                      setError("Payment verify nahi ho paya. Support se contact karo.");
                      setPlacing(false);
                    });
                },
                modal: {
                  ondismiss: function () {
                    setError("Payment cancel kar diya gaya.");
                    setPlacing(false);
                  },
                },
                prefill: {
                  name: customerName.trim(),
                  contact: customerPhone.trim(),
                },
                theme: {
                  color: "#d32f2f",
                },
              };

              const rzp = new window.Razorpay(options);
              rzp.open();
            })
            .catch((err) => {
              console.error("Razorpay order error:", err);
              setError("Payment initialize nahi ho paya. Dobara try karo.");
              setPlacing(false);
            });
        } else {
          // Counter payment
          clearCart();
          navigate(`/order-success?orderId=${orderId}&table=${tableNumber}`);
        }
      })
      .catch((err) => {
        console.error("Order error:", err.response?.data || err);
        setError(
          err.response?.data?.error || "Order place nahi ho paya. Dobara try karo."
        );
        setPlacing(false);
      });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ← Back to Menu
        </button>

        <div style={styles.titleRow}>
          <img src={logo} alt="The Graduated Pizza Wala Logo" style={styles.logoImg} />
          <h1 style={styles.title}>Your Cart</h1>
        </div>
      </div>

      <div style={styles.content}>
        {tableError && (
          <p style={styles.errorText}>{tableError}</p>
        )}

        {cart.length === 0 ? (
          <p style={styles.emptyText}>
            Cart khaali hai.
          </p>
        ) : (
          cart.map((item) => (
            <TiltCard
              key={item.cartKey || item.id}
              style={styles.cartItem}
              maxTilt={3}
            >
              <div>
                <h3 style={styles.itemName}>
                  {item.name}
                  {item.size ? ` (${item.size})` : ""}
                </h3>

                {item.toppings &&
                  item.toppings.length > 0 && (
                    <p style={styles.toppingsText}>
                      +{" "}
                      {item.toppings
                        .map((t) => t.name)
                        .join(", ")}
                    </p>
                  )}

                <p style={styles.itemSub}>
                  ₹{item.price} x {item.quantity} = ₹
                  {item.price * item.quantity}
                </p>
              </div>

              <div style={styles.qtyControl}>
                <button
                  style={styles.qtyBtn}
                  onClick={() =>
                    removeFromCart(
                      item.id,
                      item.size,
                      item.toppings
                    )
                  }
                >
                  −
                </button>

                <span style={styles.qtyText}>
                  {item.quantity}
                </span>

                <button
                  style={styles.qtyBtn}
                  onClick={() => {
                    const toppingsTotal = (
                      item.toppings || []
                    ).reduce(
                      (sum, t) =>
                        sum + parseFloat(t.price),
                      0
                    );

                    const basePrice =
                      item.price - toppingsTotal;

                    addToCart(
                      item,
                      item.size,
                      basePrice,
                      item.toppings
                    );
                  }}
                >
                  +
                </button>
              </div>
            </TiltCard>
          ))
        )}

        {cart.length > 0 && (
          <>
            {/* Coupon */}
            <div style={styles.couponBox}>
              <h3 style={styles.sectionTitle}>
                Have a coupon?
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  style={{
                    ...styles.nameInput,
                    flex: 1,
                  }}
                  disabled={!!appliedOffer}
                />

                {appliedOffer ? (
                  <button
                    style={styles.removeCouponBtn}
                    onClick={removeCoupon}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    style={styles.applyBtn}
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon}
                  >
                    {checkingCoupon
                      ? "Checking..."
                      : "Apply"}
                  </button>
                )}
              </div>

              {couponError && (
                <p style={styles.errorText}>
                  {couponError}
                </p>
              )}

              {appliedOffer && (
                <p style={styles.couponSuccess}>
                  ✅ {appliedOffer.title} —{" "}
                  {appliedOffer.discount_percent}% off applied
                </p>
              )}
            </div>

            {/* Total */}
            <div style={styles.totalRow}>
              <span>Total</span>

              <div style={{ textAlign: "right" }}>
                {appliedOffer && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#777",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{getTotal()}
                  </div>
                )}

                <span style={styles.totalAmount}>
                  ₹{getFinalTotal()}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div style={styles.nameBox}>
              <h3 style={styles.sectionTitle}>
                Your Name
              </h3>

              <input
                type="text"
                placeholder="Apna naam likho"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                style={styles.nameInput}
              />

              <p style={styles.nameHint}>
                Taaki staff ko pata chale kiska order hai.
              </p>

              <h3
                style={{
                  ...styles.sectionTitle,
                  marginTop: "14px",
                }}
              >
                Mobile Number (optional)
              </h3>

              <input
                type="tel"
                placeholder="10-digit number"
                value={customerPhone}
                onChange={(e) =>
                  setCustomerPhone(e.target.value)
                }
                style={styles.nameInput}
                maxLength={10}
              />
            </div>

            {/* Payment Method */}
            <div style={styles.paymentBox}>
              <h3 style={styles.sectionTitle}>
                Payment Method
              </h3>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="payment"
                  value="counter"
                  checked={paymentMethod === "counter"}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                />
                <span> Pay at Counter</span>
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                />
                <span> Pay Online (UPI / Card / Netbanking)</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <p style={styles.errorText}>
                {error}
              </p>
            )}

            <button
              style={styles.placeOrderBtn}
              onClick={handlePlaceOrder}
              disabled={placing || !tableId}
            >
              {placing
                ? "Placing Order..."
                : "Place Order"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "40px",
    background: "#0d0d0d",
  },

  header: {
    background:
      "linear-gradient(180deg, #1c1c1c, #0d0d0d)",
    color: "#fff",
    padding: "20px",
    textAlign: "center",
    borderBottom: "1px solid #2a2a2a",
  },

  backBtn: {
    background: "transparent",
    color: "#999",
    fontSize: "14px",
    marginBottom: "10px",
    padding: "4px",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  logoImg: { height: "34px", width: "34px", objectFit: "contain", borderRadius: "8px" },

  title: {
    fontSize: "22px",
  },

  content: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },

  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: "40px",
  },

  cartItem: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    border: "1px solid #2a2a2a",
  },

  itemName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
  },

  toppingsText: {
    fontSize: "12px",
    color: "#ef5350",
    margin: "2px 0",
  },

  itemSub: {
    fontSize: "13px",
    color: "#999",
    marginTop: "4px",
  },

  qtyControl: {
    display: "flex",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #d32f2f, #b71c1c)",
    borderRadius: "6px",
    color: "#fff",
  },

  qtyBtn: {
    background: "transparent",
    color: "#fff",
    padding: "6px 12px",
    fontSize: "16px",
  },

  qtyText: {
    padding: "0 8px",
    fontWeight: 600,
  },

  couponBox: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #2a2a2a",
  },

  applyBtn: {
    background:
      "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "10px 18px",
    fontSize: "13px",
    borderRadius: "8px",
  },

  removeCouponBtn: {
    background: "#2a2a2a",
    color: "#ef5350",
    padding: "10px 18px",
    fontSize: "13px",
    borderRadius: "8px",
  },

  couponSuccess: {
    color: "#66bb6a",
    fontSize: "13px",
    marginTop: "8px",
    fontWeight: 600,
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: 700,
    margin: "20px 0",
    padding: "14px",
    background: "#1c1c1c",
    borderRadius: "10px",
    color: "#fff",
    border: "1px solid #2a2a2a",
  },

  totalAmount: {
    color: "#ef5350",
  },

  nameBox: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #2a2a2a",
  },

  nameInput: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    border: "1px solid #333",
    borderRadius: "8px",
    outline: "none",
    background: "#0d0d0d",
    color: "#fff",
    boxSizing: "border-box",
  },

  nameHint: {
    fontSize: "12px",
    color: "#777",
    marginTop: "6px",
  },

  paymentBox: {
    background: "#1c1c1c",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #2a2a2a",
  },

  sectionTitle: {
    fontSize: "15px",
    marginBottom: "10px",
    color: "#fff",
  },

  radioLabel: {
    display: "block",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#ccc",
  },

  errorText: {
    color: "#ef5350",
    fontSize: "14px",
    marginBottom: "10px",
  },

  placeOrderBtn: {
    width: "100%",
    background:
      "linear-gradient(135deg, #d32f2f, #b71c1c)",
    color: "#fff",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    boxShadow:
      "0 4px 16px rgba(211,47,47,0.4)",
  },
};

export default Cart;