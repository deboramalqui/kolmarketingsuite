import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchGa4Status, fetchOauthInfo, Ga4Status, manualStart, manualFinish, OauthInfo } from "./ga4Sync";
import { useCopy } from "./useCopy";
import { CopyButton } from "./CopyButton";

/** Estado de la conexión con GA4 y cómo conectarla. Las credenciales se cargan en el servidor, nunca acá. */
export const Ga4Panel: React.FC = () => {
  const [st, setSt] = useState<Ga4Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauth, setOauth] = useState<OauthInfo>({ clientConfigured: false, redirectUri: "" });
  const { copiedKey, copy } = useCopy();
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [manualMsg, setManualMsg] = useState<{ ok: boolean; text: string; token?: string } | null>(null);
  const [manualBusy, setManualBusy] = useState(false);

  const prepare = async () => {
    setManualMsg(null);
    try {
      setManualUrl((await manualStart()).url);
    } catch (e) {
      setManualMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo generar el enlace" });
    }
  };
  const finish = async () => {
    setManualBusy(true);
    setManualMsg(null);
    try {
      const r = await manualFinish(pasted);
      setManualMsg({ ok: true, text: `Listo: GA4 quedó autorizado con ${r.email || "tu cuenta de Google"}.`, token: r.refreshToken });
      setPasted("");
      setManualUrl(null);
      fetchGa4Status(true).then(setSt);
    } catch (e) {
      setManualMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo completar" });
    } finally {
      setManualBusy(false);
    }
  };

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
            {oauth.client && (
              <p className={`text-[12px] p-2 rounded-[6px] border ${oauth.client.configured && oauth.client.idLooksValid ? "bg-[#F3F0ED] border-[#E7E3DF] text-[#46413F]" : "bg-white border-[#A40F5F] text-[#A40F5F] font-bold"}`}>
                {!oauth.client.configured
                  ? "Todavía no hay ID de cliente y secreto cargados en Secrets."
                  : oauth.client.idLooksValid
                  ? `ID de cliente detectado: ${oauth.client.idHint} (formato correcto) · secreto de ${oauth.client.secretLength} caracteres.`
                  : `El ID de cliente cargado (${oauth.client.idHint}) no tiene el formato esperado: tiene que ser números-letras y terminar en .apps.googleusercontent.com. Copialo de nuevo, sin comillas ni espacios.`}
              </p>
            )}
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
      {!st?.ok && (
        <div className="p-4 bg-white border-2 border-[#161418] rounded-[10px] space-y-3">
          <h3 className="font-bold text-[14px] text-[#161418]">Opción B, versión manual (si al volver de Google te da error 403)</h3>
          <p className="text-[12.5px] text-[#46413F]">Con varias cuentas de Google abiertas, la vuelta a la app puede fallar. Esta versión no vuelve a la app: copiás una dirección y la pegás acá.</p>
          <ol className="space-y-2 text-[13px] text-[#161418] list-decimal pl-5">
            <li>
              En Google Cloud, en el mismo cliente OAuth, agregá otra dirección en “URI de redireccionamiento autorizados”:
              <div className="mt-1.5 p-2 bg-[#F3F0ED] border border-[#E7E3DF] rounded-[6px] flex items-center justify-between gap-2">
                <code className="text-[12px] break-all">http://localhost:8080/oauth</code>
                <CopyButton text="http://localhost:8080/oauth" id="manual-redir" copiedKey={copiedKey} onCopy={copy} />
              </div>
            </li>
            <li>
              <button type="button" onClick={prepare} disabled={!oauth.clientConfigured} className="kol-btn-normal px-3 py-1.5 bg-white border border-[#161418] text-[12.5px] font-bold disabled:opacity-40">Generar el enlace</button>
              {manualUrl && (
                <a href={manualUrl} target="_blank" rel="noreferrer" className="ml-2 inline-block kol-btn-normal px-3 py-1.5 bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold">Abrir Google para autorizar</a>
              )}
            </li>
            <li>Elegí <code>redeskolaccesorios@gmail.com</code> y aceptá. Al final, el navegador va a mostrar <strong>“No se puede acceder a este sitio”</strong>: es lo esperado. <strong>Copiá la dirección completa de la barra de arriba</strong> (empieza con <code>http://localhost:8080/oauth?...</code>).</li>
            <li>
              Pegala acá y tocá Terminar:
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={3} placeholder="http://localhost:8080/oauth?state=...&code=..." className="mt-1.5 w-full p-2 border border-[#8C8580] rounded-[6px] text-[12px] font-mono kol-focus" />
              <button type="button" onClick={finish} disabled={manualBusy || !pasted.trim()} className="mt-1.5 kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold disabled:opacity-40">{manualBusy ? "Terminando…" : "Terminar"}</button>
            </li>
          </ol>
          {manualMsg && (
            <div role="status" className={`text-[13px] ${manualMsg.ok ? "text-[#161418]" : "text-[#A40F5F] font-bold"}`}>
              {manualMsg.text}
              {manualMsg.token && (
                <div className="mt-2 space-y-1 text-[12.5px] font-normal">
                  <p>Para que no se pierda cuando el servidor se reinicie, guardá este código en <strong>Secrets</strong> como <code>GA4_REFRESH_TOKEN</code>. Es una llave: no la compartas.</p>
                  <textarea readOnly rows={3} value={manualMsg.token} onClick={(e) => (e.target as HTMLTextAreaElement).select()} className="w-full p-2 border border-[#8C8580] rounded-[6px] text-[12px] font-mono" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <p className="text-[12px] text-[#6A6460] max-w-3xl">
        Las credenciales se guardan solo en el servidor y no pasan por el navegador. Para que Google Ads y GA4 muestren el gasto, la cuenta de Google Ads tiene que estar vinculada a GA4; si no, el gasto se sigue cargando a mano.
      </p>
    </section>
  );
};
