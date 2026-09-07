/* ═══ PICKEM API ═══ */

const TIMEOUT_MS = 12000;

/* ─── Observador de salud ───
   App.jsx registra un listener y se entera de cada fallo o recuperación
   sin que los componentes tengan que reportar nada. */
let healthListener = null;
export const onApiHealthChange = (fn) => { healthListener = fn; };
const reportHealth = (ok, kind) => { if (healthListener) healthListener(ok, kind); };

/**
 * Cliente de la API. Siempre resuelve con { ok, error?, errorKind? } —
 * nunca lanza, para que el llamador no tenga que envolver todo en try/catch.
 */
export async function pickemAPI(action, opts = {}) {
  const { body, params } = opts;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, errorKind: "offline", error: "Sin conexión a internet" };
  }

  const qs = new URLSearchParams({ action, ...params }).toString();

  let r;
  try {
    r = await fetch(`/api/pickem?${qs}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const kind = (e.name === "TimeoutError" || e.name === "AbortError") ? "timeout" : "network";
    console.warn(`pickemAPI[${action}] ${kind}:`, e.message);
    reportHealth(false, kind);
    return {
      ok: false,
      errorKind: kind,
      error: kind === "timeout"
        ? "El servidor tardó demasiado. Intenta de nuevo."
        : "No pudimos conectar con el servidor",
    };
  }

  let data;
  try {
    data = await r.json();
  } catch {
    console.warn(`pickemAPI[${action}] respuesta no-JSON, status ${r.status}`);
    const kind = r.status >= 500 ? "server" : "parse";
    if (kind === "server") reportHealth(false, kind);
    return {
      ok: false,
      errorKind: kind,
      error: kind === "server"
        ? "El servidor tuvo un problema. Intenta en un momento."
        : "Respuesta inesperada del servidor",
    };
  }

  if (!r.ok) {
    const kind = r.status >= 500 ? "server" : "client";
    // Sólo un 5xx significa que la API está caída; un 4xx es error de validación
    if (kind === "server") reportHealth(false, kind);
    else reportHealth(true);
    return {
      ok: false,
      errorKind: kind,
      error: data?.error || (kind === "server"
        ? "El servidor tuvo un problema. Intenta en un momento."
        : "No se pudo completar la acción"),
    };
  }

  reportHealth(true);
  return data;
}