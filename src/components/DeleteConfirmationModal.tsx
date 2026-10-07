import React from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemTitle: string;
  itemType: string;
  reason?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  itemTitle,
  itemType,
  reason,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#161418]/70 p-4">
      {/* Diálogo: Rectángulo de 12 con sombra de nivel 3 (Lámina 7.6) */}
      <div className="w-full max-w-md bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 shadow-xl p-6 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
            Confirmá la eliminación del {itemType.toLowerCase()}
          </h3>
          <p className="text-[15px] leading-[23px] text-[#46413F]">
            Vas a quitar este registro de Marketing KOL Suite. Al confirmar, se actualiza el listado en tiempo real.
          </p>
        </div>

        <div className="p-4 bg-[#FFFFFF] border-2 border-[#A40F5F] kol-card-12 text-[15px] text-[#161418] space-y-1">
          <div className="flex items-start gap-2 font-semibold text-[#A40F5F]">
            <span className="font-bold">!</span>
            <span>{itemTitle}</span>
          </div>
          {reason && (
            <p className="text-[14px] text-[#46413F] pl-4">
              Motivo indicado: {reason}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#E7E3DF] kol-focus"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] kol-focus"
          >
            Eliminar ahora
          </button>
        </div>
      </div>
    </div>
  );
};
