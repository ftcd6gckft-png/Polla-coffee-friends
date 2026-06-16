// ─────────────────────────────────────────────────────────────────
// Suscripción a todas las stats publicadas en una polla
// (lista de miembros con sus displayNames y stats actuales)
// ─────────────────────────────────────────────────────────────────
import { collection as _collectionForStats, onSnapshot as _onSnapshotForStats } from 'firebase/firestore';
import { db as _dbForStats } from '../firebase.js';

export function subscribeToPoolStats(pollId, callback) {
  if (!pollId) {
    callback([]);
    return () => {};
  }
  const colRef = _collectionForStats(_dbForStats, 'pools', pollId, 'stats');
  return _onSnapshotForStats(colRef, (snap) => {
    const rows = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    callback(rows);
  });
}
