import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { AdCheck } from "./adChecks";

export const AdChecklist: React.FC<{ checks: AdCheck[] }> = ({ checks }) => {
  const errors = checks.filter((c) => !c.ok && c.severity === "error").length;
  return (
    <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[13px] text-[#161418]">Chequeo de datos y marca</span>
        <span className={`text-[12px] font-bold ${errors ? "text-[#A40F5F]" : "text-emerald-700"}`}>
          {errors ? `${errors} para corregir` : "Todo en orden"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-[12.5px]">
            {c.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
            ) : c.severity === "error" ? (
              <AlertCircle className="w-4 h-4 text-[#A40F5F] shrink-0 mt-px" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#6A6460] shrink-0 mt-px" />
            )}
            <span className={c.ok ? "text-[#46413F]" : c.severity === "error" ? "text-[#A40F5F] font-bold" : "text-[#46413F]"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
