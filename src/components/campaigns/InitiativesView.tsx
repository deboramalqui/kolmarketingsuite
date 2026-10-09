import React from "react";
import { FranchiseCampaignItem } from "../../types/marketing";
import { formatMoney, getAds, platformLabel, utmSlug } from "./campaignModel";
import { StatusBadge } from "./StatusBadge";
import { Ga4SyncBar } from "./Ga4SyncBar";

interface Props {
  campaigns: FranchiseCampaignItem[];
  onOpen: (id: string, tab?: "resumen" | "anuncios" | "paquete") => void;
  onUpdate: (c: FranchiseCampaignItem) => void;
}

const NONE = "Sin campaña paraguas";
const isDemo = (c: FranchiseCampaignItem) => c.id.startsWith("demo-");
const dash = (n: number | undefined, has: boolean) => (has && n !== undefined ? String(n) : "—");

const Tile: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[10px]">
    <div className="text-[11.5px] uppercase tracking-wide font-bold text-[#8C8580]">{label}</div>
    <div className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums mt-0.5">{value}</div>
    {note && <div className="text-[11.5px] text-[#6A6460] mt-0.5">{note}</div>}
  </div>
);

/** Vista "Por campaña paraguas": el total y el desglose por plataforma y por anuncio */
export const InitiativesView: React.FC<Props> = ({ campaigns, onOpen, onUpdate }) => {
  const groups = new Map<string, FranchiseCampaignItem[]>();
  campaigns.forEach((c) => {
    const k = c.initiative?.trim() || NONE;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[12px] text-[13px] text-[#46413F] leading-relaxed">
        <strong className="text-[#161418]">Qué es una campaña paraguas.</strong> Es el objetivo grande (por ejemplo “Franquicia Nov 2026”). Adentro hay una campaña por plataforma (Búsqueda, Display, Meta),
        y adentro de cada una, varios anuncios. Todas llevan el mismo <code>utm_campaign</code>: así en GA4 ves el total de la paraguas y también cuánto trajo cada plataforma y cada anuncio.
      </div>

      <Ga4SyncBar campaigns={campaigns.filter((c) => (c.status === "en_vivo" || c.status === "cerrada") && !c.id.startsWith("demo-"))} onUpdate={onUpdate} />

      {Array.from(groups.entries()).map(([name, list]) => {
        const demo = list.every(isDemo);
        const withData = list.filter((c) => !!c.livePerformance?.source);
        const has = withData.length > 0;
        const t = withData.reduce(
          (a, c) => ({ spend: a.spend + (c.livePerformance?.spend ?? 0), visits: a.visits + (c.livePerformance?.visits ?? 0), consultas: a.consultas + (c.livePerformance?.consultas ?? 0), citas: a.citas + (c.livePerformance?.citas ?? 0) }),
          { spend: 0, visits: 0, consultas: 0, citas: 0 }
        );
        const cap = list.reduce((s, c) => s + (c.budget.totalCap || 0), 0);

        // mejor anuncio y mejor plataforma
        let bestAd: { label: string; camp: string; n: number } | null = null;
        withData.forEach((c) =>
          c.livePerformance?.byAd?.forEach((r) => {
            const ad = getAds(c).find((a) => a.id === r.adId);
            if (ad && r.consultas > (bestAd?.n ?? 0)) bestAd = { label: ad.label, camp: platformLabel(c), n: r.consultas };
          })
        );
        const bestPlat = [...withData].sort((a, b) => (b.livePerformance?.consultas ?? 0) - (a.livePerformance?.consultas ?? 0))[0];

        return (
          <section key={name} className={`rounded-[14px] border-2 p-5 space-y-5 ${demo ? "border-dashed border-[#A40F5F] bg-[#FFFBFC]" : "border-[#C9C3BE] bg-white"}`}>
            {demo && (
              <div role="note" className="px-3 py-2 bg-[#161418] text-[#FAF8F6] rounded-[8px] text-[12.5px] font-bold">
                DEMO · Todos los números de esta paraguas están inventados para que se entienda cómo se ve. No son resultados de Kol.
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-kol-display font-extrabold text-[19px] text-[#161418]">{name}</h3>
              {name !== NONE && <span className="text-[12.5px] text-[#46413F]">utm_campaign: <code className="bg-[#F3F0ED] px-1.5 py-0.5 rounded">{utmSlug(name.replace(/^\[[^\]]*\]\s*/, ""))}</code></span>}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <Tile label="Tope total" value={formatMoney(cap)} note={`${list.length} campañas`} />
              <Tile label="Gasto" value={has ? formatMoney(t.spend) : "—"} />
              <Tile label="Llegaron a franquicias" value={dash(t.visits, has)} note="desde anuncios" />
              <Tile label="Consultas" value={dash(t.consultas, has)} note="dejaron sus datos" />
              <Tile label="Citas" value={dash(t.citas, has)} note="agendaron" />
              <Tile label="Costo por consulta" value={has && t.consultas > 0 ? formatMoney(Math.round(t.spend / t.consultas)) : "—"} />
            </div>

            {has && (bestAd || bestPlat) && (
              <p className="text-[13px] text-[#161418] p-3 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[8px]">
                {bestPlat && <>La plataforma que más consultas trajo: <strong>{platformLabel(bestPlat)}</strong> ({bestPlat.livePerformance?.consultas}). </>}
                {bestAd && <>El anuncio que más trajo: <strong>{(bestAd as { label: string }).label}</strong> de {(bestAd as { camp: string }).camp} ({(bestAd as { n: number }).n}). </>}
                <span className="text-[#6A6460]">Con pocas consultas, es una pista, no una conclusión.</span>
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#E7E3DF] text-left text-[12px] font-bold">
                    <th className="py-2 px-3">Campaña / anuncio</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2">Tope</th>
                    <th className="py-2 px-2">Gasto</th>
                    <th className="py-2 px-2">Llegaron</th>
                    <th className="py-2 px-2">Consultas</th>
                    <th className="py-2 px-2">Citas</th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const lp = c.livePerformance;
                    const ok = !!lp?.source;
                    return (
                      <React.Fragment key={c.id}>
                        <tr className="border-t-2 border-[#C9C3BE] bg-[#FAF8F6]">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#161418]">{platformLabel(c)}{c.audience?.type === "remarketing" && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#161418] text-[#FAF8F6]">Remarketing</span>}</div>
                            <div className="text-[12px] text-[#46413F]">{c.name}</div>
                          </td>
                          <td className="py-2.5 px-2"><StatusBadge status={c.status} /></td>
                          <td className="py-2.5 px-2 tabular-nums">{formatMoney(c.budget.totalCap)}</td>
                          <td className="py-2.5 px-2 tabular-nums">{ok ? formatMoney(lp!.spend) : "—"}</td>
                          <td className="py-2.5 px-2 tabular-nums">{dash(lp?.visits, ok)}</td>
                          <td className="py-2.5 px-2 tabular-nums font-bold">{dash(lp?.consultas, ok)}</td>
                          <td className="py-2.5 px-2 tabular-nums">{dash(lp?.citas, ok)}</td>
                          <td className="py-2.5 px-2 text-right"><button type="button" onClick={() => onOpen(c.id, "resumen")} className="px-2.5 py-1 bg-white border border-[#C9C3BE] rounded-[6px] text-[12px] font-bold hover:bg-[#E7E3DF] kol-focus">Ver ficha</button></td>
                        </tr>
                        {getAds(c).map((ad) => {
                          const r = lp?.byAd?.find((x) => x.adId === ad.id);
                          return (
                            <tr key={ad.id} className="border-t border-[#E7E3DF] text-[#46413F]">
                              <td className="py-1.5 px-3 pl-8">↳ {ad.label} <span className="font-mono text-[11.5px] text-[#8C8580]">{ad.utmContent}</span></td>
                              <td />
                              <td />
                              <td className="py-1.5 px-2 tabular-nums">{r ? formatMoney(r.spend) : "—"}</td>
                              <td className="py-1.5 px-2 tabular-nums">{r ? r.visits : "—"}</td>
                              <td className="py-1.5 px-2 tabular-nums">{r ? r.consultas : "—"}</td>
                              <td className="py-1.5 px-2 tabular-nums">{r ? r.citas : "—"}</td>
                              <td />
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
};
