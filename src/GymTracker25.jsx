import { useState, useEffect, useCallback } from "react";

const APP_VERSION = "2.5.0";
const DATA_VERSION = 6;

const storage = {
  get: (key, fallback = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const fmt = (d) => { if(!d) return ""; const [y,m,day]=d.split("-"); return `${day}.${m}.${y}`; };
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const firstDayOfMonth = (y,m) => { let d=new Date(y,m,1).getDay(); return d===0?6:d-1; };

const EXERCISES = {
  push: [
    {id:"atlas_klatka",   name:"Atlas klatka",         muscle:"klata"},
    {id:"atlas_rozpietki",name:"Atlas rozpiętki",      muscle:"klata"},
    {id:"lawka_skos",     name:"Ławka skośnie hantle", muscle:"klata"},
    {id:"maszyna_skos",   name:"Maszyna skos",         muscle:"klata"},
    {id:"lawka_plaska",   name:"Ławka płasko",         muscle:"klata"},
    {id:"brama",          name:"Brama",                muscle:"klata"},
    {id:"dipy",           name:"Dipy",                 muscle:"klata"},
    {id:"wznosy_bok",     name:"Wznosy bokiem",        muscle:"barki"},
    {id:"wznosy_gora",    name:"Wznosy nad głowę",     muscle:"barki"},
    {id:"rozpietki_tyl",  name:"Rozpiętki tył",        muscle:"barki"},
    {id:"laweczka_tri",   name:"Ławeczka triceps",     muscle:"triceps"},
    {id:"wyciag_tri",     name:"Wyciąg triceps",       muscle:"triceps"},
  ],
  pull: [
    {id:"wyciag_szeroko", name:"Wyciąg góra szeroko",  muscle:"plecy"},
    {id:"wyciag_wasko",   name:"Wyciąg góra wąsko",    muscle:"plecy"},
    {id:"wyciag_dol_s",   name:"Wyciąg nisko szeroko", muscle:"plecy"},
    {id:"wyciag_dol_w",   name:"Wyciąg nisko wąsko",   muscle:"plecy"},
    {id:"narciaz",        name:"Narciaż",              muscle:"plecy"},
    {id:"wioslowanie",    name:"Wiosłowanie",          muscle:"plecy"},
    {id:"wioslowanie_l",  name:"Wiosłowanie ławka",    muscle:"plecy"},
    {id:"martwy",         name:"Martwy ciąg",          muscle:"plecy"},
    {id:"biceps_skos",    name:"Biceps skos siedząco",  muscle:"biceps"},
    {id:"modlitewnik",    name:"Modlitewnik",          muscle:"biceps"},
    {id:"mlotki",         name:"Młotki",               muscle:"biceps"},
  ],
  fbw: [
    {id:"rozpietki_fbw",  name:"Atlas rozpiętki",       muscle:"klata"},
    {id:"suwnica",        name:"Suwnica",              muscle:"nogi"},
    {id:"plaska_fbw",     name:"Ławka płasko",          muscle:"klata"},
    {id:"skos_fbw",       name:"Ławka skośnie hantle",  muscle:"klata"},
    {id:"barki_gora",     name:"Wznosy nad głowę",      muscle:"barki"},
    {id:"barki_bok",      name:"Wznosy bokiem",         muscle:"barki"},
    {id:"bark_tyl",       name:"Rozpiętki tył",         muscle:"barki"},
    {id:"sciag_g_s",      name:"Wyciąg góra szeroko",   muscle:"plecy"},
    {id:"sciag_g_w",      name:"Wyciąg góra wąsko",     muscle:"plecy"},
    {id:"sciag_d_w",      name:"Wyciąg nisko wąsko",    muscle:"plecy"},
    {id:"narciaz_fbw",    name:"Narciaż",              muscle:"plecy"},
    {id:"wioslowanie_f",  name:"Wiosłowanie ławka",    muscle:"plecy"},
    {id:"biceps_skos_f",  name:"Biceps skos siedząco",  muscle:"biceps"},
    {id:"biceps_mod_f",   name:"Modlitewnik",           muscle:"biceps"},
    {id:"mlotki_fbw",     name:"Młotki",               muscle:"biceps"},
    {id:"tri_gora",       name:"Ławeczka triceps",      muscle:"triceps"},
    {id:"tri_dol",        name:"Wyciąg triceps",        muscle:"triceps"},
    {id:"martwy_fbw",     name:"Martwy ciąg",          muscle:"plecy"},
  ],
};

const NEW_FBW = [
  {date:"2026-03-26",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-03-26",type:"fbw",exercise:"Suwnica",weight:150},
  {date:"2026-03-26",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-03-26",type:"fbw",exercise:"Ławka skośnie hantle",weight:25},
  {date:"2026-03-26",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-03-26",type:"fbw",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-03-26",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-03-26",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-03-26",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-03-26",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-03-26",type:"fbw",exercise:"Biceps skos siedząco",weight:20},
  {date:"2026-03-26",type:"fbw",exercise:"Modlitewnik",weight:15},
  {date:"2026-03-26",type:"fbw",exercise:"Młotki",weight:15},
  {date:"2026-03-26",type:"fbw",exercise:"Ławeczka triceps",weight:27},
  {date:"2026-03-26",type:"fbw",exercise:"Wyciąg triceps",weight:27},
  {date:"2026-04-21",type:"fbw",exercise:"Atlas rozpiętki",weight:65},
  {date:"2026-04-21",type:"fbw",exercise:"Suwnica",weight:170},
  {date:"2026-04-21",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-04-21",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-04-21",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-04-21",type:"fbw",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-04-21",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-04-21",type:"fbw",exercise:"Wyciąg góra wąsko",weight:70},
  {date:"2026-04-21",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-04-21",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-04-21",type:"fbw",exercise:"Wyciąg triceps",weight:35},
  {date:"2026-05-12",type:"fbw",exercise:"Atlas rozpiętki",weight:65},
  {date:"2026-05-12",type:"fbw",exercise:"Suwnica",weight:180},
  {date:"2026-05-12",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-05-12",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-05-12",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg góra szeroko",weight:80},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg góra wąsko",weight:70},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-05-12",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-05-12",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-05-19",type:"fbw",exercise:"Atlas rozpiętki",weight:60},
  {date:"2026-05-19",type:"fbw",exercise:"Suwnica",weight:170},
  {date:"2026-05-19",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-05-19",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-05-19",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-19",type:"fbw",exercise:"Wznosy bokiem",weight:7},
  {date:"2026-05-19",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-05-19",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-05-19",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-05-24",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-05-24",type:"fbw",exercise:"Suwnica",weight:180},
  {date:"2026-05-24",type:"fbw",exercise:"Ławka płasko",weight:35},
  {date:"2026-05-24",type:"fbw",exercise:"Ławka skośnie hantle",weight:25},
  {date:"2026-05-24",type:"fbw",exercise:"Wznosy nad głowę",weight:20},
  {date:"2026-05-24",type:"fbw",exercise:"Wznosy bokiem",weight:7},
  {date:"2026-05-24",type:"fbw",exercise:"Rozpiętki tył",weight:5},
  {date:"2026-05-24",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-05-24",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-05-24",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:75},
  {date:"2026-05-24",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-05-24",type:"fbw",exercise:"Biceps skos siedząco",weight:20},
  {date:"2026-05-24",type:"fbw",exercise:"Młotki",weight:15},
  {date:"2026-05-24",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  // NEW from PDF 30.05
  {date:"2026-05-30",type:"fbw",exercise:"Ławka płasko",weight:37},
  {date:"2026-05-30",type:"fbw",exercise:"Ławka skośnie hantle",weight:30},
  {date:"2026-05-30",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg góra szeroko",weight:80},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg góra wąsko",weight:80},
  {date:"2026-05-30",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-05-30",type:"fbw",exercise:"Młotki",weight:15},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg triceps",weight:35},
  {date:"2026-05-30",type:"fbw",exercise:"Wiosłowanie ławka",weight:25},
];

const SEED_PUSH_PULL = [
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg góra szeroko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg góra wąsko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg nisko wąsko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wiosłowanie",weight:20},
  {date:"2025-09-21",type:"pull",exercise:"Martwy ciąg",weight:20},
  {date:"2025-09-21",type:"pull",exercise:"Biceps skos siedząco",weight:10},
  {date:"2025-09-21",type:"pull",exercise:"Młotki",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Atlas klatka",weight:100},
  {date:"2025-09-22",type:"push",exercise:"Atlas rozpiętki",weight:30},
  {date:"2025-09-22",type:"push",exercise:"Ławka skośnie hantle",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Maszyna skos",weight:15},
  {date:"2025-09-22",type:"push",exercise:"Ławka płasko",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Wznosy bokiem",weight:7.5},
  {date:"2025-09-22",type:"push",exercise:"Wznosy nad głowę",weight:12.5},
  {date:"2025-09-22",type:"push",exercise:"Ławeczka triceps",weight:12.5},
  {date:"2025-09-22",type:"push",exercise:"Wyciąg triceps",weight:17.5},
  {date:"2025-10-08",type:"push",exercise:"Atlas rozpiętki",weight:70},
  {date:"2025-10-08",type:"push",exercise:"Ławka skośnie hantle",weight:17.5},
  {date:"2025-10-08",type:"push",exercise:"Ławka płasko",weight:21},
  {date:"2025-10-11",type:"pull",exercise:"Wyciąg góra szeroko",weight:60},
  {date:"2025-10-11",type:"pull",exercise:"Wyciąg góra wąsko",weight:60},
  {date:"2025-10-11",type:"pull",exercise:"Martwy ciąg",weight:20},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg góra szeroko",weight:65},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg góra wąsko",weight:65},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg nisko wąsko",weight:60},
  {date:"2025-10-25",type:"push",exercise:"Atlas rozpiętki",weight:55},
  {date:"2025-10-25",type:"push",exercise:"Ławka skośnie hantle",weight:20},
  {date:"2025-10-25",type:"push",exercise:"Ławka płasko",weight:20},
  {date:"2025-10-25",type:"push",exercise:"Ławeczka triceps",weight:25},
  {date:"2025-10-25",type:"push",exercise:"Wyciąg triceps",weight:25},
  {date:"2026-02-04",type:"push",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-02-04",type:"push",exercise:"Ławka skośnie hantle",weight:25},
  {date:"2026-02-04",type:"push",exercise:"Ławka płasko",weight:30},
  {date:"2026-02-04",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-02-04",type:"push",exercise:"Wznosy nad głowę",weight:20},
  {date:"2026-02-04",type:"push",exercise:"Ławeczka triceps",weight:30},
  {date:"2026-02-04",type:"push",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg nisko wąsko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Martwy ciąg",weight:30},
  {date:"2026-02-04",type:"pull",exercise:"Biceps skos siedząco",weight:17.5},
  {date:"2026-02-04",type:"pull",exercise:"Modlitewnik",weight:15},
  {date:"2026-02-04",type:"pull",exercise:"Młotki",weight:12.5},
];

const SEED_HISTORY = [...SEED_PUSH_PULL, ...NEW_FBW];

// ── MUSCLE GROUPS ─────────────────────────────────────────────────────────────
const MUSCLE_GROUPS = ["klata","plecy","barki","biceps","triceps","nogi","brzuch"];
const MUSCLE_COLORS = {klata:"#ef4444",plecy:"#3b82f6",barki:"#f97316",biceps:"#8b5cf6",triceps:"#eab308",nogi:"#22c55e",brzuch:"#06b6d4"};
const MUSCLE_LABELS = {klata:"Klatka",plecy:"Plecy",barki:"Barki",biceps:"Biceps",triceps:"Triceps",nogi:"Nogi",brzuch:"Brzuch"};

// All unique exercises with their muscle group
const getAllExercises = (customExercises=[]) => {
  const base = [...EXERCISES.push,...EXERCISES.pull,...EXERCISES.fbw];
  const seen = new Set();
  const result = [];
  base.forEach(ex => { if(!seen.has(ex.name)){ seen.add(ex.name); result.push({...ex}); } });
  customExercises.forEach(ex => { if(!seen.has(ex.name)){ seen.add(ex.name); result.push(ex); } });
  return result;
};

const typeColor = {push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308",work:"#4b5563",training:"#ef4444",recovery:"#e8d5b0",rest:"#374151"};

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{--bg:#080808;--card:#111;--card2:#1a1a1a;--border:#222;--text:#f0f0f0;--muted:#6b7280;--muted2:#9ca3af;--nav-h:68px;--push:#ef4444;--pull:#3b82f6;--fbw:#22c55e;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow:hidden;}
.light-mode{--bg:#f5f5f5;--card:#ffffff;--card2:#eeeeee;--border:#dddddd;--text:#111111;--muted:#6b7280;--muted2:#374151;}
.app{display:flex;flex-direction:column;height:100dvh;max-width:430px;margin:0 auto;position:relative;}
.screen{flex:1;overflow-y:auto;padding:0 0 var(--nav-h);}
.screen::-webkit-scrollbar{display:none;}
.nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;height:var(--nav-h);background:#0d0d0d;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;padding:0 8px 8px;z-index:100;}
.nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border:none;background:none;color:var(--muted);cursor:pointer;transition:color .2s;border-radius:12px;}
.nav-btn.active{color:var(--text);}
.nav-btn span{font-size:10px;font-weight:500;letter-spacing:.3px;}
.page-header{padding:52px 20px 16px;}
.page-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;line-height:1;}
.page-sub{color:var(--muted);font-size:13px;margin-top:4px;}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin:0 16px 12px;}
.card-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:12px;font-weight:600;}
.section-label{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:600;padding:0 20px;margin:16px 0 8px;}
.btn{border:none;border-radius:12px;padding:12px 20px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;transition:all .15s;}
.btn-primary{background:var(--push);color:#fff;width:100%;margin-top:10px;}
.btn-primary:active{transform:scale(.97);}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted2);}
.log-input{flex:1;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:16px;text-align:right;outline:none;transition:border-color .2s;}
.log-input:focus{border-color:var(--muted2);}
.log-row{display:flex;align-items:center;gap:12px;}
.log-label{font-size:13px;color:var(--muted2);width:90px;}
.ex-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);}
.ex-row:last-child{border:none;}
.ex-name{font-size:13px;color:var(--muted2);}
.ex-weight{font-family:'Bebas Neue',sans-serif;font-size:20px;}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:flex-end;backdrop-filter:blur(4px);}
.modal{background:var(--card);border-radius:20px 20px 0 0;padding:20px;width:100%;max-height:80vh;overflow-y:auto;}
.modal-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px;}
.modal-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1.5px;margin-bottom:12px;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal-dow{text-align:center;font-size:10px;color:var(--muted);font-weight:600;padding:4px 0 8px;letter-spacing:.5px;}
.cal-cell{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;position:relative;}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.animate-up{animation:slideUp .3s ease;}
.checkin-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.checkin-btn{background:var(--card2);border:1.5px solid var(--border);border-radius:12px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;transition:all .2s;}
.checkin-btn.active{border-color:currentColor;}
.stats-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 16px 12px;}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;}
.stat-val{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:1px;}
.type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 16px 12px;}
.type-card{background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:20px 16px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;gap:6px;}
.type-card:active{transform:scale(.97);}
`;

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({name,size=20,color="currentColor"}) => {
  const s={width:size,height:size,fill:"none",stroke:color,strokeWidth:2,viewBox:"0 0 24 24"};
  const icons={
    home:<svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    dumbbell:<svg {...s}><path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 12h12"/></svg>,
    food:<svg {...s}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    calendar:<svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chart:<svg {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    chevronL:<svg {...s}><polyline points="15 18 9 12 15 6"/></svg>,
    chevronR:<svg {...s}><polyline points="9 18 15 12 9 6"/></svg>,
    fire:<svg {...s} fill="#ef4444" stroke="none"><path d="M12 2s-5 5-5 10a5 5 0 0010 0C17 7 12 2 12 2zm0 14a2 2 0 01-2-2c0-2 2-4 2-4s2 2 2 4a2 2 0 01-2 2z"/></svg>,
    check:<svg {...s} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    plus:<svg {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    clock:<svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    trophy:<svg {...s}><path d="M6 9H2V4h4M18 9h4V4h-4M12 17v4M8 21h8"/><path d="M6 4h12v8a6 6 0 01-12 0V4z"/></svg>,
    gear:<svg {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    trash:<svg {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    camera:<svg {...s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  };
  return icons[name]||null;
};

// ── VIBRATE HELPER ────────────────────────────────────────────────────────────
const vibrate = (pattern=[100]) => { try { if(navigator.vibrate) navigator.vibrate(pattern); } catch{} };

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("today");
  const [dayLogs, setDayLogs]   = useState(() => storage.get("dayLogs",{}));
  const [customExercises, setCustomExercises] = useState(()=>storage.get("customExercises",[]));
  useEffect(()=>{ storage.set("customExercises",customExercises); },[customExercises]);

  const [history, setHistory]   = useState(() => {
    const savedVer = storage.get("dataVersion", 0);
    const saved = storage.get("gymHistory", null);
    if (!saved || savedVer < DATA_VERSION) {
      // Merge: add any seed entries not already present (by date+exercise)
      const base = saved || [];
      const existingKeys = new Set(base.map(e => e.date + e.exercise));
      const merged = [...base, ...SEED_HISTORY.filter(e => !existingKeys.has(e.date + e.exercise))];
      storage.set("gymHistory", merged);
      storage.set("dataVersion", DATA_VERSION);
      return merged;
    }
    return saved;
  });
  const [calDate, setCalDate]   = useState(() => { const n=new Date(); return {y:n.getFullYear(),m:n.getMonth()}; });
  const [selDay,  setSelDay]    = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => storage.get("appSettings",{vibration:true,notifications:false,darkMode:true}));

  useEffect(()=>{ storage.set("dayLogs",dayLogs); },[dayLogs]);
  useEffect(()=>{ storage.set("gymHistory",history); },[history]);
  useEffect(()=>{ storage.set("appSettings",settings); },[settings]);

  const todayStr = today();
  const saveDay = useCallback((data)=>{ setDayLogs(prev=>({...prev,[todayStr]:{...prev[todayStr],...data}})); },[todayStr]);

  const streak = (() => { let s=0,d=new Date(); for(let i=0;i<30;i++){ const ds=d.toISOString().slice(0,10); const l=dayLogs[ds]; if(l&&(l.type==="training"||l.workoutType)) s++; else if(i>0) break; d.setDate(d.getDate()-1); } return s; })();
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=d.toISOString().slice(0,10); const l=dayLogs[ds]; return !!(l&&(l.workoutType||l.type==="training")); });

  const workoutDates = {};
  history.forEach(e=>{ if(!workoutDates[e.date]) workoutDates[e.date]=e.type; });
  Object.entries(dayLogs).forEach(([d,l])=>{ if(l.workoutType&&!workoutDates[d]) workoutDates[d]=l.workoutType; });

  const todayLog = dayLogs[todayStr]||{};

  const toggleSetting = (key) => setSettings(p=>({...p,[key]:!p[key]}));

  return (
    <>
      <style>{css}</style>
      <div className={`app ${!settings.darkMode ? "light-mode" : ""}`}>
        <div className="screen">
          {tab==="today"    && <ScreenToday todayLog={todayLog} saveDay={saveDay} streak={streak} last7={last7} history={history} dayLogs={dayLogs} todayStr={todayStr} onSettings={()=>setShowSettings(true)} settings={settings}/>}
          {tab==="training" && <ScreenTraining history={history} setHistory={setHistory} saveDay={saveDay} todayStr={todayStr} dayLogs={dayLogs} settings={settings} customExercises={customExercises} setCustomExercises={setCustomExercises}/>}
          {tab==="diet"     && <ScreenDiet todayLog={todayLog} saveDay={saveDay}/>}
          {tab==="calendar" && <ScreenCalendar calDate={calDate} setCalDate={setCalDate} workoutDates={workoutDates} dayLogs={dayLogs} history={history} selDay={selDay} setSelDay={setSelDay} customExercises={customExercises}/>}
          {tab==="stats"    && <ScreenStats history={history} dayLogs={dayLogs} customExercises={customExercises}/>}
        </div>
        <nav className="nav">
          {[{id:"today",icon:"home",label:"Dziś"},{id:"training",icon:"dumbbell",label:"Trening"},{id:"diet",icon:"food",label:"Dieta"},{id:"calendar",icon:"calendar",label:"Kalendarz"},{id:"stats",icon:"chart",label:"Statystyki"}].map(n=>(
            <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
              <Icon name={n.icon} size={22}/><span>{n.label}</span>
            </button>
          ))}
        </nav>
        {showSettings && <SettingsModal settings={settings} toggle={toggleSetting} onClose={()=>setShowSettings(false)} history={history} dayLogs={dayLogs}/>}
      </div>
    </>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────
function SettingsModal({settings,toggle,onClose,history,dayLogs}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div className="modal-title">USTAWIENIA</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>v{APP_VERSION}</div>
        </div>
        {[
          {key:"vibration",   label:"Wibracja",            emoji:"📳"},
          {key:"notifications",label:"Powiadomienia",      emoji:"🔔"},
          {key:"darkMode",    label:"Tryb ciemny",         emoji:"🌙"},
        ].map(({key,label,emoji})=>(
          <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:15}}>{emoji} {label}</span>
            <div onClick={()=>toggle(key)} style={{width:48,height:26,borderRadius:13,background:settings[key]?"#ef4444":"#333",cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,left:settings[key]?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
            </div>
          </div>
        ))}
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{
            const data = JSON.stringify({history,dayLogs,exportDate:today()});
            const blob = new Blob([data],{type:"application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href=url; a.download="gymtracker-backup.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),100);
          }}>📤 Eksport danych (JSON)</button>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{
            // CSV export
            const rows = [["Data","Typ","Ćwiczenie","Ciężar (kg)","Serie"]];
            const sorted = [...history].sort((a,b)=>new Date(a.date)-new Date(b.date));
            sorted.forEach(e=>rows.push([e.date,e.type,e.exercise,e.weight,e.sets||3]));
            const csv = rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
            const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href=url; a.download="gymtracker-treningi.csv"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),100);
          }}>📊 Eksport treningów (CSV/Arkusz)</button>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{
            // HTML report that prints as PDF
            const sorted = [...history].sort((a,b)=>new Date(a.date)-new Date(b.date));
            const byDate = {};
            sorted.forEach(e=>{ if(!byDate[e.date]) byDate[e.date]={type:e.type,exercises:[]}; byDate[e.date].exercises.push(e); });
            const rows = Object.entries(byDate).reverse().map(([date,{type,exercises}])=>
              exercises.map((e,i)=>`<tr><td>${i===0?date:""}</td><td>${i===0?type.toUpperCase():""}</td><td>${e.exercise}</td><td>${e.weight} kg</td><td>${e.sets||3}</td></tr>`).join("")
            ).join("");
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GymTracker Raport</title><style>body{font-family:sans-serif;padding:20px}h1{color:#ef4444}table{width:100%;border-collapse:collapse}th{background:#ef4444;color:white;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}@media print{button{display:none}}</style></head><body><h1>🔥 GymTracker Pro – Raport</h1><p>Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}</p><br><button onclick="window.print()">🖨️ Drukuj / Zapisz PDF</button><br><br><table><tr><th>Data</th><th>Typ</th><th>Ćwiczenie</th><th>Ciężar</th><th>Serie</th></tr>${rows}</table></body></html>`;
            const blob = new Blob([html],{type:"text/html"});
            const url = URL.createObjectURL(blob);
            window.open(url,"_blank"); setTimeout(()=>URL.revokeObjectURL(url),1000);
          }}>🖨️ Raport PDF (drukuj)</button>
          <button className="btn btn-ghost" style={{width:"100%",color:"#ef4444",borderColor:"#ef444433"}} onClick={()=>{
            if(confirm("Resetować wszystkie dane?")){ localStorage.clear(); window.location.reload(); }
          }}>🗑️ Resetuj dane</button>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{marginTop:10}}>Zamknij</button>
      </div>
    </div>
  );
}

// ── SCREEN: DZIŚ ──────────────────────────────────────────────────────────────
function ScreenToday({todayLog,saveDay,streak,last7,history,dayLogs,todayStr,onSettings}) {
  const [steps,setSteps]       = useState(todayLog.steps||"");
  const [calories,setCalories] = useState(todayLog.calories||"");
  const [saved,setSaved]       = useState(!!(todayLog.steps));
  const now = new Date();
  const greet = now.getHours()<12?"Dzień dobry":now.getHours()<18?"Cześć":"Dobry wieczór";
  const lastWorkout = [...history].reverse().find(e=>e.date<todayStr)||null;
  const daysAgo = lastWorkout ? Math.floor((new Date(todayStr)-new Date(lastWorkout.date))/(86400000)) : null;
  const tColors={work:"#6b7280",training:"#ef4444",recovery:"#22c55e",push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308"};

  return (
    <div className="animate-up">
      <div className="page-header" style={{paddingBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div className="page-sub">{greet} 👋</div>
            <div className="page-title">DZIŚ</div>
            <div className="page-sub">{now.toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,marginTop:8}}>
            <button onClick={onSettings} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}>
              <Icon name="gear" size={18}/>
            </button>
            <div style={{fontSize:10,color:"var(--muted)",letterSpacing:.5}}>v{APP_VERSION}</div>
          </div>
        </div>
      </div>

      <div className="section-label">Typ dnia</div>
      <div className="card">
        <div className="card-title">Poranny check-in</div>
        <div className="checkin-grid">
          {[{id:"work",emoji:"💼",label:"Praca"},{id:"training",emoji:"🔥",label:"Trening"},{id:"recovery",emoji:"🧘",label:"Regeneracja"}].map(t=>(
            <button key={t.id} className={`checkin-btn ${todayLog.type===t.id?"active":""}`}
              style={{color:todayLog.type===t.id?tColors[t.id]:undefined}}
              onClick={()=>saveDay({type:t.id})}>
              <span style={{fontSize:22}}>{t.emoji}</span>
              <span style={{fontSize:11,fontWeight:600}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div style={{marginBottom:6}}><Icon name="fire" size={18}/></div>
          <div className="stat-val" style={{color:"#ef4444"}}>{streak}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>dni aktywności 🔥</div>
          <div style={{display:"flex",gap:5,marginTop:8}}>
            {last7.map((d,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:d?"#ef4444":"var(--border)"}}/>)}
          </div>
        </div>
        <div className="stat-card">
          <div style={{marginBottom:6}}><Icon name="trophy" size={18}/></div>
          <div className="stat-val" style={{color:"#eab308"}}>{daysAgo??"-"}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>dni od treningu</div>
          {lastWorkout && <div style={{marginTop:6,fontSize:10,fontWeight:700,letterSpacing:.8,padding:"3px 8px",borderRadius:6,background:tColors[lastWorkout.type]+"22",color:tColors[lastWorkout.type],display:"inline-block"}}>{lastWorkout.type.toUpperCase()}</div>}
        </div>
      </div>

      {lastWorkout && (
        <>
          <div className="section-label">Ostatni trening</div>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:tColors[lastWorkout.type]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                {lastWorkout.type==="push"?"🔴":lastWorkout.type==="pull"?"🔵":"🟢"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{lastWorkout.type.toUpperCase()} – {fmt(lastWorkout.date)}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{history.filter(e=>e.date===lastWorkout.date).length} ćwiczeń · {daysAgo} {daysAgo===1?"dzień":"dni"} temu</div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="section-label">Aktywność z zegarka</div>
      <div className="card">
        <div className="card-title">Wieczorny wpis</div>
        {saved&&todayLog.steps ? (
          <div style={{display:"flex",gap:20,marginBottom:12}}>
            <div><div style={{fontFamily:"'Bebas Neue'",fontSize:26}}>{(todayLog.steps||0).toLocaleString()}</div><div style={{fontSize:11,color:"var(--muted)"}}>kroków</div></div>
            <div><div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:"#ef4444"}}>{todayLog.calories||0}</div><div style={{fontSize:11,color:"var(--muted)"}}>kcal aktywnych</div></div>
          </div>
        ):null}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div className="log-row"><span className="log-label">👟 Kroki</span><input className="log-input" type="number" placeholder="np. 8000" value={steps} onChange={e=>setSteps(e.target.value)}/></div>
          <div className="log-row"><span className="log-label">🔥 Kcal aktywne</span><input className="log-input" type="number" placeholder="np. 450" value={calories} onChange={e=>setCalories(e.target.value)}/></div>
          <button className="btn btn-primary" onClick={()=>{saveDay({steps:Number(steps)||0,calories:Number(calories)||0});setSaved(true);}}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: TRENING ───────────────────────────────────────────────────────────
function ScreenTraining({history,setHistory,saveDay,todayStr,dayLogs,settings,customExercises,setCustomExercises}) {
  const [phase,setPhase]       = useState("select");
  const [selType,setSelType]   = useState(null);
  const [mainTab,setMainTab]   = useState("workout"); // workout | exercises
  const [editEx,setEditEx]     = useState(null);
  const [showAddEx,setShowAddEx] = useState(false);
  const [newEx,setNewEx]       = useState({name:"",muscle:"klata"});

  const tColors={push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308",
    klata:"#ef4444",plecy:"#3b82f6",barki:"#f97316",biceps:"#8b5cf6",triceps:"#eab308",nogi:"#22c55e"};

  const workoutTypes=[
    {id:"push",  emoji:"🔴",name:"PUSH",   desc:"Klata · Barki · Triceps · 3 serie"},
    {id:"pull",  emoji:"🔵",name:"PULL",   desc:"Plecy · Biceps · 3 serie"},
    {id:"fbw",   emoji:"🟢",name:"FBW",    desc:"Full Body · 3 serie"},
    {id:"cardio",emoji:"🟡",name:"CARDIO", desc:"Spacer · Bieżnia · Schody"},
  ];
  const muscleTypes=[
    {id:"klata",  emoji:"💪",name:"KLATKA",  desc:"Ćwiczenia na klatkę"},
    {id:"plecy",  emoji:"🔵",name:"PLECY",   desc:"Ćwiczenia na plecy"},
    {id:"barki",  emoji:"🟠",name:"BARKI",   desc:"Ćwiczenia na barki"},
    {id:"biceps", emoji:"🟣",name:"BICEPS",  desc:"Ćwiczenia na biceps"},
    {id:"triceps",emoji:"🟡",name:"TRICEPS", desc:"Ćwiczenia na triceps"},
    {id:"nogi",   emoji:"🟢",name:"NOGI",    desc:"Ćwiczenia na nogi"},
  ];

  if(phase==="cardio") return <CardioView onBack={()=>setPhase("select")} saveDay={saveDay} todayStr={todayStr}/>;
  if(phase==="session") return <SessionView type={selType} history={history} setHistory={setHistory} todayStr={todayStr} onBack={()=>{setPhase("select");}} saveDay={saveDay} settings={settings} customExercises={customExercises}/>;

  const allEx = getAllExercises(customExercises);

  const saveEditEx = () => {
    if(!editEx) return;
    const existing = customExercises.find(e=>e.name===editEx.originalName||e.editOf===editEx.originalName);
    if(existing) {
      // Update existing custom exercise
      setCustomExercises(prev=>prev.map(e=>(e.name===editEx.originalName||e.editOf===editEx.originalName)?{...e,name:editEx.name,muscle:editEx.muscle,editOf:editEx.originalName}:e));
    } else {
      // Add override for built-in exercise
      setCustomExercises(prev=>[...prev,{id:`custom_${Date.now()}`,name:editEx.name,muscle:editEx.muscle,editOf:editEx.originalName}]);
    }
    // Also update history entries to use new name
    if(editEx.name !== editEx.originalName) {
      setHistory(prev=>prev.map(e=>e.exercise===editEx.originalName?{...e,exercise:editEx.name}:e));
    }
    setEditEx(null);
  };

  const deleteExercise = (ex) => {
    // Remove from custom exercises
    setCustomExercises(prev=>prev.filter(e=>e.name!==ex.name&&e.editOf!==ex.name));
    setEditEx(null);
  };

  const deleteCustomEx = (name) => {
    setCustomExercises(prev=>prev.filter(e=>e.name!==name));
  };

  return (
    <div className="animate-up">
      <div className="page-header"><div className="page-sub">Wybierz typ</div><div className="page-title">TRENING</div></div>

      {/* MAIN TABS */}
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {[["workout","💪 Trening"],["exercises","📋 Ćwiczenia"]].map(([id,label])=>(
          <button key={id} onClick={()=>setMainTab(id)}
            style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${mainTab===id?"#ef4444":"var(--border)"}`,background:mainTab===id?"#ef444422":"var(--card2)",color:mainTab===id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {mainTab==="workout" && <>
        <div className="section-label">Typ treningu</div>
        <div className="type-grid">
          {workoutTypes.map(t=>(
            <div key={t.id} className="type-card" style={{borderColor:selType===t.id?tColors[t.id]:"var(--border)"}}
              onClick={()=>{setSelType(t.id);setPhase(t.id==="cardio"?"cardio":"session");saveDay({workoutType:t.id,type:"training"});}}>
              <span style={{fontSize:28}}>{t.emoji}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1.5,color:tColors[t.id]}}>{t.name}</span>
              <span style={{fontSize:11,color:"var(--muted)"}}>{t.desc}</span>
            </div>
          ))}
        </div>
        <div className="section-label">Partia ciała</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"0 16px 16px"}}>
          {muscleTypes.map(t=>(
            <div key={t.id} onClick={()=>{setSelType(t.id);setPhase("session");saveDay({workoutType:t.id,type:"training"});}}
              style={{background:"var(--card)",border:`1.5px solid var(--border)`,borderRadius:14,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .2s"}}
              onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"} onMouseUp={e=>e.currentTarget.style.transform=""}>
              <span style={{fontSize:24}}>{t.emoji}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:tColors[t.id]||"var(--muted2)"}}>{t.name}</span>
            </div>
          ))}
        </div>
        <div className="section-label">Historia</div>
        {["push","pull","fbw"].map(type=>{
          const dates=[...new Set(history.filter(e=>e.type===type).map(e=>e.date))].sort((a,b)=>new Date(b)-new Date(a)).slice(0,2);
          return dates.length?(
            <div key={type} className="card" style={{marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:tColors[type],marginBottom:8}}>{type.toUpperCase()}</div>
              {dates.map(d=>(
                <div key={d} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:13,color:"var(--muted2)"}}>{fmt(d)}</span>
                  <span style={{fontSize:13}}>{history.filter(e=>e.date===d&&e.type===type).length} ćw.</span>
                </div>
              ))}
            </div>
          ):null;
        })}
      </>}

      {mainTab==="exercises" && <>
        <div style={{margin:"0 16px 12px"}}>
          <button onClick={()=>setShowAddEx(s=>!s)} className="btn btn-primary" style={{background:showAddEx?"#333":"#ef4444"}}>
            {showAddEx?"✕ Anuluj":"+ Dodaj nowe ćwiczenie"}
          </button>
        </div>
        {showAddEx && (
          <div className="card" style={{marginBottom:12}}>
            <div className="card-title">Nowe ćwiczenie</div>
            <input placeholder="Nazwa ćwiczenia" value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))}
              style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:14,outline:"none",marginBottom:10}}/>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Partia ciała:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {MUSCLE_GROUPS.map(m=>(
                  <button key={m} onClick={()=>setNewEx(p=>({...p,muscle:m}))}
                    style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${newEx.muscle===m?MUSCLE_COLORS[m]:"var(--border)"}`,background:newEx.muscle===m?MUSCLE_COLORS[m]+"22":"var(--card2)",color:newEx.muscle===m?MUSCLE_COLORS[m]:"var(--muted)",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={()=>{
              if(!newEx.name.trim()) return;
              setCustomExercises(prev=>[...prev,{id:`custom_${Date.now()}`,name:newEx.name.trim(),muscle:newEx.muscle}]);
              setNewEx({name:"",muscle:"klata"});
              setShowAddEx(false);
            }}>Zapisz ćwiczenie</button>
          </div>
        )}

        {MUSCLE_GROUPS.map(muscle=>{
          const exForMuscle = allEx.filter(e=>e.muscle===muscle);
          if(!exForMuscle.length) return null;
          return (
            <div key={muscle} className="card" style={{marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUSCLE_COLORS[muscle],marginBottom:8,letterSpacing:1}}>{MUSCLE_LABELS[muscle].toUpperCase()}</div>
              {exForMuscle.map(ex=>{
                const lastEntry = [...history].filter(e=>e.exercise===ex.name).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
                return (
                  <div key={ex.id||ex.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{ex.name}</div>
                      {lastEntry&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{fmt(lastEntry.date)} · {lastEntry.weight}kg</div>}
                    </div>
                    <button onClick={()=>setEditEx({name:ex.name,muscle:ex.muscle,originalName:ex.name})}
                      style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",color:"var(--muted2)",fontSize:12,cursor:"pointer"}}>
                      ✏️
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>}

      {/* EDIT EXERCISE MODAL */}
      {editEx && (
        <div className="modal-backdrop" onClick={()=>setEditEx(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">EDYTUJ ĆWICZENIE</div>
            <input value={editEx.name} onChange={e=>setEditEx(p=>({...p,name:e.target.value}))}
              style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:14,outline:"none",marginBottom:12}}/>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>Partia ciała:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {MUSCLE_GROUPS.map(m=>(
                  <button key={m} onClick={()=>setEditEx(p=>({...p,muscle:m}))}
                    style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${editEx.muscle===m?MUSCLE_COLORS[m]:"var(--border)"}`,background:editEx.muscle===m?MUSCLE_COLORS[m]+"22":"var(--card2)",color:editEx.muscle===m?MUSCLE_COLORS[m]:"var(--muted)",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveEditEx}>Zapisz</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8,color:"#ef4444",borderColor:"#ef444433"}}
              onClick={()=>deleteExercise(editEx)}>
              🗑️ Usuń ćwiczenie
            </button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditEx(null)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ── SESSION VIEW ──────────────────────────────────────────────────────────────
function SessionView({type,history,setHistory,todayStr,onBack,saveDay,settings,customExercises=[]}) {
  const SETS = 3;
  const muscleColorMap={klata:"#ef4444",plecy:"#3b82f6",barki:"#f97316",biceps:"#8b5cf6",triceps:"#eab308",nogi:"#22c55e"};
  const color={push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308",...muscleColorMap}[type]||"#ef4444";
  // For muscle-based sessions, get all exercises for that muscle
  const isMuscleSession = MUSCLE_GROUPS.includes(type);
  const allEx = getAllExercises(customExercises);
  const exList = isMuscleSession
    ? allEx.filter(e=>e.muscle===type)
    : (EXERCISES[type]||[]);
  const [weights,setWeights]   = useState({});
  const [done,setDone]         = useState({});
  const [startTime]            = useState(Date.now());
  const [elapsed,setElapsed]   = useState(0);
  const [note,setNote]         = useState("");
  const [finished,setFinished] = useState(false);
  const [restTimer,setRestTimer]= useState(null);
  const [restActive,setRestActive]=useState(false);
  const REST_DURATION = 180; // 3 minutes

  useEffect(()=>{ const t=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000); return ()=>clearInterval(t); },[startTime]);
  useEffect(()=>{
    if(restTimer===null) return;
    if(restTimer<=0){ setRestTimer(null); setRestActive(false); if(settings?.vibration) vibrate([200,100,200]); return; }
    const t=setTimeout(()=>setRestTimer(r=>r-1),1000);
    return()=>clearTimeout(t);
  },[restTimer,settings]);

  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const getLastWeight=useCallback((exName)=>{
    const m=history.filter(e=>e.exercise===exName&&e.type===type).sort((a,b)=>new Date(b.date)-new Date(a.date));
    return m[0]?.weight??null;
  },[history,type]);

  const isPR=(exName,w)=>{ const prev=history.filter(e=>e.exercise===exName&&e.type===type).map(e=>e.weight); return prev.length>0&&w>Math.max(...prev); };

  const toggleSet=(exId,setIdx)=>{
    setDone(prev=>{
      const cur=prev[exId]||Array(SETS).fill(false);
      const next=[...cur]; next[setIdx]=!next[setIdx];
      if(next[setIdx]){ setRestTimer(REST_DURATION); setRestActive(true); if(settings?.vibration) vibrate([100]); }
      return{...prev,[exId]:next};
    });
  };

  const totalSets=exList.length*SETS;
  const doneSets=Object.values(done).reduce((s,arr)=>s+arr.filter(Boolean).length,0);

  const handleFinish=()=>{
    const newEntries=exList.filter(ex=>weights[ex.id]).map(ex=>({date:todayStr,type,exercise:ex.name,weight:parseFloat(weights[ex.id]),sets:SETS,id:`${todayStr}-${ex.id}-${Date.now()}`}));
    if(newEntries.length) setHistory(prev=>{
      // Remove any existing entries for today+type to prevent duplicates
      const filtered=prev.filter(e=>!(e.date===todayStr&&e.type===type&&newEntries.some(n=>n.exercise===e.exercise)));
      return [...filtered,...newEntries];
    });
    saveDay({type:"training",workoutType:type,duration:elapsed,note,setsCompleted:doneSets});
    setFinished(true);
    if(settings?.vibration) vibrate([300,100,300,100,300]);
  };

  if(finished) return (
    <div className="animate-up" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:24,textAlign:"center"}}>
      <div style={{fontSize:64}}>🏆</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>TRENING UKOŃCZONY!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>Czas: {fmtTime(elapsed)}</div>
      <div style={{color:"var(--muted)",fontSize:14}}>{Object.values(weights).filter(Boolean).length} ćwiczeń · {doneSets} serii</div>
      <button className="btn btn-primary" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button>
    </div>
  );

  return (
    <div className="animate-up">
      <div style={{padding:"48px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}>
          <Icon name="chevronL" size={18}/>
        </button>
        <div style={{flex:1,fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>{type.toUpperCase()}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"6px 12px"}}>
          <Icon name="clock" size={14}/><span style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{fmtTime(elapsed)}</span>
        </div>
      </div>

      <div style={{margin:"0 20px 8px",background:"var(--border)",borderRadius:4,height:4}}>
        <div style={{height:"100%",borderRadius:4,background:color,width:`${totalSets>0?doneSets/totalSets*100:0}%`,transition:"width .3s"}}/>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginBottom:12}}>{doneSets}/{totalSets} serii</div>

      {restActive&&restTimer!==null&&(
        <div style={{margin:"0 16px 12px",background:color+"22",border:`1px solid ${color}44`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color,fontWeight:700,letterSpacing:1}}>PRZERWA</div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:40,color,lineHeight:1}}>{fmtTime(restTimer)}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>3 minuty odpoczynku</div>
          </div>
          <button onClick={()=>{setRestTimer(null);setRestActive(false);}} style={{background:color,border:"none",borderRadius:10,padding:"10px 18px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Pomiń</button>
        </div>
      )}

      {exList.map(ex=>{
        const lastW=getLastWeight(ex.name);
        const w=parseFloat(weights[ex.id])||0;
        const pr=w>0&&isPR(ex.name,w);
        const exDone=(done[ex.id]||[]).filter(Boolean).length===SETS;
        return (
          <div key={ex.id} className="card" style={{opacity: exDone ? 0.85 : 1, transition:"opacity .2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{ex.name}</div>
                <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginTop:2}}>{ex.muscle}</div>
              </div>
              <div style={{textAlign:"right"}}>
                {pr&&<div style={{fontSize:10,fontWeight:700,color:"#eab308"}}>🏆 REKORD!</div>}
                {lastW&&<div style={{fontSize:11,color:"var(--muted)"}}>Ostatnio: <strong>{lastW} kg</strong></div>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <input type="number" step="0.5" placeholder={lastW?`${lastW}`:"kg"} value={weights[ex.id]||""}
                onChange={e=>setWeights(p=>({...p,[ex.id]:e.target.value}))}
                style={{flex:1,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:16,outline:"none"}}/>
              <span style={{fontSize:13,color:"var(--muted)"}}>kg</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {Array.from({length:SETS},(_,i)=>{
                const s=(done[ex.id]||[])[i];
                return (
                  <button key={i} onClick={()=>toggleSet(ex.id,i)}
                    style={{flex:1,height:40,borderRadius:8,border:`1.5px solid ${s?color:"var(--border)"}`,background:s?color+"22":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:s?color:"var(--muted)",transition:"all .15s",fontSize:12,fontWeight:600}}>
                    {s?<Icon name="check" size={14}/>:`Seria ${i+1}`}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="card">
        <div className="card-title">Notatka</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Jak poszło? Samopoczucie, uwagi..."
          style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",resize:"none",height:72}}/>
      </div>
      <div style={{padding:"0 16px 16px"}}>
        <button className="btn btn-primary" onClick={handleFinish}>✓ Zakończ trening ({fmtTime(elapsed)})</button>
      </div>
    </div>
  );
}

// ── CARDIO VIEW ───────────────────────────────────────────────────────────────
function CardioView({onBack,saveDay,todayStr}) {
  const [type,setType]=useState(null);
  const [km,setKm]=useState("");
  const [time,setTime]=useState("");
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{ if(!running)return; const t=setInterval(()=>setElapsed(e=>e+1),1000); return()=>clearInterval(t); },[running]);
  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const color="#eab308";
  const handleSave=()=>{ saveDay({type:"cardio",cardio:{activityType:type,km:parseFloat(km)||0,time:time||fmtTime(elapsed),elapsed}}); setSaved(true); };
  if(saved) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:24}}>
      <div style={{fontSize:64}}>✅</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:2}}>ZAPISANO!</div>
      <button className="btn btn-primary" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button>
    </div>
  );
  return (
    <div className="animate-up">
      <div style={{padding:"48px 20px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Icon name="chevronL" size={18}/></button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>CARDIO</div>
      </div>
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {[{id:"walk",emoji:"🚶",name:"Spacer"},{id:"treadmill",emoji:"🏃",name:"Bieżnia"},{id:"stairs",emoji:"🪜",name:"Schody"}].map(ct=>(
          <button key={ct.id} onClick={()=>setType(ct.id)}
            style={{flex:1,background:type===ct.id?"#eab30822":"var(--card)",border:`1.5px solid ${type===ct.id?"#eab308":"var(--border)"}`,borderRadius:14,padding:"14px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:26}}>{ct.emoji}</span>
            <span style={{fontSize:12,fontWeight:700,color:type===ct.id?"#eab308":"var(--muted)"}}>{ct.name}</span>
          </button>
        ))}
      </div>
      {type&&(<>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:4,color}}>{fmtTime(elapsed)}</div>
          <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center"}}>
            <button onClick={()=>setRunning(r=>!r)} style={{background:running?"#ef444422":"#eab30822",border:`1.5px solid ${running?"#ef4444":"#eab308"}`,borderRadius:12,padding:"10px 24px",color:running?"#ef4444":"#eab308",fontWeight:700,cursor:"pointer",fontSize:14}}>{running?"⏸ Pauza":"▶ Start"}</button>
            <button onClick={()=>{setRunning(false);setElapsed(0);}} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 16px",color:"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:14}}>Reset</button>
          </div>
        </div>
        <div className="card">
          {(type==="walk"||type==="treadmill")&&<div className="log-row" style={{marginBottom:10}}><span className="log-label">📏 km</span><input className="log-input" type="number" step="0.1" placeholder="3.5" value={km} onChange={e=>setKm(e.target.value)}/></div>}
          <div className="log-row"><span className="log-label">⏱ Czas</span><input className="log-input" type="text" placeholder="mm:ss" value={time} onChange={e=>setTime(e.target.value)}/></div>
        </div>
        <div style={{padding:"0 16px 16px"}}><button className="btn btn-primary" onClick={handleSave}>✓ Zapisz aktywność</button></div>
      </>)}
    </div>
  );
}

// ── SCREEN: DIETA ─────────────────────────────────────────────────────────────
function ScreenDiet({todayLog,saveDay}) {
  const [meals,setMeals]         = useState(()=>storage.get("meals",[]));
  const [goalKcal,setGoalKcal]   = useState(()=>storage.get("goalKcal",2200));
  const [editGoal,setEditGoal]   = useState(false);
  const [historyTab,setHistoryTab]=useState("today");
  const [showAdd,setShowAdd]     = useState(false);
  const [newMeal,setNewMeal]     = useState({name:"",kcal:"",protein:"",carbs:"",fat:""});
  const [imgPreview,setImgPreview]=useState(null);

  useEffect(()=>{ storage.set("meals",meals); },[meals]);
  useEffect(()=>{ storage.set("goalKcal",goalKcal); },[goalKcal]);

  const todayStr=today();
  const todayMeals=meals.filter(m=>m.date===todayStr);
  const totalKcal=todayMeals.reduce((s,m)=>s+(m.kcal||0),0);
  const totalProt=todayMeals.reduce((s,m)=>s+(m.protein||0),0);
  const totalCarb=todayMeals.reduce((s,m)=>s+(m.carbs||0),0);
  const totalFat=todayMeals.reduce((s,m)=>s+(m.fat||0),0);
  const pct=Math.min(100,Math.round((totalKcal/goalKcal)*100));

  const last7kcal=Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=d.toISOString().slice(0,10); const label=["Pn","Wt","Śr","Cz","Pt","So","Nd"][d.getDay()===0?6:d.getDay()-1]; return{ds,label,kcal:meals.filter(m=>m.date===ds).reduce((s,m)=>s+(m.kcal||0),0)}; });
  const maxKcal=Math.max(...last7kcal.map(d=>d.kcal),goalKcal,1);

  const handlePhoto=(e)=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setImgPreview(ev.target.result); r.readAsDataURL(f); };

  const saveMeal=()=>{
    if(!newMeal.name) return;
    const meal={...newMeal,kcal:Number(newMeal.kcal)||0,protein:Number(newMeal.protein)||0,carbs:Number(newMeal.carbs)||0,fat:Number(newMeal.fat)||0,date:todayStr,time:new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}),id:Date.now(),img:imgPreview};
    setMeals(prev=>[meal,...prev]);
    setNewMeal({name:"",kcal:"",protein:"",carbs:"",fat:""});
    setImgPreview(null);
    setShowAdd(false);
  };

  const historyDates=[...new Set(meals.filter(m=>m.date!==todayStr).map(m=>m.date))].sort().reverse().slice(0,14);

  return (
    <div className="animate-up">
      <div className="page-header"><div className="page-sub">Dziennik</div><div className="page-title">DIETA</div></div>

      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:totalKcal>goalKcal?"#ef4444":"#22c55e"}}>{totalKcal}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>z {goalKcal} kcal celu</div>
          </div>
          <button onClick={()=>setEditGoal(e=>!e)} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",color:"var(--muted2)",fontSize:12,cursor:"pointer",fontWeight:600}}>{editGoal?"Zamknij":"Cel kcal"}</button>
        </div>
        {editGoal&&<div className="log-row" style={{marginBottom:10}}><span className="log-label">🎯 Cel</span><input className="log-input" type="number" value={goalKcal} onChange={e=>setGoalKcal(Number(e.target.value))}/></div>}
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

      {/* WEEKLY CHART */}
      <div className="card">
        <div className="card-title">Kalorie – 7 dni</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80,marginBottom:4}}>
          {last7kcal.map((d,i)=>{
            const h=Math.max(4,(d.kcal/maxKcal)*76);
            const isT=d.ds===todayStr;
            const over=d.kcal>goalKcal;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{fontSize:8,color:"var(--muted)",height:14,display:"flex",alignItems:"flex-end"}}>{d.kcal>0?d.kcal:""}</div>
                <div style={{width:"100%",height:h,borderRadius:4,background:isT?(over?"#ef4444":"#22c55e"):over?"#ef444433":"#3b82f633",border:isT?`1px solid ${over?"#ef4444":"#22c55e"}`:"none"}}/>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:4}}>{last7kcal.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:d.ds===todayStr?"var(--text)":"var(--muted)",fontWeight:d.ds===todayStr?700:400}}>{d.label}</div>)}</div>
      </div>

      {/* ADD MEAL */}
      <div style={{margin:"0 16px 12px"}}>
        <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-primary" style={{background:showAdd?"#333":"#ef4444"}}>{showAdd?"✕ Anuluj":"+ Dodaj posiłek"}</button>
      </div>

      {showAdd&&(
        <div className="card">
          <div className="card-title">Nowy posiłek</div>
          {imgPreview&&<img src={imgPreview} alt="" style={{width:"100%",borderRadius:10,marginBottom:10,maxHeight:150,objectFit:"cover"}}/>}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:"10px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <Icon name="camera" size={20}/><span style={{fontSize:10,color:"var(--muted)"}}>Aparat</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
            </label>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:"10px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <span style={{fontSize:20}}>🖼️</span><span style={{fontSize:10,color:"var(--muted)"}}>Galeria</span>
              <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </label>
          </div>
          <input placeholder="Nazwa posiłku *" value={newMeal.name} onChange={e=>setNewMeal(p=>({...p,name:e.target.value}))}
            style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:14,outline:"none",marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["kcal","🔥 Kalorie","kcal"],["protein","🥩 Białko","g"],["carbs","🍞 Węgle","g"],["fat","🧈 Tłuszcze","g"]].map(([key,label,unit])=>(
              <div key={key}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>{label}</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input type="number" placeholder="0" value={newMeal[key]} onChange={e=>setNewMeal(p=>({...p,[key]:e.target.value}))}
                    style={{width:"100%",minWidth:0,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 6px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",textAlign:"right"}}/>
                  <span style={{fontSize:10,color:"var(--muted)",flexShrink:0}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={saveMeal}>✓ Zapisz posiłek</button>
        </div>
      )}

      <div style={{display:"flex",gap:8,margin:"4px 16px 8px"}}>
        {[["today","Dziś"],["history","Historia"]].map(([id,label])=>(
          <button key={id} onClick={()=>setHistoryTab(id)}
            style={{flex:1,padding:"8px",borderRadius:10,border:`1.5px solid ${historyTab===id?"#22c55e":"var(--border)"}`,background:historyTab===id?"#22c55e22":"var(--card2)",color:historyTab===id?"#22c55e":"var(--muted)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {historyTab==="today"?(
        todayMeals.length>0?todayMeals.map(m=>(
          <div key={m.id} className="card" style={{marginBottom:8}}>
            {m.img&&<img src={m.img} alt="" style={{width:"100%",borderRadius:10,marginBottom:8,maxHeight:120,objectFit:"cover"}}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.time} · B:{m.protein}g W:{m.carbs}g T:{m.fat}g</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#22c55e"}}>{m.kcal}</span>
                <button onClick={()=>setMeals(prev=>prev.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:18,padding:4}}>×</button>
              </div>
            </div>
          </div>
        )):<div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontSize:13}}>Brak posiłków dzisiaj</div>
      ):(
        historyDates.length>0?historyDates.map(ds=>{
          const dm=meals.filter(m=>m.date===ds);
          const dk=dm.reduce((s,m)=>s+(m.kcal||0),0);
          return (
            <div key={ds} className="card" style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{fmt(ds)}</span>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:dk>goalKcal?"#ef4444":"#22c55e"}}>{dk} kcal</span>
              </div>
              {dm.slice(0,3).map(m=>(
                <div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:"1px solid var(--border)"}}>
                  <span style={{fontSize:12,color:"var(--muted2)"}}>{m.name}</span>
                  <span style={{fontSize:12,color:"var(--muted)"}}>{m.kcal} kcal</span>
                </div>
              ))}
              {dm.length>3&&<div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>+{dm.length-3} więcej</div>}
            </div>
          );
        }):<div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontSize:13}}>Brak historii</div>
      )}
    </div>
  );
}

// ── WEEKLY MUSCLE PROGRESS ────────────────────────────────────────────────────
function WeeklyMuscleProgress({history,customExercises=[]}) {
  const DEFAULT_GOALS = {klata:9,barki:9,triceps:6,plecy:12,biceps:9,nogi:6};
  const [goals,setGoals]   = useState(()=>storage.get("weeklyGoals",DEFAULT_GOALS));
  const [editGoals,setEditGoals] = useState(false);
  const [tempGoals,setTempGoals] = useState({});
  useEffect(()=>{ storage.set("weeklyGoals",goals); },[goals]);

  const now = new Date();
  const dayOfWeek = (now.getDay()+6)%7;
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-dayOfWeek);
  const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d.toISOString().slice(0,10); });
  const weekEntries = history.filter(e=>weekDays.includes(e.date));
  const muscleMap = {};
  getAllExercises(customExercises).forEach(ex=>{ muscleMap[ex.name]=ex.muscle; });
  const muscleSets = {};
  weekEntries.forEach(e=>{ const m=muscleMap[e.exercise]||null; if(m) muscleSets[m]=(muscleSets[m]||0)+(e.sets||3); });

  const wStart = weekStart.toLocaleDateString("pl-PL",{day:"numeric",month:"short"});
  const wEnd = new Date(weekStart); wEnd.setDate(weekStart.getDate()+6);
  const wEndStr = wEnd.toLocaleDateString("pl-PL",{day:"numeric",month:"short"});
  const muscles = ["klata","plecy","barki","biceps","triceps","nogi"];

  return (
    <>
      <div className="section-label">Tydzień – serie na partię ciała</div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:11,color:"var(--muted)"}}>{wStart} – {wEndStr}</div>
          <button onClick={()=>{ setTempGoals({...goals}); setEditGoals(true); }}
            style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"5px 10px",color:"var(--muted2)",fontSize:11,cursor:"pointer",fontWeight:600}}>
            ✏️ Cele
          </button>
        </div>
        {muscles.map(m=>{
          const done=muscleSets[m]||0;
          const goal=goals[m]||9;
          const pct=Math.min(100,Math.round((done/goal)*100));
          const col=MUSCLE_COLORS[m]||"#666";
          return (
            <div key={m} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600}}>{MUSCLE_LABELS[m]}</span>
                <span style={{fontSize:12,color:done>=goal?"#22c55e":"var(--muted)"}}><strong style={{color:col}}>{done}</strong>/{goal} serii</span>
              </div>
              <div style={{background:"var(--border)",borderRadius:4,height:8}}>
                <div style={{height:"100%",borderRadius:4,background:done>=goal?"#22c55e":col,width:`${pct}%`,transition:"width .3s"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {editGoals&&(
        <div className="modal-backdrop" onClick={()=>setEditGoals(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">CELE SERII / TYDZIEŃ</div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Ile serii na partię chcesz zrobić w tygodniu</div>
            {muscles.map(m=>{
              const val = tempGoals[m]!==undefined ? tempGoals[m] : (DEFAULT_GOALS[m]||9);
              return (
                <div key={m} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:14,color:MUSCLE_COLORS[m],fontWeight:700}}>{MUSCLE_LABELS[m]}</span>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:MUSCLE_COLORS[m]}}>{val}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setTempGoals(p=>({...p,[m]:Math.max(1,val-1)}))}
                      style={{width:44,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
                    <div style={{flex:1,background:"var(--border)",borderRadius:4,height:8}}>
                      <div style={{height:"100%",borderRadius:4,background:MUSCLE_COLORS[m],width:`${Math.min(100,Math.round((val/20)*100))}%`,transition:"width .2s"}}/>
                    </div>
                    <button onClick={()=>setTempGoals(p=>({...p,[m]:val+1}))}
                      style={{width:44,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
                  </div>
                </div>
              );
            })}
            <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>{ setGoals({...tempGoals}); setEditGoals(false); }}>✓ Zapisz cele</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditGoals(false)}>Anuluj</button>
          </div>
        </div>
      )}
    </>
  );
}


// ── SCREEN: KALENDARZ ─────────────────────────────────────────────────────────
function ScreenCalendar({calDate,setCalDate,workoutDates,dayLogs,history,selDay,setSelDay,customExercises=[]}) {
  const {y,m}=calDate;
  const todayStr=today();
  const prevMonth=()=>setCalDate(m===0?{y:y-1,m:11}:{y,m:m-1});
  const nextMonth=()=>setCalDate(m===11?{y:y+1,m:0}:{y,m:m+1});
  const days=daysInMonth(y,m);
  const firstDay=firstDayOfMonth(y,m);
  const cells=Array(firstDay).fill(null).concat(Array.from({length:days},(_,i)=>i+1));
  const getDayStr=d=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getDayType=d=>{ const ds=getDayStr(d); return workoutDates[ds]||(dayLogs[ds]?.type)||null; };

  // series per muscle per day
  const getSeriesInfo=ds=>{
    const entries=history.filter(e=>e.date===ds);
    if(!entries.length) return null;
    const byMuscle={};
    entries.forEach(e=>{ const sets=e.sets||3; byMuscle[e.type]=(byMuscle[e.type]||0)+sets; });
    return byMuscle;
  };

  return (
    <div className="animate-up">
      <div className="page-header"><div className="page-sub">Historia aktywności</div><div className="page-title">KALENDARZ</div></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 16px",marginBottom:12}}>
        {[["push","🔴 PUSH"],["pull","🔵 PULL"],["fbw","🟢 FBW"],["cardio","🟡 Cardio"],["work","💼 Praca"],["recovery","🧘 Regen"]].map(([t,l])=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--muted)"}}>
            <div style={{width:8,height:8,borderRadius:2,background:typeColor[t]}}/>{l}
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={prevMonth} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Icon name="chevronL" size={16}/></button>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:2}}>{MONTHS_PL[m]} {y}</span>
          <button onClick={nextMonth} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Icon name="chevronR" size={16}/></button>
        </div>
        <div className="cal-grid">
          {DAYS_PL.map(d=><div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d,i)=>{
            if(!d) return <div key={`e${i}`} style={{aspectRatio:1}}/>;
            const ds=getDayStr(d);
            const tp=getDayType(d);
            const col=tp?typeColor[tp]:"var(--card2)";
            const isT=ds===todayStr;
            const si=getSeriesInfo(ds);
            return (
              <div key={d} className="cal-cell" style={{background:tp?col+"33":"var(--card2)",color:tp?col:"var(--muted)",fontWeight:isT?700:400,boxShadow:isT?"0 0 0 1.5px var(--text)":"none"}}
                onClick={()=>setSelDay(d)}>
                {d}
                {si&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:col}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* MONTH SUMMARY */}
      <div className="section-label">Miesiąc – serie na partie</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"0 16px 12px"}}>
        {["push","pull","fbw"].map(tp=>{
          const monthEntries=history.filter(e=>e.type===tp&&e.date.startsWith(`${y}-${String(m+1).padStart(2,"0")}`));
          const totalSets=monthEntries.reduce((s,e)=>s+(e.sets||3),0);
          const workouts=[...new Set(monthEntries.map(e=>e.date))].length;
          return (
            <div key={tp} style={{background:"var(--card)",border:`1px solid var(--border)`,borderRadius:14,padding:"12px 10px",borderLeft:`3px solid ${typeColor[tp]}`}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:typeColor[tp]}}>{totalSets}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>serii łącznie</div>
              <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{workouts} treningów</div>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:.8,color:typeColor[tp],marginTop:4,fontWeight:700}}>{tp}</div>
            </div>
          );
        })}
      </div>

      {/* WEEKLY MUSCLE GROUPS */}
      <div className="section-label">Tydzień – serie na partię ciała</div>
      {(()=>{
        // Get current week Mon-Sun
        const now = new Date();
        const dayOfWeek = (now.getDay()+6)%7;
        const weekStart = new Date(now); weekStart.setDate(now.getDate()-dayOfWeek);
        const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d.toISOString().slice(0,10); });
        const weekEntries = history.filter(e=>weekDays.includes(e.date));

        // Map exercise to muscle group
        const muscleMap = {};
        [...EXERCISES.push,...EXERCISES.pull,...EXERCISES.fbw].forEach(ex=>{
          muscleMap[ex.name] = ex.muscle;
        });
        const muscleSets = {};
        weekEntries.forEach(e=>{
          const muscle = muscleMap[e.exercise]||e.type;
          muscleSets[muscle] = (muscleSets[muscle]||0) + (e.sets||3);
        });
        const muscleColors = {klata:"#ef4444",barki:"#f97316",triceps:"#eab308",plecy:"#3b82f6",biceps:"#8b5cf6"};
        const muscleGoals = {klata:9,barki:9,triceps:6,plecy:12,biceps:9};
        const muscles = ["klata","barki","triceps","plecy","biceps"];
        const wStart = weekStart.toLocaleDateString("pl-PL",{day:"numeric",month:"short"});
        const wEnd = new Date(weekStart); wEnd.setDate(weekStart.getDate()+6);
        const wEndStr = wEnd.toLocaleDateString("pl-PL",{day:"numeric",month:"short"});
        return (
          <div className="card" style={{marginBottom:12}}>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:12}}>{wStart} – {wEndStr}</div>
            {muscles.map(m=>{
              const done = muscleSets[m]||0;
              const goal = muscleGoals[m];
              const pct = Math.min(100,Math.round((done/goal)*100));
              const col = muscleColors[m]||"#666";
              return (
                <div key={m} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,textTransform:"capitalize"}}>{m}</span>
                    <span style={{fontSize:12,color:done>=goal?"#22c55e":"var(--muted)"}}><strong style={{color:col}}>{done}</strong> / {goal} serii</span>
                  </div>
                  <div style={{background:"var(--border)",borderRadius:4,height:8}}>
                    <div style={{height:"100%",borderRadius:4,background:done>=goal?"#22c55e":col,width:`${pct}%`,transition:"width .3s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {selDay&&(()=>{
        const ds=getDayStr(selDay);
        const entries=history.filter(e=>e.date===ds);
        const log=dayLogs[ds]||{};
        const tp=getDayType(selDay);
        const col=tp?typeColor[tp]:"var(--muted)";
        const si=getSeriesInfo(ds);
        return (
          <div className="modal-backdrop" onClick={()=>setSelDay(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-title" style={{color:col}}>{fmt(ds)} – {tp?tp.toUpperCase():"Brak danych"}</div>
              {log.duration&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>⏱ Czas: {Math.floor(log.duration/60)} min</div>}
              {si&&(
                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  {Object.entries(si).map(([t,s])=>(
                    <div key={t} style={{background:typeColor[t]+"22",border:`1px solid ${typeColor[t]}44`,borderRadius:8,padding:"4px 10px",fontSize:12,color:typeColor[t],fontWeight:700}}>
                      {t.toUpperCase()}: {s} serii
                    </div>
                  ))}
                </div>
              )}
              {log.steps&&<div style={{fontSize:13,color:"var(--muted2)",marginBottom:4}}>👟 {log.steps?.toLocaleString()} kroków</div>}
              {log.calories&&<div style={{fontSize:13,color:"var(--muted2)",marginBottom:8}}>🔥 {log.calories} kcal aktywnych</div>}
              {entries.length>0&&(
                <>
                  <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1.5,color:"var(--muted)",fontWeight:600,marginBottom:8}}>Ćwiczenia</div>
                  {entries.map((e,i)=>(
                    <div key={i} className="ex-row">
                      <span className="ex-name">{e.exercise}</span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:11,color:"var(--muted)"}}>{e.sets||3}×</span>
                        <span className="ex-weight" style={{color:col}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {log.note&&<div style={{marginTop:12,padding:"10px 12px",background:"var(--card2)",borderRadius:10,fontSize:12,color:"var(--muted2)"}}>{log.note}</div>}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:16}} onClick={()=>setSelDay(null)}>Zamknij</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── SCREEN: STATYSTYKI ────────────────────────────────────────────────────────
function ScreenStats({history,dayLogs,customExercises=[]}) {
  const [activeTab,setActiveTab]     = useState("exercises");
  const [selExercise,setSelExercise] = useState("Wyciąg góra szeroko");
  const [selGroup,setSelGroup]       = useState("pull"); // push|pull|fbw|muscle name
  const [bodyWeight,setBodyWeight]   = useState(()=>storage.get("bodyWeight",[]));
  const [newWeight,setNewWeight]     = useState("");
  const [measurements,setMeasurements]=useState(()=>storage.get("measurements",{}));
  const [editMeas,setEditMeas]       = useState(false);
  const [tempMeas,setTempMeas]       = useState({});

  useEffect(()=>{ storage.set("bodyWeight",bodyWeight); },[bodyWeight]);
  useEffect(()=>{ storage.set("measurements",measurements); },[measurements]);

  const tc={push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",...MUSCLE_COLORS};

  const totals={push:0,pull:0,fbw:0};
  Object.keys(totals).forEach(tp=>{ totals[tp]=[...new Set(history.filter(e=>e.type===tp).map(e=>e.date))].length; });
  const totalSteps=Object.values(dayLogs).reduce((s,l)=>s+(l.steps||0),0);
  const totalKcalActive=Object.values(dayLogs).reduce((s,l)=>s+(l.calories||0),0);

  // Get exercises for selected group
  // Also discover exercises from history that aren't in any list yet
  const historyExercises = (() => {
    const known = new Set(getAllExercises(customExercises).map(e=>e.name));
    const result = [];
    const seen = new Set();
    history.forEach(e=>{
      if(!known.has(e.exercise)&&!seen.has(e.exercise)){
        seen.add(e.exercise);
        result.push({id:`hist_${e.exercise}`,name:e.exercise,muscle:"klata"});
      }
    });
    return result;
  })();
  const allKnownEx = getAllExercises([...customExercises,...historyExercises]);

  const getExercisesForGroup = (group) => {
    if(["push","pull","fbw"].includes(group)) {
      // Include custom exercises that belong to muscles in this group
      const groupMuscles = {
        push:["klata","barki","triceps"],
        pull:["plecy","biceps"],
        fbw: ["klata","barki","triceps","plecy","biceps","nogi"]
      }[group]||[];
      const baseEx = [...new Set(EXERCISES[group].map(e=>e.name))];
      const allEx = getAllExercises(customExercises);
      const customForGroup = allEx.filter(e=>groupMuscles.includes(e.muscle)&&!baseEx.includes(e.name)).map(e=>e.name);
      return [...baseEx, ...customForGroup];
    }
    return [...new Set(allKnownEx.filter(e=>e.muscle===group).map(e=>e.name))];
  };

  const exListForGroup = getExercisesForGroup(selGroup);

  // For stats - combine all history for an exercise regardless of push/pull/fbw
  const exHistory = history
    .filter(e=>e.exercise===selExercise)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const maxW=exHistory.length?Math.max(...exHistory.map(e=>e.weight)):1;
  const minW=exHistory.length?Math.min(...exHistory.map(e=>e.weight)):0;
  const range=maxW-minW||1;
  const chartH=100;
  const chartW_pts=exHistory.length>1?exHistory.length-1:1;

  // Weekly data
  const getWeekStart=d=>{ const dt=new Date(d); dt.setDate(dt.getDate()-((dt.getDay()+6)%7)); return dt.toISOString().slice(0,10); };
  const weekMap={};
  history.forEach(e=>{ const ws=getWeekStart(e.date); if(!weekMap[ws]) weekMap[ws]={push:new Set(),pull:new Set(),fbw:new Set()}; if(weekMap[ws][e.type]) weekMap[ws][e.type].add(e.date); });
  const weeks=Object.entries(weekMap).sort((a,b)=>a[0]>b[0]?-1:1).slice(0,8);

  // Body weight chart
  const weightSorted=[...bodyWeight].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const maxBW=weightSorted.length?Math.max(...weightSorted.map(w=>w.val)):100;
  const minBW=weightSorted.length?Math.min(...weightSorted.map(w=>w.val)):60;
  const bwRange=maxBW-minBW||1;
  const bwPts=weightSorted.length>1?weightSorted.length-1:1;
  const addWeight=()=>{ const v=parseFloat(newWeight); if(!v)return; setBodyWeight(prev=>[...prev.filter(w=>w.date!==today()),{date:today(),val:v,id:Date.now()}]); setNewWeight(""); };

  // Last training per muscle
  const getLastMuscleTraining = (muscle) => {
    const allEx = getAllExercises(customExercises);
    const muscleExNames = new Set(allEx.filter(e=>e.muscle===muscle).map(e=>e.name));
    const entries = history.filter(e=>muscleExNames.has(e.exercise)).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!entries.length) return null;
    const lastDate = entries[0].date;
    const lastEntries = entries.filter(e=>e.date===lastDate);
    return {date:lastDate, entries:lastEntries};
  };

  const BODY_PARTS=[{key:"klatka",label:"Klatka",x:50,y:26},{key:"biceps_l",label:"Biceps L",x:20,y:35},{key:"biceps_p",label:"Biceps P",x:80,y:35},{key:"pas",label:"Pas",x:50,y:50},{key:"biodra",label:"Biodra",x:50,y:60},{key:"udo_l",label:"Udo L",x:30,y:72},{key:"udo_p",label:"Udo P",x:70,y:72},{key:"lydka_l",label:"Łydka L",x:30,y:87},{key:"lydka_p",label:"Łydka P",x:70,y:87}];

  // GROUP TABS: push|pull|fbw + muscle groups
  const groupTabs = [
    {id:"push",label:"PUSH",color:"#ef4444"},
    {id:"pull",label:"PULL",color:"#3b82f6"},
    {id:"fbw", label:"FBW", color:"#22c55e"},
    {id:"klata",   label:"Klatka",  color:MUSCLE_COLORS.klata},
    {id:"plecy",   label:"Plecy",   color:MUSCLE_COLORS.plecy},
    {id:"barki",   label:"Barki",   color:MUSCLE_COLORS.barki},
    {id:"biceps",  label:"Biceps",  color:MUSCLE_COLORS.biceps},
    {id:"triceps", label:"Triceps", color:MUSCLE_COLORS.triceps},
    {id:"nogi",    label:"Nogi",    color:MUSCLE_COLORS.nogi},
  ];

  return (
    <div className="animate-up">
      <div className="page-header"><div className="page-sub">Twoje wyniki</div><div className="page-title">STATYSTYKI</div></div>

      {/* TOTALS */}
      <div style={{display:"flex",gap:6,margin:"0 16px 12px",overflowX:"auto",paddingBottom:2}}>
        {Object.entries(totals).map(([tp,n])=>(
          <div key={tp} style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:64}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:tc[tp]}}>{n}</div>
            <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>{tp}</div>
          </div>
        ))}
        <div style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:64}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:"#eab308"}}>{Math.round(totalSteps/1000)}k</div>
          <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>Kroki</div>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{display:"flex",gap:6,margin:"0 16px 12px",overflowX:"auto"}}>
        {[{id:"exercises",label:"📈 Ćwiczenia"},{id:"muscle_last",label:"💪 Partie"},{id:"body",label:"⚖️ Sylwetka"},{id:"week",label:"📅 Tygodnie"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{flexShrink:0,padding:"8px 14px",borderRadius:10,border:`1.5px solid ${activeTab===t.id?"#ef4444":"var(--border)"}`,background:activeTab===t.id?"#ef444422":"var(--card2)",color:activeTab===t.id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: EXERCISES */}
      {activeTab==="exercises" && <>
        {/* Group selector */}
        <div style={{margin:"0 16px 8px",overflowX:"auto",display:"flex",gap:6,paddingBottom:4}}>
          {groupTabs.map(g=>(
            <button key={g.id} onClick={()=>{setSelGroup(g.id);setSelExercise(getExercisesForGroup(g.id)[0]||selExercise);}}
              style={{flexShrink:0,border:`1.5px solid ${selGroup===g.id?g.color:"var(--border)"}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,background:selGroup===g.id?g.color+"33":"var(--card2)",color:selGroup===g.id?g.color:"var(--muted)"}}>
              {g.label}
            </button>
          ))}
        </div>
        {/* Exercise selector */}
        <div style={{margin:"0 16px 8px",overflowX:"auto",display:"flex",gap:6,paddingBottom:4}}>
          {exListForGroup.map(ex=>(
            <button key={ex} onClick={()=>setSelExercise(ex)}
              style={{flexShrink:0,border:"1px solid var(--border)",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,background:selExercise===ex?tc[selGroup]+"22":"var(--card2)",color:selExercise===ex?tc[selGroup]:"var(--muted)",outline:selExercise===ex?`1.5px solid ${tc[selGroup]}44`:"none"}}>
              {ex}
            </button>
          ))}
        </div>
        {/* Chart */}
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{selExercise}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{exHistory.length} pomiarów łącznie</div>
            </div>
            {exHistory.length>0&&<div style={{textAlign:"right"}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:tc[selGroup]||"#ef4444"}}>{maxW} kg</div><div style={{fontSize:10,color:"var(--muted)"}}>REKORD</div></div>}
          </div>
          {exHistory.length>1?(
            <svg width="100%" height={chartH+30} viewBox={`0 0 100 ${chartH+30}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={tc[selGroup]||"#ef4444"} stopOpacity=".3"/><stop offset="100%" stopColor={tc[selGroup]||"#ef4444"} stopOpacity="0"/></linearGradient></defs>
              <path d={[`M 0 ${chartH-((exHistory[0].weight-minW)/range)*chartH}`,...exHistory.slice(1).map((_,i)=>`L ${((i+1)/chartW_pts)*100} ${chartH-((exHistory[i+1].weight-minW)/range)*chartH}`),`L 100 ${chartH}`,`L 0 ${chartH}`,"Z"].join(" ")} fill="url(#grad)"/>
              <polyline points={exHistory.map((e,i)=>`${(i/chartW_pts)*100},${chartH-((e.weight-minW)/range)*chartH}`).join(" ")} fill="none" stroke={tc[selGroup]||"#ef4444"} strokeWidth="1.5"/>
              {exHistory.map((e,i)=><circle key={i} cx={(i/chartW_pts)*100} cy={chartH-((e.weight-minW)/range)*chartH} r="2" fill={tc[selGroup]||"#ef4444"}/>)}
              <text x="0" y={chartH+20} fontSize="7" fill="var(--muted)">{minW}kg</text>
              <text x="100" y={chartH+20} fontSize="7" fill="var(--muted)" textAnchor="end">{fmt(exHistory[exHistory.length-1].date)}</text>
            </svg>
          ):exHistory.length===1?<div style={{textAlign:"center",padding:"16px 0",color:"var(--muted)",fontSize:13}}>Jeden pomiar: {exHistory[0].weight} kg</div>:<div style={{textAlign:"center",padding:"16px 0",color:"var(--muted)",fontSize:13}}>Brak danych</div>}
        </div>
        {exHistory.length>0&&(
          <div className="card">
            <div className="card-title">Historia</div>
            {[...exHistory].reverse().slice(0,12).map((e,i,arr)=>{ const prev=arr[i+1]; const diff=prev?e.weight-prev.weight:0; return (
              <div key={i} className="ex-row">
                <div>
                  <div className="ex-name">{fmt(e.date)}</div>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.type?.toUpperCase()}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {diff!==0&&<span style={{fontSize:11,color:diff>0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                  <span className="ex-weight" style={{color:tc[selGroup]||"#ef4444"}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                </div>
              </div>
            );})}
          </div>
        )}
      </>}

      {/* TAB: MUSCLE LAST */}
      {activeTab==="muscle_last" && (
        <div>
          {MUSCLE_GROUPS.filter(m=>m!=="brzuch").map(muscle=>{
            const last = getLastMuscleTraining(muscle);
            const daysAgo = last ? Math.floor((new Date(today())-new Date(last.date))/86400000) : null;
            // Get best weight per exercise for this muscle
            const allEx = getAllExercises(customExercises);
            const muscleExNames = [...new Set(allEx.filter(e=>e.muscle===muscle).map(e=>e.name))];
            const bestPerEx = muscleExNames.map(exName=>{
              const entries = history.filter(e=>e.exercise===exName).sort((a,b)=>new Date(b.date)-new Date(a.date));
              if(!entries.length) return null;
              const best = Math.max(...entries.map(e=>e.weight));
              const latest = entries[0];
              return {name:exName, latest:latest.weight, best, date:latest.date};
            }).filter(Boolean);
            return (
              <div key={muscle} className="card" style={{marginBottom:8,borderLeft:`3px solid ${MUSCLE_COLORS[muscle]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:last?10:4}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:MUSCLE_COLORS[muscle],letterSpacing:1}}>{MUSCLE_LABELS[muscle]}</div>
                  {last?(
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,color:"var(--muted2)",fontWeight:600}}>{fmt(last.date)}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{daysAgo===0?"dzisiaj":daysAgo===1?"wczoraj":`${daysAgo} dni temu`}</div>
                    </div>
                  ):<div style={{fontSize:12,color:"var(--muted)"}}>Brak danych</div>}
                </div>
                {bestPerEx.map((ex,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontSize:12,color:"var(--muted2)"}}>{ex.name}</div>
                      <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{fmt(ex.date)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUSCLE_COLORS[muscle]}}>{ex.latest}kg</div>
                      {ex.best>ex.latest&&<div style={{fontSize:10,color:"#eab308"}}>max: {ex.best}kg</div>}
                    </div>
                  </div>
                ))}
                {!bestPerEx.length&&<div style={{fontSize:12,color:"var(--muted)",padding:"4px 0"}}>Brak danych</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: BODY */}
      {activeTab==="body" && <>
        <div className="card">
          <div className="card-title">Sylwetka – obwody (cm)</div>
          <div style={{position:"relative",width:"100%",paddingBottom:"110%"}}>
            <svg viewBox="0 0 100 140" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
              <ellipse cx="50" cy="10" rx="9" ry="9" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="36" y="19" width="28" height="36" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="19" y="21" width="13" height="27" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="68" y="21" width="13" height="27" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="35" y="55" width="13" height="40" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="52" y="55" width="13" height="40" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="34" y="94" width="12" height="32" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              <rect x="54" y="94" width="12" height="32" rx="5" fill="#222" stroke="#444" strokeWidth="1"/>
              {BODY_PARTS.map(bp=>{
                const val=measurements[bp.key];
                const cx=bp.x; const cy=bp.y*1.4;
                return (
                  <g key={bp.key} onClick={()=>{ setTempMeas({...measurements}); setEditMeas(bp.key); }} style={{cursor:"pointer"}}>
                    <circle cx={cx} cy={cy} r="5.5" fill={val?"#ef444488":"#33333399"} stroke={val?"#ef4444":"#555"} strokeWidth="0.8"/>
                    <text x={cx} y={cy+0.5} textAnchor="middle" dominantBaseline="middle" fontSize="3.5" fill={val?"#fff":"#888"} fontWeight="bold">{val?`${val}`:"+"}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}}>
            {BODY_PARTS.map(bp=>{ const val=measurements[bp.key]; return (
              <div key={bp.key} onClick={()=>{ setTempMeas({...measurements}); setEditMeas(bp.key); }}
                style={{background:"var(--card2)",border:`1px solid ${val?"#ef444444":"var(--border)"}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"var(--muted2)"}}>{bp.label}</span>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:val?"#ef4444":"var(--muted)"}}>{val?`${val}cm`:"—"}</span>
              </div>
            );})}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Waga ciała</div>
          <div className="log-row" style={{marginBottom:10}}>
            <span className="log-label">⚖️ Dzisiaj</span>
            <input className="log-input" type="number" step="0.1" placeholder="np. 78.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)}/>
            <span style={{fontSize:13,color:"var(--muted)",marginLeft:4}}>kg</span>
          </div>
          <button className="btn btn-primary" onClick={addWeight}>Zapisz wagę</button>
          {weightSorted.length>1&&(
            <svg width="100%" height={chartH+24} viewBox={`0 0 100 ${chartH+24}`} preserveAspectRatio="none" style={{overflow:"visible",marginTop:12}}>
              <defs><linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".3"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
              <path d={[`M 0 ${chartH-((weightSorted[0].val-minBW)/bwRange)*chartH}`,...weightSorted.slice(1).map((_,i)=>`L ${((i+1)/bwPts)*100} ${chartH-((weightSorted[i+1].val-minBW)/bwRange)*chartH}`),`L 100 ${chartH}`,`L 0 ${chartH}`,"Z"].join(" ")} fill="url(#bwg)"/>
              <polyline points={weightSorted.map((w,i)=>`${(i/bwPts)*100},${chartH-((w.val-minBW)/bwRange)*chartH}`).join(" ")} fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              {weightSorted.map((w,i)=><circle key={i} cx={(i/bwPts)*100} cy={chartH-((w.val-minBW)/bwRange)*chartH} r="2" fill="#3b82f6"/>)}
              <text x="0" y={chartH+18} fontSize="7" fill="var(--muted)">{minBW}kg</text>
              <text x="100" y={chartH+18} fontSize="7" fill="var(--muted)" textAnchor="end">{maxBW}kg</text>
            </svg>
          )}
          {weightSorted.length>0&&(
            [...weightSorted].reverse().slice(0,8).map((w,i,arr)=>{ const prev=arr[i+1]; const diff=prev?+(w.val-prev.val).toFixed(1):0; return (
              <div key={w.id} className="ex-row">
                <span className="ex-name">{fmt(w.date)}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {diff!==0&&<span style={{fontSize:11,color:diff<0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                  <span className="ex-weight" style={{color:"#3b82f6"}}>{w.val} <span style={{fontSize:12}}>kg</span></span>
                </div>
              </div>
            );})
          )}
        </div>
      </>}

      {/* TAB: WEEK */}
      {activeTab==="week" && (
        <div className="card">
          <div className="card-title">Podsumowanie tygodni</div>
          {weeks.length===0&&<div style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:13}}>Brak danych</div>}
          {weeks.map(([ws,data])=>{
            const pN=data.push?.size||0,lN=data.pull?.size||0,fN=data.fbw?.size||0,total=pN+lN+fN;
            const we=new Date(ws); we.setDate(we.getDate()+6);
            return (
              <div key={ws} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,color:"var(--muted2)",fontWeight:600}}>{fmt(ws)} – {fmt(we.toISOString().slice(0,10))}</span>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#ef4444"}}>{total}x</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[["PUSH",pN,"#ef4444"],["PULL",lN,"#3b82f6"],["FBW",fN,"#22c55e"]].map(([l,n,c])=>(
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

      {/* OBWÓD MODAL */}
      {editMeas&&(()=>{
        const bp=BODY_PARTS.find(b=>b.key===editMeas);
        return (
          <div className="modal-backdrop" onClick={()=>setEditMeas(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-title">📏 {bp?.label}</div>
              <div className="log-row" style={{marginBottom:16}}>
                <span className="log-label">Obwód</span>
                <input className="log-input" type="number" step="0.5" placeholder="cm" autoFocus
                  value={tempMeas[editMeas]||""}
                  onChange={e=>setTempMeas(p=>({...p,[editMeas]:Number(e.target.value)}))}/>
                <span style={{fontSize:13,color:"var(--muted)",marginLeft:4}}>cm</span>
              </div>
              <button className="btn btn-primary" onClick={()=>{ setMeasurements(tempMeas); setEditMeas(false); }}>Zapisz</button>
              {measurements[editMeas]&&<button className="btn btn-ghost" style={{width:"100%",marginTop:8,color:"#ef4444"}} onClick={()=>{ const m={...measurements}; delete m[editMeas]; setMeasurements(m); setEditMeas(false); }}>Usuń pomiar</button>}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditMeas(false)}>Anuluj</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
