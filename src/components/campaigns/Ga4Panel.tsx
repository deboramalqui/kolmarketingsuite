import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchGa4Status, fetchOauthInfo, Ga4Status } from "./ga4Sync";
import { useCopy } from "./useCopy";
import { CopyButton } from "./CopyButton";

/** Estado de la conexión con GA4 y cómo conectarla. Las credenciales se cargan en el servidor, nunca acá. */
export const Ga4Panel: React.FC = () => {
  const [st, setSt] = useState<Ga4Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauth, setOauth] = useState<{ clientConfigured: boolean; redirectUri: string }>({ clientConfigured: false, redirectUri: "" });
  const { copiedKey, copy } = useCopy();

  useEffect(() => {
    fetchGa4Status(false).then(setSt);
    fetchOauthInfo().then(setOauth);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-2">
            <h3 className="font-bold text-[14px] text-[#161418]">Opción A · Cuenta de servicio</h3>
            <p className="text-[12.5px] text-[#46413F]">Requiere que alguien con rol <strong>Administrador</strong> de la cuenta de GA4 agregue un correo como Lector.</p>
            <ol className="space-y-1.5 text-[13px] text-[#161418] list-decimal pl-5">
              <li>En Google Cloud, activá la <strong>API de datos de Google Analytics</strong> y creá una <strong>cuenta de servicio</strong> con su clave JSON.</li>
              <li>Un administrador de GA4 la agrega como <strong>Lector</strong> (Administrar → Gestión de accesos a la cuenta o a la propiedad).</li>
              <li>En <strong>Secrets</strong> de AI Studio cargá <code>GA4_SERVICE_ACCOUNT_JSON</code> con el contenido completo del archivo.</li>
              <li>Volvé acá y tocá “Probar la conexión”.</li>
            </ol>
          </div>

          <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-2">
            <h3 className="font-bold text-[14px] text-[#161418]">Opción B · Autorizar con una cuenta de Google</h3>
            <p className="text-[12.5px] text-[#46413F]">No hace falta ser administrador: alcanza con la cuenta que ya ve los datos de GA4 (por ejemplo, <code>redeskolaccesorios@gmail.com</code>).</p>
            <ol className="space-y-1.5 text-[13px] text-[#161418] list-decimal pl-5">
              <li>
                En Google Cloud → <strong>Google Auth Platform</strong> (o “Pantalla de consentimiento de OAuth”): tipo <strong>Externo</strong>, nombre “KOL Marketing Suite”, y agregá el permiso <code>analytics.readonly</code>. Después tocá <strong>Publicar la app</strong> (si queda en “Prueba”, la autorización vence a los 7 días).
              </li>
              <li>
                En <strong>Clientes</strong> (o Credenciales) → Crear cliente → <strong>Aplicación web</strong>. En “URI de redireccionamiento autorizados” pegá:
                {oauth.redirectUri ? (
                  <div className="mt-1.5 p-2 bg-[#F3F0ED] border border-[#E7E3DF] rounded-[6px] flex items-center justify-between gap-2">
                    <code className="text-[12px] break-all">{oauth.redirectUri}</code>
                    <CopyButton text={oauth.redirectUri} id="redir" copiedKey={copiedKey} onCopy={copy} />
                  </div>
                ) : (
                  <span className="block text-[12px] text-[#6A6460]">(no se pudo detectar la dirección)</span>
                )}
              </li>
              <li>Copiá el <strong>ID de cliente</strong> y el <strong>secreto</strong> y guardalos en <strong>Secrets</strong> como <code>GOOGLE_OAUTH_CLIENT_ID</code> y <code>GOOGLE_OAUTH_CLIENT_SECRET</code>. Reiniciá la app.</li>
              <li>Tocá el botón de abajo, elegí la cuenta y aceptá. Google puede avisar “app no verificada”: Avanzado → Ir a KOL Marketing Suite.</li>
              <li>Al terminar, te muestra un código: guardalo en Secrets como <code>GA4_REFRESH_TOKEN</code> para que no se pierda si el servidor se reinicia.</li>
            </ol>
            <a
              href={oauth.clientConfigured ? "/api/ga4/oauth/start" : undefined}
              aria-disabled={!oauth.clientConfigured}
              className={`inline-block mt-1 kol-btn-normal px-4 py-2 text-[12.5px] font-bold ${oauth.clientConfigured ? "bg-[#161418] text-[#FAF8F6]" : "bg-[#E7E3DF] text-[#8C8580] pointer-events-none"}`}
            >
              Autorizar con Google
            </a>
            {!oauth.clientConfigured && <p className="text-[12px] text-[#6A6460]">Se habilita cuando estén cargados el ID de cliente y el secreto (paso 3).</p>}
          </div>
        </div>
      )}
      <p className="text-[12px] text-[#6A6460] max-w-3xl">
        Las credenciales se guardan solo en el servidor y no pasan por el navegador. Para que Google Ads y GA4 muestren el gasto, la cuenta de Google Ads tiene que estar vinculada a GA4; si no, el gasto se sigue cargando a mano.
      </p>
    </section>
  );
};
