import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconSalud(p: IconProps) {
  return <svg {...base} {...p}><path d="M12 2v4m0 12v4M2 12h4m12 0h4M7.05 7.05l2.83 2.83M14.12 14.12l2.83 2.83M7.05 16.95l2.83-2.83M14.12 9.88l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>;
}

export function IconTramites(p: IconProps) {
  return <svg {...base} {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"/></svg>;
}

export function IconNotaria(p: IconProps) {
  return <svg {...base} {...p}><path d="M15.232 5.232l3.536 3.536M9 11l3.536-3.536 3.536 3.536L12.536 14.5 9 11zM3 21l6-2 9.5-9.5-3.5-3.5L5 17l-2 4z"/></svg>;
}

export function IconPropiedad(p: IconProps) {
  return <svg {...base} {...p}><path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/><circle cx="16" cy="16" r="2"/><path d="M16 14v-1M16 18v1"/></svg>;
}

export function IconBanca(p: IconProps) {
  return <svg {...base} {...p}><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>;
}

export function IconTelefono(p: IconProps) {
  return <svg {...base} {...p}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5S9.5 12 11 13.5s3 2.5 3 2.5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16.72V20a2 2 0 01-2 2h-1C9.716 22 2 14.284 2 6V5z"/></svg>;
}

export function IconEntrevista(p: IconProps) {
  return <svg {...base} {...p}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/><path d="M16 17l2 2 4-4" strokeWidth={2}/></svg>;
}

export function IconEspanol(p: IconProps) {
  return <svg {...base} {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/><path d="M8 12h2m2 0h2"/></svg>;
}
