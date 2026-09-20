import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Cart key ab item + size + toppings ka combo hai
  const getCartKey = (itemId, size, toppings = []) => {
    const toppingIds = toppings.map((t) => t.id).sort().join(',');
    return `${itemId}_${size || 'default'}_${toppingIds}`;
  };

  const addToCart = (item, size = null, basePrice = null, toppings = []) => {
    const cartKey = getCartKey(item.id, size, toppings);
    const finalBasePrice = basePrice !== null ? basePrice : item.price;
    const toppingsTotal = toppings.reduce((sum, t) => sum + parseFloat(t.price), 0);
    const finalPrice = parseFloat(finalBasePrice) + toppingsTotal;

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prevCart.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prevCart,
        {
          cartKey,
          id: item.id,
          name: item.name,
          size,
          toppings,
          price: finalPrice,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (itemId, size = null, toppings = []) => {
    const cartKey = getCartKey(itemId, size, toppings);
    setCart((prevCart) =>
      prevCart
        .map((i) => (i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const getItemQuantity = (itemId, size = null, toppings = []) => {
    const cartKey = getCartKey(itemId, size, toppings);
    const item = cart.find((i) => i.cartKey === cartKey);
    return item ? item.quantity : 0;
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, getItemQuantity, getTotal, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}