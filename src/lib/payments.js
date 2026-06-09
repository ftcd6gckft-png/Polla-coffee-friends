import {
  doc, setDoc, updateDoc, getDoc, collection, getDocs, onSnapshot, serverTimestamp
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

export async function setPaymentStatus(pollId, userId, paid, markedByUid) {
  const payRef = doc(db, 'pools', pollId, 'payments', userId);
  await setDoc(payRef, {
    paid,
    paidAt: paid ? serverTimestamp() : null,
    markedByUid,
  }, { merge: true });

  try {
    const colRef = collection(db, 'pools', pollId, 'payments');
    const snap = await getDocs(colRef);
    let total = 0;
    snap.docs.forEach((d) => {
      if (d.data()?.paid === true) total += 1;
    });
    const poolRef = doc(db, 'pools', pollId);
    await updateDoc(poolRef, { paidCount: total });
  } catch (e) {
    console.warn('[payments] no se pudo actualizar paidCount', e?.code);
  }
}
