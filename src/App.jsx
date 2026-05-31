import { useState, useEffect, useCallback } from "react";

// ── STORAGE HELPERS ──────────────────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const DAY_TYPES = {
  work:       { label: "Pracujący",    emoji: "💼", color: "#6b7280", accent: "#374151" },
  training:   { label: "Treningowy",  emoji: "💪", color: "#ef4444", accent: "#7f1d1d" },
  recovery:   { label: "Regeneracja", emoji: "🧘", color: "#22c55e", accent: "#14532d" },
  push:       { label: "PUSH",        emoji: "🔴", color: "#ef4444", accent: "#7f1d1d" },
  pull:       { label: "PULL",        emoji: "🔵", color: "#3b82f6", accent: "#1e3a5f" },
  fbw:        { label: "FBW",         emoji: "🟢", color: "#22c55e", accent: "#14532d" },
  cardio:     { label: "Cardio",      emoji: "🟡", color: "#eab308", accent: "#713f12" },
  rest:       { label: "Odpoczynek",  emoji: "⚪", color: "#9ca3af", accent: "#374151" },
};

const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
                   "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL   = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];

// ── SEED DATA from PDFs ──────────────────────────────────────────────────────
const SEED_HISTORY = (() => {
  const entries = [
    // PUSH/PULL – Siłownia.pdf (2025)
    { date:"2025-09-21", type:"pull", exercise:"Wyciąg góra szeroko",  weight:50 },
    { date:"2025-09-21", type:"pull", exercise:"Wyciąg góra wąsko",    weight:50 },
    { date:"2025-09-21", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:50 },
    { date:"2025-09-21", type:"pull", exercise:"Wiosłowanie",          weight:20 },
    { date:"2025-09-21", type:"pull", exercise:"Martwy ciąg",          weight:20 },
    { date:"2025-09-21", type:"pull", exercise:"Biceps skos",          weight:10 },
    { date:"2025-09-21", type:"pull", exercise:"Młotki",               weight:10 },

    { date:"2025-09-22", type:"push", exercise:"Atlas klatka",         weight:100 },
    { date:"2025-09-22", type:"push", exercise:"Atlas rozpiętki",      weight:30 },
    { date:"2025-09-22", type:"push", exercise:"Ławka skośnie hantle", weight:10 },
    { date:"2025-09-22", type:"push", exercise:"Maszyna skos",         weight:15 },
    { date:"2025-09-22", type:"push", exercise:"Ławka płasko",         weight:10 },
    { date:"2025-09-22", type:"push", exercise:"Wznosy bokiem",        weight:7.5},
    { date:"2025-09-22", type:"push", exercise:"Wznosy nad głowę",     weight:12.5},
    { date:"2025-09-22", type:"push", exercise:"Ławeczka triceps",     weight:12.5},
    { date:"2025-09-22", type:"push", exercise:"Wyciąg triceps",       weight:17.5},

    { date:"2025-09-26", type:"pull", exercise:"Wyciąg góra szeroko",  weight:55 },
    { date:"2025-09-26", type:"pull", exercise:"Wyciąg góra wąsko",    weight:55 },
    { date:"2025-09-26", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:55 },
    { date:"2025-09-26", type:"pull", exercise:"Biceps skos",          weight:10 },
    { date:"2025-09-26", type:"pull", exercise:"Modlitewnik",          weight:7.5},
    { date:"2025-09-26", type:"pull", exercise:"Młotki",               weight:5  },

    { date:"2025-09-29", type:"push", exercise:"Atlas rozpiętki",      weight:40 },
    { date:"2025-09-29", type:"push", exercise:"Ławka skośnie hantle", weight:15 },
    { date:"2025-09-29", type:"push", exercise:"Maszyna skos",         weight:15 },
    { date:"2025-09-29", type:"push", exercise:"Ławka płasko",         weight:12.5},
    { date:"2025-09-29", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-09-29", type:"push", exercise:"Wznosy nad głowę",     weight:15 },
    { date:"2025-09-29", type:"push", exercise:"Rozpiętki tył",        weight:20 },
    { date:"2025-09-29", type:"push", exercise:"Ławeczka triceps",     weight:10 },
    { date:"2025-09-29", type:"push", exercise:"Wyciąg triceps",       weight:15 },

    { date:"2025-10-01", type:"pull", exercise:"Wyciąg góra szeroko",  weight:55 },
    { date:"2025-10-01", type:"pull", exercise:"Wyciąg góra wąsko",    weight:55 },
    { date:"2025-10-01", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:55 },
    { date:"2025-10-01", type:"pull", exercise:"Biceps skos",          weight:10 },
    { date:"2025-10-01", type:"pull", exercise:"Modlitewnik",          weight:7.5},
    { date:"2025-10-01", type:"pull", exercise:"Młotki",               weight:10 },

    { date:"2025-10-03", type:"push", exercise:"Ławka skośnie hantle", weight:17.5},
    { date:"2025-10-03", type:"push", exercise:"Maszyna skos",         weight:15 },
    { date:"2025-10-03", type:"push", exercise:"Ławka płasko",         weight:20 },
    { date:"2025-10-03", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-10-03", type:"push", exercise:"Wznosy nad głowę",     weight:12.5},
    { date:"2025-10-03", type:"push", exercise:"Ławeczka triceps",     weight:10 },
    { date:"2025-10-03", type:"push", exercise:"Wyciąg triceps",       weight:20 },
    { date:"2025-10-03", type:"push", exercise:"Dipy",                 weight:40 },

    { date:"2025-10-07", type:"pull", exercise:"Wyciąg góra szeroko",  weight:55 },
    { date:"2025-10-07", type:"pull", exercise:"Wyciąg góra wąsko",    weight:55 },
    { date:"2025-10-07", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:55 },
    { date:"2025-10-07", type:"pull", exercise:"Narciaż",              weight:20 },
    { date:"2025-10-07", type:"pull", exercise:"Wiosłowanie",          weight:10 },
    { date:"2025-10-07", type:"pull", exercise:"Biceps skos",          weight:12 },
    { date:"2025-10-07", type:"pull", exercise:"Modlitewnik",          weight:10 },
    { date:"2025-10-07", type:"pull", exercise:"Młotki",               weight:10 },

    { date:"2025-10-08", type:"push", exercise:"Atlas rozpiętki",      weight:70 },
    { date:"2025-10-08", type:"push", exercise:"Ławka skośnie hantle", weight:17.5},
    { date:"2025-10-08", type:"push", exercise:"Maszyna skos",         weight:12.5},
    { date:"2025-10-08", type:"push", exercise:"Ławka płasko",         weight:21 },
    { date:"2025-10-08", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-10-08", type:"push", exercise:"Wznosy nad głowę",     weight:15 },
    { date:"2025-10-08", type:"push", exercise:"Rozpiętki tył",        weight:30 },

    { date:"2025-10-11", type:"pull", exercise:"Wyciąg góra szeroko",  weight:60 },
    { date:"2025-10-11", type:"pull", exercise:"Wyciąg góra wąsko",    weight:60 },
    { date:"2025-10-11", type:"pull", exercise:"Wiosłowanie",          weight:20 },
    { date:"2025-10-11", type:"pull", exercise:"Martwy ciąg",          weight:20 },
    { date:"2025-10-11", type:"pull", exercise:"Biceps skos",          weight:12.5},
    { date:"2025-10-11", type:"pull", exercise:"Modlitewnik",          weight:10 },
    { date:"2025-10-11", type:"pull", exercise:"Młotki",               weight:12.5},

    { date:"2025-10-15", type:"push", exercise:"Ławka skośnie hantle", weight:17.5},
    { date:"2025-10-15", type:"push", exercise:"Ławka płasko",         weight:25 },
    { date:"2025-10-15", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-10-15", type:"push", exercise:"Wznosy nad głowę",     weight:15 },
    { date:"2025-10-15", type:"push", exercise:"Wyciąg triceps",       weight:25 },

    { date:"2025-10-16", type:"pull", exercise:"Wyciąg góra szeroko",  weight:60 },
    { date:"2025-10-16", type:"pull", exercise:"Wyciąg góra wąsko",    weight:60 },
    { date:"2025-10-16", type:"pull", exercise:"Narciaż",              weight:22 },
    { date:"2025-10-16", type:"pull", exercise:"Wiosłowanie",          weight:20 },
    { date:"2025-10-16", type:"pull", exercise:"Biceps skos",          weight:12.5},
    { date:"2025-10-16", type:"pull", exercise:"Modlitewnik",          weight:10 },
    { date:"2025-10-16", type:"pull", exercise:"Młotki",               weight:10 },

    { date:"2025-10-18", type:"push", exercise:"Atlas klatka",         weight:100 },
    { date:"2025-10-18", type:"push", exercise:"Ławka skośnie hantle", weight:17.5},
    { date:"2025-10-18", type:"push", exercise:"Ławka płasko",         weight:21 },
    { date:"2025-10-18", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-10-18", type:"push", exercise:"Wznosy nad głowę",     weight:15 },

    { date:"2025-10-24", type:"pull", exercise:"Wyciąg góra szeroko",  weight:65 },
    { date:"2025-10-24", type:"pull", exercise:"Wyciąg góra wąsko",    weight:65 },
    { date:"2025-10-24", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:60 },
    { date:"2025-10-24", type:"pull", exercise:"Biceps skos",          weight:12.5},
    { date:"2025-10-24", type:"pull", exercise:"Modlitewnik",          weight:12.5},
    { date:"2025-10-24", type:"pull", exercise:"Młotki",               weight:10 },

    { date:"2025-10-25", type:"push", exercise:"Atlas rozpiętki",      weight:55 },
    { date:"2025-10-25", type:"push", exercise:"Ławka skośnie hantle", weight:20 },
    { date:"2025-10-25", type:"push", exercise:"Ławka płasko",         weight:20 },
    { date:"2025-10-25", type:"push", exercise:"Wznosy bokiem",        weight:10 },
    { date:"2025-10-25", type:"push", exercise:"Wznosy nad głowę",     weight:15 },
    { date:"2025-10-25", type:"push", exercise:"Ławeczka triceps",     weight:25 },
    { date:"2025-10-25", type:"push", exercise:"Wyciąg triceps",       weight:25 },

    { date:"2025-10-28", type:"pull", exercise:"Wyciąg góra szeroko",  weight:60 },
    { date:"2025-10-28", type:"pull", exercise:"Wyciąg góra wąsko",    weight:60 },
    { date:"2025-10-28", type:"pull", exercise:"Wyciąg nisko wąsko",   weight:65 },
    { date:"2025-10-28", type:"pull", exercise:"Narciaż",              weight:20 },
    { date:"2025-10-28", type:"pull", exercise:"Biceps skos",          weight:12.5},
    { date:"2025-10-28", type:"pull", exercise:"Modlitewnik",          weight:12.5},
    { date:"2025-10-28", type:"pull", exercise:"Młotki",               weight:10 },

    // FBW – Fbw.pdf (2026)
    { date:"2026-03-26", type:"fbw", exercise:"Rozpiętki",             weight:55 },
    { date:"2026-03-26", type:"fbw", exercise:"Suwnica",               weight:150},
    { date:"2026-03-26", type:"fbw", exercise:"Płaska",                weight:30 },
    { date:"2026-03-26", type:"fbw", exercise:"Skos",                  weight:25 },
    { date:"2026-03-26", type:"fbw", exercise:"Barki góra",            weight:22 },
    { date:"2026-03-26", type:"fbw", exercise:"Barki bok",             weight:10 },
    { date:"2026-03-26", type:"fbw", exercise:"Ściąganie góra szeroko",weight:75 },
    { date:"2026-03-26", type:"fbw", exercise:"Ściąganie góra wąsko",  weight:75 },
    { date:"2026-03-26", type:"fbw", exercise:"Ściąganie dół wąsko",   weight:80 },
    { date:"2026-03-26", type:"fbw", exercise:"Narciaż",               weight:30 },
    { date:"2026-03-26", type:"fbw", exercise:"Biceps skos",           weight:20 },
    { date:"2026-03-26", type:"fbw", exercise:"Biceps modlitewnik",    weight:15 },
    { date:"2026-03-26", type:"fbw", exercise:"Młotki",                weight:15 },
    { date:"2026-03-26", type:"fbw", exercise:"Triceps góra",          weight:27 },
    { date:"2026-03-26", type:"fbw", exercise:"Triceps dół",           weight:27 },

    { date:"2026-04-21", type:"fbw", exercise:"Rozpiętki",             weight:65 },
    { date:"2026-04-21", type:"fbw", exercise:"Suwnica",               weight:170},
    { date:"2026-04-21", type:"fbw", exercise:"Płaska",                weight:30 },
    { date:"2026-04-21", type:"fbw", exercise:"Skos",                  weight:27 },
    { date:"2026-04-21", type:"fbw", exercise:"Barki góra",            weight:22 },
    { date:"2026-04-21", type:"fbw", exercise:"Barki bok",             weight:10 },
    { date:"2026-04-21", type:"fbw", exercise:"Ściąganie góra szeroko",weight:75 },
    { date:"2026-04-21", type:"fbw", exercise:"Ściąganie góra wąsko",  weight:70 },
    { date:"2026-04-21", type:"fbw", exercise:"Ściąganie dół wąsko",   weight:80 },
    { date:"2026-04-21", type:"fbw", exercise:"Biceps skos",           weight:17 },
    { date:"2026-04-21", type:"fbw", exercise:"Triceps dół",           weight:35 },

    { date:"2026-05-12", type:"fbw", exercise:"Rozpiętki",             weight:65 },
    { date:"2026-05-12", type:"fbw", exercise:"Suwnica",               weight:180},
    { date:"2026-05-12", type:"fbw", exercise:"Płaska",                weight:30 },
    { date:"2026-05-12", type:"fbw", exercise:"Skos",                  weight:27 },
    { date:"2026-05-12", type:"fbw", exercise:"Barki góra",            weight:22 },
    { date:"2026-05-12", type:"fbw", exercise:"Ściąganie góra szeroko",weight:80 },
    { date:"2026-05-12", type:"fbw", exercise:"Ściąganie góra wąsko",  weight:70 },
    { date:"2026-05-12", type:"fbw", exercise:"Ściąganie dół wąsko",   weight:80 },
    { date:"2026-05-12", type:"fbw", exercise:"Biceps skos",           weight:17 },
    { date:"2026-05-12", type:"fbw", exercise:"Triceps dół",           weight:30 },
    { date:"2026-05-12", type:"fbw", exercise:"Młotki",                weight:12 },

    { date:"2026-05-19", type:"fbw", exercise:"Rozpiętki",             weight:60 },
    { date:"2026-05-19", type:"fbw", exercise:"Suwnica",               weight:170},
    { date:"2026-05-19", type:"fbw", exercise:"Płaska",                weight:30 },
    { date:"2026-05-19", type:"fbw", exercise:"Skos",                  weight:27 },
    { date:"2026-05-19", type:"fbw", exercise:"Barki góra",            weight:22 },
    { date:"2026-05-19", type:"fbw", exercise:"Barki bok",             weight:7  },
    { date:"2026-05-19", type:"fbw", exercise:"Ściąganie góra szeroko",weight:75 },
    { date:"2026-05-19", type:"fbw", exercise:"Ściąganie góra wąsko",  weight:75 },
    { date:"2026-05-19", type:"fbw", exercise:"Triceps dół",           weight:30 },

    { date:"2026-05-24", type:"fbw", exercise:"Rozpiętki",             weight:55 },
    { date:"2026-05-24", type:"fbw", exercise:"Suwnica",               weight:180},
    { date:"2026-05-24", type:"fbw", exercise:"Płaska",                weight:35 },
    { date:"2026-05-24", type:"fbw", exercise:"Skos",                  weight:25 },
    { date:"2026-05-24", type:"fbw", exercise:"Barki góra",            weight:20 },
    { date:"2026-05-24", type:"fbw", exercise:"Barki bok",             weight:7  },
    { date:"2026-05-24", type:"fbw", exercise:"Bark tył",              weight:5  },
    { date:"2026-05-24", type:"fbw", exercise:"Ściąganie góra szeroko",weight:75 },
    { date:"2026-05-24", type:"fbw", exercise:"Ściąganie góra wąsko",  weight:75 },
    { date:"2026-05-24", type:"fbw", exercise:"Ściąganie dół wąsko",   weight:75 },
    { date:"2026-05-24", type:"fbw", exercise:"Narciaż",               weight:30 },
    { date:"2026-05-24", type:"fbw", exercise:"Biceps skos",           weight:20 },
    { date:"2026-05-24", type:"fbw", exercise:"Młotki",                weight:15 },
    { date:"2026-05-24", type:"fbw", exercise:"Triceps dół",           weight:30 },
  ];
  return entries;
})();

// ── EXERCISES CONFIG ─────────────────────────────────────────────────────────
const EXERCISES = {
  push: [
    { id:"atlas_klatka",   name:"Atlas klatka",         muscle:"klata"   },
    { id:"atlas_rozpietki",name:"Atlas rozpiętki",      muscle:"klata"   },
    { id:"lawka_skos",     name:"Ławka skośnie hantle", muscle:"klata"   },
    { id:"maszyna_skos",   name:"Maszyna skos",         muscle:"klata"   },
    { id:"lawka_plaska",   name:"Ławka płasko",         muscle:"klata"   },
    { id:"brama",          name:"Brama",                muscle:"klata"   },
    { id:"dipy",           name:"Dipy",                 muscle:"klata"   },
    { id:"wznosy_bok",     name:"Wznosy bokiem",        muscle:"barki"   },
    { id:"wznosy_gora",    name:"Wznosy nad głowę",     muscle:"barki"   },
    { id:"rozpietki_tyl",  name:"Rozpiętki tył",        muscle:"barki"   },
    { id:"laweczka_tri",   name:"Ławeczka triceps",     muscle:"triceps" },
    { id:"wyciag_tri",     name:"Wyciąg triceps",       muscle:"triceps" },
  ],
  pull: [
    { id:"wyciag_szeroko", name:"Wyciąg góra szeroko",  muscle:"plecy"   },
    { id:"wyciag_wasko",   name:"Wyciąg góra wąsko",    muscle:"plecy"   },
    { id:"wyciag_dol_s",   name:"Wyciąg nisko szeroko", muscle:"plecy"   },
    { id:"wyciag_dol_w",   name:"Wyciąg nisko wąsko",   muscle:"plecy"   },
    { id:"narciaz",        name:"Narciaż",              muscle:"plecy"   },
    { id:"wioslowanie",    name:"Wiosłowanie",          muscle:"plecy"   },
    { id:"martwy",         name:"Martwy ciąg",          muscle:"plecy"   },
    { id:"biceps_skos",    name:"Biceps skos",          muscle:"biceps"  },
    { id:"modlitewnik",    name:"Modlitewnik",          muscle:"biceps"  },
    { id:"mlotki",         name:"Młotki",               muscle:"biceps"  },
  ],
  fbw: [
    { id:"rozpietki_fbw",  name:"Rozpiętki",            muscle:"klata"   },
    { id:"suwnica",        name:"Suwnica",              muscle:"klata"   },
    { id:"plaska_fbw",     name:"Płaska",               muscle:"klata"   },
    { id:"skos_fbw",       name:"Skos",                 muscle:"klata"   },
    { id:"barki_gora",     name:"Barki góra",           muscle:"barki"   },
    { id:"barki_bok",      name:"Barki bok",            muscle:"barki"   },
    { id:"bark_tyl",       name:"Bark tył",             muscle:"barki"   },
    { id:"sciag_g_s",      name:"Ściąganie góra szeroko",muscle:"plecy"  },
    { id:"sciag_g_w",      name:"Ściąganie góra wąsko", muscle:"plecy"   },
    { id:"sciag_d_w",      name:"Ściąganie dół wąsko",  muscle:"plecy"   },
    { id:"narciaz_fbw",    name:"Narciaż",              muscle:"plecy"   },
    { id:"biceps_skos_f",  name:"Biceps skos",          muscle:"biceps"  },
    { id:"biceps_mod_f",   name:"Biceps modlitewnik",   muscle:"biceps"  },
    { id:"mlotki_fbw",     name:"Młotki",               muscle:"biceps"  },
    { id:"tri_gora",       name:"Triceps góra",         muscle:"triceps" },
    { id:"tri_dol",        name:"Triceps dół",          muscle:"triceps" },
  ],
};

// ── UTILS ────────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);
const fmt = (d) => {
  const [y,m,day] = d.split("-");
  return `${day}.${m}.${y}`;
};
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const firstDayOfMonth = (y,m) => {
  let d = new Date(y,m,1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
};

// ── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=20 }) => {
  const icons = {
    home:     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    dumbbell: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 12h12"/></svg>,
    food:     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    calendar: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chart:    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    chevronL: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronR: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
    fire:     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-5-5-10-5-10z"/></svg>,
    steps:    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 5l2 2-8 8-2-2 8-8z"/><path d="M9 11l2 2-3 3-2-2 3-3z"/></svg>,
    check:    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    plus:     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    clock:    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    trophy:   <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H2V4h4M18 9h4V4h-4M12 17v4M8 21h8"/><path d="M6 4h12v8a6 6 0 01-12 0V4z"/></svg>,
  };
  return icons[name] || null;
};

// ── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --bg: #080808; --card: #111111; --card2: #1a1a1a; --border: #222222;
    --text: #f0f0f0; --muted: #6b7280; --muted2: #9ca3af;
    --push: #ef4444; --pull: #3b82f6; --fbw: #22c55e; --cardio: #eab308;
    --nav-h: 68px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow: hidden; }
  .app { display: flex; flex-direction: column; height: 100dvh; max-width: 430px; margin: 0 auto; position: relative; }
  .screen { flex: 1; overflow-y: auto; padding: 0 0 var(--nav-h); }
  .screen::-webkit-scrollbar { display: none; }

  /* NAV */
  .nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
    height: var(--nav-h); background: #0d0d0d; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-around; padding: 0 8px 8px; z-index:100; }
  .nav-btn { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 12px;
    border:none; background:none; color:var(--muted); cursor:pointer; transition:color .2s; border-radius:12px; }
  .nav-btn.active { color: var(--text); }
  .nav-btn span { font-size: 10px; font-weight:500; letter-spacing:.3px; }
  .nav-btn.active .nav-dot { background: var(--push); }

  /* HEADER */
  .page-header { padding: 52px 20px 16px; }
  .page-title { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:2px; line-height:1; }
  .page-sub { color:var(--muted); font-size:13px; margin-top:4px; }

  /* CARDS */
  .card { background: var(--card); border: 1px solid var(--border); border-radius:16px; padding:16px; margin:0 16px 12px; }
  .card-sm { background: var(--card2); border: 1px solid var(--border); border-radius:12px; padding:12px; }
  .card-title { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:12px; font-weight:600; }

  /* CHECKIN */
  .checkin-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
  .checkin-btn { background:var(--card2); border:1.5px solid var(--border); border-radius:12px; padding:12px 6px;
    display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; transition:all .2s; }
  .checkin-btn.active { border-color: currentColor; }
  .checkin-btn .emoji { font-size:22px; }
  .checkin-btn .lbl { font-size:11px; font-weight:600; letter-spacing:.5px; }

  /* STATS ROW */
  .stats-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 12px; }
  .stat-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px; }
  .stat-val { font-family:'Bebas Neue',sans-serif; font-size:30px; letter-spacing:1px; }
  .stat-label { font-size:11px; color:var(--muted); margin-top:2px; }
  .stat-icon { margin-bottom:6px; }

  /* STREAK */
  .streak-bar { display:flex; gap:5px; margin-top:10px; }
  .streak-day { flex:1; height:4px; border-radius:2px; background:var(--border); }
  .streak-day.done { background: var(--push); }

  /* CALENDAR */
  .cal-header { display:flex; align-items:center; justify-content:space-between; padding:0 4px; margin-bottom:16px; }
  .cal-month { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:2px; }
  .cal-nav { background:var(--card2); border:1px solid var(--border); border-radius:8px; width:36px; height:36px;
    display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text); }
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .cal-dow { text-align:center; font-size:10px; color:var(--muted); font-weight:600; padding:4px 0 8px; letter-spacing:.5px; }
  .cal-cell { aspect-ratio:1; border-radius:8px; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; position:relative; }
  .cal-cell.empty { background:transparent; cursor:default; }
  .cal-cell.today-cell { box-shadow:0 0 0 1.5px var(--text); }
  .cal-cell.has-dot::after { content:''; position:absolute; bottom:3px; left:50%; transform:translateX(-50%);
    width:4px; height:4px; border-radius:50%; background:inherit; filter:brightness(1.5); }

  /* DAY DETAIL MODAL */
  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:200; display:flex; align-items:flex-end; backdrop-filter:blur(4px); }
  .modal { background:var(--card); border-radius:20px 20px 0 0; padding:20px; width:100%; max-height:70vh; overflow-y:auto; }
  .modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 16px; }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:1.5px; margin-bottom:12px; }
  .ex-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); }
  .ex-row:last-child { border:none; }
  .ex-name { font-size:13px; color:var(--muted2); }
  .ex-weight { font-family:'Bebas Neue',sans-serif; font-size:20px; }

  /* EVENING LOG */
  .log-row { display:flex; align-items:center; gap:12px; }
  .log-input { flex:1; background:var(--card2); border:1px solid var(--border); border-radius:10px;
    padding:10px 14px; color:var(--text); font-family:'DM Sans',sans-serif; font-size:16px; text-align:right;
    outline:none; transition:border-color .2s; }
  .log-input:focus { border-color: var(--muted2); }
  .log-label { font-size:13px; color:var(--muted2); width:90px; }
  .btn { border:none; border-radius:12px; padding:12px 20px; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; transition:all .15s; }
  .btn-primary { background:var(--push); color:#fff; width:100%; margin-top:10px; }
  .btn-primary:active { transform:scale(.97); }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted2); }

  /* LAST WORKOUT */
  .last-workout { display:flex; align-items:center; gap:12px; }
  .type-badge { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .tag { display:inline-block; font-size:10px; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
    padding:3px 8px; border-radius:6px; }

  /* SECTION LABEL */
  .section-label { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); font-weight:600;
    padding:0 20px; margin:16px 0 8px; }

  /* TRAINING PLACEHOLDER */
  .type-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 12px; }
  .type-card { background:var(--card); border:1.5px solid var(--border); border-radius:16px; padding:20px 16px;
    cursor:pointer; transition:all .2s; display:flex; flex-direction:column; gap:6px; }
  .type-card:active { transform:scale(.97); }
  .type-card .type-emoji { font-size:28px; }
  .type-card .type-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1.5px; }
  .type-card .type-desc { font-size:11px; color:var(--muted); }

  /* EVENING INPUT */
  .evening-saved { display:flex; align-items:center; gap:10px; padding:4px 0; }
  .ev-val { font-family:'Bebas Neue',sans-serif; font-size:26px; }
  .ev-unit { font-size:12px; color:var(--muted); }

  /* ANIMATIONS */
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  .animate-up { animation: slideUp .3s ease; }
`;

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("today");
  const [dayLogs, setDayLogs]     = useState(() => storage.get("dayLogs", {}));
  const [history, setHistory]     = useState(() => {
    const saved = storage.get("gymHistory", null);
    if (saved) return saved;
    // first run – seed from PDFs
    storage.set("gymHistory", SEED_HISTORY);
    return SEED_HISTORY;
  });
  const [calDate, setCalDate]     = useState(() => { const n=new Date(); return {y:n.getFullYear(),m:n.getMonth()}; });
  const [selDay,  setSelDay]      = useState(null);

  const todayStr = today();

  // persist dayLogs
  useEffect(() => { storage.set("dayLogs", dayLogs); }, [dayLogs]);
  useEffect(() => { storage.set("gymHistory", history); }, [history]);

  const saveDay = useCallback((data) => {
    setDayLogs(prev => ({ ...prev, [todayStr]: { ...prev[todayStr], ...data } }));
  }, [todayStr]);

  // compute streak
  const streak = (() => {
    let s = 0, d = new Date();
    for (let i=0;i<14;i++) {
      const ds = d.toISOString().slice(0,10);
      const log = dayLogs[ds];
      if (log && (log.type === "training" || log.type === "cardio" || log.type === "push" || log.type === "pull" || log.type === "fbw")) s++;
      d.setDate(d.getDate()-1);
    }
    return s;
  })();

  // get last 7 days for streak bar
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    const ds=d.toISOString().slice(0,10);
    const log=dayLogs[ds];
    return log && (log.type==="training"||log.type==="push"||log.type==="pull"||log.type==="fbw"||log.type==="cardio");
  });

  const todayLog = dayLogs[todayStr] || {};

  // gather workout dates for calendar
  const workoutDates = {};
  history.forEach(e => {
    if (!workoutDates[e.date]) workoutDates[e.date] = e.type;
  });
  Object.entries(dayLogs).forEach(([d,l]) => {
    if (l.type && !workoutDates[d]) workoutDates[d] = l.type;
    if (l.workoutType && !workoutDates[d]) workoutDates[d] = l.workoutType;
  });

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="screen">
          {tab === "today"    && <ScreenToday todayLog={todayLog} saveDay={saveDay} streak={streak} last7={last7} history={history} dayLogs={dayLogs} todayStr={todayStr} />}
          {tab === "training" && <ScreenTraining history={history} setHistory={setHistory} saveDay={saveDay} todayStr={todayStr} dayLogs={dayLogs} />}
          {tab === "diet"     && <ScreenDiet todayLog={todayLog} saveDay={saveDay} />}
          {tab === "calendar" && <ScreenCalendar calDate={calDate} setCalDate={setCalDate} workoutDates={workoutDates} dayLogs={dayLogs} history={history} selDay={selDay} setSelDay={setSelDay} />}
          {tab === "stats"    && <ScreenStats history={history} dayLogs={dayLogs} />}
        </div>

        <nav className="nav">
          {[
            {id:"today",    icon:"home",     label:"Dziś"},
            {id:"training", icon:"dumbbell", label:"Trening"},
            {id:"diet",     icon:"food",     label:"Dieta"},
            {id:"calendar", icon:"calendar", label:"Kalendarz"},
            {id:"stats",    icon:"chart",    label:"Statystyki"},
          ].map(n => (
            <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
              <Icon name={n.icon} size={22}/>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// ── SCREEN: DZIŚ ─────────────────────────────────────────────────────────────
function ScreenToday({ todayLog, saveDay, streak, last7, history, dayLogs, todayStr }) {
  const [steps, setSteps]     = useState(todayLog.steps || "");
  const [calories, setCalories] = useState(todayLog.calories || "");
  const [saved, setSaved]     = useState(!!(todayLog.steps || todayLog.calories));

  const typeColors = { work:"#6b7280", training:"#ef4444", recovery:"#22c55e", push:"#ef4444", pull:"#3b82f6", fbw:"#22c55e", cardio:"#eab308" };

  // last workout info
  const lastWorkout = [...history].reverse().find(e=>e.date < todayStr) || null;
  const lastWorkoutDate = lastWorkout ? lastWorkout.date : null;
  const lastWorkoutType = lastWorkoutDate ? (dayLogs[lastWorkoutDate]?.workoutType || lastWorkout.type) : null;
  const daysAgo = lastWorkoutDate ? Math.floor((new Date(todayStr)-new Date(lastWorkoutDate))/(1000*60*60*24)) : null;

  const handleSaveEvening = () => {
    saveDay({ steps: Number(steps)||0, calories: Number(calories)||0 });
    setSaved(true);
  };

  const now = new Date();
  const greet = now.getHours() < 12 ? "Dzień dobry" : now.getHours() < 18 ? "Cześć" : "Dobry wieczór";

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">{greet} 👋</div>
        <div className="page-title">DZIŚ</div>
        <div className="page-sub">{new Date().toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>

      {/* CHECK-IN */}
      <div className="section-label">Typ dnia</div>
      <div className="card">
        <div className="card-title">Poranny check-in</div>
        <div className="checkin-grid">
          {[
            {id:"work",     emoji:"💼", label:"Praca"},
            {id:"training", emoji:"💪", label:"Trening"},
            {id:"recovery", emoji:"🧘", label:"Regeneracja"},
          ].map(t => (
            <button key={t.id}
              className={`checkin-btn ${todayLog.type===t.id?"active":""}`}
              style={{ color: todayLog.type===t.id ? typeColors[t.id] : undefined }}
              onClick={() => saveDay({type:t.id})}>
              <span className="emoji">{t.emoji}</span>
              <span className="lbl">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STREAK */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><Icon name="fire" size={18}/></div>
          <div className="stat-val" style={{color:"#ef4444"}}>{streak}</div>
          <div className="stat-label">dni streak 🔥</div>
          <div className="streak-bar">
            {last7.map((d,i) => <div key={i} className={`streak-day ${d?"done":""}`}/>)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icon name="trophy" size={18}/></div>
          <div className="stat-val" style={{color:"#eab308"}}>{daysAgo !== null ? daysAgo : "–"}</div>
          <div className="stat-label">dni od treningu</div>
          {lastWorkoutType && <div className="tag" style={{background:typeColors[lastWorkoutType]+"22",color:typeColors[lastWorkoutType],marginTop:6}}>{lastWorkoutType.toUpperCase()}</div>}
        </div>
      </div>

      {/* LAST WORKOUT */}
      {lastWorkout && (
        <>
          <div className="section-label">Ostatni trening</div>
          <div className="card">
            <div className="last-workout">
              <div className="type-badge" style={{background:typeColors[lastWorkout.type]+"22"}}>
                {lastWorkout.type==="push"?"🔴":lastWorkout.type==="pull"?"🔵":"🟢"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{lastWorkout.type.toUpperCase()} – {fmt(lastWorkout.date)}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
                  {history.filter(e=>e.date===lastWorkout.date).length} ćwiczeń
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:"var(--muted)"}}>{daysAgo} {daysAgo===1?"dzień":"dni"} temu</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* EVENING LOG */}
      <div className="section-label">Wieczorny wpis</div>
      <div className="card">
        <div className="card-title">Aktywność z zegarka</div>
        {saved && todayLog.steps ? (
          <div style={{display:"flex",gap:24,marginBottom:12}}>
            <div className="evening-saved">
              <Icon name="steps" size={18}/>
              <div><div className="ev-val">{(todayLog.steps||0).toLocaleString()}</div><div className="ev-unit">kroków</div></div>
            </div>
            <div className="evening-saved">
              <Icon name="fire" size={18}/>
              <div><div className="ev-val">{todayLog.calories||0}</div><div className="ev-unit">kcal aktywnych</div></div>
            </div>
          </div>
        ) : null}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div className="log-row">
            <span className="log-label">👟 Kroki</span>
            <input className="log-input" type="number" placeholder="np. 8000"
              value={steps} onChange={e=>setSteps(e.target.value)}/>
          </div>
          <div className="log-row">
            <span className="log-label">🔥 Kcal aktywne</span>
            <input className="log-input" type="number" placeholder="np. 450"
              value={calories} onChange={e=>setCalories(e.target.value)}/>
          </div>
          <button className="btn btn-primary" onClick={handleSaveEvening}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: TRENING (placeholder – Etap 2) ───────────────────────────────────
function ScreenTraining({ history, setHistory, saveDay, todayStr, dayLogs }) {
  const [phase, setPhase] = useState("select"); // select | session
  const [selType, setSelType] = useState(null);

  const typeColors = { push:"#ef4444", pull:"#3b82f6", fbw:"#22c55e", cardio:"#eab308" };
  const types = [
    {id:"push", emoji:"🔴", name:"PUSH", desc:"Klata · Barki · Triceps · 3 serie"},
    {id:"pull", emoji:"🔵", name:"PULL", desc:"Plecy · Biceps · 3 serie"},
    {id:"fbw",  emoji:"🟢", name:"FBW",  desc:"Full Body · 2 serie"},
    {id:"cardio",emoji:"🟡",name:"CARDIO",desc:"Spacer · Bieżnia · Schody"},
  ];

  if (phase === "select") return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">Wybierz typ</div>
        <div className="page-title">TRENING</div>
      </div>
      <div className="type-grid">
        {types.map(t => (
          <div key={t.id} className="type-card"
            style={{borderColor: selType===t.id ? typeColors[t.id] : "var(--border)"}}
            onClick={() => {
              setSelType(t.id);
              setPhase(t.id === "cardio" ? "cardio" : "session");
              saveDay({workoutType:t.id, type:"training"});
            }}>
            <span className="type-emoji">{t.emoji}</span>
            <span className="type-name" style={{color:typeColors[t.id]}}>{t.name}</span>
            <span className="type-desc">{t.desc}</span>
          </div>
        ))}
      </div>
      <div className="section-label">Historia treningów</div>
      {["push","pull","fbw"].map(type => {
        const dates = [...new Set(history.filter(e=>e.type===type).map(e=>e.date))].sort().reverse().slice(0,2);
        return dates.length ? (
          <div key={type} className="card" style={{marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:typeColors[type]}}>{type.toUpperCase()}</span>
              <span style={{fontSize:12,color:"var(--muted)"}}>ostatnie treningi</span>
            </div>
            {dates.map(d=>(
              <div key={d} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:13,color:"var(--muted2)"}}>{fmt(d)}</span>
                <span style={{fontSize:13}}>{history.filter(e=>e.date===d&&e.type===type).length} ćw.</span>
              </div>
            ))}
          </div>
        ) : null;
      })}
    </div>
  );

  if (phase === "cardio") return <CardioView onBack={()=>setPhase("select")} saveDay={saveDay} todayStr={todayStr} dayLogs={dayLogs} />;

  return <SessionView type={selType} history={history} setHistory={setHistory}
    todayStr={todayStr} onBack={()=>setPhase("select")} saveDay={saveDay} />;
}

// ── SESSION VIEW ─────────────────────────────────────────────────────────────
function SessionView({ type, history, setHistory, todayStr, onBack, saveDay }) {
  const sets    = type === "fbw" ? 2 : 3;
  const color   = { push:"#ef4444", pull:"#3b82f6", fbw:"#22c55e", cardio:"#eab308" }[type];
  const exList  = EXERCISES[type] || [];

  const [weights,   setWeights]   = useState({});
  const [done,      setDone]      = useState({});   // { exId: [true,false,false] }
  const [startTime]               = useState(Date.now());
  const [elapsed,   setElapsed]   = useState(0);
  const [note,      setNote]      = useState("");
  const [finished,  setFinished]  = useState(false);
  const [restTimer, setRestTimer] = useState(null); // seconds remaining
  const [showRest,  setShowRest]  = useState(false);

  // get last weight for each exercise
  const getLastWeight = useCallback((exName) => {
    const matches = history.filter(e => e.exercise === exName && e.type === type).sort((a,b)=>a.date>b.date?-1:1);
    return matches[0]?.weight ?? null;
  }, [history, type]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now()-startTime)/1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer <= 0) { setRestTimer(null); setShowRest(false); return; }
    const t = setTimeout(() => setRestTimer(r => r-1), 1000);
    return () => clearTimeout(t);
  }, [restTimer]);

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const toggleSet = (exId, setIdx) => {
    setDone(prev => {
      const cur = prev[exId] || Array(sets).fill(false);
      const next = [...cur];
      next[setIdx] = !next[setIdx];
      // start rest timer when completing a set
      if (next[setIdx]) { setRestTimer(90); setShowRest(true); }
      return { ...prev, [exId]: next };
    });
  };

  const totalSets = exList.length * sets;
  const doneSets  = Object.values(done).reduce((s,arr)=>s+arr.filter(Boolean).length, 0);
  const progress  = totalSets > 0 ? doneSets / totalSets : 0;

  const isPR = (exName, w) => {
    const prev = history.filter(e=>e.exercise===exName&&e.type===type).map(e=>e.weight);
    return prev.length > 0 && w > Math.max(...prev);
  };

  const handleFinish = () => {
    const newEntries = exList
      .filter(ex => weights[ex.id])
      .map(ex => ({ date:todayStr, type, exercise:ex.name, weight: parseFloat(weights[ex.id]) }));
    if (newEntries.length) {
      setHistory(prev => [...prev, ...newEntries]);
    }
    saveDay({ type:"training", workoutType:type, duration:elapsed, note });
    setFinished(true);
  };

  if (finished) return (
    <div className="animate-up" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:24}}>
      <div style={{fontSize:64}}>🏆</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>TRENING UKOŃCZONY!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>Czas: {fmtTime(elapsed)}</div>
      <div style={{color:"var(--muted)",fontSize:14}}>{Object.values(weights).filter(Boolean).length} ćwiczeń zapisanych</div>
      <button className="btn btn-primary" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button>
    </div>
  );

  return (
    <div className="animate-up">
      {/* HEADER */}
      <div style={{padding:"48px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}>
          <Icon name="chevronL" size={18}/>
        </button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>{type.toUpperCase()}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"6px 12px"}}>
          <Icon name="clock" size={14}/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1}}>{fmtTime(elapsed)}</span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{margin:"0 20px 16px",background:"var(--border)",borderRadius:4,height:4}}>
        <div style={{height:"100%",borderRadius:4,background:color,width:`${progress*100}%`,transition:"width .3s"}}/>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginBottom:12}}>{doneSets} / {totalSets} serii</div>

      {/* REST TIMER */}
      {showRest && restTimer !== null && (
        <div style={{margin:"0 16px 12px",background:color+"22",border:`1px solid ${color}44`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color,fontWeight:700,letterSpacing:1}}>PRZERWA</div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color}}>{fmtTime(restTimer)}</div>
          </div>
          <button onClick={()=>{setRestTimer(null);setShowRest(false);}} style={{background:color,border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Pomiń</button>
        </div>
      )}

      {/* EXERCISES */}
      {exList.map(ex => {
        const lastW = getLastWeight(ex.name);
        const w     = parseFloat(weights[ex.id])||0;
        const pr    = w > 0 && isPR(ex.name, w);
        const exDone= (done[ex.id]||[]).every(Boolean) && (done[ex.id]||[]).length===sets;
        return (
          <div key={ex.id} className="card" style={{opacity:exDone?.8:1,transition:"opacity .2s"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{ex.name}</div>
                <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginTop:2}}>{ex.muscle}</div>
              </div>
              <div style={{textAlign:"right"}}>
                {pr && <div style={{fontSize:10,fontWeight:700,color:"#eab308",letterSpacing:.8}}>🏆 REKORD!</div>}
                {lastW && <div style={{fontSize:11,color:"var(--muted)"}}>Ostatnio: <strong>{lastW} kg</strong></div>}
              </div>
            </div>
            {/* Weight input */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <input
                type="number" step="0.5" placeholder={lastW ? `${lastW}` : "kg"}
                value={weights[ex.id]||""}
                onChange={e=>setWeights(p=>({...p,[ex.id]:e.target.value}))}
                style={{flex:1,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:16,outline:"none"}}
              />
              <span style={{fontSize:13,color:"var(--muted)"}}>kg</span>
            </div>
            {/* Set checkboxes */}
            <div style={{display:"flex",gap:8}}>
              {Array.from({length:sets},(_,i)=>{
                const s = (done[ex.id]||[])[i];
                return (
                  <button key={i} onClick={()=>toggleSet(ex.id,i)}
                    style={{flex:1,height:36,borderRadius:8,border:`1.5px solid ${s?color:"var(--border)"}`,background:s?color+"22":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:s?color:"var(--muted)",transition:"all .15s"}}>
                    {s ? <Icon name="check" size={14}/> : <span style={{fontSize:12,fontWeight:600}}>Seria {i+1}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* NOTE + FINISH */}
      <div className="card">
        <div className="card-title">Notatka</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Jak poszło? Samopoczucie, uwagi..."
          style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",resize:"none",height:80}}/>
      </div>
      <div style={{padding:"0 16px 16px"}}>
        <button className="btn btn-primary" onClick={handleFinish}>
          ✓ Zakończ trening ({fmtTime(elapsed)})
        </button>
      </div>
    </div>
  );
}

// ── SCREEN: DIETA (placeholder) ──────────────────────────────────────────────
// ── CARDIO VIEW ───────────────────────────────────────────────────────────────
function CardioView({ onBack, saveDay, todayStr, dayLogs }) {
  const [type, setType]       = useState(null); // walk|treadmill|stairs
  const [km,   setKm]         = useState("");
  const [time, setTime]       = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(e => e+1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const cardioTypes = [
    {id:"walk",      emoji:"🚶", name:"Spacer",   fields:["km","time"]},
    {id:"treadmill", emoji:"🏃", name:"Bieżnia",  fields:["time","km"]},
    {id:"stairs",    emoji:"🪜", name:"Schody",   fields:["time"]},
  ];

  const handleSave = () => {
    const todayCardio = dayLogs[todayStr]?.cardio || [];
    saveDay({
      type:"cardio",
      cardio:[...todayCardio, {
        activityType: type,
        km: parseFloat(km)||0,
        time: time || fmtTime(elapsed),
        elapsed,
        date: todayStr,
      }]
    });
    setSaved(true);
  };

  const color = "#eab308";

  if (saved) return (
    <div className="animate-up" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:24}}>
      <div style={{fontSize:64}}>✅</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:2}}>ZAPISANO!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>{type} {km ? `· ${km} km` : ""} {time||fmtTime(elapsed)}</div>
      <button className="btn btn-primary" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button>
    </div>
  );

  return (
    <div className="animate-up">
      <div style={{padding:"48px 20px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}>
          <Icon name="chevronL" size={18}/>
        </button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>CARDIO</div>
      </div>

      <div className="section-label">Typ aktywności</div>
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {cardioTypes.map(ct => (
          <button key={ct.id} onClick={()=>setType(ct.id)}
            style={{flex:1,background:type===ct.id?"#eab30822":"var(--card)",border:`1.5px solid ${type===ct.id?"#eab308":"var(--border)"}`,borderRadius:14,padding:"14px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:26}}>{ct.emoji}</span>
            <span style={{fontSize:12,fontWeight:700,color:type===ct.id?"#eab308":"var(--muted)"}}>{ct.name}</span>
          </button>
        ))}
      </div>

      {type && (
        <>
          {/* TIMER */}
          <div className="card" style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:4,color}}>{fmtTime(elapsed)}</div>
            <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center"}}>
              <button onClick={()=>setRunning(r=>!r)}
                style={{background:running?"#ef444422":"#eab30822",border:`1.5px solid ${running?"#ef4444":"#eab308"}`,borderRadius:12,padding:"10px 24px",color:running?"#ef4444":"#eab308",fontWeight:700,cursor:"pointer",fontSize:14}}>
                {running ? "⏸ Pauza" : "▶ Start"}
              </button>
              <button onClick={()=>{setRunning(false);setElapsed(0);}}
                style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 16px",color:"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:14}}>
                Reset
              </button>
            </div>
          </div>

          {/* INPUTS */}
          <div className="card">
            <div className="card-title">Szczegóły</div>
            {(type==="walk"||type==="treadmill") && (
              <div className="log-row" style={{marginBottom:10}}>
                <span className="log-label">📏 Kilometry</span>
                <input className="log-input" type="number" step="0.1" placeholder="np. 3.5"
                  value={km} onChange={e=>setKm(e.target.value)}/>
              </div>
            )}
            <div className="log-row">
              <span className="log-label">⏱ Czas (opcja)</span>
              <input className="log-input" type="text" placeholder="mm:ss"
                value={time} onChange={e=>setTime(e.target.value)}/>
            </div>
          </div>

          <div style={{padding:"0 16px 16px"}}>
            <button className="btn btn-primary" onClick={handleSave}>✓ Zapisz aktywność</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── SCREEN: DIETA ─────────────────────────────────────────────────────────────
function ScreenDiet({ todayLog, saveDay }) {
  const [meals,      setMeals]      = useState(() => storage.get("meals", []));
  const [loading,    setLoading]    = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgBase64,  setImgBase64]  = useState(null);
  const [aiResult,   setAiResult]   = useState(null);
  const [error,      setError]      = useState(null);
  const [goalKcal,   setGoalKcal]   = useState(() => storage.get("goalKcal", 2200));
  const [editGoal,   setEditGoal]   = useState(false);
  const [historyTab, setHistoryTab] = useState("today"); // today | history

  useEffect(() => { storage.set("meals", meals); }, [meals]);
  useEffect(() => { storage.set("goalKcal", goalKcal); }, [goalKcal]);

  const todayStr = today();
  const todayMeals = meals.filter(m => m.date === todayStr);
  const totalKcal  = todayMeals.reduce((s,m) => s + (m.kcal||0), 0);
  const totalProt  = todayMeals.reduce((s,m) => s + (m.protein||0), 0);
  const totalCarb  = todayMeals.reduce((s,m) => s + (m.carbs||0), 0);
  const totalFat   = todayMeals.reduce((s,m) => s + (m.fat||0), 0);
  const pct = Math.min(100, Math.round((totalKcal/goalKcal)*100));

  // last 7 days kcal for chart
  const last7kcal = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const ds = d.toISOString().slice(0,10);
    const dayLabel = ["Pn","Wt","Śr","Cz","Pt","So","Nd"][d.getDay()===0?6:d.getDay()-1];
    const kcal = meals.filter(m=>m.date===ds).reduce((s,m)=>s+(m.kcal||0),0);
    return {ds, dayLabel, kcal};
  });
  const maxKcal = Math.max(...last7kcal.map(d=>d.kcal), goalKcal, 1);

  const handleFile = (e, source) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgPreview(ev.target.result);
      setImgBase64(ev.target.result.split(",")[1]);
      setAiResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!imgBase64) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:[
              {type:"image", source:{type:"base64", media_type:"image/jpeg", data:imgBase64}},
              {type:"text",  text:`Przeanalizuj zdjęcie posiłku i podaj szacunkowe wartości odżywcze. Odpowiedz TYLKO w formacie JSON bez żadnego innego tekstu:
{"name":"nazwa posiłku po polsku","kcal":liczba,"protein":liczba,"carbs":liczba,"fat":liczba,"notes":"krótka uwaga po polsku"}`}
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c=>c.text||"").join("") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiResult(parsed);
    } catch(e) {
      setError("Nie udało się przeanalizować zdjęcia. Spróbuj ponownie.");
    }
    setLoading(false);
  };

  const saveMeal = () => {
    if (!aiResult) return;
    const meal = { ...aiResult, date: todayStr, time: new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}), id: Date.now() };
    setMeals(prev => [meal, ...prev]);
    setImgPreview(null); setImgBase64(null); setAiResult(null);
  };

  const deleteMeal = (id) => setMeals(prev => prev.filter(m => m.id !== id));

  // group history by date
  const historyDates = [...new Set(meals.filter(m=>m.date!==todayStr).map(m=>m.date))].sort().reverse().slice(0,14);

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">Dziennik</div>
        <div className="page-title">DIETA</div>
      </div>

      {/* GOAL + PROGRESS */}
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:36,color: totalKcal>goalKcal?"#ef4444":"#22c55e"}}>{totalKcal}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>z {goalKcal} kcal celu</div>
          </div>
          <button onClick={()=>setEditGoal(e=>!e)}
            style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",color:"var(--muted2)",fontSize:12,cursor:"pointer",fontWeight:600}}>
            {editGoal?"Zamknij":"Cel kcal"}
          </button>
        </div>
        {editGoal && (
          <div className="log-row" style={{marginBottom:10}}>
            <span className="log-label">🎯 Cel kcal</span>
            <input className="log-input" type="number" value={goalKcal} onChange={e=>setGoalKcal(Number(e.target.value))}/>
          </div>
        )}
        <div style={{background:"var(--border)",borderRadius:6,height:8,marginBottom:10}}>
          <div style={{height:"100%",borderRadius:6,background:totalKcal>goalKcal?"#ef4444":"#22c55e",width:`${pct}%`,transition:"width .3s"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[["🥩 Białko",totalProt,"g","#ef4444"],["🍞 Węgl.",totalCarb,"g","#eab308"],["🧈 Tłuszcze",totalFat,"g","#3b82f6"]].map(([l,v,u,c])=>(
            <div key={l} style={{textAlign:"center",background:"var(--card2)",borderRadius:10,padding:"8px 4px"}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:c}}>{v}{u}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WEEKLY KCAL CHART */}
      <div className="card">
        <div className="card-title">Kalorie – ostatnie 7 dni</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80,marginBottom:6}}>
          {last7kcal.map((d,i)=>{
            const h = Math.max(4, (d.kcal/maxKcal)*76);
            const isToday = d.ds===todayStr;
            const overGoal = d.kcal > goalKcal;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:8,color:"var(--muted)",height:14,display:"flex",alignItems:"flex-end"}}>
                  {d.kcal>0?d.kcal:""}
                </div>
                <div style={{width:"100%",height:h,borderRadius:4,background:isToday?(overGoal?"#ef4444":"#22c55e"):overGoal?"#ef444444":"#3b82f644",border:isToday?`1px solid ${overGoal?"#ef4444":"#22c55e"}`:"none",transition:"height .3s"}}/>
              </div>
            );
          })}
        </div>
        {/* goal line label */}
        <div style={{display:"flex",gap:4}}>
          {last7kcal.map((d,i)=>(
            <div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:d.ds===todayStr?"var(--text)":"var(--muted)",fontWeight:d.ds===todayStr?700:400}}>{d.dayLabel}</div>
          ))}
        </div>
      </div>

      {/* PHOTO UPLOAD */}
      <div className="section-label">Dodaj posiłek</div>
      <div className="card">
        {imgPreview ? (
          <>
            <img src={imgPreview} alt="posiłek" style={{width:"100%",borderRadius:10,marginBottom:12,maxHeight:200,objectFit:"cover"}}/>
            {aiResult ? (
              <div style={{background:"var(--card2)",borderRadius:12,padding:14,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{aiResult.name}</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:6}}>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#22c55e"}}>{aiResult.kcal} kcal</span>
                  <span style={{fontSize:12,color:"var(--muted)",alignSelf:"flex-end",paddingBottom:2}}>B:{aiResult.protein}g W:{aiResult.carbs}g T:{aiResult.fat}g</span>
                </div>
                {aiResult.notes && <div style={{fontSize:12,color:"var(--muted2)"}}>{aiResult.notes}</div>}
              </div>
            ) : (
              <button className="btn btn-primary" onClick={analyzePhoto} disabled={loading} style={{marginBottom:8}}>
                {loading ? "🤖 Analizuję..." : "🤖 Analizuj z AI"}
              </button>
            )}
            {error && <div style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{error}</div>}
            {aiResult && <button className="btn btn-primary" onClick={saveMeal}>✓ Zapisz posiłek</button>}
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>{setImgPreview(null);setImgBase64(null);setAiResult(null);}}>Anuluj</button>
          </>
        ) : (
          <div style={{display:"flex",gap:10}}>
            <label style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"18px 8px",cursor:"pointer",background:"var(--card2)",borderRadius:12,border:"1.5px dashed var(--border)"}}>
              <span style={{fontSize:32}}>📸</span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--muted2)",letterSpacing:.5}}>APARAT</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
            </label>
            <label style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"18px 8px",cursor:"pointer",background:"var(--card2)",borderRadius:12,border:"1.5px dashed var(--border)"}}>
              <span style={{fontSize:32}}>🖼️</span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--muted2)",letterSpacing:.5}}>GALERIA</span>
              <input type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            </label>
          </div>
        )}
      </div>

      {/* TABS: DZIŚ / HISTORIA */}
      <div style={{display:"flex",gap:8,margin:"12px 16px 4px"}}>
        {[["today","Dziś"],["history","Historia"]].map(([id,label])=>(
          <button key={id} onClick={()=>setHistoryTab(id)}
            style={{flex:1,padding:"8px",borderRadius:10,border:`1.5px solid ${historyTab===id?"#22c55e":"var(--border)"}`,background:historyTab===id?"#22c55e22":"var(--card2)",color:historyTab===id?"#22c55e":"var(--muted)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {historyTab==="today" ? (
        todayMeals.length > 0 ? todayMeals.map(m => (
          <div key={m.id} className="card" style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.time} · B:{m.protein}g W:{m.carbs}g T:{m.fat}g</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#22c55e"}}>{m.kcal}</span>
                <button onClick={()=>deleteMeal(m.id)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:18,padding:4}}>×</button>
              </div>
            </div>
          </div>
        )) : (
          <div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontSize:13}}>Brak posiłków dzisiaj</div>
        )
      ) : (
        historyDates.length > 0 ? historyDates.map(ds => {
          const dayMeals = meals.filter(m=>m.date===ds);
          const dayKcal = dayMeals.reduce((s,m)=>s+(m.kcal||0),0);
          return (
            <div key={ds} className="card" style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{fmt(ds)}</span>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:dayKcal>goalKcal?"#ef4444":"#22c55e"}}>{dayKcal} kcal</span>
              </div>
              {dayMeals.slice(0,3).map(m=>(
                <div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:"1px solid var(--border)"}}>
                  <span style={{fontSize:12,color:"var(--muted2)"}}>{m.name}</span>
                  <span style={{fontSize:12,color:"var(--muted)"}}>{m.kcal} kcal</span>
                </div>
              ))}
              {dayMeals.length>3 && <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>+{dayMeals.length-3} więcej</div>}
            </div>
          );
        }) : (
          <div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontSize:13}}>Brak historii posiłków</div>
        )
      )}
    </div>
  );
}

// ── SCREEN: KALENDARZ ────────────────────────────────────────────────────────
function ScreenCalendar({ calDate, setCalDate, workoutDates, dayLogs, history, selDay, setSelDay }) {
  const { y, m } = calDate;
  const today_str = today();

  const typeColor = {
    push:"#ef4444", pull:"#3b82f6", fbw:"#22c55e",
    cardio:"#eab308", work:"#4b5563", training:"#ef4444",
    recovery:"#22c55e", rest:"#374151",
  };

  const prevMonth = () => setCalDate(m===0 ? {y:y-1,m:11} : {y,m:m-1});
  const nextMonth = () => setCalDate(m===11 ? {y:y+1,m:0} : {y,m:m+1});

  const days = daysInMonth(y, m);
  const firstDay = firstDayOfMonth(y, m);
  const cells = Array(firstDay).fill(null).concat(Array.from({length:days},(_,i)=>i+1));

  const getDayStr = d => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const getDayType = (d) => {
    const ds = getDayStr(d);
    if (workoutDates[ds]) return workoutDates[ds];
    const log = dayLogs[ds];
    if (log?.type) return log.type;
    return null;
  };

  // detail modal
  const getDayDetail = (d) => {
    const ds = getDayStr(d);
    const entries = history.filter(e=>e.date===ds);
    const log = dayLogs[ds] || {};
    return { entries, log, ds };
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">Historia aktywności</div>
        <div className="page-title">KALENDARZ</div>
      </div>

      {/* LEGEND */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"0 16px",marginBottom:12}}>
        {[["push","🔴 PUSH"],["pull","🔵 PULL"],["fbw","🟢 FBW"],["cardio","🟡 Cardio"],["work","💼 Praca"],["recovery","🧘 Regen"]].map(([t,l])=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--muted)"}}>
            <div style={{width:8,height:8,borderRadius:2,background:typeColor[t]}}/>
            {l}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth}><Icon name="chevronL" size={16}/></button>
          <span className="cal-month">{MONTHS_PL[m]} {y}</span>
          <button className="cal-nav" onClick={nextMonth}><Icon name="chevronR" size={16}/></button>
        </div>

        <div className="cal-grid">
          {DAYS_PL.map(d=><div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d,i) => {
            if (!d) return <div key={`e${i}`} className="cal-cell empty"/>;
            const ds  = getDayStr(d);
            const tp  = getDayType(d);
            const col = tp ? typeColor[tp] : "var(--card2)";
            const isT = ds === today_str;
            return (
              <div key={d} className={`cal-cell ${isT?"today-cell":""}`}
                style={{background: tp ? col+"33" : "var(--card2)", color: tp ? col : "var(--muted)", fontWeight: isT?700:400}}
                onClick={() => setSelDay(d)}>
                {d}
                {tp && <div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:col}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* MONTH SUMMARY */}
      <div className="section-label">Podsumowanie miesiąca</div>
      <div className="stats-row">
        {["push","pull","fbw"].map(tp=>{
          const count = [...new Set(history.filter(e=>e.type===tp&&e.date.startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).map(e=>e.date))].length;
          return (
            <div key={tp} className="stat-card" style={{borderLeft:`3px solid ${typeColor[tp]}`}}>
              <div className="stat-val" style={{color:typeColor[tp]}}>{count}</div>
              <div className="stat-label">{tp.toUpperCase()} treningi</div>
            </div>
          );
        })}
        <div className="stat-card">
          <div className="stat-val">{
            Object.keys(dayLogs).filter(d=>d.startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).reduce((s,d)=>s+(dayLogs[d]?.steps||0),0).toLocaleString()
          }</div>
          <div className="stat-label">kroków łącznie</div>
        </div>
      </div>

      {/* DAY MODAL */}
      {selDay && (() => {
        const { entries, log, ds } = getDayDetail(selDay);
        const tp = getDayType(selDay);
        const col = tp ? typeColor[tp] : "var(--muted)";
        return (
          <div className="modal-backdrop" onClick={()=>setSelDay(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-title" style={{color:col}}>{fmt(ds)} – {tp ? tp.toUpperCase() : "Brak danych"}</div>
              {log.duration && <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>⏱ Czas treningu: {Math.floor(log.duration/60)} min</div>}
              {log.steps ? <div style={{fontSize:13,color:"var(--muted2)",marginBottom:4}}>👟 Kroki: <strong>{log.steps.toLocaleString()}</strong></div> : null}
              {log.calories ? <div style={{fontSize:13,color:"var(--muted2)",marginBottom:8}}>🔥 Kcal aktywne: <strong>{log.calories}</strong></div> : null}
              {entries.length > 0 ? (
                <>
                  <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1.5,color:"var(--muted)",fontWeight:600,marginBottom:8}}>Ćwiczenia</div>
                  {entries.map((e,i)=>(
                    <div key={i} className="ex-row">
                      <span className="ex-name">{e.exercise}</span>
                      <span className="ex-weight" style={{color:col}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{color:"var(--muted)",fontSize:13,padding:"16px 0",textAlign:"center"}}>Brak zapisanych ćwiczeń</div>
              )}
              {log.note && <div style={{marginTop:12,padding:"10px 12px",background:"var(--card2)",borderRadius:10,fontSize:12,color:"var(--muted2)"}}>{log.note}</div>}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:16}} onClick={()=>setSelDay(null)}>Zamknij</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── SCREEN: STATYSTYKI ───────────────────────────────────────────────────────
function ScreenStats({ history, dayLogs }) {
  const [selExercise, setSelExercise] = useState("Wyciag gora szeroko");
  const [selType,     setSelType]     = useState("pull");
  const [activeTab,   setActiveTab]   = useState("exercises");
  const [bodyWeight,  setBodyWeight]  = useState(() => storage.get("bodyWeight", []));
  const [newWeight,   setNewWeight]   = useState("");

  useEffect(() => { storage.set("bodyWeight", bodyWeight); }, [bodyWeight]);

  const typeColor = { push:"#ef4444", pull:"#3b82f6", fbw:"#22c55e" };

  const allExercises = {
    push: [...new Set(EXERCISES.push.map(e=>e.name))],
    pull: [...new Set(EXERCISES.pull.map(e=>e.name))],
    fbw:  [...new Set(EXERCISES.fbw.map(e=>e.name))],
  };

  const exHistory = history
    .filter(e => e.exercise === selExercise)
    .sort((a,b) => a.date > b.date ? 1 : -1);

  const maxW = exHistory.length ? Math.max(...exHistory.map(e=>e.weight)) : 1;
  const minW = exHistory.length ? Math.min(...exHistory.map(e=>e.weight)) : 0;
  const range = maxW - minW || 1;
  const chartH = 120;
  const chartW_pts = exHistory.length > 1 ? exHistory.length - 1 : 1;

  const totals = { push:0, pull:0, fbw:0 };
  Object.keys(totals).forEach(tp => {
    totals[tp] = [...new Set(history.filter(e=>e.type===tp).map(e=>e.date))].length;
  });
  const totalSteps = Object.values(dayLogs).reduce((s,l)=>s+(l.steps||0),0);
  const totalKcalActive = Object.values(dayLogs).reduce((s,l)=>s+(l.calories||0),0);

  // weekly summary
  const getWeekStart = (d) => { const dt=new Date(d); dt.setDate(dt.getDate()-((dt.getDay()+6)%7)); return dt.toISOString().slice(0,10); };
  const weekMap = {};
  history.forEach(e => {
    const ws = getWeekStart(e.date);
    if (!weekMap[ws]) weekMap[ws] = {push:new Set(),pull:new Set(),fbw:new Set()};
    if (weekMap[ws][e.type]) weekMap[ws][e.type].add(e.date);
  });
  const weeks = Object.entries(weekMap).sort((a,b)=>a[0]>b[0]?-1:1).slice(0,8);

  // body weight chart
  const weightSorted = [...bodyWeight].sort((a,b)=>a.date>b.date?1:-1);
  const maxBW = weightSorted.length ? Math.max(...weightSorted.map(w=>w.val)) : 100;
  const minBW = weightSorted.length ? Math.min(...weightSorted.map(w=>w.val)) : 60;
  const bwRange = maxBW - minBW || 1;
  const bwPts = weightSorted.length > 1 ? weightSorted.length - 1 : 1;

  const addWeight = () => {
    const v = parseFloat(newWeight);
    if (!v) return;
    setBodyWeight(prev => [...prev.filter(w=>w.date!==today()), { date:today(), val:v, id:Date.now() }]);
    setNewWeight("");
  };

  const tabs = [{id:"exercises",label:"Cwiczenia"},{id:"body",label:"Waga"},{id:"week",label:"Tygodnie"}];

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">Twoje wyniki</div>
        <div className="page-title">STATYSTYKI</div>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 16px 12px",overflowX:"auto"}}>
        {Object.entries(totals).map(([tp,n])=>(
          <div key={tp} style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",textAlign:"center",minWidth:70}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:typeColor[tp]}}>{n}</div>
            <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>{tp}</div>
          </div>
        ))}
        <div style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",textAlign:"center",minWidth:70}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:"#eab308"}}>{Math.round(totalSteps/1000)}k</div>
          <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>Kroki</div>
        </div>
        <div style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",textAlign:"center",minWidth:70}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:"#f97316"}}>{Math.round(totalKcalActive/1000)}k</div>
          <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>Kcal</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 16px 12px"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1.5px solid ${activeTab===t.id?"#ef4444":"var(--border)"}`,background:activeTab===t.id?"#ef444422":"var(--card2)",color:activeTab===t.id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab==="exercises" && <>
        <div style={{display:"flex",gap:6,margin:"0 16px 10px",overflowX:"auto",paddingBottom:4}}>
          {Object.keys(allExercises).map(tp=>(
            <button key={tp} onClick={()=>setSelType(tp)}
              style={{flexShrink:0,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:12,
                background:selType===tp?typeColor[tp]+"33":"var(--card2)",color:selType===tp?typeColor[tp]:"var(--muted)",
                outline:selType===tp?`1.5px solid ${typeColor[tp]}`:"none"}}>
              {tp.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{margin:"0 16px 8px",overflowX:"auto",display:"flex",gap:6,paddingBottom:4}}>
          {allExercises[selType].map(ex=>(
            <button key={ex} onClick={()=>setSelExercise(ex)}
              style={{flexShrink:0,border:"1px solid var(--border)",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,
                background:selExercise===ex?typeColor[selType]+"22":"var(--card2)",color:selExercise===ex?typeColor[selType]:"var(--muted)",
                outline:selExercise===ex?`1.5px solid ${typeColor[selType]}44`:"none"}}>
              {ex}
            </button>
          ))}
        </div>
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{selExercise}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{exHistory.length} pomiarow</div>
            </div>
            {exHistory.length > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:typeColor[selType]}}>{maxW} kg</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>REKORD</div>
              </div>
            )}
          </div>
          {exHistory.length > 1 ? (
            <svg width="100%" height={chartH+30} viewBox={`0 0 100 ${chartH+30}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={typeColor[selType]} stopOpacity=".3"/>
                  <stop offset="100%" stopColor={typeColor[selType]} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={[
                `M 0 ${chartH-((exHistory[0].weight-minW)/range)*chartH}`,
                ...exHistory.slice(1).map((_,i)=>`L ${((i+1)/chartW_pts)*100} ${chartH-((exHistory[i+1].weight-minW)/range)*chartH}`),
                `L 100 ${chartH}`,`L 0 ${chartH}`,"Z"
              ].join(" ")} fill="url(#grad)"/>
              <polyline points={exHistory.map((e,i)=>`${(i/chartW_pts)*100},${chartH-((e.weight-minW)/range)*chartH}`).join(" ")}
                fill="none" stroke={typeColor[selType]} strokeWidth="1.5"/>
              {exHistory.map((e,i)=>(
                <circle key={i} cx={(i/chartW_pts)*100} cy={chartH-((e.weight-minW)/range)*chartH} r="2" fill={typeColor[selType]}/>
              ))}
              <text x="0" y={chartH+20} fontSize="7" fill="var(--muted)">{minW}kg</text>
              <text x="100" y={chartH+20} fontSize="7" fill="var(--muted)" textAnchor="end">{fmt(exHistory[exHistory.length-1].date)}</text>
            </svg>
          ) : exHistory.length===1 ? (
            <div style={{textAlign:"center",padding:"20px 0",color:"var(--muted)",fontSize:13}}>Tylko jeden pomiar - {exHistory[0].weight} kg</div>
          ) : (
            <div style={{textAlign:"center",padding:"20px 0",color:"var(--muted)",fontSize:13}}>Brak danych</div>
          )}
        </div>
        {exHistory.length > 0 && (
          <div className="card">
            <div className="card-title">Historia pomiarow</div>
            {[...exHistory].reverse().slice(0,10).map((e,i,arr)=>{
              const prev=arr[i+1]; const diff=prev?e.weight-prev.weight:0;
              return (
                <div key={i} className="ex-row">
                  <span className="ex-name">{fmt(e.date)}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {diff!==0&&<span style={{fontSize:11,color:diff>0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                    <span className="ex-weight" style={{color:typeColor[selType]}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>}

      {activeTab==="body" && <>
        <div className="card">
          <div className="card-title">Zapisz wage dzisiaj</div>
          <div className="log-row" style={{marginBottom:10}}>
            <span className="log-label">Waga</span>
            <input className="log-input" type="number" step="0.1" placeholder="np. 78.5"
              value={newWeight} onChange={e=>setNewWeight(e.target.value)}/>
            <span style={{fontSize:13,color:"var(--muted)",marginLeft:4}}>kg</span>
          </div>
          <button className="btn btn-primary" onClick={addWeight}>Zapisz wage</button>
        </div>
        {weightSorted.length > 0 && (
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>Waga ciala</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{weightSorted.length} pomiarow</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:"#3b82f6"}}>{weightSorted[weightSorted.length-1].val} kg</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>OSTATNIA</div>
              </div>
            </div>
            {weightSorted.length > 1 && (
              <svg width="100%" height={chartH+30} viewBox={`0 0 100 ${chartH+30}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
                <defs>
                  <linearGradient id="bwgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity=".3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d={[
                  `M 0 ${chartH-((weightSorted[0].val-minBW)/bwRange)*chartH}`,
                  ...weightSorted.slice(1).map((_,i)=>`L ${((i+1)/bwPts)*100} ${chartH-((weightSorted[i+1].val-minBW)/bwRange)*chartH}`),
                  `L 100 ${chartH}`,`L 0 ${chartH}`,"Z"
                ].join(" ")} fill="url(#bwgrad)"/>
                <polyline points={weightSorted.map((w,i)=>`${(i/bwPts)*100},${chartH-((w.val-minBW)/bwRange)*chartH}`).join(" ")}
                  fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
                {weightSorted.map((w,i)=>(
                  <circle key={i} cx={(i/bwPts)*100} cy={chartH-((w.val-minBW)/bwRange)*chartH} r="2" fill="#3b82f6"/>
                ))}
                <text x="0" y={chartH+20} fontSize="7" fill="var(--muted)">{minBW}kg</text>
                <text x="100" y={chartH+20} fontSize="7" fill="var(--muted)" textAnchor="end">{fmt(weightSorted[weightSorted.length-1].date)}</text>
              </svg>
            )}
            <div className="card-title" style={{marginTop:12}}>Historia</div>
            {[...weightSorted].reverse().slice(0,10).map((w,i,arr)=>{
              const prev=arr[i+1]; const diff=prev?+(w.val-prev.val).toFixed(1):0;
              return (
                <div key={w.id} className="ex-row">
                  <span className="ex-name">{fmt(w.date)}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {diff!==0&&<span style={{fontSize:11,color:diff<0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                    <span className="ex-weight" style={{color:"#3b82f6"}}>{w.val} <span style={{fontSize:12}}>kg</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>}

      {activeTab==="week" && (
        <div className="card">
          <div className="card-title">Podsumowanie tygodni</div>
          {weeks.length===0 && <div style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:13}}>Brak danych</div>}
          {weeks.map(([ws, data])=>{
            const pushN=data.push?.size||0, pullN=data.pull?.size||0, fbwN=data.fbw?.size||0;
            const total=pushN+pullN+fbwN;
            const weekEnd=new Date(ws); weekEnd.setDate(weekEnd.getDate()+6);
            return (
              <div key={ws} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,color:"var(--muted2)",fontWeight:600}}>{fmt(ws)} - {fmt(weekEnd.toISOString().slice(0,10))}</span>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#ef4444"}}>{total}x</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[["PUSH",pushN,"#ef4444"],["PULL",pullN,"#3b82f6"],["FBW",fbwN,"#22c55e"]].map(([l,n,c])=>(
                    <div key={l} style={{flex:1,textAlign:"center",background:n>0?c+"22":"var(--card2)",borderRadius:8,padding:"6px 4px",border:n>0?`1px solid ${c}44`:"none"}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:n>0?c:"var(--muted)"}}>{n}x</div>
                      <div style={{fontSize:9,color:"var(--muted)",letterSpacing:.5}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
