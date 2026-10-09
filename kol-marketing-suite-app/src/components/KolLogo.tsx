import React from 'react';

interface KolLogoProps {
  className?: string;
  size?: number;
  variant?: 'claro' | 'oscuro';
}

export const KolLogo: React.FC<KolLogoProps> = ({
  className = '',
  size = 32,
  variant = 'claro',
}) => {
  const isDark = variant === 'oscuro';
  const bgColor = isDark ? '#111827' : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" fill={bgColor} />
      {/* Hoja estilizada KOL con curva tecnológica */}
      <path
        d="M50 18C33 18 20 33 20 54C20 73 34 82 50 82C66 82 80 73 80 54C80 33 67 18 50 18Z"
        fill="#10B981"
      />
      <path
        d="M50 18C44 32 44 68 50 82C56 68 56 32 50 18Z"
        fill="#059669"
      />
      <path
        d="M32 46C42 48 48 56 50 62"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M68 46C58 48 52 56 50 62"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="38" r="4" fill="#34D399" />
    </svg>
  );
};
