// Estructura de eliminatorias - Mundial 2026
// 32 partidos: 16 dieciseisavos + 8 octavos + 4 cuartos + 2 semis + 3er puesto + Final
// HORARIOS EN HORA COLOMBIA (UTC-5)
// Fuente: FIFA oficial / TUDN / Olé / ClaroSports

export const KNOCKOUT_MATCHES = [
  // ─── DIECISEISAVOS (R32) - Jun 28 a Jul 3 ─────────────────────
  { id: 'K01', phase: 'r32', date: '2026-06-28', time: '14:00', homeSlot: '2A',           awaySlot: '2B',            city: 'Los Ángeles',      venue: 'SoFi Stadium' },
  { id: 'K02', phase: 'r32', date: '2026-06-29', time: '15:30', homeSlot: '1E',           awaySlot: '3A/B/C/D/F',    city: 'Boston',           venue: 'Gillette Stadium' },
  { id: 'K03', phase: 'r32', date: '2026-06-29', time: '20:00', homeSlot: '1F',           awaySlot: '2C',            city: 'Monterrey',        venue: 'Estadio BBVA' },
  { id: 'K04', phase: 'r32', date: '2026-06-29', time: '12:00', homeSlot: '1C',           awaySlot: '2F',            city: 'Houston',          venue: 'NRG Stadium' },
  { id: 'K05', phase: 'r32', date: '2026-06-30', time: '16:00', homeSlot: '1I',           awaySlot: '3C/D/F/G/H',    city: 'East Rutherford',  venue: 'MetLife Stadium' },
  { id: 'K06', phase: 'r32', date: '2026-06-30', time: '12:00', homeSlot: '2E',           awaySlot: '2I',            city: 'Dallas',           venue: 'AT&T Stadium' },
  { id: 'K07', phase: 'r32', date: '2026-06-30', time: '20:00', homeSlot: '1A',           awaySlot: '3C/E/F/H/I',    city: 'Ciudad de México', venue: 'Estadio Azteca' },
  { id: 'K08', phase: 'r32', date: '2026-07-01', time: '11:00', homeSlot: '1L',           awaySlot: '3E/H/I/J/K',    city: 'Atlanta',          venue: 'Mercedes-Benz Stadium' },
  { id: 'K09', phase: 'r32', date: '2026-07-01', time: '19:00', homeSlot: '1D',           awaySlot: '3B/E/F/I/J',    city: 'San Francisco',    venue: 'Levi\'s Stadium' },
  { id: 'K10', phase: 'r32', date: '2026-07-01', time: '15:00', homeSlot: '1G',           awaySlot: '3A/E/H/I/J',    city: 'Seattle',          venue: 'Lumen Field' },
  { id: 'K11', phase: 'r32', date: '2026-07-02', time: '18:00', homeSlot: '2K',           awaySlot: '2L',            city: 'Toronto',          venue: 'BMO Field' },
  { id: 'K12', phase: 'r32', date: '2026-07-02', time: '14:00', homeSlot: '1H',           awaySlot: '2J',            city: 'Los Ángeles',      venue: 'SoFi Stadium' },
  { id: 'K13', phase: 'r32', date: '2026-07-02', time: '22:00', homeSlot: '1B',           awaySlot: '3E/F/G/I/J',    city: 'Vancouver',        venue: 'BC Place' },
  { id: 'K14', phase: 'r32', date: '2026-07-03', time: '17:00', homeSlot: '1J',           awaySlot: '2H',            city: 'Miami',            venue: 'Hard Rock Stadium' },
  { id: 'K15', phase: 'r32', date: '2026-07-03', time: '20:30', homeSlot: '1K',           awaySlot: '3D/E/I/J/L',    city: 'Kansas City',      venue: 'Arrowhead Stadium' },
  { id: 'K16', phase: 'r32', date: '2026-07-03', time: '13:00', homeSlot: '2D',           awaySlot: '2G',            city: 'Dallas',           venue: 'AT&T Stadium' },

  // ─── OCTAVOS (R16) - Jul 4 a Jul 7 ────────────────────────────
  { id: 'K17', phase: 'r16', date: '2026-07-04', time: '16:00', homeSlot: 'W K02',        awaySlot: 'W K05',         city: 'Filadelfia',       venue: 'Lincoln Financial Field' },
  { id: 'K18', phase: 'r16', date: '2026-07-04', time: '12:00', homeSlot: 'W K01',        awaySlot: 'W K03',         city: 'Houston',          venue: 'NRG Stadium' },
  { id: 'K19', phase: 'r16', date: '2026-07-05', time: '15:00', homeSlot: 'W K04',        awaySlot: 'W K06',         city: 'East Rutherford',  venue: 'MetLife Stadium' },
  { id: 'K20', phase: 'r16', date: '2026-07-05', time: '19:00', homeSlot: 'W K07',        awaySlot: 'W K08',         city: 'Ciudad de México', venue: 'Estadio Azteca' },
  { id: 'K21', phase: 'r16', date: '2026-07-06', time: '14:00', homeSlot: 'W K11',        awaySlot: 'W K12',         city: 'Dallas',           venue: 'AT&T Stadium' },
  { id: 'K22', phase: 'r16', date: '2026-07-06', time: '19:00', homeSlot: 'W K09',        awaySlot: 'W K10',         city: 'Seattle',          venue: 'Lumen Field' },
  { id: 'K23', phase: 'r16', date: '2026-07-07', time: '11:00', homeSlot: 'W K14',        awaySlot: 'W K16',         city: 'Atlanta',          venue: 'Mercedes-Benz Stadium' },
  { id: 'K24', phase: 'r16', date: '2026-07-07', time: '15:00', homeSlot: 'W K13',        awaySlot: 'W K15',         city: 'Vancouver',        venue: 'BC Place' },

  // ─── CUARTOS (QF) - Jul 9 a Jul 11 ────────────────────────────
  { id: 'K25', phase: 'qf',  date: '2026-07-09', time: '15:00', homeSlot: 'W K17',        awaySlot: 'W K18',         city: 'Boston',           venue: 'Gillette Stadium' },
  { id: 'K26', phase: 'qf',  date: '2026-07-10', time: '14:00', homeSlot: 'W K21',        awaySlot: 'W K22',         city: 'Los Ángeles',      venue: 'SoFi Stadium' },
  { id: 'K27', phase: 'qf',  date: '2026-07-11', time: '16:00', homeSlot: 'W K19',        awaySlot: 'W K20',         city: 'Miami',            venue: 'Hard Rock Stadium' },
  { id: 'K28', phase: 'qf',  date: '2026-07-11', time: '20:00', homeSlot: 'W K23',        awaySlot: 'W K24',         city: 'Kansas City',      venue: 'Arrowhead Stadium' },

  // ─── SEMIFINALES (SF) - Jul 14 y Jul 15 ───────────────────────
  { id: 'K29', phase: 'sf',  date: '2026-07-14', time: '14:00', homeSlot: 'W K25',        awaySlot: 'W K26',         city: 'Dallas',           venue: 'AT&T Stadium' },
  { id: 'K30', phase: 'sf',  date: '2026-07-15', time: '14:00', homeSlot: 'W K27',        awaySlot: 'W K28',         city: 'Atlanta',          venue: 'Mercedes-Benz Stadium' },

  // ─── TERCER PUESTO - Jul 18 ───────────────────────────────────
  { id: 'K31', phase: 'third', date: '2026-07-18', time: '16:00', homeSlot: 'L K29',      awaySlot: 'L K30',         city: 'Miami',            venue: 'Hard Rock Stadium' },

  // ─── FINAL - Jul 19 ───────────────────────────────────────────
  { id: 'K32', phase: 'final', date: '2026-07-19', time: '14:00', homeSlot: 'W K29',      awaySlot: 'W K30',         city: 'East Rutherford',  venue: 'MetLife Stadium' },
];

export const PHASE_LABELS = {
  r32:   'Dieciseisavos',
  r16:   'Octavos',
  qf:    'Cuartos',
  sf:    'Semifinales',
  third: 'Tercer puesto',
  final: 'Final',
};

export const PHASES_ORDER = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
export const matchesByPhase = (phase) => KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
