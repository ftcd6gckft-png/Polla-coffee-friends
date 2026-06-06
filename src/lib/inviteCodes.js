// Genera códigos de invitación tipo "MUNDIAL-X7K2"
// Sin caracteres ambiguos (0/O, 1/I/L) para evitar typos al teclear

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin I, L, O, 0, 1
const PREFIX = 'MUNDIAL';

export function generateInviteCode() {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${PREFIX}-${suffix}`;
}

// Normaliza un código tecleado por el usuario (mayúsculas, sin espacios)
export function normalizeCode(input) {
  if (!input) return '';
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

// Valida que un código tenga el formato correcto
export function isValidCodeFormat(code) {
  const normalized = normalizeCode(code);
  return /^MUNDIAL-[A-Z2-9]{4}$/.test(normalized);
}
