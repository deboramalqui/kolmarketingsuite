import React from "react";

interface KolLogoProps {
  /**
   * "blanco": logo-blanco oficial (isotipo blanco + corazón/L magenta + letras "kol" blancas) para fondos oscuros (#161418 / #2A2629)
   * "oscuro": versión adaptada para superficies claras (#FFFFFF) con trazos en carbón #161418 y corazón/L magenta
   */
  variant?: "blanco" | "oscuro";
  className?: string;
}

export const KolLogo: React.FC<KolLogoProps> = ({
  variant = "blanco",
  className = "h-[44px] w-auto",
}) => {
  const strokeAndTextColor = variant === "blanco" ? "#FFFFFF" : "#161418";
  const magentaColor = "#EA1573";

  return (
    <svg
      viewBox="0 0 1000 406"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="kol"
    >
      {/* Marco rectangular redondeado inclinado a la izquierda (-24.5°) */}
      <g transform="translate(145, 225) rotate(-24.5)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M -32 -162 H 32 A 54 54 0 0 1 86 -108 V 108 A 54 54 0 0 1 32 162 H -32 A 54 54 0 0 1 -86 108 V -108 A 54 54 0 0 1 -32 -162 Z M -28 -130 H 28 A 26 26 0 0 1 54 -104 V 104 A 26 26 0 0 1 28 130 H -28 A 26 26 0 0 1 -54 104 V -104 A 26 26 0 0 1 -28 -130 Z"
          fill={strokeAndTextColor}
        />
      </g>

      {/* Bloque en L / corazón geométrico en magenta inclinado a la derecha (+21.5°) */}
      <g transform="translate(123, 224) rotate(21.5)">
        <path
          d="M 0 0 L 0 -184 A 56 56 0 0 1 56 -240 L 102 -240 A 56 56 0 0 1 158 -184 L 158 -136 L 230 -136 A 56 56 0 0 1 286 -80 L 286 -56 A 56 56 0 0 1 230 0 L 0 0 Z"
          fill={magentaColor}
        />
      </g>

      {/* Logotipo "kol" geométrico redondeado */}
      {/* Letra "k" */}
      <path
        d="M 483 85 A 10 10 0 0 1 493 75 H 531 A 10 10 0 0 1 541 85 V 216 L 594 150 A 12 12 0 0 1 604 145 H 641 A 8 8 0 0 1 647 158 L 591 224 L 654 327 A 8 8 0 0 1 647 340 H 609 A 12 12 0 0 1 599 334 L 554 256 L 541 271 V 330 A 10 10 0 0 1 531 340 H 493 A 10 10 0 0 1 483 330 V 85 Z"
        fill={strokeAndTextColor}
      />

      {/* Letra "o" */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 766 140 C 823.4 140 869 185.6 869 242 C 869 298.4 823.4 344 766 344 C 708.6 344 663 298.4 663 242 C 663 185.6 708.6 140 766 140 Z M 766 194 C 739.5 194 719 215.2 719 242 C 719 268.8 739.5 290 766 290 C 792.5 290 813 268.8 813 242 C 813 215.2 792.5 194 766 194 Z"
        fill={strokeAndTextColor}
      />

      {/* Letra "l" */}
      <path
        d="M 917 85 A 10 10 0 0 1 927 75 H 965 A 10 10 0 0 1 975 85 V 280 C 975 290 979 294 989 295 H 991 A 8 8 0 0 1 999 303 V 332 A 10 10 0 0 1 989 342 H 966 C 934 342 917 325 917 291 V 85 Z"
        fill={strokeAndTextColor}
      />
    </svg>
  );
};
