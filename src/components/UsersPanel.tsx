import React, { useEffect, useState } from "react";
import { Info, Check, Copy } from "lucide-react";
import { ROLE_LABEL, type Role } from "../lib/auth";

interface UsersInfo {
  enabled: boolean;
  reason?: string;
  callbackUrl: string;
  sessionSecretSet: boolean;
  users: Array<{ email: string; role: Role }>;
}

const ROLE_NAME: Record<Role, string> = { admin: "Administra", editor: "Edita", viewer: "Ve" };
const ROLE_CAN: Record<Role, string> = {
  viewer: "Mira Hoy, Fuentes, Informes y las campañas. No cambia nada.",
  editor: "Lo de “Ve”, y además crea y edita campañas y la galería. No sincroniza ni toca conexiones.",
  admin: "Lo de “Edita”, y además actualiza los datos, prueba y configura las conexiones y ve esta lista.",
};

export const UsersPanel: React.FC = () => {
  const [info, setInfo] = useState<UsersInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.error || `El servidor respondió ${r.status}`)))))
      .then(setInfo)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo leer la lista de usuarios"));
  }, []);

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const card = "p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4";
  const code = "bg-[#161418] text-[#FFBA00] px-1.5 py-0.5 rounded font-mono font-bold";

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 border-2 border-[#FAF8F6] rounded-[10px] text-[14px] font-semibold flex items-start gap-2" role="alert">
          <span aria-hidden="true" className="font-bold">!</span>
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="p-4 bg-[#2A2629] border border-[#46413F] rounded-[10px] flex items-start gap-3" role="status">
          <Info className="w-5 h-5 shrink-0 text-[#FAF8F6] mt-0.5" aria-hidden="true" />
          <p className="text-[14px] text-[#FAF8F6] leading-snug">
            {info.enabled ? (
              <><strong>El inicio de sesión está encendido.</strong> {info.users.length} {info.users.length === 1 ? "persona tiene" : "personas tienen"} acceso con su cuenta de Google.</>
            ) : (
              <><strong>El inicio de sesión está apagado: la app está abierta.</strong> {info.reason}</>
            )}
          </p>
        </div>
      )}

      <section className={card}>
        <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">Qué puede hacer cada rol</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["viewer", "editor", "admin"] as Role[]).map((r) => (
            <div key={r} className="p-4 bg-[#161418] border border-[#46413F] rounded-[12px] space-y-1.5">
              <div className="font-kol-display font-bold text-[16px] text-[#FAF8F6]">{ROLE_NAME[r]}</div>
              <div className="text-[14px] text-[#FFBA00] font-semibold">{ROLE_LABEL[r]}</div>
              <p className="text-[14px] text-[#C9C3BE] leading-snug">{ROLE_CAN[r]}</p>
            </div>
          ))}
        </div>
        <p className="text-[14px] text-[#C9C3BE]">No hay contraseñas propias de la app: cada persona entra con su cuenta de Google, con la verificación en dos pasos de Google.</p>
      </section>

      <section className={card}>
        <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">Personas con acceso</h3>
        {info && info.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[420px]">
              <thead>
                <tr className="text-[14px] text-[#C9C3BE] font-semibold border-b border-[#46413F]">
                  <th className="py-2 pr-3">Cuenta de Google</th>
                  <th className="py-2">Rol</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#FAF8F6]">
                {info.users.map((u) => (
                  <tr key={u.email} className="border-b border-[#46413F]/60">
                    <td className="py-2.5 pr-3 font-mono">{u.email}</td>
                    <td className="py-2.5">{ROLE_NAME[u.role]} · <span className="text-[#C9C3BE]">{ROLE_LABEL[u.role]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[14px] text-[#C9C3BE]">{info ? "Todavía no hay personas cargadas." : "Cargando…"}</p>
        )}
      </section>

      <section className={card}>
        <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">Cómo sumar, cambiar o sacar a alguien</h3>
        <ol className="list-decimal pl-5 space-y-2 text-[14px] text-[#FAF8F6] leading-snug">
          <li>En AI Studio, abrí <strong>Settings → Secrets</strong> y creá o editá el secret <code className={code}>APP_USERS</code>.</li>
          <li>
            Escribí una cuenta por persona, con su rol, separadas por coma. Ejemplo (reemplazá por las cuentas reales):
            <div className="mt-1.5 p-2.5 bg-[#161418] border border-[#46413F] rounded-[8px] font-mono text-[14px] break-all">
              persona1@gmail.com:admin, persona2@gmail.com:editor, persona3@gmail.com:viewer
            </div>
          </li>
          <li>Los roles son <code className={code}>admin</code>, <code className={code}>editor</code> y <code className={code}>viewer</code>. Incluí <strong>tu propia cuenta como admin</strong> antes de guardar, o te vas a quedar afuera.</li>
          <li>Creá también el secret <code className={code}>SESSION_SECRET</code> con un texto largo al azar (16 caracteres o más), para que las sesiones no se cierren cada vez que la app se reinicia.</li>
          <li>Guardá y esperá a que la app se reinicie. Para sacar a alguien, borrala de la lista y reiniciá.</li>
        </ol>
        {info && !info.sessionSecretSet && (
          <div className="p-3 border-2 border-[#FAF8F6] rounded-[8px] text-[14px] font-semibold flex items-start gap-2">
            <span aria-hidden="true" className="font-bold">!</span>
            <span>Falta <code className={code}>SESSION_SECRET</code>: hasta que lo cargues, las sesiones se cierran cada vez que la app se reinicia.</span>
          </div>
        )}
      </section>

      <section className={card}>
        <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">Un paso en Google Cloud (una sola vez)</h3>
        <p className="text-[14px] text-[#C9C3BE] leading-snug">
          Para que Google deje volver a la app después de iniciar sesión, esta dirección tiene que estar en el cliente de OAuth, en “URI de redireccionamiento autorizados”:
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="p-2.5 bg-[#161418] border border-[#46413F] rounded-[8px] font-mono text-[14px] text-[#FAF8F6] break-all">{info?.callbackUrl ?? "…"}</code>
          <button
            type="button"
            onClick={() => info && copy(info.callbackUrl)}
            className="kol-btn-normal px-4 border border-[#C9C3BE] text-[#FAF8F6] hover:bg-[#161418] flex items-center gap-2 kol-focus-dark"
          >
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            <span>{copied ? "Copiada" : "Copiar"}</span>
          </button>
        </div>
        <p className="text-[14px] text-[#C9C3BE] leading-snug">
          Si la app se abre desde más de una dirección (la de prueba y la publicada), agregá las dos. El inicio de sesión funciona bien en la dirección publicada.
        </p>
      </section>
    </div>
  );
};
