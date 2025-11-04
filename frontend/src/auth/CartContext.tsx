import { createContext, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./useAuth";

export const CartContext = createContext({
  cartCount: 0,
  refreshCartCount: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(() => {
    if (user && user.id) {
      axios
        .get(`http://localhost:8080/cart/findAll?userId=${user.id}`)
        .then((res) => {
          const items = res.data;
          console.log("Cart items:", items);
          const totalCount = items.reduce(
            (sum: number, item: { quantity: number }) => sum + item.quantity,
            0
          );
          setCartCount(totalCount);
        })
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
}