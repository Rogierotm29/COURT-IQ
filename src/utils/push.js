import { pickemAPI } from "../api/pickem";

export const VAPID_KEY="BKMJ55qDz8klBdhztjHMlXcXAWbF1FecmMqFzq2j6XbFotJUe_Cwdx-WMKERkQ51qv4X_DrFjsK1wP8LFpIjz_k";

export const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
export const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;

export async function autoSubscribePush(userId){
  if(!("Notification" in window)) throw new Error("Tu navegador no soporta notificaciones");
  if(!("serviceWorker" in navigator)) throw new Error("Tu navegador no soporta service workers");
  if(isIOS()&&!isStandalone()) throw new Error("iOS_NOT_INSTALLED");
  const perm=await Notification.requestPermission();
  if(perm==="denied") throw new Error("Bloqueaste las notificaciones en este navegador. Debes habilitarlas en Configuración del teléfono.");
  if(perm!=="granted") throw new Error("Permiso de notificaciones no otorgado");
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:VAPID_KEY});
  const result=await pickemAPI("subscribePush",{body:{userId,subscription:sub.toJSON()}});
  if(!result?.ok) throw new Error(result?.error||"Error guardando suscripción en el servidor");
}