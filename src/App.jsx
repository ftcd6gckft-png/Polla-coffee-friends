import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FLAG = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Rep. Checa":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia-Herzegovina":"🇧🇦","Catar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EE.UU.":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","Uzbekistán":"🇺🇿","Congo RD":"🇨🇩",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

const MATCHES = [
  {id:1,home:"México",away:"Sudáfrica",date:"2026-06-11T14:00",group:"A"},
  {id:2,home:"Corea del Sur",away:"Rep. Checa",date:"2026-06-11T21:00",group:"A"},
  {id:3,home:"Rep. Checa",away:"Sudáfrica",date:"2026-06-18T11:00",group:"A"},
  {id:4,home:"México",away:"Corea del Sur",date:"2026-06-18T20:00",group:"A"},
  {id:5,home:"Rep. Checa",away:"México",date:"2026-06-24T20:00",group:"A"},
  {id:6,home:"Sudáfrica",away:"Corea del Sur",date:"2026-06-24T20:00",group:"A"},
  {id:7,home:"Canadá",away:"Bosnia-Herzegovina",date:"2026-06-12T14:00",group:"B"},
  {id:8,home:"Catar",away:"Suiza",date:"2026-06-13T14:00",group:"B"},
  {id:9,home:"Suiza",away:"Bosnia-Herzegovina",date:"2026-06-18T14:00",group:"B"},
  {id:10,home:"Canadá",away:"Catar",date:"2026-06-18T17:00",group:"B"},
  {id:11,home:"Suiza",away:"Canadá",date:"2026-06-24T14:00",group:"B"},
  {id:12,home:"Bosnia-Herzegovina",away:"Catar",date:"2026-06-24T14:00",group:"B"},
  {id:13,home:"Brasil",away:"Marruecos",date:"2026-06-13T17:00",group:"C"},
  {id:14,home:"Haití",away:"Escocia",date:"2026-06-13T20:00",group:"C"},
  {id:15,home:"Escocia",away:"Marruecos",date:"2026-06-19T17:00",group:"C"},
  {id:16,home:"Brasil",away:"Haití",date:"2026-06-19T20:00",group:"C"},
  {id:17,home:"Marruecos",away:"Haití",date:"2026-06-24T17:00",group:"C"},
  {id:18,home:"Escocia",away:"Brasil",date:"2026-06-24T17:00",group:"C"},
  {id:19,home:"EE.UU.",away:"Paraguay",date:"2026-06-12T20:00",group:"D"},
  {id:20,home:"Australia",away:"Turquía",date:"2026-06-13T23:00",group:"D"},
  {id:21,home:"EE.UU.",away:"Australia",date:"2026-06-19T14:00",group:"D"},
  {id:22,home:"Turquía",away:"Paraguay",date:"2026-06-19T23:00",group:"D"},
  {id:23,home:"Turquía",away:"EE.UU.",date:"2026-06-25T21:00",group:"D"},
  {id:24,home:"Paraguay",away:"Australia",date:"2026-06-25T21:00",group:"D"},
  {id:25,home:"Alemania",away:"Curazao",date:"2026-06-14T12:00",group:"E"},
  {id:26,home:"Costa de Marfil",away:"Ecuador",date:"2026-06-14T18:00",group:"E"},
  {id:27,home:"Alemania",away:"Costa de Marfil",date:"2026-06-20T15:00",group:"E"},
  {id:28,home:"Ecuador",away:"Curazao",date:"2026-06-20T19:00",group:"E"},
  {id:29,home:"Ecuador",away:"Alemania",date:"2026-06-25T15:00",group:"E"},
  {id:30,home:"Curazao",away:"Costa de Marfil",date:"2026-06-25T15:00",group:"E"},
  {id:31,home:"Países Bajos",away:"Japón",date:"2026-06-14T15:00",group:"F"},
  {id:32,home:"Suecia",away:"Túnez",date:"2026-06-14T21:00",group:"F"},
  {id:33,home:"Países Bajos",away:"Suecia",date:"2026-06-20T12:00",group:"F"},
  {id:34,home:"Túnez",away:"Japón",date:"2026-06-20T23:00",group:"F"},
  {id:35,home:"Túnez",away:"Países Bajos",date:"2026-06-25T18:00",group:"F"},
  {id:36,home:"Japón",away:"Suecia",date:"2026-06-25T18:00",group:"F"},
  {id:37,home:"España",away:"Cabo Verde",date:"2026-06-15T11:00",group:"G"},
  {id:38,home:"Arabia Saudita",away:"Uruguay",date:"2026-06-15T17:00",group:"G"},
  {id:39,home:"España",away:"Arabia Saudita",date:"2026-06-21T11:00",group:"G"},
  {id:40,home:"Uruguay",away:"Cabo Verde",date:"2026-06-21T17:00",group:"G"},
  {id:41,home:"Uruguay",away:"España",date:"2026-06-26T19:00",group:"G"},
  {id:42,home:"Cabo Verde",away:"Arabia Saudita",date:"2026-06-26T19:00",group:"G"},
  {id:43,home:"Bélgica",away:"Egipto",date:"2026-06-15T14:00",group:"H"},
  {id:44,home:"Irán",away:"Nueva Zelanda",date:"2026-06-15T20:00",group:"H"},
  {id:45,home:"Bélgica",away:"Irán",date:"2026-06-21T14:00",group:"H"},
  {id:46,home:"Nueva Zelanda",away:"Egipto",date:"2026-06-21T20:00",group:"H"},
  {id:47,home:"Nueva Zelanda",away:"Bélgica",date:"2026-06-26T22:00",group:"H"},
  {id:48,home:"Egipto",away:"Irán",date:"2026-06-26T22:00",group:"H"},
