import type { SVGProps } from "react";

/**
 * Costa Companion – símbolo principal (variante A).
 * La C verde abraza un punto-sol terracota.
 * Props de color permiten aplicar versión "sobre verde" (hueso) o estándar.
 */
export function LogoSymbol({
  strokeColor = "#2C4A3B",
  dotColor = "#C97B4A",
  ...props
}: SVGProps<SVGSVGElement> & {
  strokeColor?: string;
  dotColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Costa Companion"
      {...props}
    >
      <path
        d="M78 26 A34 34 0 1 0 78 74"
        stroke={strokeColor}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="60" cy="50" r="8" fill={dotColor} />
    </svg>
  );
}

/**
 * Versión favicon / app icon: cuadrado redondeado verde con la C en hueso.
 */
export function LogoFavicon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Costa Companion"
      {...props}
    >
      <rect x="6" y="6" width="88" height="88" rx="22" fill="#2C4A3B" />
      <path
        d="M72 32 A26 26 0 1 0 72 68"
        stroke="#F7F4EF"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="58" cy="50" r="6.5" fill="#E0A877" />
    </svg>
  );
}
