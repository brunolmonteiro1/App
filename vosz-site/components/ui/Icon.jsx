// Conjunto de ícones em linha (stroke), leve e sem dependências externas.
// Estilo: traço arredondado, coerente com as formas arredondadas da marca.

const paths = {
  utensils: <><path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M18 3c-1.5 0-3 2-3 5s1.5 4 3 4v9" /></>,
  home: <><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></>,
  heart: <path d="M12 20s-7-4.5-9.5-9A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
  shield: <path d="M12 3.5 5 6.2V11c0 4.5 3 7.8 7 9.5 4-1.7 7-5 7-9.5V6.2L12 3.5Z" />,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.6-1-2.6 0-.8.7-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="12" cy="8" r="1" /><circle cx="16.5" cy="11" r="1" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" /></>,
  link: <><path d="M9 15 15 9" /><path d="M11 6.5 12.5 5a4 4 0 0 1 5.7 5.7l-1.5 1.5" /><path d="M13 17.5 11.5 19a4 4 0 0 1-5.7-5.7l1.5-1.5" /></>,
  family: <><circle cx="8" cy="8" r="2.4" /><circle cx="16" cy="8" r="2.4" /><path d="M4 19c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2M13 19c0-2.5 1.8-4.2 4-4.2s3.9 1.7 3.9 4.2" /></>,
  book: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" /></>,
  brain: <path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1.5 4.5A2.5 2.5 0 0 0 9 20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm6 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 19 11a2.5 2.5 0 0 0-1.5-4.5A2.5 2.5 0 0 0 15 4Z" />,
  tag: <><path d="M4 12.5 12.5 4H20v7.5L11.5 20 4 12.5Z" /><circle cx="15.5" cy="8.5" r="1.2" /></>,
  sprout: <><path d="M12 20v-8" /><path d="M12 12c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5Z" /><path d="M12 14c0-2.5-2-4.5-5-4.5 0 3 2 4.5 5 4.5Z" /></>,
  handshake: <path d="m11 17 2 2 3.5-3.5M3 12l4-4 5 4 2-2 4 3 3-2M8 8l3 3" />,
  building: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></>,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.5a3 3 0 0 1 0 5.5M17 15c2.3.5 4 2.4 4 5" /></>,
  megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" /><path d="M18 9a4 4 0 0 1 0 6" /></>,
};

export default function Icon({ name, className = "h-6 w-6", ...props }) {
  const path = paths[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );
}
