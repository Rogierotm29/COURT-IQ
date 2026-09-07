/* ═══ PICKEM API ═══ */

const TIMEOUT_MS = 12000;

/**
 * Cliente de la API. Siempre resuelve con { ok, error?, errorKind? } —
 * nunca lanza, para que el llamador no tenga que envolver todo en try/catch.
 *
 * errorKind permite a la UI reaccionar distinto según la causa:
 *   "offline"  — el dispositivo no tiene conexión
 *   "timeout"  — el servidor tardó demasiado
 *   "network"  — falló la petición (DNS, CORS, servidor caído)
 *   "server"   — el servidor respondió con 5xx
 *   "client"   — el servidor respondió con 4xx
 *   "parse"    — la respuesta no era JSON válido
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
    if (e.name === "TimeoutError" || e.name === "AbortError") {
      console.warn(`pickemAPI[${action}] timeout tras ${TIMEOUT_MS}ms`);
      return { ok: false, errorKind: "timeout", error: "El servidor tardó demasiado. Intenta de nuevo." };
    }
    console.warn(`pickemAPI[${action}] falló la petición:`, e.message);
    return { ok: false, errorKind: "network", error: "No pudimos conectar con el servidor" };
  }

  // Respuestas de error con cuerpo JSON: preferimos el mensaje del servidor
  let data;
  try {
    data = await r.json();
  } catch {
    console.warn(`pickemAPI[${action}] respuesta no-JSON, status ${r.status}`);
    return {
      ok: false,
      errorKind: r.status >= 500 ? "server" : "parse",
      error: r.status >= 500
        ? "El servidor tuvo un problema. Intenta en un momento."
        : "Respuesta inesperada del servidor",
    };
  }

  if (!r.ok) {
    const kind = r.status === 429 ? "client" : r.status >= 500 ? "server" : "client";
    return {
      ok: false,
      errorKind: kind,
      error: data?.error || (kind === "server"
        ? "El servidor tuvo un problema. Intenta en un momento."
        : "No se pudo completar la acción"),
    };
  }

  return data;
}