// ─────────────────────────────────────────────────────────────────
// Gestión de miembros de una polla (solo admin)
// Sacar un miembro: lo quita del array members + borra sus
// predictions, stats y payments dentro de esa polla.
// ─────────────────────────────────────────────────────────────────
import {
  doc, getDoc, updateDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Saca a un usuario de una polla.
 *
 * Acciones:
 *   1. Borra /pools/{pollId}/predictions/{uid}
 *   2. Borra /pools/{pollId}/stats/{uid}
 *   3. Borra /pools/{pollId}/payments/{uid} (si existía)
 *   4. Recalcula paidCount en el doc de la polla
 *   5. Quita el uid del array members del doc de la polla
 *   6. Quita el pollId del array pools del user (best-effort, puede fallar
 *      por permisos pero no es crítico)
 *
 * Solo el admin de la polla puede hacerlo (validado en reglas).
 */
export async function removeMemberFromPool(pollId, memberUid) {
  if (!pollId || !memberUid) throw new Error('Falta pollId o memberUid');

  // Verificar que el miembro existe en la polla antes de hacer nada
  const poolRef = doc(db, 'pools', pollId);
  const poolSnap = await getDoc(poolRef);
  if (!poolSnap.exists()) throw new Error('La polla no existe');
  const poolData = poolSnap.data();
  const members = poolData.members || [];
  if (!members.includes(memberUid)) {
    throw new Error('Esa persona no es miembro de esta polla');
  }
  if (poolData.adminUid === memberUid) {
    throw new Error('No puedes sacarte a ti mismo como admin');
  }

  // 1, 2, 3 - Borrar sus subdocs
  const errors = [];
  try {
    await deleteDoc(doc(db, 'pools', pollId, 'predictions', memberUid));
  } catch (e) {
    if (e?.code !== 'not-found') errors.push(`predictions: ${e.code}`);
  }
  try {
    await deleteDoc(doc(db, 'pools', pollId, 'stats', memberUid));
  } catch (e) {
    if (e?.code !== 'not-found') errors.push(`stats: ${e.code}`);
  }

  // payments existe solo si lo marcaron alguna vez
  let wasPaid = false;
  try {
    const paySnap = await getDoc(doc(db, 'pools', pollId, 'payments', memberUid));
    if (paySnap.exists()) {
      wasPaid = paySnap.data()?.paid === true;
      await deleteDoc(doc(db, 'pools', pollId, 'payments', memberUid));
    }
  } catch (e) {
    if (e?.code !== 'not-found') errors.push(`payments: ${e.code}`);
  }

  // 4, 5 - Actualizar doc de la polla: quitar de members y ajustar paidCount
  const newPaidCount = wasPaid
    ? Math.max(0, (poolData.paidCount || 0) - 1)
    : (poolData.paidCount || 0);
  const newMemberCount = Math.max(0, members.length - 1);

  await updateDoc(poolRef, {
    members: arrayRemove(memberUid),
    memberCount: newMemberCount,
    paidCount: newPaidCount,
  });

  // 6 - Best-effort: quitar de users/{memberUid}.pools (puede fallar por permisos)
  try {
    await updateDoc(doc(db, 'users', memberUid), {
      pools: arrayRemove(pollId),
    });
  } catch (e) {
    // No crítico - la persona puede limpiarlo cuando abra su app
    console.warn('[removeMember] no se pudo limpiar users.pools:', e?.code);
  }

  if (errors.length > 0) {
    console.warn('[removeMember] algunos pasos fallaron:', errors);
  }

  return { ok: true, errors };
}
