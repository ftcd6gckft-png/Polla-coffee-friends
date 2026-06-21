// ─────────────────────────────────────────────────────────────────
// Cálculo en vivo de tablas de posiciones de la fase de grupos,
// mejores terceros lugares, y proyección del bracket de dieciseisavos.
//
// Criterios FIFA Mundial 2026 (en orden):
//   1. Puntos totales
//   2. Enfrentamiento directo entre los empatados (puntos → DG → GF)
//   3. Diferencia de goles general
//   4. Goles a favor general
//   5. (Fair Play y Ranking FIFA — no implementados)
//   6. Orden alfabético (fallback)
// ─────────────────────────────────────────────────────────────────
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';
import { TEAMS, GROUPS } from '../data/teams.js';

function computeTeamStats(teamCode, matches, results) {
  const stats = {
    code: teamCode,
    pj: 0, g: 0, e: 0, p: 0,
    gf: 0, gc: 0, dif: 0, pts: 0,
  };
  for (const m of matches) {
    if (m.home !== teamCode && m.away !== teamCode) continue;
    const r = results[m.id];
    if (!r) continue;
    const sh = Number(r.home);
    const sa = Number(r.away);
    if (Number.isNaN(sh) || Number.isNaN(sa)) continue;
    const isHome = m.home === teamCode;
    const own = isHome ? sh : sa;
    const opp = isHome ? sa : sh;
    stats.pj += 1;
    stats.gf += own;
    stats.gc += opp;
    if (own > opp) { stats.g += 1; stats.pts += 3; }
    else if (own < opp) { stats.p += 1; }
    else { stats.e += 1; stats.pts += 1; }
  }
  stats.dif = stats.gf - stats.gc;
  return stats;
}

function computeHeadToHeadStats(teamCodes, matches, results) {
  const teamSet = new Set(teamCodes);
  const out = {};
  for (const code of teamCodes) {
    out[code] = { pts: 0, dif: 0, gf: 0, gc: 0 };
  }
  for (const m of matches) {
    if (!teamSet.has(m.home) || !teamSet.has(m.away)) continue;
    const r = results[m.id];
    if (!r) continue;
    const sh = Number(r.home);
    const sa = Number(r.away);
    if (Number.isNaN(sh) || Number.isNaN(sa)) continue;
    const h = out[m.home];
    const a = out[m.away];
    h.gf += sh; h.gc += sa;
    a.gf += sa; a.gc += sh;
    if (sh > sa) h.pts += 3;
    else if (sa > sh) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  }
  for (const code of teamCodes) {
    out[code].dif = out[code].gf - out[code].gc;
  }
  return out;
}

function rankTeams(teamStats, matches, results) {
  const sorted = [...teamStats].sort((a, b) => b.pts - a.pts);
  const groups = [];
  let cur = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pts === cur[0].pts) cur.push(sorted[i]);
    else { groups.push(cur); cur = [sorted[i]]; }
  }
  if (cur.length > 0) groups.push(cur);
  const result = [];
  for (const g of groups) {
    if (g.length === 1) result.push(g[0]);
    else result.push(...breakTie(g, matches, results));
  }
  return result;
}

function breakTie(tiedTeams, matches, results) {
  if (tiedTeams.length === 1) return tiedTeams;
  const codes = tiedTeams.map((t) => t.code);
  const h2h = computeHeadToHeadStats(codes, matches, results);
  return [...tiedTeams].sort((a, b) => {
    const aH = h2h[a.code], bH = h2h[b.code];
    if (bH.pts !== aH.pts) return bH.pts - aH.pts;
    if (bH.dif !== aH.dif) return bH.dif - aH.dif;
    if (bH.gf !== aH.gf) return bH.gf - aH.gf;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const aName = teamName(a.code), bName = teamName(b.code);
    return aName.localeCompare(bName);
  });
}

function teamName(code) {
  const t = TEAMS.find((x) => x.code === code);
  return t?.name || code;
}

export function calcGroupStandings(groupLetter, results = {}) {
  const teams = TEAMS.filter((t) => t.group === groupLetter);
  const matches = GROUP_MATCHES.filter((m) => m.group === groupLetter);
  const baseStats = teams.map((t) => {
    const stats = computeTeamStats(t.code, matches, results);
    return { ...stats, name: t.name, flag: t.flag };
  });
  const ranked = rankTeams(baseStats, matches, results);
  ranked.forEach((s, i) => {
    s.position = i + 1;
    s.status = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : 'fourth';
  });
  return ranked;
}

export function calcAllGroupStandings(results = {}) {
  const out = {};
  for (const g of GROUPS) out[g] = calcGroupStandings(g, results);
  return out;
}

export function calcBestThirds(allStandings) {
  const thirds = [];
  for (const g of GROUPS) {
    const groupTable = allStandings[g];
    if (!groupTable) continue;
    const third = groupTable.find((t) => t.position === 3);
    if (!third) continue;
    thirds.push({ ...third, group: g });
  }
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });
  thirds.forEach((t, i) => {
    t.qualifies = i < 8;
    t.thirdsPosition = i + 1;
  });
  return thirds;
}

export function calcGroupsProgress(results = {}) {
  const total = GROUP_MATCHES.length;
  const played = GROUP_MATCHES.filter((m) => !!results[m.id]).length;
  return { played, total, percent: Math.round((played / total) * 100) };
}

// ─────────────────────────────────────────────────────────────────
// PROYECCIÓN DE BRACKET DE DIECISEISAVOS
//
// Lee los slots de KNOCKOUT_MATCHES (cosas como "1A", "2B", "3ACDH").
// Para slots de tipo "1X" o "2X" (líder o segundo de un grupo concreto),
// reemplaza con el equipo real de la tabla del grupo X.
// Para slots de tipo "3..." (tercero), deja el placeholder y muestra el
// candidato más probable de los terceros clasificados.
// ─────────────────────────────────────────────────────────────────

/**
 * Intenta resolver un slot a un equipo real.
 * Devuelve { type, team?, label, group? }
 *   type: 'first' | 'second' | 'third' | 'unknown'
 *   team: { code, name, flag } si se pudo resolver
 *   label: texto a mostrar como "Líder Grupo A" o similar
 *   group: letra del grupo de origen (si aplica)
 */
function resolveSlot(slot, allStandings, bestThirds) {
  if (!slot || typeof slot !== 'string') {
    return { type: 'unknown', label: '?', team: null };
  }
  // Slot tipo "1A", "2B", etc.
  const simple = slot.match(/^([12])([A-L])$/);
  if (simple) {
    const pos = parseInt(simple[1], 10);
    const group = simple[2];
    const table = allStandings[group];
    if (!table) return { type: 'unknown', label: slot, team: null };
    const teamData = table[pos - 1];
    if (!teamData || teamData.pj === 0) {
      return {
        type: pos === 1 ? 'first' : 'second',
        label: pos === 1 ? `Líder Grupo ${group}` : `2do Grupo ${group}`,
        team: null,
        group,
      };
    }
    return {
      type: pos === 1 ? 'first' : 'second',
      label: pos === 1 ? `Líder Grupo ${group}` : `2do Grupo ${group}`,
      team: {
        code: teamData.code,
        name: teamData.name,
        flag: teamData.flag,
      },
      group,
    };
  }
  // Slot tipo "3ACDH" → tercero de uno de esos grupos según matriz FIFA
  const thirdMatch = slot.match(/^3([A-L]+)$/);
  if (thirdMatch) {
    const candidateGroups = thirdMatch[1].split('');
    // Buscar entre los terceros clasificados si alguno pertenece a estos grupos
    const possibleThirds = bestThirds.filter(
      (t) => t.qualifies && candidateGroups.includes(t.group)
    );
    return {
      type: 'third',
      label: `Mejor 3ro (${candidateGroups.join('/')})`,
      team: null,
      candidateGroups,
      possibleThirds,
    };
  }
  return { type: 'unknown', label: slot, team: null };
}

/**
 * Proyecta el bracket de dieciseisavos.
 * Devuelve los 16 partidos con sus 2 slots resueltos.
 */
export function projectRoundOf32(allStandings, bestThirds) {
  const r32 = KNOCKOUT_MATCHES.filter((m) => m.phase === 'r32');
  return r32.map((m) => ({
    id: m.id,
    date: m.date,
    time: m.time,
    city: m.city,
    homeSlot: m.homeSlot,
    awaySlot: m.awaySlot,
    home: resolveSlot(m.homeSlot, allStandings, bestThirds),
    away: resolveSlot(m.awaySlot, allStandings, bestThirds),
  }));
}
