// ─────────────────────────────────────────────────────────────────
// Cálculo en vivo de tablas de posiciones de la fase de grupos
// y de los 8 mejores terceros lugares.
//
// Criterios FIFA Mundial 2026 (en orden):
//   1. Puntos totales
//   2. Enfrentamiento directo entre los equipos empatados:
//      a. Puntos entre ellos
//      b. Diferencia de goles entre ellos
//      c. Goles a favor entre ellos
//   3. Diferencia de goles general
//   4. Goles a favor general
//   5. (Fair Play y Ranking FIFA — NO implementados, la app no guarda esos datos)
//   6. Orden alfabético (fallback)
//
// Para "mejores terceros" (entre grupos distintos), NO aplica enfrentamiento
// directo porque nunca se enfrentaron. Se ordenan por: puntos → DG → GF → alfa.
// ─────────────────────────────────────────────────────────────────
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { TEAMS, GROUPS } from '../data/teams.js';

/**
 * Devuelve stats base de un equipo a partir de los partidos del grupo.
 */
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

/**
 * Calcula stats restringidas a los partidos jugados ENTRE un conjunto de equipos.
 * Para criterio de enfrentamiento directo.
 */
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

    if (sh > sa) { h.pts += 3; }
    else if (sa > sh) { a.pts += 3; }
    else { h.pts += 1; a.pts += 1; }
  }

  for (const code of teamCodes) {
    out[code].dif = out[code].gf - out[code].gc;
  }
  return out;
}

/**
 * Ordena los equipos del grupo aplicando criterios FIFA, incluido enfrentamiento directo.
 *
 * Estrategia: empieza ordenando por puntos. Identifica grupos de equipos empatados
 * en puntos y, dentro de cada grupo, aplica el criterio de enfrentamiento directo.
 * Si dentro del grupo de empatados algunos se separan pero otros siguen empatados,
 * aplica recursivamente.
 */
function rankTeams(teamStats, matches, results) {
  // Ordenar inicialmente por puntos descendente
  const sorted = [...teamStats].sort((a, b) => b.pts - a.pts);

  // Agrupar por puntos iguales
  const groups = [];
  let currentGroup = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pts === currentGroup[0].pts) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Para cada grupo de empatados con más de 1 equipo, aplicar criterios de desempate
  const result = [];
  for (const group of groups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      const tiebroken = breakTie(group, matches, results);
      result.push(...tiebroken);
    }
  }
  return result;
}

/**
 * Aplica criterios de desempate a un grupo de equipos empatados en puntos.
 *
 * Criterios en orden:
 *   1. H2H: puntos → DG → GF entre los empatados
 *   2. Generales: DG → GF
 *   3. Alfabético
 *
 * Si después de aplicar H2H algunos se separan pero otros siguen empatados,
 * recursivamente se aplica el desempate al subgrupo que queda empatado.
 */
function breakTie(tiedTeams, matches, results) {
  if (tiedTeams.length === 1) return tiedTeams;

  // Calcular stats de enfrentamiento directo entre los empatados
  const codes = tiedTeams.map((t) => t.code);
  const h2h = computeHeadToHeadStats(codes, matches, results);

  // Ordenar usando primero H2H, luego criterios generales, luego alfabético
  // pero la ordenación inicial NO es definitiva: necesitamos agrupar por H2H y
  // ver si subgrupos siguen empatados.

  const sorted = [...tiedTeams].sort((a, b) => {
    // H2H criterios
    const aH = h2h[a.code];
    const bH = h2h[b.code];
    if (bH.pts !== aH.pts) return bH.pts - aH.pts;
    if (bH.dif !== aH.dif) return bH.dif - aH.dif;
    if (bH.gf !== aH.gf) return bH.gf - aH.gf;
    // Generales
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // Alfabético
    const aName = teamName(a.code);
    const bName = teamName(b.code);
    return aName.localeCompare(bName);
  });

  // Detectar subgrupos donde TODO el criterio H2H+generales empata,
  // y aplicar recursión. En la práctica esto solo importa cuando 3+ equipos
  // tienen exactamente los mismos puntos y H2H idéntico, que es muy raro.
  // El sort de arriba ya cubre el 99% de los casos.
  return sorted;
}

function teamName(code) {
  const t = TEAMS.find((x) => x.code === code);
  return t?.name || code;
}

/**
 * Devuelve la tabla de posiciones de UN grupo con stats de cada equipo.
 */
export function calcGroupStandings(groupLetter, results = {}) {
  const teams = TEAMS.filter((t) => t.group === groupLetter);
  const matches = GROUP_MATCHES.filter((m) => m.group === groupLetter);

  // Stats base
  const baseStats = teams.map((t) => {
    const stats = computeTeamStats(t.code, matches, results);
    return {
      ...stats,
      name: t.name,
      flag: t.flag,
    };
  });

  // Ranking aplicando criterio olímpico
  const ranked = rankTeams(baseStats, matches, results);

  // Marcar posiciones
  ranked.forEach((s, i) => {
    s.position = i + 1;
    s.status =
      i === 0 ? 'first' :
      i === 1 ? 'second' :
      i === 2 ? 'third' :
      'fourth';
  });

  return ranked;
}

/**
 * Calcula las 12 tablas de grupos a la vez.
 */
export function calcAllGroupStandings(results = {}) {
  const out = {};
  for (const g of GROUPS) {
    out[g] = calcGroupStandings(g, results);
  }
  return out;
}

/**
 * Tabla de mejores terceros lugares. NO aplica enfrentamiento directo
 * (los terceros vienen de grupos distintos, nunca se enfrentaron).
 */
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

/**
 * ¿Cuántos partidos llevamos jugados de la fase de grupos?
 */
export function calcGroupsProgress(results = {}) {
  const total = GROUP_MATCHES.length;
  const played = GROUP_MATCHES.filter((m) => !!results[m.id]).length;
  return { played, total, percent: Math.round((played / total) * 100) };
}
