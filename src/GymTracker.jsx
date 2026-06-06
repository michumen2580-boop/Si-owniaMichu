import { useState, useEffect, useCallback } from "react";

const APP_VERSION = "4.0.0";
const DATA_VERSION = 10;

// ── STORAGE ───────────────────────────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL   = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const fmt   = (d) => { if(!d)return""; const [y,m,day]=d.split("-"); return `${day}.${m}.${y}`; };
const daysInMonth    = (y,m) => new Date(y,m+1,0).getDate();
const firstDayOfWeek = (y,m) => { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; };
const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const vibrate = (p=[100]) => { try{ if(navigator.vibrate) navigator.vibrate(p); }catch{} };

// ── MUSCLE METADATA ───────────────────────────────────────────────────────────
const MUSCLES      = ["klata","plecy","barki","biceps","triceps","nogi"];
const MUSCLE_COLOR = {klata:"#ef4444",plecy:"#3b82f6",barki:"#f97316",biceps:"#8b5cf6",triceps:"#eab308",nogi:"#22c55e"};
const MUSCLE_LABEL = {klata:"Klatka",plecy:"Plecy",barki:"Barki",biceps:"Biceps",triceps:"Triceps",nogi:"Nogi"};
const TYPE_COLOR   = {push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308",work:"#4b5563",recovery:"#e8d5b0"};

// ── CANONICAL EXERCISE DATABASE ───────────────────────────────────────────────
const EXERCISES = {
  push: [
    {id:"atlas_klatka",   name:"Atlas klatka",        muscle:"klata"},
    {id:"atlas_rozpietki",name:"Atlas rozpiętki",      muscle:"klata"},
    {id:"lawka_skos",     name:"Ławka skośnie hantle", muscle:"klata"},
    {id:"maszyna_skos",   name:"Maszyna skos",         muscle:"klata"},
    {id:"lawka_plasko",   name:"Ławka płasko",         muscle:"klata"},
    {id:"brama",          name:"Brama",                muscle:"klata"},
    {id:"dipy",           name:"Dipy",                 muscle:"klata"},
    {id:"wznosy_bok",     name:"Wznosy bokiem",        muscle:"barki"},
    {id:"wznosy_gora",    name:"Wznosy nad głowę",     muscle:"barki"},
    {id:"rozpietki_tyl",  name:"Rozpiętki tył",        muscle:"barki"},
    {id:"laweczka_tri",   name:"Ławeczka triceps",     muscle:"triceps"},
    {id:"wyciag_tri",     name:"Wyciąg triceps",       muscle:"triceps"},
  ],
  pull: [
    {id:"wyciag_g_s",     name:"Wyciąg góra szeroko",  muscle:"plecy"},
    {id:"wyciag_g_w",     name:"Wyciąg góra wąsko",    muscle:"plecy"},
    {id:"wyciag_d_w",     name:"Wyciąg nisko wąsko",   muscle:"plecy"},
    {id:"narciaz",        name:"Narciaż",              muscle:"plecy"},
    {id:"wioslowanie",    name:"Wiosłowanie",          muscle:"plecy"},
    {id:"wioslowanie_l",  name:"Wiosłowanie ławka",    muscle:"plecy"},
    {id:"martwy",         name:"Martwy ciąg",          muscle:"plecy"},
    {id:"biceps_skos",    name:"Biceps skos siedząco", muscle:"biceps"},
    {id:"modlitewnik",    name:"Modlitewnik",          muscle:"biceps"},
    {id:"mlotki",         name:"Młotki",               muscle:"biceps"},
  ],
  fbw: [
    {id:"fbw_atlas_r",    name:"Atlas rozpiętki",      muscle:"klata"},
    {id:"fbw_suwnica",    name:"Suwnica",              muscle:"nogi"},
    {id:"fbw_plasko",     name:"Ławka płasko",         muscle:"klata"},
    {id:"fbw_skos",       name:"Ławka skośnie hantle", muscle:"klata"},
    {id:"fbw_wzn_g",      name:"Wznosy nad głowę",     muscle:"barki"},
    {id:"fbw_wzn_b",      name:"Wznosy bokiem",        muscle:"barki"},
    {id:"fbw_r_tyl",      name:"Rozpiętki tył",        muscle:"barki"},
    {id:"fbw_wyc_gs",     name:"Wyciąg góra szeroko",  muscle:"plecy"},
    {id:"fbw_wyc_gw",     name:"Wyciąg góra wąsko",    muscle:"plecy"},
    {id:"fbw_wyc_dw",     name:"Wyciąg nisko wąsko",   muscle:"plecy"},
    {id:"fbw_narciaz",    name:"Narciaż",              muscle:"plecy"},
    {id:"fbw_wioslL",     name:"Wiosłowanie ławka",    muscle:"plecy"},
    {id:"fbw_martwy",     name:"Martwy ciąg",          muscle:"plecy"},
    {id:"fbw_bic_skos",   name:"Biceps skos siedząco", muscle:"biceps"},
    {id:"fbw_modl",       name:"Modlitewnik",          muscle:"biceps"},
    {id:"fbw_mlotki",     name:"Młotki",               muscle:"biceps"},
    {id:"fbw_law_tri",    name:"Ławeczka triceps",     muscle:"triceps"},
    {id:"fbw_wyc_tri",    name:"Wyciąg triceps",       muscle:"triceps"},
  ],
};

// Master lookup: name -> muscle (all canonical exercises)
const MUSCLE_OF = {};
Object.values(EXERCISES).flat().forEach(e => { MUSCLE_OF[e.name] = e.muscle; });

// All unique canonical exercise names with muscle
const ALL_CANONICAL = (() => {
  const seen = new Set();
  const result = [];
  Object.values(EXERCISES).flat().forEach(e => {
    if(!seen.has(e.name)){ seen.add(e.name); result.push({name:e.name, muscle:e.muscle}); }
  });
  return result;
})();

// ── SEED HISTORY (clean data from PDFs) ───────────────────────────────────────
const SEED_HISTORY = [
  {date:"2025-09-18",type:"push",exercise:"Atlas klatka",weight:100},
  {date:"2025-09-18",type:"push",exercise:"Atlas rozpiętki",weight:30},
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg góra szeroko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg góra wąsko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wyciąg nisko wąsko",weight:50},
  {date:"2025-09-21",type:"pull",exercise:"Wiosłowanie",weight:20},
  {date:"2025-09-21",type:"pull",exercise:"Martwy ciąg",weight:20},
  {date:"2025-09-21",type:"pull",exercise:"Biceps skos siedząco",weight:10},
  {date:"2025-09-21",type:"pull",exercise:"Młotki",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Ławka skośnie hantle",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Maszyna skos",weight:15},
  {date:"2025-09-22",type:"push",exercise:"Ławka płasko",weight:10},
  {date:"2025-09-22",type:"push",exercise:"Brama",weight:10},
  {date:"2025-09-22",type:"pull",exercise:"Modlitewnik",weight:15},
  {date:"2025-09-22",type:"push",exercise:"Wznosy bokiem",weight:7.5},
  {date:"2025-09-22",type:"push",exercise:"Wznosy nad głowę",weight:12.5},
  {date:"2025-09-22",type:"push",exercise:"Ławeczka triceps",weight:12.5},
  {date:"2025-09-22",type:"push",exercise:"Wyciąg triceps",weight:17.5},
  {date:"2025-09-26",type:"pull",exercise:"Wyciąg góra szeroko",weight:55},
  {date:"2025-09-26",type:"pull",exercise:"Wyciąg góra wąsko",weight:55},
  {date:"2025-09-26",type:"pull",exercise:"Wyciąg nisko wąsko",weight:55},
  {date:"2025-09-26",type:"pull",exercise:"Biceps skos siedząco",weight:10},
  {date:"2025-09-26",type:"pull",exercise:"Modlitewnik",weight:7.5},
  {date:"2025-09-26",type:"pull",exercise:"Młotki",weight:5},
  {date:"2025-09-29",type:"push",exercise:"Ławka skośnie hantle",weight:15},
  {date:"2025-09-29",type:"push",exercise:"Maszyna skos",weight:15},
  {date:"2025-09-29",type:"push",exercise:"Ławka płasko",weight:12.5},
  {date:"2025-09-29",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2025-09-29",type:"push",exercise:"Wznosy nad głowę",weight:15},
  {date:"2025-09-29",type:"push",exercise:"Rozpiętki tył",weight:20},
  {date:"2025-09-29",type:"push",exercise:"Ławeczka triceps",weight:10},
  {date:"2025-09-29",type:"push",exercise:"Wyciąg triceps",weight:15},
  {date:"2025-10-01",type:"pull",exercise:"Wyciąg góra szeroko",weight:55},
  {date:"2025-10-01",type:"pull",exercise:"Wyciąg góra wąsko",weight:55},
  {date:"2025-10-01",type:"pull",exercise:"Wyciąg nisko wąsko",weight:55},
  {date:"2025-10-01",type:"pull",exercise:"Biceps skos siedząco",weight:10},
  {date:"2025-10-01",type:"pull",exercise:"Modlitewnik",weight:7.5},
  {date:"2025-10-01",type:"pull",exercise:"Młotki",weight:10},
  {date:"2025-10-03",type:"push",exercise:"Ławka skośnie hantle",weight:17.5},
  {date:"2025-10-03",type:"push",exercise:"Maszyna skos",weight:15},
  {date:"2025-10-03",type:"push",exercise:"Ławka płasko",weight:20},
  {date:"2025-10-03",type:"push",exercise:"Dipy",weight:40},
  {date:"2025-10-03",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2025-10-03",type:"push",exercise:"Wznosy nad głowę",weight:12.5},
  {date:"2025-10-03",type:"push",exercise:"Ławeczka triceps",weight:10},
  {date:"2025-10-03",type:"push",exercise:"Wyciąg triceps",weight:20},
  {date:"2025-10-07",type:"pull",exercise:"Wyciąg góra szeroko",weight:55},
  {date:"2025-10-07",type:"pull",exercise:"Wyciąg góra wąsko",weight:55},
  {date:"2025-10-07",type:"pull",exercise:"Wyciąg nisko wąsko",weight:55},
  {date:"2025-10-07",type:"pull",exercise:"Narciaż",weight:20},
  {date:"2025-10-07",type:"pull",exercise:"Wiosłowanie",weight:10},
  {date:"2025-10-07",type:"pull",exercise:"Biceps skos siedząco",weight:12},
  {date:"2025-10-07",type:"pull",exercise:"Modlitewnik",weight:10},
  {date:"2025-10-07",type:"pull",exercise:"Młotki",weight:10},
  {date:"2025-10-08",type:"push",exercise:"Atlas rozpiętki",weight:40},
  {date:"2025-10-08",type:"push",exercise:"Ławka skośnie hantle",weight:17.5},
  {date:"2025-10-08",type:"push",exercise:"Maszyna skos",weight:12.5},
  {date:"2025-10-08",type:"push",exercise:"Ławka płasko",weight:21},
  {date:"2025-10-08",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2025-10-08",type:"push",exercise:"Wznosy nad głowę",weight:15},
  {date:"2025-10-08",type:"push",exercise:"Rozpiętki tył",weight:30},
  {date:"2025-10-11",type:"pull",exercise:"Wyciąg góra szeroko",weight:60},
  {date:"2025-10-11",type:"pull",exercise:"Wyciąg góra wąsko",weight:60},
  {date:"2025-10-11",type:"pull",exercise:"Wyciąg nisko wąsko",weight:60},
  {date:"2025-10-11",type:"pull",exercise:"Wiosłowanie",weight:20},
  {date:"2025-10-11",type:"pull",exercise:"Martwy ciąg",weight:20},
  {date:"2025-10-11",type:"pull",exercise:"Biceps skos siedząco",weight:12.5},
  {date:"2025-10-11",type:"pull",exercise:"Modlitewnik",weight:10},
  {date:"2025-10-11",type:"pull",exercise:"Młotki",weight:12.5},
  {date:"2025-10-15",type:"push",exercise:"Ławka skośnie hantle",weight:17.5},
  {date:"2025-10-15",type:"push",exercise:"Ławka płasko",weight:25},
  {date:"2025-10-15",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2025-10-15",type:"push",exercise:"Wznosy nad głowę",weight:15},
  {date:"2025-10-15",type:"push",exercise:"Wyciąg triceps",weight:25},
  {date:"2025-10-16",type:"pull",exercise:"Wyciąg góra szeroko",weight:60},
  {date:"2025-10-16",type:"pull",exercise:"Wyciąg góra wąsko",weight:60},
  {date:"2025-10-16",type:"pull",exercise:"Wyciąg nisko wąsko",weight:60},
  {date:"2025-10-16",type:"pull",exercise:"Narciaż",weight:22},
  {date:"2025-10-16",type:"pull",exercise:"Wiosłowanie",weight:20},
  {date:"2025-10-16",type:"pull",exercise:"Biceps skos siedząco",weight:12.5},
  {date:"2025-10-16",type:"pull",exercise:"Modlitewnik",weight:10},
  {date:"2025-10-16",type:"pull",exercise:"Młotki",weight:10},
  {date:"2025-10-18",type:"push",exercise:"Ławka skośnie hantle",weight:17.5},
  {date:"2025-10-18",type:"push",exercise:"Ławka płasko",weight:21},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg góra szeroko",weight:65},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg góra wąsko",weight:65},
  {date:"2025-10-24",type:"pull",exercise:"Wyciąg nisko wąsko",weight:60},
  {date:"2025-10-25",type:"push",exercise:"Atlas rozpiętki",weight:70},
  {date:"2025-10-25",type:"push",exercise:"Ławka skośnie hantle",weight:20},
  {date:"2025-10-25",type:"push",exercise:"Ławka płasko",weight:20},
  {date:"2025-10-25",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2025-10-25",type:"push",exercise:"Wznosy nad głowę",weight:15},
  {date:"2025-10-25",type:"push",exercise:"Ławeczka triceps",weight:25},
  {date:"2025-10-25",type:"push",exercise:"Wyciąg triceps",weight:25},
  {date:"2025-10-28",type:"pull",exercise:"Wyciąg góra szeroko",weight:60},
  {date:"2025-10-28",type:"pull",exercise:"Wyciąg góra wąsko",weight:60},
  {date:"2025-10-28",type:"pull",exercise:"Wyciąg nisko wąsko",weight:65},
  {date:"2025-10-28",type:"pull",exercise:"Narciaż",weight:20},
  {date:"2025-10-28",type:"pull",exercise:"Biceps skos siedząco",weight:12.5},
  {date:"2025-10-28",type:"pull",exercise:"Modlitewnik",weight:12.5},
  {date:"2025-10-28",type:"pull",exercise:"Młotki",weight:10},
  {date:"2026-02-04",type:"push",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-02-04",type:"push",exercise:"Ławka skośnie hantle",weight:25},
  {date:"2026-02-04",type:"push",exercise:"Ławka płasko",weight:30},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Wyciąg nisko wąsko",weight:75},
  {date:"2026-02-04",type:"pull",exercise:"Martwy ciąg",weight:30},
  {date:"2026-02-04",type:"pull",exercise:"Biceps skos siedząco",weight:17.5},
  {date:"2026-02-04",type:"pull",exercise:"Modlitewnik",weight:15},
  {date:"2026-02-04",type:"pull",exercise:"Młotki",weight:12.5},
  {date:"2026-02-04",type:"push",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-02-04",type:"push",exercise:"Wznosy nad głowę",weight:20},
  {date:"2026-02-04",type:"push",exercise:"Ławeczka triceps",weight:30},
  {date:"2026-02-04",type:"push",exercise:"Wyciąg triceps",weight:30},
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
  {date:"2026-03-30",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-03-30",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-03-30",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-03-30",type:"fbw",exercise:"Wznosy nad głowę",weight:27},
  {date:"2026-03-30",type:"fbw",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-03-30",type:"fbw",exercise:"Ławeczka triceps",weight:30},
  {date:"2026-03-30",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-03-31",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-03-31",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-03-31",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-03-31",type:"fbw",exercise:"Martwy ciąg",weight:25},
  {date:"2026-03-31",type:"fbw",exercise:"Biceps skos siedząco",weight:15},
  {date:"2026-03-31",type:"fbw",exercise:"Modlitewnik",weight:15},
  {date:"2026-03-31",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-04-09",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-04-09",type:"fbw",exercise:"Ławka płasko",weight:25},
  {date:"2026-04-09",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-04-09",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-04-09",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-04-09",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-04-09",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-04-09",type:"fbw",exercise:"Biceps skos siedząco",weight:15},
  {date:"2026-04-09",type:"fbw",exercise:"Modlitewnik",weight:15},
  {date:"2026-04-09",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-04-09",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-04-15",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-04-15",type:"fbw",exercise:"Ławka płasko",weight:27},
  {date:"2026-04-15",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-04-15",type:"fbw",exercise:"Wznosy nad głowę",weight:20},
  {date:"2026-04-15",type:"fbw",exercise:"Wznosy bokiem",weight:10},
  {date:"2026-04-15",type:"fbw",exercise:"Wyciąg góra szeroko",weight:70},
  {date:"2026-04-15",type:"fbw",exercise:"Wyciąg góra wąsko",weight:70},
  {date:"2026-04-15",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-04-15",type:"fbw",exercise:"Martwy ciąg",weight:27},
  {date:"2026-04-15",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-04-15",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-04-15",type:"fbw",exercise:"Ławeczka triceps",weight:25},
  {date:"2026-04-15",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-04-17",type:"fbw",exercise:"Suwnica",weight:170},
  {date:"2026-04-17",type:"fbw",exercise:"Ławka płasko",weight:32},
  {date:"2026-04-17",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-04-17",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-04-17",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-04-17",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-04-17",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:85},
  {date:"2026-04-17",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-04-17",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-04-17",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-04-17",type:"fbw",exercise:"Ławeczka triceps",weight:30},
  {date:"2026-04-17",type:"fbw",exercise:"Wyciąg triceps",weight:30},
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
  {date:"2026-04-21",type:"fbw",exercise:"Modlitewnik",weight:15},
  {date:"2026-04-21",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-04-21",type:"fbw",exercise:"Wyciąg triceps",weight:35},
  {date:"2026-04-27",type:"fbw",exercise:"Atlas rozpiętki",weight:50},
  {date:"2026-04-27",type:"fbw",exercise:"Ławka płasko",weight:25},
  {date:"2026-04-27",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-04-27",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-04-27",type:"fbw",exercise:"Wznosy bokiem",weight:12},
  {date:"2026-04-27",type:"fbw",exercise:"Ławeczka triceps",weight:27},
  {date:"2026-04-27",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-05-07",type:"fbw",exercise:"Suwnica",weight:170},
  {date:"2026-05-07",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-05-07",type:"fbw",exercise:"Wyciąg góra wąsko",weight:65},
  {date:"2026-05-07",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-05-07",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-05-07",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-05-07",type:"fbw",exercise:"Modlitewnik",weight:15},
  {date:"2026-05-07",type:"fbw",exercise:"Młotki",weight:12},
  {date:"2026-05-12",type:"fbw",exercise:"Atlas rozpiętki",weight:65},
  {date:"2026-05-12",type:"fbw",exercise:"Suwnica",weight:180},
  {date:"2026-05-12",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-05-12",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-05-12",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg góra szeroko",weight:80},
  {date:"2026-05-12",type:"fbw",exercise:"Wyciąg góra wąsko",weight:70},
  {date:"2026-05-15",type:"fbw",exercise:"Atlas rozpiętki",weight:65},
  {date:"2026-05-15",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-05-15",type:"fbw",exercise:"Wznosy nad głowę",weight:25},
  {date:"2026-05-15",type:"fbw",exercise:"Wznosy bokiem",weight:7},
  {date:"2026-05-15",type:"fbw",exercise:"Wyciąg góra szeroko",weight:80},
  {date:"2026-05-19",type:"fbw",exercise:"Atlas rozpiętki",weight:60},
  {date:"2026-05-19",type:"fbw",exercise:"Suwnica",weight:170},
  {date:"2026-05-19",type:"fbw",exercise:"Ławka płasko",weight:30},
  {date:"2026-05-19",type:"fbw",exercise:"Ławka skośnie hantle",weight:27},
  {date:"2026-05-19",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-19",type:"fbw",exercise:"Wznosy bokiem",weight:7},
  {date:"2026-05-19",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-05-22",type:"fbw",exercise:"Ławka płasko",weight:35},
  {date:"2026-05-22",type:"fbw",exercise:"Ławka skośnie hantle",weight:25},
  {date:"2026-05-22",type:"fbw",exercise:"Wznosy nad głowę",weight:20},
  {date:"2026-05-22",type:"fbw",exercise:"Wznosy bokiem",weight:7},
  {date:"2026-05-22",type:"fbw",exercise:"Rozpiętki tył",weight:5},
  {date:"2026-05-22",type:"fbw",exercise:"Wyciąg góra szeroko",weight:75},
  {date:"2026-05-22",type:"fbw",exercise:"Wyciąg góra wąsko",weight:75},
  {date:"2026-05-22",type:"fbw",exercise:"Wyciąg nisko wąsko",weight:80},
  {date:"2026-05-22",type:"fbw",exercise:"Narciaż",weight:30},
  {date:"2026-05-22",type:"fbw",exercise:"Biceps skos siedząco",weight:20},
  {date:"2026-05-22",type:"fbw",exercise:"Młotki",weight:15},
  {date:"2026-05-22",type:"fbw",exercise:"Wyciąg triceps",weight:30},
  {date:"2026-05-24",type:"fbw",exercise:"Atlas rozpiętki",weight:55},
  {date:"2026-05-24",type:"fbw",exercise:"Suwnica",weight:180},
  {date:"2026-05-24",type:"fbw",exercise:"Wyciąg góra wąsko",weight:80},
  {date:"2026-05-30",type:"fbw",exercise:"Ławka płasko",weight:37},
  {date:"2026-05-30",type:"fbw",exercise:"Ławka skośnie hantle",weight:30},
  {date:"2026-05-30",type:"fbw",exercise:"Wznosy nad głowę",weight:22},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg góra szeroko",weight:80},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg góra wąsko",weight:80},
  {date:"2026-05-30",type:"fbw",exercise:"Wiosłowanie ławka",weight:25},
  {date:"2026-05-30",type:"fbw",exercise:"Biceps skos siedząco",weight:17},
  {date:"2026-05-30",type:"fbw",exercise:"Młotki",weight:15},
  {date:"2026-05-30",type:"fbw",exercise:"Wyciąg triceps",weight:35}
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
// Get muscle for any exercise name (canonical or custom)
const getMuscle = (exName, customExercises=[]) => {
  if(MUSCLE_OF[exName]) return MUSCLE_OF[exName];
  const custom = customExercises.find(e=>e.name===exName);
  if(custom) return custom.muscle;
  return null;
};

// Get all exercises (canonical unique + custom), sorted by muscle
const getAllExercises = (customExercises=[]) => {
  const result = [...ALL_CANONICAL];
  const existingNames = new Set(result.map(e=>e.name));
  customExercises.forEach(e=>{
    if(!existingNames.has(e.name)){ result.push({name:e.name, muscle:e.muscle}); existingNames.add(e.name); }
  });
  return result;
};

// Get exercise list for a session type (push/pull/fbw or muscle name)
const getExercisesForSession = (type, customExercises=[]) => {
  if(EXERCISES[type]) return EXERCISES[type];
  // Muscle-based session
  const base = Object.values(EXERCISES).flat().filter(e=>e.muscle===type);
  const seen = new Set(base.map(e=>e.name));
  const custom = customExercises.filter(e=>e.muscle===type&&!seen.has(e.name));
  return [...base, ...custom];
};

const autoBackup = (history, dayLogs) => {
  try { storage.set("gymtracker_backup", {history,dayLogs,savedAt:new Date().toISOString()}); } catch {}
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{--bg:#080808;--card:#111;--card2:#1a1a1a;--border:#222;--text:#f0f0f0;--muted:#6b7280;--muted2:#9ca3af;--nav-h:68px;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow:hidden;}
.light{--bg:#f4f4f4;--card:#fff;--card2:#eee;--border:#ddd;--text:#111;--muted:#6b7280;--muted2:#374151;}
.app{display:flex;flex-direction:column;height:100dvh;max-width:430px;margin:0 auto;}
.screen{flex:1;overflow-y:auto;padding-bottom:var(--nav-h);}
.screen::-webkit-scrollbar{display:none;}
.nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;height:var(--nav-h);background:#0a0a0a;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;padding:0 8px 8px;z-index:100;}
.nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border:none;background:none;color:var(--muted);cursor:pointer;border-radius:12px;}
.nav-btn.active{color:var(--text);}
.nav-btn span{font-size:10px;font-weight:500;}
.ph{padding:52px 20px 16px;}
.title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;line-height:1;}
.sub{color:var(--muted);font-size:13px;margin-top:4px;}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin:0 16px 12px;}
.card-sm{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:12px;}
.ctitle{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:12px;font-weight:600;}
.slabel{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:600;padding:0 20px;margin:16px 0 8px;}
.btn{border:none;border-radius:12px;padding:12px 20px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;transition:all .15s;}
.btn-red{background:#ef4444;color:#fff;width:100%;margin-top:10px;}
.btn-red:active{transform:scale(.97);}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted2);}
.inp{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;width:100%;}
.inp:focus{border-color:var(--muted2);}
.inp-r{text-align:right;font-size:16px;}
.row{display:flex;align-items:center;gap:12px;}
.ex-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);}
.ex-row:last-child{border:none;}
.ex-name{font-size:13px;color:var(--muted2);}
.ex-wt{font-family:'Bebas Neue',sans-serif;font-size:20px;}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:flex-end;backdrop-filter:blur(4px);}
.modal{background:var(--card);border-radius:20px 20px 0 0;padding:20px;width:100%;max-height:82vh;overflow-y:auto;}
.modal-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px;}
.modal-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1.5px;margin-bottom:12px;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal-cell{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;cursor:pointer;position:relative;}
.pill{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:6px;}
.chip-grid{display:flex;flex-wrap:wrap;gap:6px;}
.chip{padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:var(--card2);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
.chip.active{border-color:currentColor;}
@keyframes up{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.anim{animation:up .25s ease;}
`;

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({n,s=20,c="currentColor"}) => {
  const p={width:s,height:s,fill:"none",stroke:c,strokeWidth:2,viewBox:"0 0 24 24"};
  const icons={
    home:   <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    dumbbell:<svg {...p}><path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 12h12"/></svg>,
    food:   <svg {...p}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    cal:    <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chart:  <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    gear:   <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    check:  <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    chL:    <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    chR:    <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    clock:  <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    fire:   <svg {...p} fill="#ef4444" stroke="none"><path d="M12 2s-5 5-5 10a5 5 0 0010 0C17 7 12 2 12 2zm0 14a2 2 0 01-2-2c0-2 2-4 2-4s2 2 2 4a2 2 0 01-2 2z"/></svg>,
    trophy: <svg {...p}><path d="M6 9H2V4h4M18 9h4V4h-4M12 17v4M8 21h8"/><path d="M6 4h12v8a6 6 0 01-12 0V4z"/></svg>,
    trash:  <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    edit:   <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus:   <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    cam:    <svg {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  };
  return icons[n]||null;
};

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,  setTab]  = useState("today");
  const [settings, setSettings] = useState(()=>storage.get("appSettings",{vibration:true,darkMode:true,notifications:false}));
  const [weeklyGoals, setWeeklyGoals] = useState(()=>storage.get("weeklyGoals",{klata:9,plecy:12,barki:9,biceps:9,triceps:6,nogi:6}));
  const [customExercises, setCustomExercises] = useState(()=>storage.get("customExercises",[]));
  const [dayLogs, setDayLogs]   = useState(()=>storage.get("dayLogs",{}));
  const [history, setHistory]   = useState(()=>{
    const saved = storage.get("gymHistory",null);
    const ver   = storage.get("dataVersion",0);
    if(ver < DATA_VERSION){
      // Merge: keep user workouts, add seed entries not already present
      const base = Array.isArray(saved) ? saved : [];
      const existingKeys = new Set(base.map(e=>`${e.date}|${e.exercise}`));
      const merged = [
        ...base,
        ...SEED_HISTORY.filter(e=>!existingKeys.has(`${e.date}|${e.exercise}`))
      ].sort((a,b)=>a.date>b.date?1:-1);
      storage.set("gymHistory", merged);
      storage.set("dataVersion", DATA_VERSION);
      return merged;
    }
    return saved || SEED_HISTORY;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(()=>{ storage.set("appSettings",settings); },[settings]);
  useEffect(()=>{ storage.set("weeklyGoals",weeklyGoals); },[weeklyGoals]);
  useEffect(()=>{ storage.set("customExercises",customExercises); },[customExercises]);
  useEffect(()=>{ storage.set("dayLogs",dayLogs); },[dayLogs]);
  useEffect(()=>{ storage.set("gymHistory",history); },[history]);

  const todayStr = today();
  const saveDay  = useCallback((data)=>{
    setDayLogs(p=>({...p,[todayStr]:{...p[todayStr],...data}}));
  },[todayStr]);

  const todayLog = dayLogs[todayStr]||{};
  const workoutDates = {};
  history.forEach(e=>{ if(!workoutDates[e.date]) workoutDates[e.date]=e.type; });
  Object.entries(dayLogs).forEach(([d,l])=>{ if(l.workoutType&&!workoutDates[d]) workoutDates[d]=l.workoutType; });

  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return !!(dayLogs[ds]?.workoutType||workoutDates[ds]); });
  const streak = (()=>{ let s=0,d=new Date(); for(let i=0;i<30;i++){ const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; if(dayLogs[ds]?.workoutType||workoutDates[ds]) s++; else if(i>0) break; d.setDate(d.getDate()-1); } return s; })();

  const sharedProps = {history,setHistory,dayLogs,setDayLogs,saveDay,todayStr,todayLog,settings,customExercises,setCustomExercises,weeklyGoals,setWeeklyGoals,workoutDates};

  return (
    <>
      <style>{css}</style>
      <div className={`app ${settings.darkMode?"":"light"}`}>
        <div className="screen">
          {tab==="today"    && <ScreenToday    {...sharedProps} streak={streak} last7={last7} onSettings={()=>setShowSettings(true)}/>}
          {tab==="training" && <ScreenTraining {...sharedProps}/>}
          {tab==="diet"     && <ScreenDiet     {...sharedProps}/>}
          {tab==="calendar" && <ScreenCalendar {...sharedProps}/>}
          {tab==="stats"    && <ScreenStats    {...sharedProps}/>}
        </div>
        <nav className="nav">
          {[{id:"today",n:"home",l:"Dziś"},{id:"training",n:"dumbbell",l:"Trening"},{id:"diet",n:"food",l:"Dieta"},{id:"calendar",n:"cal",l:"Kalendarz"},{id:"stats",n:"chart",l:"Statystyki"}].map(x=>(
            <button key={x.id} className={`nav-btn ${tab===x.id?"active":""}`} onClick={()=>setTab(x.id)}>
              <Ic n={x.n} s={22}/><span>{x.l}</span>
            </button>
          ))}
        </nav>
        {showSettings && <SettingsModal settings={settings} setSettings={setSettings} weeklyGoals={weeklyGoals} setWeeklyGoals={setWeeklyGoals} history={history} dayLogs={dayLogs} onClose={()=>setShowSettings(false)}/>}
      </div>
    </>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────
function SettingsModal({settings,setSettings,weeklyGoals,setWeeklyGoals,history,dayLogs,onClose}) {
  const tog = k => setSettings(p=>({...p,[k]:!p[k]}));
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div className="modal-title">USTAWIENIA</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>v{APP_VERSION}</div>
        </div>
        {[{k:"vibration",e:"📳",l:"Wibracja"},{k:"notifications",e:"🔔",l:"Powiadomienia"},{k:"darkMode",e:"🌙",l:"Tryb ciemny"}].map(({k,e,l})=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:15}}>{e} {l}</span>
            <div onClick={()=>tog(k)} style={{width:48,height:26,borderRadius:13,background:settings[k]?"#ef4444":"#333",cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,left:settings[k]?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
            </div>
          </div>
        ))}
        <div style={{marginTop:16,marginBottom:8,fontSize:13,fontWeight:700,color:"var(--muted2)",letterSpacing:.5}}>CELE SERII / TYDZIEŃ</div>
        {MUSCLES.map(m=>{
          const val=weeklyGoals[m]||9;
          return (
            <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontSize:14,color:MUSCLE_COLOR[m],fontWeight:600}}>{MUSCLE_LABEL[m]}</span>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>setWeeklyGoals(p=>({...p,[m]:Math.max(1,val-1)}))} style={{width:38,height:38,borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:24,minWidth:30,textAlign:"center",color:MUSCLE_COLOR[m]}}>{val}</span>
                <button onClick={()=>setWeeklyGoals(p=>({...p,[m]:val+1}))} style={{width:38,height:38,borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
          );
        })}
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{ const BOM="\uFEFF"; const rows=[["Data","Typ","Ćwiczenie","Ciężar(kg)","Serie"],...history.sort((a,b)=>a.date>b.date?1:-1).map(e=>[e.date,e.type,e.exercise,e.weight,e.sets||3])]; const csv=BOM+rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n"); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})); a.download="gymtracker.csv"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }}>📊 Eksport CSV (Arkusz)</button>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{ const d=JSON.stringify({history,dayLogs,exportDate:today()}); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([d],{type:"application/json"})); a.download="gymtracker-backup.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }}>📤 Backup JSON</button>
          <button className="btn btn-ghost" style={{width:"100%",color:"#ef4444",borderColor:"#ef444433"}} onClick={()=>{ if(confirm("Resetować wszystkie dane?")){ localStorage.clear(); window.location.reload(); } }}>🗑️ Resetuj dane</button>
        </div>
        <button className="btn btn-red" onClick={onClose} style={{marginTop:10}}>Zamknij</button>
      </div>
    </div>
  );
}

// ── SCREEN: DZIŚ ──────────────────────────────────────────────────────────────
function ScreenToday({todayLog,saveDay,streak,last7,history,dayLogs,todayStr,onSettings}) {
  const [steps,setSteps]     = useState(todayLog.steps||"");
  const [kcal,setKcal]       = useState(todayLog.calories||"");
  const now = new Date();
  const greet = now.getHours()<12?"Dzień dobry":now.getHours()<18?"Cześć":"Dobry wieczór";
  const last = [...history].sort((a,b)=>b.date>a.date?1:-1).find(e=>e.date<todayStr);
  const daysAgo = last ? Math.floor((new Date(todayStr)-new Date(last.date))/86400000) : null;
  return (
    <div className="anim">
      <div className="ph" style={{paddingBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div className="sub">{greet} 👋</div><div className="title">DZIŚ</div>
            <div className="sub">{now.toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"})}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,marginTop:8}}>
            <button onClick={onSettings} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Ic n="gear" s={18}/></button>
            <div style={{fontSize:10,color:"var(--muted)"}}>v{APP_VERSION}</div>
          </div>
        </div>
      </div>
      <div className="slabel">Typ dnia</div>
      <div className="card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{id:"work",e:"💼",l:"Praca"},{id:"training",e:"🔥",l:"Trening"},{id:"recovery",e:"🧘",l:"Regeneracja"}].map(t=>(
            <button key={t.id} onClick={()=>saveDay({type:t.id})}
              style={{background:"var(--card2)",border:`1.5px solid ${todayLog.type===t.id?(t.id==="work"?"#6b7280":t.id==="recovery"?"#e8d5b0":"#ef4444"):"var(--border)"}`,borderRadius:12,padding:"12px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}}>
              <span style={{fontSize:22}}>{t.e}</span>
              <span style={{fontSize:11,fontWeight:600,color:todayLog.type===t.id?(t.id==="work"?"#6b7280":t.id==="recovery"?"#e8d5b0":"#ef4444"):"var(--muted)"}}>{t.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 16px 12px"}}>
        <div className="card-sm" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:14}}>
          <Ic n="fire" s={18}/><div style={{fontFamily:"'Bebas Neue'",fontSize:30,color:"#ef4444",margin:"4px 0"}}>{streak}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>dni aktywności</div>
          <div style={{display:"flex",gap:5,marginTop:8}}>{last7.map((d,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:d?"#ef4444":"var(--border)"}}/>)}</div>
        </div>
        <div className="card-sm" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:14}}>
          <Ic n="trophy" s={18}/><div style={{fontFamily:"'Bebas Neue'",fontSize:30,color:"#eab308",margin:"4px 0"}}>{daysAgo??"-"}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>dni od treningu</div>
          {last&&<span className="pill" style={{background:TYPE_COLOR[last.type]+"22",color:TYPE_COLOR[last.type],marginTop:6}}>{last.type.toUpperCase()}</span>}
        </div>
      </div>
      {last&&<><div className="slabel">Ostatni trening</div>
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:TYPE_COLOR[last.type]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
              {last.type==="push"?"🔴":last.type==="pull"?"🔵":"🟢"}
            </div>
            <div><div style={{fontWeight:600}}>{last.type.toUpperCase()} – {fmt(last.date)}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{history.filter(e=>e.date===last.date).length} ćw. · {daysAgo} {daysAgo===1?"dzień":"dni"} temu</div>
            </div>
          </div>
        </div></>}
      <div className="slabel">Aktywność z zegarka</div>
      <div className="card">
        {todayLog.steps&&<div style={{display:"flex",gap:24,marginBottom:12}}>
          <div><div style={{fontFamily:"'Bebas Neue'",fontSize:26}}>{(todayLog.steps||0).toLocaleString()}</div><div style={{fontSize:11,color:"var(--muted)"}}>kroków</div></div>
          <div><div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:"#ef4444"}}>{todayLog.calories||0}</div><div style={{fontSize:11,color:"var(--muted)"}}>kcal aktywnych</div></div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div className="row"><span style={{fontSize:13,color:"var(--muted2)",width:100}}>👟 Kroki</span><input className="inp inp-r" type="number" placeholder="np. 8000" value={steps} onChange={e=>setSteps(e.target.value)}/></div>
          <div className="row"><span style={{fontSize:13,color:"var(--muted2)",width:100}}>🔥 Kcal aktywne</span><input className="inp inp-r" type="number" placeholder="np. 450" value={kcal} onChange={e=>setKcal(e.target.value)}/></div>
          <button className="btn btn-red" onClick={()=>saveDay({steps:Number(steps)||0,calories:Number(kcal)||0})}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: TRENING ───────────────────────────────────────────────────────────
function ScreenTraining({history,setHistory,saveDay,todayStr,settings,customExercises,setCustomExercises}) {
  const [phase, setPhase]   = useState("select"); // select|session|cardio|exercises
  const [selType,setSelType]= useState(null);
  const [editEx, setEditEx] = useState(null); // {name,muscle,isCustom,originalName}
  const [showAdd,setShowAdd]= useState(false);
  const [newEx,  setNewEx]  = useState({name:"",muscle:"klata"});

  // All exercises including custom ones
  const allEx = getAllExercises(customExercises);

  const saveEditEx = () => {
    if(!editEx||!editEx.name.trim()) return;
    if(editEx.isCustom) {
      setCustomExercises(p=>p.map(e=>e.name===editEx.originalName?{...e,name:editEx.name.trim(),muscle:editEx.muscle}:e));
      // update history entries with old name
      if(editEx.name!==editEx.originalName)
        setHistory(p=>p.map(e=>e.exercise===editEx.originalName?{...e,exercise:editEx.name.trim()}:e));
    } else {
      // For built-in exercises, add a custom override
      const exists = customExercises.find(e=>e.originalName===editEx.originalName);
      if(exists) setCustomExercises(p=>p.map(e=>e.originalName===editEx.originalName?{...e,name:editEx.name.trim(),muscle:editEx.muscle}:e));
      else setCustomExercises(p=>[...p,{name:editEx.name.trim(),muscle:editEx.muscle,originalName:editEx.originalName,isOverride:true}]);
      if(editEx.name!==editEx.originalName)
        setHistory(p=>p.map(e=>e.exercise===editEx.originalName?{...e,exercise:editEx.name.trim()}:e));
    }
    setEditEx(null);
  };

  const deleteEx = () => {
    if(!editEx) return;
    if(editEx.isCustom) setCustomExercises(p=>p.filter(e=>e.name!==editEx.originalName));
    else setCustomExercises(p=>p.filter(e=>e.originalName!==editEx.originalName));
    setEditEx(null);
  };

  if(phase==="session") return <SessionView type={selType} history={history} setHistory={setHistory} todayStr={todayStr} onBack={()=>setPhase("select")} saveDay={saveDay} settings={settings} customExercises={customExercises}/>;
  if(phase==="cardio")  return <CardioView onBack={()=>setPhase("select")} saveDay={saveDay} todayStr={todayStr}/>;

  return (
    <div className="anim">
      <div className="ph"><div className="sub">Wybierz typ</div><div className="title">TRENING</div></div>
      {/* TAB SWITCHER */}
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {[["select","💪 Trening"],["exercises","📋 Ćwiczenia"]].map(([id,label])=>(
          <button key={id} onClick={()=>setPhase(id)}
            style={{flex:1,padding:10,borderRadius:12,border:`1.5px solid ${phase===id?"#ef4444":"var(--border)"}`,background:phase===id?"#ef444422":"var(--card2)",color:phase===id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {phase==="select" && <>
        <div className="slabel">Typ treningu</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 16px 12px"}}>
          {[{id:"push",e:"🔴",n:"PUSH",d:"Klata·Barki·Triceps"},{id:"pull",e:"🔵",n:"PULL",d:"Plecy·Biceps"},{id:"fbw",e:"🟢",n:"FBW",d:"Full Body"},{id:"cardio",e:"🟡",n:"CARDIO",d:"Spacer·Bieżnia"}].map(t=>(
            <div key={t.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:"20px 16px",cursor:"pointer",display:"flex",flexDirection:"column",gap:6}}
              onClick={()=>{setSelType(t.id);setPhase(t.id==="cardio"?"cardio":"session");saveDay({workoutType:t.id,type:"training"});}}>
              <span style={{fontSize:28}}>{t.e}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1.5,color:TYPE_COLOR[t.id]||"#eab308"}}>{t.n}</span>
              <span style={{fontSize:11,color:"var(--muted)"}}>{t.d}</span>
            </div>
          ))}
        </div>
        <div className="slabel">Partia ciała</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"0 16px 12px"}}>
          {MUSCLES.map(m=>{
            const MUSCLE_ICON={klata:"🫁",plecy:"🔵",barki:"🏋️",biceps:"💪",triceps:"🤜",nogi:"🦵"};
            return (
              <div key={m} onClick={()=>{setSelType(m);setPhase("session");saveDay({workoutType:m,type:"training"});}}
                style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <span style={{fontSize:22}}>{MUSCLE_ICON[m]||"💪"}</span>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:MUSCLE_COLOR[m]}}>{MUSCLE_LABEL[m].toUpperCase()}</span>
              </div>
            );
          })}
        </div>
        <div className="slabel">Historia</div>
        {["push","pull","fbw"].map(type=>{
          const dates=[...new Set(history.filter(e=>e.type===type).map(e=>e.date))].sort().reverse().slice(0,2);
          return dates.length?(
            <div key={type} className="card" style={{marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:TYPE_COLOR[type],marginBottom:8}}>{type.toUpperCase()}</div>
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

      {phase==="exercises" && <>
        <div style={{margin:"0 16px 12px"}}>
          <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-red" style={{background:showAdd?"#333":"#ef4444"}}>
            {showAdd?"✕ Anuluj":"+ Dodaj nowe ćwiczenie"}
          </button>
        </div>
        {showAdd&&(
          <div className="card" style={{marginBottom:12}}>
            <input className="inp" placeholder="Nazwa ćwiczenia" value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <div className="chip-grid" style={{marginBottom:10}}>
              {MUSCLES.map(m=>(
                <button key={m} className={`chip ${newEx.muscle===m?"active":""}`} style={{color:newEx.muscle===m?MUSCLE_COLOR[m]:"var(--muted)",borderColor:newEx.muscle===m?MUSCLE_COLOR[m]:"var(--border)"}}
                  onClick={()=>setNewEx(p=>({...p,muscle:m}))}>{MUSCLE_LABEL[m]}</button>
              ))}
            </div>
            <button className="btn btn-red" onClick={()=>{
              if(!newEx.name.trim()) return;
              setCustomExercises(p=>[...p,{name:newEx.name.trim(),muscle:newEx.muscle}]);
              setNewEx({name:"",muscle:"klata"}); setShowAdd(false);
            }}>✓ Dodaj ćwiczenie</button>
          </div>
        )}
        {MUSCLES.map(muscle=>{
          const exs = allEx.filter(e=>e.muscle===muscle);
          if(!exs.length) return null;
          return (
            <div key={muscle} className="card" style={{marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUSCLE_COLOR[muscle],marginBottom:8}}>{MUSCLE_LABEL[muscle].toUpperCase()}</div>
              {exs.map(ex=>{
                const last = [...history].filter(e=>e.exercise===ex.name).sort((a,b)=>b.date>a.date?1:-1)[0];
                const isCustom = customExercises.some(c=>c.name===ex.name&&!c.isOverride);
                return (
                  <div key={ex.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{ex.name}{isCustom&&<span style={{fontSize:9,color:MUSCLE_COLOR[muscle],marginLeft:6,fontWeight:700}}>WŁASNE</span>}</div>
                      {last&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{fmt(last.date)} · {last.weight}kg</div>}
                    </div>
                    <button onClick={()=>setEditEx({name:ex.name,muscle:ex.muscle,originalName:ex.name,isCustom})}
                      style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted2)"}}>
                      <Ic n="edit" s={14}/>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>}

      {/* EDIT EXERCISE MODAL */}
      {editEx&&(
        <div className="modal-bg" onClick={()=>setEditEx(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">EDYTUJ ĆWICZENIE</div>
            <input className="inp" value={editEx.name} onChange={e=>setEditEx(p=>({...p,name:e.target.value}))} style={{marginBottom:12}}/>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>Partia ciała:</div>
            <div className="chip-grid" style={{marginBottom:16}}>
              {MUSCLES.map(m=>(
                <button key={m} className={`chip ${editEx.muscle===m?"active":""}`}
                  style={{color:editEx.muscle===m?MUSCLE_COLOR[m]:"var(--muted)",borderColor:editEx.muscle===m?MUSCLE_COLOR[m]:"var(--border)"}}
                  onClick={()=>setEditEx(p=>({...p,muscle:m}))}>{MUSCLE_LABEL[m]}</button>
              ))}
            </div>
            <button className="btn btn-red" onClick={saveEditEx}>✓ Zapisz zmiany</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8,color:"#ef4444",borderColor:"#ef444433"}} onClick={deleteEx}>🗑️ Usuń ćwiczenie</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditEx(null)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SESSION VIEW ──────────────────────────────────────────────────────────────
function SessionView({type,history,setHistory,todayStr,onBack,saveDay,settings,customExercises=[]}) {
  const color = TYPE_COLOR[type]||MUSCLE_COLOR[type]||"#ef4444";
  const exList = getExercisesForSession(type, customExercises);
  const [excluded, setExcluded]   = useState(new Set()); // exercises skipped this session
  const [weights,   setWeights]   = useState({});
  const [done,      setDone]      = useState({});
  const [startTime]               = useState(Date.now());
  const [elapsed,   setElapsed]   = useState(0);
  const [note,      setNote]      = useState("");
  const [finished,  setFinished]  = useState(false);
  const [restEx,    setRestEx]    = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const REST = 180;

  useEffect(()=>{ const t=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000); return()=>clearInterval(t); },[startTime]);
  useEffect(()=>{ if(restTimer===null)return; if(restTimer<=0){setRestTimer(null);setRestEx(null);if(settings?.vibration)vibrate([200,100,200,100,200]);return;} const t=setTimeout(()=>setRestTimer(r=>r-1),1000); return()=>clearTimeout(t); },[restTimer]);
  useEffect(()=>{ let wl=null; const acq=async()=>{ try{ if("wakeLock" in navigator) wl=await navigator.wakeLock.request("screen"); }catch{} }; acq(); const re=()=>{if(document.visibilityState==="visible")acq();}; document.addEventListener("visibilitychange",re); return()=>{ document.removeEventListener("visibilitychange",re); if(wl)try{wl.release();}catch{} }; },[]);

  const getLastW = useCallback((name)=>[...history].filter(e=>e.exercise===name).sort((a,b)=>b.date>a.date?1:-1)[0]?.weight??null,[history]);
  const isPR = (name,w)=>{ const prev=history.filter(e=>e.exercise===name).map(e=>e.weight); return prev.length>0&&w>Math.max(...prev); };

  const toggleSet = (exId,i,sets) => {
    setDone(prev=>{
      const cur=prev[exId]||Array(sets).fill(false);
      const next=[...cur]; next[i]=!next[i];
      if(next[i]){ setRestTimer(REST); setRestEx(exId); if(settings?.vibration)vibrate([100]); }
      else if(restEx===exId){ setRestTimer(null); setRestEx(null); }
      return {...prev,[exId]:next};
    });
  };

  const handleFinish = () => {
    const entries = exList
      .filter(ex=>weights[ex.id||ex.name] && !excluded.has(ex.id||ex.name))
      .map(ex=>({ date:todayStr, type, exercise:ex.name, weight:parseFloat(weights[ex.id||ex.name]), sets:(done[ex.id||ex.name]||[]).filter(Boolean).length||3, id:`${todayStr}-${ex.name}-${Date.now()}` }));
    if(entries.length) setHistory(prev=>{
      const filtered=prev.filter(e=>!(e.date===todayStr&&e.type===type&&entries.some(n=>n.exercise===e.exercise)));
      const merged=[...filtered,...entries];
      autoBackup(merged,{});
      return merged;
    });
    saveDay({type:"training",workoutType:type,duration:elapsed,note});
    setFinished(true);
  };

  const doneSets  = Object.values(done).reduce((s,a)=>s+a.filter(Boolean).length,0);
  const totalSets = exList.length*3;

  if(finished) return (
    <div className="anim" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:24,textAlign:"center"}}>
      <div style={{fontSize:64}}>🏆</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>TRENING UKOŃCZONY!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>Czas: {fmtTime(elapsed)} · {Object.values(weights).filter(Boolean).length} ćwiczeń</div>
      <button className="btn btn-red" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button>
    </div>
  );

  return (
    <div className="anim">
      <div style={{padding:"48px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Ic n="chL" s={18}/></button>
        <div style={{flex:1,fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>{(MUSCLE_LABEL[type]||type).toUpperCase()}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"6px 12px"}}><Ic n="clock" s={14}/><span style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{fmtTime(elapsed)}</span></div>
      </div>
      <div style={{margin:"0 20px 8px",background:"var(--border)",borderRadius:4,height:4}}>
        <div style={{height:"100%",borderRadius:4,background:color,width:`${totalSets>0?Math.min(100,(doneSets/totalSets)*100):0}%`,transition:"width .3s"}}/>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginBottom:12}}>{doneSets} / {totalSets} serii</div>

      {[...exList].sort((a,b)=>{
        const ak=a.id||a.name, bk=b.id||b.name;
        const ad=(done[ak]||[]).filter(Boolean).length>=3;
        const bd=(done[bk]||[]).filter(Boolean).length>=3;
        return ad===bd?0:ad?1:-1;
      }).map(ex=>{
        const key=ex.id||ex.name;
        const lastW=getLastW(ex.name);
        const w=parseFloat(weights[key])||0;
        const pr=w>0&&isPR(ex.name,w);
        const exDone=(done[key]||[]).filter(Boolean).length>=3;
        const isResting=restEx===key&&restTimer!==null;
        return (
          <div key={key} className="card" style={{opacity:excluded.has(key)?0.35:exDone?0.7:1,border:isResting?`1.5px solid ${color}`:undefined,transition:"opacity .3s"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{ex.name}</div><div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginTop:2}}>{ex.muscle}</div></div>
              <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                {pr&&<div style={{fontSize:10,fontWeight:700,color:"#eab308"}}>🏆 REKORD!</div>}
                {lastW&&<div style={{fontSize:11,color:"var(--muted)"}}>Ostatnio: <strong>{lastW}kg</strong></div>}
                <button onClick={()=>setExcluded(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;})}
                  style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"1px solid var(--border)",background:"transparent",color:excluded.has(key)?"#ef4444":"var(--muted)",cursor:"pointer",marginTop:2}}>
                  {excluded.has(key)?"✗ Pomiń":"− Pomiń"}
                </button>
              </div>
            </div>
            {isResting&&(
              <div style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontSize:10,color,fontWeight:700,letterSpacing:1}}>⏸ PRZERWA</div><div style={{fontFamily:"'Bebas Neue'",fontSize:36,color,lineHeight:1}}>{fmtTime(restTimer)}</div></div>
                <button onClick={()=>{setRestTimer(null);setRestEx(null);}} style={{background:color,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Pomiń</button>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <input type="number" step="0.5" placeholder={lastW?`${lastW}`:"kg"} value={weights[key]||""}
                onChange={e=>setWeights(p=>({...p,[key]:e.target.value}))}
                style={{flex:1,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:16,outline:"none"}}/>
              <span style={{fontSize:13,color:"var(--muted)"}}>kg</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[0,1,2].map(i=>{
                const s=(done[key]||[])[i];
                return (
                  <button key={i} onClick={()=>toggleSet(key,i,3)}
                    style={{flex:1,height:40,borderRadius:8,border:`1.5px solid ${s?color:"var(--border)"}`,background:s?color+"22":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:s?color:"var(--muted)",transition:"all .15s",fontSize:12,fontWeight:600}}>
                    {s?<Ic n="check" s={14}/>:`Seria ${i+1}`}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="card">
        <div className="ctitle">Notatka</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Jak poszło?"
          style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",resize:"none",height:72}}/>
      </div>
      <div style={{padding:"0 16px 16px"}}>
        <button className="btn btn-red" onClick={handleFinish}>✓ Zakończ ({fmtTime(elapsed)})</button>
      </div>
    </div>
  );
}

// ── CARDIO VIEW ───────────────────────────────────────────────────────────────
function CardioView({onBack,saveDay,todayStr}) {
  const [type,setType]=useState(null);
  const [km,setKm]=useState("");
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{ if(!running)return; const t=setInterval(()=>setElapsed(e=>e+1),1000); return()=>clearInterval(t); },[running]);
  const color="#eab308";
  if(saved) return <div className="anim" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16}}><div style={{fontSize:64}}>✅</div><div style={{fontFamily:"'Bebas Neue'",fontSize:32}}>ZAPISANO!</div><button className="btn btn-red" style={{width:"auto",paddingLeft:32,paddingRight:32}} onClick={onBack}>Powrót</button></div>;
  return (
    <div className="anim">
      <div style={{padding:"48px 20px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Ic n="chL" s={18}/></button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color}}>CARDIO</div>
      </div>
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {[{id:"walk",e:"🚶",n:"Spacer"},{id:"treadmill",e:"🏃",n:"Bieżnia"},{id:"stairs",e:"🪜",n:"Schody"}].map(ct=>(
          <button key={ct.id} onClick={()=>setType(ct.id)} style={{flex:1,background:type===ct.id?"#eab30822":"var(--card)",border:`1.5px solid ${type===ct.id?"#eab308":"var(--border)"}`,borderRadius:14,padding:"14px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:26}}>{ct.e}</span><span style={{fontSize:12,fontWeight:700,color:type===ct.id?"#eab308":"var(--muted)"}}>{ct.n}</span>
          </button>
        ))}
      </div>
      {type&&<>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:4,color}}>{fmtTime(elapsed)}</div>
          <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center"}}>
            <button onClick={()=>setRunning(r=>!r)} style={{background:running?"#ef444422":"#eab30822",border:`1.5px solid ${running?"#ef4444":"#eab308"}`,borderRadius:12,padding:"10px 24px",color:running?"#ef4444":"#eab308",fontWeight:700,cursor:"pointer",fontSize:14}}>{running?"⏸ Pauza":"▶ Start"}</button>
            <button onClick={()=>{setRunning(false);setElapsed(0);}} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 16px",color:"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:14}}>Reset</button>
          </div>
        </div>
        {(type==="walk"||type==="treadmill")&&<div className="card"><div className="row"><span style={{fontSize:13,color:"var(--muted2)",width:80}}>📏 km</span><input className="inp inp-r" type="number" step="0.1" placeholder="3.5" value={km} onChange={e=>setKm(e.target.value)}/></div></div>}
        <div style={{padding:"0 16px 16px"}}><button className="btn btn-red" onClick={()=>{saveDay({type:"cardio",cardio:{activityType:type,km:parseFloat(km)||0,elapsed}});setSaved(true);}}>✓ Zapisz</button></div>
      </>}
    </div>
  );
}

// ── SCREEN: DIETA ─────────────────────────────────────────────────────────────
function ScreenDiet({saveDay}) {
  const [meals,setMeals]       = useState(()=>storage.get("meals",[]));
  const [goalKcal,setGoalKcal] = useState(()=>storage.get("goalKcal",2200));
  const [showAdd,setShowAdd]   = useState(false);
  const [imgPrev,setImgPrev]   = useState(null);
  const [newMeal,setNewMeal]   = useState({name:"",kcal:"",protein:"",carbs:"",fat:""});
  const [histTab,setHistTab]   = useState("today");
  useEffect(()=>{ storage.set("meals",meals); },[meals]);
  useEffect(()=>{ storage.set("goalKcal",goalKcal); },[goalKcal]);
  const todayStr=today();
  const todayMeals=meals.filter(m=>m.date===todayStr);
  const totalKcal=todayMeals.reduce((s,m)=>s+(m.kcal||0),0);
  const pct=Math.min(100,Math.round((totalKcal/goalKcal)*100));
  const last7=Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; const label=["Pn","Wt","Śr","Cz","Pt","So","Nd"][d.getDay()===0?6:d.getDay()-1]; return{ds,label,kcal:meals.filter(m=>m.date===ds).reduce((s,m)=>s+(m.kcal||0),0)}; });
  const maxK=Math.max(...last7.map(d=>d.kcal),goalKcal,1);
  const handleImg=(e)=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setImgPrev(ev.target.result); r.readAsDataURL(f); };
  const saveMeal=()=>{ if(!newMeal.name)return; setMeals(p=>[{...newMeal,kcal:Number(newMeal.kcal)||0,protein:Number(newMeal.protein)||0,carbs:Number(newMeal.carbs)||0,fat:Number(newMeal.fat)||0,date:todayStr,time:new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}),id:Date.now(),img:imgPrev},...p]); setNewMeal({name:"",kcal:"",protein:"",carbs:"",fat:""}); setImgPrev(null); setShowAdd(false); };
  const histDates=[...new Set(meals.filter(m=>m.date!==todayStr).map(m=>m.date))].sort().reverse().slice(0,14);
  return (
    <div className="anim">
      <div className="ph"><div className="sub">Dziennik</div><div className="title">DIETA</div></div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div><div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:totalKcal>goalKcal?"#ef4444":"#22c55e"}}>{totalKcal}</div><div style={{fontSize:11,color:"var(--muted)"}}>z {goalKcal} kcal celu</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setGoalKcal(p=>Math.max(100,p-100))} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:16,minWidth:40,textAlign:"center"}}>{goalKcal}</span>
            <button onClick={()=>setGoalKcal(p=>p+100)} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
        </div>
        <div style={{background:"var(--border)",borderRadius:6,height:8,marginBottom:10}}><div style={{height:"100%",borderRadius:6,background:totalKcal>goalKcal?"#ef4444":"#22c55e",width:`${pct}%`,transition:"width .3s"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[["🥩 B",todayMeals.reduce((s,m)=>s+(m.protein||0),0),"g","#ef4444"],["🍞 W",todayMeals.reduce((s,m)=>s+(m.carbs||0),0),"g","#eab308"],["🧈 T",todayMeals.reduce((s,m)=>s+(m.fat||0),0),"g","#3b82f6"]].map(([l,v,u,c])=>(
            <div key={l} style={{textAlign:"center",background:"var(--card2)",borderRadius:10,padding:"8px 4px"}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:c}}>{v}{u}</div><div style={{fontSize:10,color:"var(--muted)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="ctitle">Kalorie – 7 dni</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80,marginBottom:4}}>
          {last7.map((d,i)=>{ const h=Math.max(4,(d.kcal/maxK)*76); const isT=d.ds===todayStr; const over=d.kcal>goalKcal; return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{fontSize:8,color:"var(--muted)",height:14,display:"flex",alignItems:"flex-end"}}>{d.kcal>0?d.kcal:""}</div>
              <div style={{width:"100%",height:h,borderRadius:4,background:isT?(over?"#ef4444":"#22c55e"):over?"#ef444433":"#3b82f633",border:isT?`1px solid ${over?"#ef4444":"#22c55e"}`:"none"}}/>
            </div>
          );})}
        </div>
        <div style={{display:"flex",gap:4}}>{last7.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:d.ds===todayStr?"var(--text)":"var(--muted)",fontWeight:d.ds===todayStr?700:400}}>{d.label}</div>)}</div>
      </div>
      <div style={{margin:"0 16px 12px"}}>
        <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-red" style={{background:showAdd?"#333":"#ef4444"}}>{showAdd?"✕ Anuluj":"+ Dodaj posiłek"}</button>
      </div>
      {showAdd&&(
        <div className="card">
          {imgPrev&&<img src={imgPrev} alt="" style={{width:"100%",borderRadius:10,marginBottom:10,maxHeight:150,objectFit:"cover"}}/>}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <Ic n="cam" s={20}/><span style={{fontSize:10,color:"var(--muted)"}}>Aparat</span><input type="file" accept="image/*" capture="environment" onChange={handleImg} style={{display:"none"}}/>
            </label>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <span style={{fontSize:20}}>🖼️</span><span style={{fontSize:10,color:"var(--muted)"}}>Galeria</span><input type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
            </label>
          </div>
          <input className="inp" placeholder="Nazwa posiłku *" value={newMeal.name} onChange={e=>setNewMeal(p=>({...p,name:e.target.value}))} style={{marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["kcal","🔥 Kcal","kcal"],["protein","🥩 Białko","g"],["carbs","🍞 Węgle","g"],["fat","🧈 Tłuszcze","g"]].map(([key,label,unit])=>(
              <div key={key} style={{minWidth:0}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                <div style={{display:"flex",alignItems:"center",gap:2}}>
                  <input type="number" placeholder="0" value={newMeal[key]} onChange={e=>setNewMeal(p=>({...p,[key]:e.target.value}))} style={{width:"100%",minWidth:0,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 4px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:14,outline:"none",textAlign:"right"}}/>
                  <span style={{fontSize:10,color:"var(--muted)",flexShrink:0,marginLeft:2}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-red" onClick={saveMeal}>✓ Zapisz posiłek</button>
        </div>
      )}
      <div style={{display:"flex",gap:8,margin:"4px 16px 8px"}}>
        {[["today","Dziś"],["history","Historia"]].map(([id,l])=>(
          <button key={id} onClick={()=>setHistTab(id)} style={{flex:1,padding:8,borderRadius:10,border:`1.5px solid ${histTab===id?"#22c55e":"var(--border)"}`,background:histTab===id?"#22c55e22":"var(--card2)",color:histTab===id?"#22c55e":"var(--muted)",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {histTab==="today"?(
        todayMeals.length>0?todayMeals.map(m=>(
          <div key={m.id} className="card" style={{marginBottom:8}}>
            {m.img&&<img src={m.img} alt="" style={{width:"100%",borderRadius:10,marginBottom:8,maxHeight:120,objectFit:"cover"}}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{m.name}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.time} · B:{m.protein}g W:{m.carbs}g T:{m.fat}g</div></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#22c55e"}}>{m.kcal}</span>
                <button onClick={()=>setMeals(p=>p.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:18,padding:4}}>×</button>
              </div>
            </div>
          </div>
        )):<div style={{textAlign:"center",padding:24,color:"var(--muted)",fontSize:13}}>Brak posiłków dzisiaj</div>
      ):(
        histDates.length>0?histDates.map(ds=>{ const dm=meals.filter(m=>m.date===ds); const dk=dm.reduce((s,m)=>s+(m.kcal||0),0); return (
          <div key={ds} className="card" style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:13}}>{fmt(ds)}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:dk>goalKcal?"#ef4444":"#22c55e"}}>{dk} kcal</span>
            </div>
            {dm.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:"1px solid var(--border)"}}><span style={{fontSize:12,color:"var(--muted2)"}}>{m.name}</span><span style={{fontSize:12,color:"var(--muted)"}}>{m.kcal} kcal</span></div>)}
          </div>
        )}):<div style={{textAlign:"center",padding:24,color:"var(--muted)",fontSize:13}}>Brak historii</div>
      )}
    </div>
  );
}
// ── SCREEN: KALENDARZ ─────────────────────────────────────────────────────────
function ScreenCalendar({history,dayLogs,workoutDates,weeklyGoals,setWeeklyGoals,customExercises}) {
  const [calDate,setCalDate] = useState(()=>{ const n=new Date(); return {y:n.getFullYear(),m:n.getMonth()}; });
  const [selDay,setSelDay]   = useState(null);
  const {y,m} = calDate;
  const todayStr = today();
  const prevM = ()=>setCalDate(m===0?{y:y-1,m:11}:{y,m:m-1});
  const nextM = ()=>setCalDate(m===11?{y:y+1,m:0}:{y,m:m+1});
  const days = daysInMonth(y,m);
  const first = firstDayOfWeek(y,m);
  const cells = Array(first).fill(null).concat(Array.from({length:days},(_,i)=>i+1));
  const ds = d=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getDayType = d=>workoutDates[ds(d)]||(dayLogs[ds(d)]?.type)||null;

  // Series per muscle for month
  const monthStr = `${y}-${String(m+1).padStart(2,"0")}`;
  const monthTotals = {push:0,pull:0,fbw:0};
  history.filter(e=>e.date.startsWith(monthStr)).forEach(e=>{ if(monthTotals[e.type]!==undefined) monthTotals[e.type]+=(e.sets||3); });

  // Weekly muscle series
  const now2=new Date(); const dow=(now2.getDay()+6)%7;
  const wkStart=new Date(now2); wkStart.setDate(now2.getDate()-dow); wkStart.setHours(0,0,0,0);
  const wkDays=Array.from({length:7},(_,i)=>{ const d=new Date(wkStart); d.setDate(wkStart.getDate()+i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const muscleSets={};
  history.filter(e=>wkDays.includes(e.date)).forEach(e=>{ const mu=getMuscle(e.exercise,customExercises); if(mu) muscleSets[mu]=(muscleSets[mu]||0)+(Number(e.sets)||3); });
  const wStart2=wkStart.toLocaleDateString("pl-PL",{day:"numeric",month:"short"});
  const wEnd2=new Date(wkStart); wEnd2.setDate(wkStart.getDate()+6);
  const [editGoals,setEditGoals]=useState(false);
  const [tmpGoals,setTmpGoals]=useState({});

  return (
    <div className="anim">
      <div className="ph"><div className="sub">Historia aktywności</div><div className="title">KALENDARZ</div></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 16px",marginBottom:12}}>
        {[["push","🔴 PUSH"],["pull","🔵 PULL"],["fbw","🟢 FBW"],["cardio","🟡 Cardio"],["work","💼 Praca"],["recovery","🧘 Regen"]].map(([t,l])=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--muted)"}}>
            <div style={{width:8,height:8,borderRadius:2,background:TYPE_COLOR[t]||"#e8d5b0"}}/>{l}
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={prevM} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Ic n="chL" s={16}/></button>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:2}}>{MONTHS_PL[m]} {y}</span>
          <button onClick={nextM} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text)"}}><Ic n="chR" s={16}/></button>
        </div>
        <div className="cal-grid">
          {DAYS_PL.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"var(--muted)",fontWeight:600,padding:"4px 0 8px",letterSpacing:.5}}>{d}</div>)}
          {cells.map((d,i)=>{
            if(!d) return <div key={`e${i}`} style={{aspectRatio:1}}/>;
            const tp=getDayType(d); const col=tp?TYPE_COLOR[tp]||"#e8d5b0":null;
            const isT=ds(d)===todayStr;
            return (
              <div key={d} className="cal-cell" style={{background:col?col+"33":"var(--card2)",color:col||"var(--muted)",fontWeight:isT?700:400,boxShadow:isT?"0 0 0 1.5px var(--text)":"none"}} onClick={()=>setSelDay(d)}>
                {d}
                {col&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:col}}/>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="slabel">Miesiąc – serie</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"0 16px 12px"}}>
        {["push","pull","fbw"].map(tp=>(
          <div key={tp} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"12px 10px",borderLeft:`3px solid ${TYPE_COLOR[tp]}`}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:TYPE_COLOR[tp]}}>{monthTotals[tp]}</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>serii</div>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:.8,color:TYPE_COLOR[tp],marginTop:4,fontWeight:700}}>{tp}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 20px",marginBottom:8}}>
        <div className="slabel" style={{margin:0,padding:0}}>Tydzień – serie na partię</div>
        <div style={{fontSize:11,color:"var(--muted)"}}>{wStart2} – {wEnd2.toLocaleDateString("pl-PL",{day:"numeric",month:"short"})}</div>
      </div>
      <div className="card" style={{marginBottom:12}}>
        {MUSCLES.map(mu=>{
          const done=muscleSets[mu]||0; const goal=weeklyGoals[mu]||9;
          const pct=Math.min(100,Math.round((done/goal)*100)); const col=MUSCLE_COLOR[mu];
          return (
            <div key={mu} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,fontWeight:600}}>{MUSCLE_LABEL[mu]}</span>
                <span style={{fontSize:13,color:done>=goal?"#22c55e":"var(--muted)"}}><strong style={{color:col,fontFamily:"'Bebas Neue'",fontSize:18}}>{done}</strong><span style={{fontSize:11}}> / {goal}</span></span>
              </div>
              <div style={{background:"var(--border)",borderRadius:6,height:10}}><div style={{height:"100%",borderRadius:6,background:done>=goal?"#22c55e":col,width:`${pct}%`,transition:"width .4s"}}/></div>
            </div>
          );
        })}
        <button onClick={()=>{setTmpGoals({...weeklyGoals});setEditGoals(true);}} style={{width:"100%",marginTop:4,padding:12,borderRadius:12,border:"1.5px solid #ef4444",background:"#ef444411",color:"#ef4444",fontSize:14,fontWeight:700,cursor:"pointer"}}>🎯 Zmień cele serii</button>
      </div>

      {selDay&&(()=>{
        const dayStr=ds(selDay);
        const entries=history.filter(e=>e.date===dayStr);
        const log=dayLogs[dayStr]||{};
        const tp=getDayType(selDay);
        const col=tp?TYPE_COLOR[tp]||"#e8d5b0":"var(--muted)";
        return (
          <div className="modal-bg" onClick={()=>setSelDay(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-title" style={{color:col}}>{fmt(dayStr)} – {tp?tp.toUpperCase():"Brak"}</div>
              {log.duration&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>⏱ {Math.floor(log.duration/60)} min</div>}
              {log.steps&&<div style={{fontSize:13,color:"var(--muted2)",marginBottom:4}}>👟 {log.steps?.toLocaleString()} kroków</div>}
              {log.calories&&<div style={{fontSize:13,color:"var(--muted2)",marginBottom:8}}>🔥 {log.calories} kcal</div>}
              {entries.length>0&&<><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1.5,color:"var(--muted)",fontWeight:600,marginBottom:8}}>Ćwiczenia</div>
                {entries.map((e,i)=>(
                  <div key={i} className="ex-row">
                    <div><div className="ex-name">{e.exercise}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.sets||3}×</div></div>
                    <span className="ex-wt" style={{color:col}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                  </div>
                ))}</>}
              {log.note&&<div style={{marginTop:12,padding:"10px 12px",background:"var(--card2)",borderRadius:10,fontSize:12,color:"var(--muted2)"}}>{log.note}</div>}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:16}} onClick={()=>setSelDay(null)}>Zamknij</button>
            </div>
          </div>
        );
      })()}

      {editGoals&&(
        <div className="modal-bg" onClick={()=>setEditGoals(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">CELE SERII / TYDZIEŃ</div>
            {MUSCLES.map(mu=>{ const val=tmpGoals[mu]!==undefined?tmpGoals[mu]:(weeklyGoals[mu]||9); return (
              <div key={mu} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:14,color:MUSCLE_COLOR[mu],fontWeight:700}}>{MUSCLE_LABEL[mu]}</span>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:MUSCLE_COLOR[mu]}}>{val}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setTmpGoals(p=>({...p,[mu]:Math.max(1,val-1)}))} style={{width:44,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
                  <div style={{flex:1,background:"var(--border)",borderRadius:5,height:8}}><div style={{height:"100%",borderRadius:5,background:MUSCLE_COLOR[mu],width:`${Math.min(100,Math.round((val/20)*100))}%`,transition:"width .2s"}}/></div>
                  <button onClick={()=>setTmpGoals(p=>({...p,[mu]:val+1}))} style={{width:44,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
                </div>
              </div>
            );})}
            <button className="btn btn-red" style={{marginTop:16}} onClick={()=>{setWeeklyGoals({...weeklyGoals,...tmpGoals});setEditGoals(false);}}>✓ Zapisz cele</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditGoals(false)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}
// ── SCREEN: STATYSTYKI ────────────────────────────────────────────────────────
function ScreenStats({history,dayLogs,customExercises=[]}) {
  const [activeTab,   setActiveTab]   = useState("exercises");
  const [selGroup,    setSelGroup]    = useState("pull");
  const [selExercise, setSelExercise] = useState("Wyciąg góra szeroko");
  const [bodyWeight,  setBodyWeight]  = useState(()=>storage.get("bodyWeight",[]));
  const [newWeight,   setNewWeight]   = useState("");
  const [measurements,setMeasurements]= useState(()=>storage.get("measurements",{}));
  const [editMeas,    setEditMeas]    = useState(null);
  const [tmpMeas,     setTmpMeas]     = useState({});

  useEffect(()=>{ storage.set("bodyWeight",bodyWeight); },[bodyWeight]);
  useEffect(()=>{ storage.set("measurements",measurements); },[measurements]);

  const totals={push:0,pull:0,fbw:0};
  Object.keys(totals).forEach(tp=>{ totals[tp]=[...new Set(history.filter(e=>e.type===tp).map(e=>e.date))].length; });
  const totalSteps=Object.values(dayLogs).reduce((s,l)=>s+(l.steps||0),0);

  // All exercises visible in stats
  const allEx = getAllExercises(customExercises);

  const getExForGroup = (group) => {
    if(["push","pull","fbw"].includes(group)){
      const base=[...new Set(EXERCISES[group].map(e=>e.name))];
      const musInGroup={push:["klata","barki","triceps"],pull:["plecy","biceps"],fbw:MUSCLES}[group];
      const extra=allEx.filter(e=>musInGroup.includes(e.muscle)&&!base.includes(e.name)).map(e=>e.name);
      // Also include exercise names from history that map to this group's muscles
      const histExtra=new Set();
      history.forEach(e=>{ const mu=getMuscle(e.exercise,customExercises); if(mu&&musInGroup.includes(mu)&&!base.includes(e.exercise)&&!extra.includes(e.exercise)) histExtra.add(e.exercise); });
      return [...base,...extra,...histExtra];
    }
    const base=[...new Set(allEx.filter(e=>e.muscle===group).map(e=>e.name))];
    const histExtra=new Set();
    history.forEach(e=>{ const mu=getMuscle(e.exercise,customExercises); if(mu===group&&!base.includes(e.exercise)) histExtra.add(e.exercise); });
    return [...base,...histExtra];
  };

  const exListForGroup = getExForGroup(selGroup);

  // All history for selected exercise
  const exHistory = history
    .filter(e=>e.exercise===selExercise)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const maxW=exHistory.length?Math.max(...exHistory.map(e=>e.weight)):1;
  const minW=exHistory.length?Math.min(...exHistory.map(e=>e.weight)):0;
  const range=maxW-minW||1;
  const chartH=100;
  const pts=exHistory.length>1?exHistory.length-1:1;
  const col=TYPE_COLOR[selGroup]||MUSCLE_COLOR[selGroup]||"#ef4444";

  // Last training per muscle
  const getLastMuscle=(muscle)=>{
    const names=new Set(allEx.filter(e=>e.muscle===muscle).map(e=>e.name));
    history.forEach(e=>{ const mu=getMuscle(e.exercise,customExercises); if(mu===muscle) names.add(e.exercise); });
    const entries=history.filter(e=>names.has(e.exercise)).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!entries.length) return null;
    const lastDate=entries[0].date;
    const seen=new Set();
    const lastEntries=entries.filter(e=>{if(e.date===lastDate&&!seen.has(e.exercise)){seen.add(e.exercise);return true;}return false;});
    return {date:lastDate,entries:lastEntries};
  };

  const getBestPerEx=(muscle)=>{
    const names=new Set(allEx.filter(e=>e.muscle===muscle).map(e=>e.name));
    history.forEach(e=>{ const mu=getMuscle(e.exercise,customExercises); if(mu===muscle) names.add(e.exercise); });
    return [...names].map(exName=>{
      const entries=history.filter(e=>e.exercise===exName).sort((a,b)=>new Date(b.date)-new Date(a.date));
      if(!entries.length) return null;
      return {name:exName,latest:entries[0].weight,best:Math.max(...entries.map(e=>e.weight)),date:entries[0].date};
    }).filter(Boolean);
  };

  // Body weight
  const wSorted=[...bodyWeight].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const maxBW=wSorted.length?Math.max(...wSorted.map(w=>w.val)):100;
  const minBW=wSorted.length?Math.min(...wSorted.map(w=>w.val)):60;
  const bwR=maxBW-minBW||1;
  const bwPts=wSorted.length>1?wSorted.length-1:1;

  const groupTabs=[
    {id:"push",label:"PUSH",color:"#ef4444"},{id:"pull",label:"PULL",color:"#3b82f6"},{id:"fbw",label:"FBW",color:"#22c55e"},
    ...MUSCLES.map(m=>({id:m,label:MUSCLE_LABEL[m],color:MUSCLE_COLOR[m]}))
  ];

  const BODY_PARTS=[{key:"klatka",label:"Klatka",x:50,y:26},{key:"biceps_l",label:"Biceps L",x:20,y:35},{key:"biceps_p",label:"Biceps P",x:80,y:35},{key:"pas",label:"Pas",x:50,y:50},{key:"biodra",label:"Biodra",x:50,y:60},{key:"udo_l",label:"Udo L",x:30,y:72},{key:"udo_p",label:"Udo P",x:70,y:72},{key:"lydka_l",label:"Łydka L",x:30,y:87},{key:"lydka_p",label:"Łydka P",x:70,y:87}];

  return (
    <div className="anim">
      <div className="ph"><div className="sub">Twoje wyniki</div><div className="title">STATYSTYKI</div></div>

      <div style={{display:"flex",gap:6,margin:"0 16px 12px",overflowX:"auto",paddingBottom:2}}>
        {Object.entries(totals).map(([tp,n])=>(
          <div key={tp} style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:64}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:TYPE_COLOR[tp]}}>{n}</div>
            <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>{tp}</div>
          </div>
        ))}
        <div style={{flexShrink:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:64}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:"#eab308"}}>{Math.round(totalSteps/1000)}k</div>
          <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8}}>Kroki</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 16px 12px",overflowX:"auto"}}>
        {[{id:"exercises",label:"📈 Ćwiczenia"},{id:"muscle_last",label:"💪 Partie"},{id:"body",label:"⚖️ Sylwetka"},{id:"week",label:"📅 Tygodnie"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flexShrink:0,padding:"8px 14px",borderRadius:10,border:`1.5px solid ${activeTab===t.id?"#ef4444":"var(--border)"}`,background:activeTab===t.id?"#ef444422":"var(--card2)",color:activeTab===t.id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.label}</button>
        ))}
      </div>

      {activeTab==="exercises"&&<>
        <div style={{margin:"0 16px 8px",overflowX:"auto",display:"flex",gap:6,paddingBottom:4}}>
          {groupTabs.map(g=>(
            <button key={g.id} onClick={()=>{setSelGroup(g.id);const exs=getExForGroup(g.id);if(exs.length)setSelExercise(exs[0]);}}
              style={{flexShrink:0,border:`1.5px solid ${selGroup===g.id?g.color:"var(--border)"}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,background:selGroup===g.id?g.color+"33":"var(--card2)",color:selGroup===g.id?g.color:"var(--muted)"}}>
              {g.label}
            </button>
          ))}
        </div>
        <div style={{margin:"0 16px 8px",overflowX:"auto",display:"flex",gap:6,paddingBottom:4}}>
          {exListForGroup.map(ex=>(
            <button key={ex} onClick={()=>setSelExercise(ex)}
              style={{flexShrink:0,border:"1px solid var(--border)",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,background:selExercise===ex?col+"22":"var(--card2)",color:selExercise===ex?col:"var(--muted)",outline:selExercise===ex?`1.5px solid ${col}44`:"none"}}>
              {ex}
            </button>
          ))}
        </div>
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
            <div><div style={{fontWeight:600,fontSize:13}}>{selExercise}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{exHistory.length} pomiarów</div></div>
            {exHistory.length>0&&<div style={{textAlign:"right"}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:col}}>{maxW} kg</div><div style={{fontSize:10,color:"var(--muted)"}}>REKORD</div></div>}
          </div>
          {exHistory.length>1?(
            <svg width="100%" height={chartH+30} viewBox={`0 0 100 ${chartH+30}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity=".3"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
              <path d={[`M 0 ${chartH-((exHistory[0].weight-minW)/range)*chartH}`,...exHistory.slice(1).map((_,i)=>`L ${((i+1)/pts)*100} ${chartH-((exHistory[i+1].weight-minW)/range)*chartH}`),`L 100 ${chartH}`,`L 0 ${chartH}`,"Z"].join(" ")} fill="url(#g1)"/>
              <polyline points={exHistory.map((e,i)=>`${(i/pts)*100},${chartH-((e.weight-minW)/range)*chartH}`).join(" ")} fill="none" stroke={col} strokeWidth="1.5"/>
              {exHistory.map((e,i)=><circle key={i} cx={(i/pts)*100} cy={chartH-((e.weight-minW)/range)*chartH} r="2.5" fill={col}/>)}
              <text x="0" y={chartH+20} fontSize="7" fill="var(--muted)">{minW}kg</text>
              <text x="100" y={chartH+20} fontSize="7" fill="var(--muted)" textAnchor="end">{fmt(exHistory[exHistory.length-1].date)}</text>
            </svg>
          ):exHistory.length===1?<div style={{textAlign:"center",padding:"16px 0",color:"var(--muted)",fontSize:13}}>Jeden pomiar: {exHistory[0].weight}kg</div>:<div style={{textAlign:"center",padding:"16px 0",color:"var(--muted)",fontSize:13}}>Brak danych</div>}
        </div>
        {exHistory.length>0&&(
          <div className="card">
            <div className="ctitle">Historia</div>
            {[...exHistory].reverse().slice(0,12).map((e,i,arr)=>{
              const prev=arr[i+1]; const diff=prev?e.weight-prev.weight:0;
              return (
                <div key={i} className="ex-row">
                  <div><div className="ex-name">{fmt(e.date)}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.type?.toUpperCase()} · {e.sets||3}×</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {diff!==0&&<span style={{fontSize:11,color:diff>0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                    <span className="ex-wt" style={{color:col}}>{e.weight} <span style={{fontSize:12}}>kg</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>}

      {activeTab==="muscle_last"&&(
        <div>
          {MUSCLES.map(muscle=>{
            const last=getLastMuscle(muscle);
            const daysAgo=last?Math.floor((new Date(today())-new Date(last.date))/86400000):null;
            const bestEx=getBestPerEx(muscle);
            return (
              <div key={muscle} className="card" style={{marginBottom:8,borderLeft:`3px solid ${MUSCLE_COLOR[muscle]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:bestEx.length?10:0}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:MUSCLE_COLOR[muscle],letterSpacing:1}}>{MUSCLE_LABEL[muscle]}</div>
                  {last?<div style={{textAlign:"right"}}><div style={{fontSize:12,color:"var(--muted2)",fontWeight:600}}>{fmt(last.date)}</div><div style={{fontSize:11,color:"var(--muted)"}}>{daysAgo===0?"dzisiaj":daysAgo===1?"wczoraj":`${daysAgo} dni temu`}</div></div>:<div style={{fontSize:12,color:"var(--muted)"}}>Brak danych</div>}
                </div>
                {bestEx.map((ex,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:"1px solid var(--border)"}}>
                    <div><div style={{fontSize:12,color:"var(--muted2)"}}>{ex.name}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{fmt(ex.date)}</div></div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUSCLE_COLOR[muscle]}}>{ex.latest}kg</div>
                      {ex.best>ex.latest&&<div style={{fontSize:10,color:"#eab308"}}>max: {ex.best}kg</div>}
                    </div>
                  </div>
                ))}
                {!bestEx.length&&<div style={{fontSize:12,color:"var(--muted)",padding:"4px 0"}}>Brak danych</div>}
              </div>
            );
          })}
        </div>
      )}

      {activeTab==="body"&&<>
        <div className="card">
          <div className="ctitle">Sylwetka – obwody (cm)</div>
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
              {BODY_PARTS.map(bp=>{ const val=measurements[bp.key]; return (
                <g key={bp.key} onClick={()=>{setTmpMeas({...measurements});setEditMeas(bp.key);}} style={{cursor:"pointer"}}>
                  <circle cx={bp.x} cy={bp.y*1.4} r="5.5" fill={val?"#ef444488":"#33333399"} stroke={val?"#ef4444":"#555"} strokeWidth="0.8"/>
                  <text x={bp.x} y={bp.y*1.4+0.5} textAnchor="middle" dominantBaseline="middle" fontSize="3.5" fill={val?"#fff":"#888"} fontWeight="bold">{val?`${val}`:"+"}</text>
                </g>
              );})}
            </svg>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}}>
            {BODY_PARTS.map(bp=>{ const val=measurements[bp.key]; return (
              <div key={bp.key} onClick={()=>{setTmpMeas({...measurements});setEditMeas(bp.key);}} style={{background:"var(--card2)",border:`1px solid ${val?"#ef444444":"var(--border)"}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"var(--muted2)"}}>{bp.label}</span>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:val?"#ef4444":"var(--muted)"}}>{val?`${val}cm`:"—"}</span>
              </div>
            );})}
          </div>
        </div>
        <div className="card">
          <div className="ctitle">Waga ciała</div>
          <div className="row" style={{marginBottom:10}}>
            <span style={{fontSize:13,color:"var(--muted2)",width:80}}>⚖️ Dzisiaj</span>
            <input className="inp inp-r" type="number" step="0.1" placeholder="78.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)}/>
            <span style={{fontSize:13,color:"var(--muted)"}}>kg</span>
          </div>
          <button className="btn btn-red" onClick={()=>{ const v=parseFloat(newWeight); if(!v)return; setBodyWeight(p=>[...p.filter(w=>w.date!==today()),{date:today(),val:v,id:Date.now()}]); setNewWeight(""); }}>Zapisz wagę</button>
          {wSorted.length>1&&(
            <svg width="100%" height={chartH+24} viewBox={`0 0 100 ${chartH+24}`} preserveAspectRatio="none" style={{overflow:"visible",marginTop:12}}>
              <defs><linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".3"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
              <path d={[`M 0 ${chartH-((wSorted[0].val-minBW)/bwR)*chartH}`,...wSorted.slice(1).map((_,i)=>`L ${((i+1)/bwPts)*100} ${chartH-((wSorted[i+1].val-minBW)/bwR)*chartH}`),`L 100 ${chartH}`,`L 0 ${chartH}`,"Z"].join(" ")} fill="url(#bwg)"/>
              <polyline points={wSorted.map((w,i)=>`${(i/bwPts)*100},${chartH-((w.val-minBW)/bwR)*chartH}`).join(" ")} fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              {wSorted.map((w,i)=><circle key={i} cx={(i/bwPts)*100} cy={chartH-((w.val-minBW)/bwR)*chartH} r="2" fill="#3b82f6"/>)}
              <text x="0" y={chartH+18} fontSize="7" fill="var(--muted)">{minBW}kg</text>
              <text x="100" y={chartH+18} fontSize="7" fill="var(--muted)" textAnchor="end">{maxBW}kg</text>
            </svg>
          )}
          {[...wSorted].reverse().slice(0,8).map((w,i,arr)=>{ const prev=arr[i+1]; const diff=prev?+(w.val-prev.val).toFixed(1):0; return (
            <div key={w.id} className="ex-row">
              <span className="ex-name">{fmt(w.date)}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {diff!==0&&<span style={{fontSize:11,color:diff<0?"#22c55e":"#ef4444"}}>{diff>0?"▲":"▼"}{Math.abs(diff)}</span>}
                <span className="ex-wt" style={{color:"#3b82f6"}}>{w.val} <span style={{fontSize:12}}>kg</span></span>
              </div>
            </div>
          );})}
        </div>
        {editMeas&&(()=>{ const bp=BODY_PARTS.find(b=>b.key===editMeas); return (
          <div className="modal-bg" onClick={()=>setEditMeas(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-title">📏 {bp?.label}</div>
              <div className="row" style={{marginBottom:16}}>
                <span style={{fontSize:13,color:"var(--muted2)",width:80}}>Obwód</span>
                <input className="inp inp-r" type="number" step="0.5" placeholder="cm" autoFocus value={tmpMeas[editMeas]||""} onChange={e=>setTmpMeas(p=>({...p,[editMeas]:Number(e.target.value)}))}/>
                <span style={{fontSize:13,color:"var(--muted)"}}>cm</span>
              </div>
              <button className="btn btn-red" onClick={()=>{setMeasurements(tmpMeas);setEditMeas(null);}}>Zapisz</button>
              {measurements[editMeas]&&<button className="btn btn-ghost" style={{width:"100%",marginTop:8,color:"#ef4444"}} onClick={()=>{const mm={...measurements};delete mm[editMeas];setMeasurements(mm);setEditMeas(null);}}>Usuń pomiar</button>}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEditMeas(null)}>Anuluj</button>
            </div>
          </div>
        );})()}
      </>}

      {activeTab==="week"&&(()=>{
        const getWS=d=>{const dt=new Date(d);dt.setDate(dt.getDate()-((dt.getDay()+6)%7));return dt.toISOString().slice(0,10);};
        const wMap={};
        history.forEach(e=>{const ws=getWS(e.date);if(!wMap[ws])wMap[ws]={push:new Set(),pull:new Set(),fbw:new Set()};if(wMap[ws][e.type])wMap[ws][e.type].add(e.date);});
        const weeks=Object.entries(wMap).sort((a,b)=>a[0]>b[0]?-1:1).slice(0,8);
        return (
          <div className="card">
            <div className="ctitle">Podsumowanie tygodni</div>
            {!weeks.length&&<div style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:13}}>Brak danych</div>}
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
        );
      })()}
    </div>
  );
}
