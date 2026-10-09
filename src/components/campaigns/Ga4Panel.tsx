import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchGa4Status, Ga4Status } from "./ga4Sync";

/** Estado de la conexión con GA4 y cómo conectarla. Las credenciales se cargan en el servidor, nunca acá. */
export const Ga4Panel: React.FC = () => {
  const [st, setSt] = useState<Ga4Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchGa4Status(false).then(setSt);
  }, []);

  const test = async () => {
    setBusy(true);
    setSt(await fetchGa4Status(true));
    setBusy(false);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-kol-display font-bold text-[18px] text-[#161418]">Conexión con Google Analytics (GA4)</h2>
        <p className="text-[13px] text-[#46413F] max-w-3xl mt-1">
          Con la conexión activa, los resultados de cada campaña (visitas, consultas y citas, por anuncio) se leen solos desde GA4 usando el nombre de campaña y de anuncio del UTM. Ya no hace falta cargarlos a mano.
        </p>
      </div>

      <div className={`p-4 rounded-[10px] border flex flex-col md:flex-row md:items-center gap-3 justify-between ${st?.ok ? "border-[#161418] bg-white" : "border-[#C9C3BE] bg-[#FAF8F6]"}`} aria-live="polite">
        <div className="flex items-start gap-2 text-[13.5px]">
          {st?.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#6A6460] shrink-0" />}
          <div>
            <strong className="text-[#161418]">{st ? (st.configured ? (st.ok === undefined ? "Credenciales cargadas" : st.ok ? "Conectado" : "No se pudo conectar") : "Sin conectar") : "Consultando…"}</strong>
            <p className="text-[#46413F]">{st?.message}</p>
            {st?.propertyId && <p className="text-[12px] text-[#6A6460]">Propiedad de GA4: {st.propertyId}</p>}
          </div>
        </div>
        <button type="button" disabled={busy || !st?.configured} onClick={test} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold flex items-center gap-2 disabled:opacity-40 self-start md:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Probar la conexión
        </button>
      </div>

      {!st?.ok && (
        <ol className="space-y-2 text-[13px] text-[#161418] list-decimal pl-5 max-w-3xl">
          <li>En Google Cloud, creá un proyecto (o usá uno existente) y activá la <strong>API de datos de Google Analytics</strong>.</li>
          <li>Creá una <strong>cuenta de servicio</strong> y descargá su archivo de claves (formato JSON).</li>
          <li>En GA4 (Administrar → Acceso a la propiedad) agregá el correo de esa cuenta de servicio con el rol <strong>Lector</strong>, en la propiedad “kolaccesorios - GA4”.</li>
          <li>En AI Studio, panel <strong>Secrets</strong>, cargá <code>GA4_SERVICE_ACCOUNT_JSON</code> con el contenido completo del archivo. Si la propiedad no es la 372010641, cargá también <code>GA4_PROPERTY_ID</code>.</li>
          <li>Volvé acá y tocá “Probar la conexión”.</li>
        </ol>
      )}
      <p className="text-[12px] text-[#6A6460] max-w-3xl">
        Las credenciales se guardan solo en el servidor y no pasan por el navegador. Para que Google Ads y GA4 muestren el gasto, la cuenta de Google Ads tiene que estar vinculada a GA4; si no, el gasto se sigue cargando a mano.
      </p>
    </section>
  );
};
