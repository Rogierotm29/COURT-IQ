import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pickemAPI } from "../api/pickem";
import { store } from "../utils/storage";

/* ═══ COSMETICS CONTEXT ═══
   Centraliza los items comprados y equipados del usuario.
   Antes vivían por separado en ShopTab, PickemTab y SettingsTab,
   sincronizados con eventos globales del navegador. */

const CosmeticsContext = createContext(null);

export const CosmeticsProvider = ({ userId, children }) => {
  const [items, setItems] = useState([]);        // llaves compradas
  const [equipped, setEquipped] = useState({});  // {title, color, border}
  const [shields, setShields] = useState(0);

  const equippedKey = userId ? `courtiq_equipped_${userId}` : null;

  // Carga inicial y recarga al cambiar de usuario
  const refresh = useCallback(() => {
    if (!userId) { setItems([]); setEquipped({}); setShields(0); return; }
    pickemAPI("myShopItems", { params: { userId } }).then(d => { if (d.ok) setItems(d.items || []); });
    pickemAPI("getShields",  { params: { userId } }).then(d => { if (d.ok) setShields(d.shields || 0); });
    setEquipped(store.getJSON(`courtiq_equipped_${userId}`, {}));
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Equipar o desequipar — toggle si ya está puesto
  const equip = useCallback((item) => {
    if (!equippedKey) return;
    setEquipped(prev => {
      const next = { ...prev };
      if (next[item.type] === item.key) delete next[item.type];
      else next[item.type] = item.key;
      store.setJSON(equippedKey, next);
      return next;
    });
  }, [equippedKey]);

  // Se llama después de una compra exitosa
  const addItem = useCallback((item) => {
    if (item.type === "shield") { setShields(s => s + 1); return; }
    if (item.type === "extra_pick") return;
    setItems(prev => prev.includes(item.key) ? prev : [...prev, item.key]);
    // Auto-equipar lo recién comprado
    if (equippedKey) {
      setEquipped(prev => {
        const next = { ...prev, [item.type]: item.key };
        store.setJSON(equippedKey, next);
        return next;
      });
    }
  }, [equippedKey]);

  const useShield = useCallback((left) => setShields(left), []);

  return (
    <CosmeticsContext.Provider value={{ items, equipped, shields, equip, addItem, useShield, refresh }}>
      {children}
    </CosmeticsContext.Provider>
  );
};

export const useCosmetics = () => {
  const ctx = useContext(CosmeticsContext);
  if (!ctx) throw new Error("useCosmetics debe usarse dentro de <CosmeticsProvider>");
  return ctx;
};