// 48 selecciones del Mundial 2026, agrupadas A-L
// Bandera, nombre corto en español, grupo
export const TEAMS = [
  // Grupo A
  { code: 'MEX', flag: '🇲🇽', name: 'México',          group: 'A' },
  { code: 'RSA', flag: '🇿🇦', name: 'Sudáfrica',       group: 'A' },
  { code: 'KOR', flag: '🇰🇷', name: 'Corea del Sur',   group: 'A' },
  { code: 'CZE', flag: '🇨🇿', name: 'Rep. Checa',      group: 'A' },
  // Grupo B
  { code: 'CAN', flag: '🇨🇦', name: 'Canadá',          group: 'B' },
  { code: 'BIH', flag: '🇧🇦', name: 'Bosnia',          group: 'B' },
  { code: 'QAT', flag: '🇶🇦', name: 'Qatar',           group: 'B' },
  { code: 'SUI', flag: '🇨🇭', name: 'Suiza',           group: 'B' },
  // Grupo C
  { code: 'BRA', flag: '🇧🇷', name: 'Brasil',          group: 'C' },
  { code: 'MAR', flag: '🇲🇦', name: 'Marruecos',       group: 'C' },
  { code: 'HAI', flag: '🇭🇹', name: 'Haití',           group: 'C' },
  { code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Escocia',         group: 'C' },
  // Grupo D
  { code: 'USA', flag: '🇺🇸', name: 'Estados Unidos',  group: 'D' },
  { code: 'PAR', flag: '🇵🇾', name: 'Paraguay',        group: 'D' },
  { code: 'AUS', flag: '🇦🇺', name: 'Australia',       group: 'D' },
  { code: 'TUR', flag: '🇹🇷', name: 'Turquía',         group: 'D' },
  // Grupo E
  { code: 'GER', flag: '🇩🇪', name: 'Alemania',        group: 'E' },
  { code: 'CUW', flag: '🇨🇼', name: 'Curazao',         group: 'E' },
  { code: 'CIV', flag: '🇨🇮', name: 'Costa de Marfil', group: 'E' },
  { code: 'ECU', flag: '🇪🇨', name: 'Ecuador',         group: 'E' },
  // Grupo F
  { code: 'NED', flag: '🇳🇱', name: 'Países Bajos',    group: 'F' },
  { code: 'JPN', flag: '🇯🇵', name: 'Japón',           group: 'F' },
  { code: 'SWE', flag: '🇸🇪', name: 'Suecia',          group: 'F' },
  { code: 'TUN', flag: '🇹🇳', name: 'Túnez',           group: 'F' },
  // Grupo G
  { code: 'BEL', flag: '🇧🇪', name: 'Bélgica',         group: 'G' },
  { code: 'EGY', flag: '🇪🇬', name: 'Egipto',          group: 'G' },
  { code: 'IRN', flag: '🇮🇷', name: 'Irán',            group: 'G' },
  { code: 'NZL', flag: '🇳🇿', name: 'Nueva Zelanda',   group: 'G' },
  // Grupo H
  { code: 'ESP', flag: '🇪🇸', name: 'España',          group: 'H' },
  { code: 'CPV', flag: '🇨🇻', name: 'Cabo Verde',      group: 'H' },
  { code: 'KSA', flag: '🇸🇦', name: 'Arabia Saudita',  group: 'H' },
  { code: 'URU', flag: '🇺🇾', name: 'Uruguay',         group: 'H' },
  // Grupo I
  { code: 'FRA', flag: '🇫🇷', name: 'Francia',         group: 'I' },
  { code: 'SEN', flag: '🇸🇳', name: 'Senegal',         group: 'I' },
  { code: 'IRQ', flag: '🇮🇶', name: 'Irak',            group: 'I' },
  { code: 'NOR', flag: '🇳🇴', name: 'Noruega',         group: 'I' },
  // Grupo J
  { code: 'ARG', flag: '🇦🇷', name: 'Argentina',       group: 'J' },
  { code: 'ALG', flag: '🇩🇿', name: 'Argelia',         group: 'J' },
  { code: 'AUT', flag: '🇦🇹', name: 'Austria',         group: 'J' },
  { code: 'JOR', flag: '🇯🇴', name: 'Jordania',        group: 'J' },
  // Grupo K
  { code: 'POR', flag: '🇵🇹', name: 'Portugal',        group: 'K' },
  { code: 'COD', flag: '🇨🇩', name: 'RD Congo',        group: 'K' },
  { code: 'UZB', flag: '🇺🇿', name: 'Uzbekistán',      group: 'K' },
  { code: 'COL', flag: '🇨🇴', name: 'Colombia',        group: 'K' },
  // Grupo L
  { code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Inglaterra',      group: 'L' },
  { code: 'CRO', flag: '🇭🇷', name: 'Croacia',         group: 'L' },
  { code: 'GHA', flag: '🇬🇭', name: 'Ghana',           group: 'L' },
  { code: 'PAN', flag: '🇵🇦', name: 'Panamá',          group: 'L' },
];

export const TEAMS_BY_CODE = Object.fromEntries(TEAMS.map((t) => [t.code, t]));
export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
export const teamLabel = (code) => {
  const t = TEAMS_BY_CODE[code];
  return t ? `${t.flag} ${t.name}` : code;
};
