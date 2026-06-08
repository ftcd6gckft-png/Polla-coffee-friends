// ─────────────────────────────────────────────────────────────────
// Estado de pago de cada miembro de una polla.
//
// Estructura:
//   /pools/{pollId}/payments/{userId}
//     paid: boolean
//     paidAt: timestamp (cuando se marcó como pagado)
//     markedByUid: string (uid del admin que lo marcó)
//
// Reglas: solo el admin de la polla puede ESCRIBIR. Todos los miembros LEEN.
// ─────────────────────────────────────────────────────────────────
import {
  doc, setDoc, collection, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

export function subscribeToPoolPayments(pollId, callback) {
  const colRef = collection(db, 'pools', pollId, 'payments');
  return onSnapshot(colRef, (snap) => {
    const result = {};
    snap.docs.forEach((d) => { result[d.id] = d.data(); });
    callback(result);
  });
}

/**
 * Marca o desmarca el pago de un usuario.
 * Solo el admin de la polla puede hacerlo (validado en reglas).
 */
export async function setPaymentStatus(pollId, userId, paid, markedByUid) {
  const ref = doc(db, 'pools', pollId, 'payments', userId);
  await setDoc(ref, {
    paid,
    paidAt: paid ? serverTimestamp() : null,
    markedByUid,
  }, { merge: true });
}
