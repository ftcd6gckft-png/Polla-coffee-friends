import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  subscribeToPoolStats,
  subscribeToOfficialChampion,
} from '../lib/predictionsExtended.js';
import { subscribeToGroupResults } from '../lib/predictions.js';
import { subscribeToKnockoutResults } from '../lib/predictionsExtended.js';
import { subscribeToPoolPayments, setPaymentStatus } from '../lib/payments.js';
import { TEAMS } from '../data/teams.js';
import { useToast } from './Toast.jsx';

const VALOR_INSCRIPCION = 15000;

function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RankingTab({ pollId }) {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [pool, setPool] = useState(null);
  const [payments, setPayments] = useState({});
  const [officialChamp, setOfficialChamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!pollId) return;
    const unsub = onSnapshot(doc(db, 'pools', pollId), (snap) => {
      if (snap.exists()) setPool({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [pollId]);

  useEffect(() => {
    const unsub = subscribeToPoolStats(pollId, (rows) => {
      setStats(rows);
      setLoading(false);
    });
    return unsub;
  }, [pollId]);

  const isAdmin = pool && user && pool.adminUid === user.uid;
  useEffect(() => {
    if (!isAdmin) {
      setPayments({});
      return;
    }
    const unsub = subscribeToPoolPayments(pollId, setPayments);
    return unsub;
  }, [pollId, isAdmin]);

  useEffect(() => {
    const unsub = subscribeToOfficialChampion(setOfficialChamp);
    return unsub;
  }, []);

  useEffect(() => {
    const a = subscribeToGroupResults(() => {});
    const b = subscribeToKnockoutResults(() => {});
    return () => { a(); b(); };
  }, []);

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando ranking…</span>
      </div>
    );
  }

  const paidCount = pool?.paidCount || 0;
  const bolsa = paidCount * VALOR_INSCRIPCION;

  con
