// Capa de acceso a Firestore para esta entrega
// Centraliza las queries para que las páginas no toquen Firestore directo
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  getDocs, serverTimestamp, arrayUnion, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateInviteCode } from './inviteCodes.js';

export const MAX_POOL_MEMBERS = 50;

// ─── USERS ────────────────────────────────────────────────────────

/**
 * Crea o actualiza el documento del usuario en Firestore tras registrarse.
 * Se llama después de auth.createUserWithEmailAndPassword.
 */
export async function ensureUserDoc(uid, { email, displayName }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      displayName: displayName || email.split('@')[0],
      pools: [],
      createdAt: serverTimestamp(),
    });
  }
  return ref;
}

export async function getUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── POOLS ────────────────────────────────────────────────────────

/**
 * Crea una nueva polla. Genera un código único, crea el documento de la polla
 * y un mapeo en inviteCodes/{code} para resolver rápido.
 * Devuelve { id, code }.
 */
export async function createPool({ name, adminUid, adminDisplayName }) {
  if (!name || !name.trim()) throw new Error('El nombre de la polla es obligatorio');
  const cleanName = name.trim().slice(0, 80);

  // Genera código único (reintenta hasta 10 veces si choca)
  let code;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateInviteCode();
    const codeRef = doc(db, 'inviteCodes', candidate);
    const existing = await getDoc(codeRef);
    if (!existing.exists()) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error('No se pudo generar un código único, intenta de nuevo');

  // Documento de la polla
  const pollRef = doc(collection(db, 'pools'));
  await setDoc(pollRef, {
    name: cleanName,
    code,
    adminUid,
    adminDisplayName: adminDisplayName || '',
    members: [adminUid],
    memberCount: 1,
    createdAt: serverTimestamp(),
  });

  // Mapeo código → pollId
  await setDoc(doc(db, 'inviteCodes', code), {
    pollId: pollRef.id,
    createdAt: serverTimestamp(),
  });

  // Asociar al usuario
  await updateDoc(doc(db, 'users', adminUid), {
    pools: arrayUnion(pollRef.id),
  });

  return { id: pollRef.id, code };
}

/**
 * Resuelve un código de invitación a un pollId.
 * Devuelve { pollId, poll } o null si el código no existe.
 */
export async function resolveInviteCode(code) {
  const codeRef = doc(db, 'inviteCodes', code);
  const codeSnap = await getDoc(codeRef);
  if (!codeSnap.exists()) return null;
  const { pollId } = codeSnap.data();
  const pollSnap = await getDoc(doc(db, 'pools', pollId));
  if (!pollSnap.exists()) return null;
  return { pollId, poll: { id: pollSnap.id, ...pollSnap.data() } };
}

/**
 * Une al usuario a una polla por código.
 * Valida que no esté ya, que no exceda el límite de 50.
 * Atomico vía transacción para evitar race conditions cerca del límite.
 */
export async function joinPoolByCode({ code, uid }) {
  const codeRef = doc(db, 'inviteCodes', code);
  const codeSnap = await getDoc(codeRef);
  if (!codeSnap.exists()) throw new Error('Ese código de invitación no existe');
  const { pollId } = codeSnap.data();

  const pollRef = doc(db, 'pools', pollId);

  await runTransaction(db, async (tx) => {
    const pollSnap = await tx.get(pollRef);
    if (!pollSnap.exists()) throw new Error('La polla ya no existe');
    const data = pollSnap.data();
    const members = data.members || [];

    if (members.includes(uid)) {
      // ya es miembro, no hagas nada extra (idempotente)
      return;
    }
    if (members.length >= MAX_POOL_MEMBERS) {
      throw new Error(`Esta polla ya alcanzó el máximo de ${MAX_POOL_MEMBERS} miembros`);
    }

    tx.update(pollRef, {
      members: [...members, uid],
      memberCount: members.length + 1,
    });

    const userRef = doc(db, 'users', uid);
    tx.update(userRef, { pools: arrayUnion(pollId) });
  });

  // Devuelve la polla actualizada
  const updated = await getDoc(pollRef);
  return { id: updated.id, ...updated.data() };
}

/**
 * Obtiene todas las pollas de un usuario (las que tiene en su array `pools`).
 */
export async function getUserPools(uid) {
  const userDoc = await getUserDoc(uid);
  if (!userDoc || !userDoc.pools || userDoc.pools.length === 0) return [];

  // Firestore "in" admite hasta 30 ids; como el límite por polla es 50 y
  // probablemente un usuario tenga muy pocas pollas, esto va bien.
  // Si se llega a superar, hay que hacer chunking.
  const ids = userDoc.pools.slice(0, 30);
  const q = query(collection(db, 'pools'), where('__name__', 'in', ids));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPool(pollId) {
  const snap = await getDoc(doc(db, 'pools', pollId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
