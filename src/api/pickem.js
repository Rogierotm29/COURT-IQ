/* ═══ PICKEM API ═══ */
export async function pickemAPI(action, opts = {}) {
  const { body, params } = opts;
  const qs = new URLSearchParams({ action, ...params }).toString();
  try {
    const r = await fetch(`/api/pickem?${qs}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return await r.json();
  } catch { return { ok: false, error: "Network error" }; }
}