/**
 * Нэг мөрт inline SVG icon-ууд. Emoji-г орлоно.
 * Бүх атрибут нэг хашилттай (') тул давхар хашилттай JS/HTML мөр дотор аюулгүй суудаг.
 * currentColor-оор будагдаж, width/height='1em' тул текстийн хэмжээгээр томордог.
 * Ашиглах: import { icon } from '../ui/icons.js'  ->  icon('phone')
 */

const A = "xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24' style='vertical-align:-.15em;flex:none' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'";
const AF = "xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24' style='vertical-align:-.15em;flex:none' fill='currentColor'";

export const ICONS = {
  phone: `<svg ${A} class='ico'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'/></svg>`,
  mail: `<svg ${A} class='ico'><rect x='2' y='4' width='20' height='16' rx='2'/><path d='m22 7-10 6L2 7'/></svg>`,
  users: `<svg ${A} class='ico'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>`,
  book: `<svg ${A} class='ico'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'/><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'/></svg>`,
  pin: `<svg ${A} class='ico'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg>`,
  clock: `<svg ${A} class='ico'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>`,
  globe: `<svg ${A} class='ico'><circle cx='12' cy='12' r='10'/><path d='M2 12h20'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/></svg>`,
  cap: `<svg ${A} class='ico'><path d='M22 10 12 5 2 10l10 5 10-5z'/><path d='M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5'/></svg>`,
  trophy: `<svg ${A} class='ico'><path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/><path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/><path d='M4 22h16'/><path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'/><path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'/><path d='M18 2H6v7a6 6 0 0 0 12 0V2z'/></svg>`,
  chart: `<svg ${A} class='ico'><path d='M23 6 13.5 15.5 8.5 10.5 1 18'/><path d='M17 6h6v6'/></svg>`,
  edit: `<svg ${A} class='ico'><path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/></svg>`,
  school: `<svg ${A} class='ico'><path d='M3 21h18'/><path d='M5 21V8l7-4 7 4v13'/><path d='M9 21v-6h6v6'/></svg>`,
  star: `<svg ${AF} class='ico'><path d='M12 2 15.09 8.26 22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z'/></svg>`,
  target: `<svg ${A} class='ico'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/></svg>`,
  teacher: `<svg ${A} class='ico'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>`,
  bell: `<svg ${A} class='ico'><path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/><path d='M13.73 21a2 2 0 0 1-3.46 0'/></svg>`,
  calendar: `<svg ${A} class='ico'><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/></svg>`,
  card: `<svg ${A} class='ico'><rect x='1' y='4' width='22' height='16' rx='2'/><path d='M1 10h22'/></svg>`,
  user: `<svg ${A} class='ico'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>`,
  home: `<svg ${A} class='ico'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><path d='M9 22V12h6v10'/></svg>`,
  camera: `<svg ${A} class='ico'><path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'/><circle cx='12' cy='13' r='4'/></svg>`,
  eye: `<svg ${A} class='ico'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>`,
  qr: `<svg ${A} class='ico'><rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/><path d='M14 14h3v3h-3zM21 14v.01M14 21h.01M17 21h.01M21 17v4'/></svg>`,
  check: `<svg ${A} class='ico'><path d='M20 6 9 17l-5-5'/></svg>`,
  diamond: `<svg ${A} class='ico'><path d='M6 3h12l4 6-10 12L2 9z'/><path d='M2 9h20M12 3v18'/></svg>`,
  puzzle: `<svg ${A} class='ico'><path d='M4 7h3a2 2 0 1 1 4 0h3v3a2 2 0 1 0 0 4v3h-3a2 2 0 1 0-4 0H4v-3a2 2 0 1 1 0-4V7z'/></svg>`,
  'arrow-right': `<svg ${A} class='ico'><path d='M5 12h14M12 5l7 7-7 7'/></svg>`,
  'arrow-left': `<svg ${A} class='ico'><path d='M19 12H5M12 19l-7-7 7-7'/></svg>`,
  'arrow-up': `<svg ${A} class='ico'><path d='M12 19V5M5 12l7-7 7 7'/></svg>`,
  'arrow-down': `<svg ${A} class='ico'><path d='M12 5v14M19 12l-7 7-7-7'/></svg>`,
};

export function icon(name) {
  return ICONS[name] || '';
}
