import { useState, useEffect, useCallback } from "react";

const APP_VERSION = "4.6.1";
const DATA_VERSION = 11;

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
// ALL_CANONICAL replaced by exerciseDB

// ── SEED HISTORY (clean data from PDFs) ───────────────────────────────────────
const EXERCISE_DB_SEED = {
  "Atlas klatka":{muscle:"klata",trainings:["push"],history:[{date:"2025-09-18",type:"push",weight:100.0,sets:3}]},
  "Atlas rozpiętki":{muscle:"klata",trainings:["push","fbw"],history:[{date:"2025-09-18",type:"push",weight:30.0,sets:3},{date:"2025-10-08",type:"push",weight:40.0,sets:3},{date:"2025-10-25",type:"push",weight:70.0,sets:3},{date:"2026-02-04",type:"push",weight:55.0,sets:3},{date:"2026-03-30",type:"fbw",weight:55.0,sets:3},{date:"2026-04-09",type:"fbw",weight:55.0,sets:3},{date:"2026-04-15",type:"fbw",weight:55.0,sets:3},{date:"2026-04-21",type:"fbw",weight:65.0,sets:3},{date:"2026-04-27",type:"fbw",weight:50.0,sets:3},{date:"2026-05-12",type:"fbw",weight:65.0,sets:3},{date:"2026-05-15",type:"fbw",weight:65.0,sets:3},{date:"2026-05-19",type:"fbw",weight:60.0,sets:3},{date:"2026-05-24",type:"fbw",weight:55.0,sets:3}]},
  "Biceps skos siedząco":{muscle:"biceps",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:10.0,sets:3},{date:"2025-09-26",type:"pull",weight:10.0,sets:3},{date:"2025-10-01",type:"pull",weight:10.0,sets:3},{date:"2025-10-07",type:"pull",weight:12.0,sets:3},{date:"2025-10-11",type:"pull",weight:12.5,sets:3},{date:"2025-10-16",type:"pull",weight:12.5,sets:3},{date:"2025-10-28",type:"pull",weight:12.5,sets:3},{date:"2026-02-04",type:"pull",weight:17.5,sets:3},{date:"2026-03-26",type:"fbw",weight:20.0,sets:3},{date:"2026-03-31",type:"fbw",weight:15.0,sets:3},{date:"2026-04-09",type:"fbw",weight:15.0,sets:3},{date:"2026-04-15",type:"fbw",weight:17.0,sets:3},{date:"2026-04-17",type:"fbw",weight:17.0,sets:3},{date:"2026-04-21",type:"fbw",weight:17.0,sets:3},{date:"2026-05-07",type:"fbw",weight:17.0,sets:3},{date:"2026-05-22",type:"fbw",weight:20.0,sets:3},{date:"2026-05-30",type:"fbw",weight:17.0,sets:3}]},
  "Brama":{muscle:"klata",trainings:["push"],history:[{date:"2025-09-22",type:"push",weight:10.0,sets:3}]},
  "Dipy":{muscle:"klata",trainings:["push"],history:[{date:"2025-10-03",type:"push",weight:40.0,sets:3}]},
  "Martwy ciąg":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:20.0,sets:3},{date:"2025-10-11",type:"pull",weight:20.0,sets:3},{date:"2026-02-04",type:"pull",weight:30.0,sets:3},{date:"2026-03-31",type:"fbw",weight:25.0,sets:3},{date:"2026-04-15",type:"fbw",weight:27.0,sets:3}]},
  "Maszyna skos":{muscle:"klata",trainings:["push"],history:[{date:"2025-09-22",type:"push",weight:15.0,sets:3},{date:"2025-09-29",type:"push",weight:15.0,sets:3},{date:"2025-10-03",type:"push",weight:15.0,sets:3},{date:"2025-10-08",type:"push",weight:12.5,sets:3}]},
  "Modlitewnik":{muscle:"biceps",trainings:["pull","fbw"],history:[{date:"2025-09-22",type:"pull",weight:15.0,sets:3},{date:"2025-09-26",type:"pull",weight:7.5,sets:3},{date:"2025-10-01",type:"pull",weight:7.5,sets:3},{date:"2025-10-07",type:"pull",weight:10.0,sets:3},{date:"2025-10-11",type:"pull",weight:10.0,sets:3},{date:"2025-10-16",type:"pull",weight:10.0,sets:3},{date:"2025-10-28",type:"pull",weight:12.5,sets:3},{date:"2026-02-04",type:"pull",weight:15.0,sets:3},{date:"2026-03-26",type:"fbw",weight:15.0,sets:3},{date:"2026-03-31",type:"fbw",weight:15.0,sets:3},{date:"2026-04-09",type:"fbw",weight:15.0,sets:3},{date:"2026-04-21",type:"fbw",weight:15.0,sets:3},{date:"2026-05-07",type:"fbw",weight:15.0,sets:3}]},
  "Młotki":{muscle:"biceps",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:10.0,sets:3},{date:"2025-09-26",type:"pull",weight:5.0,sets:3},{date:"2025-10-01",type:"pull",weight:10.0,sets:3},{date:"2025-10-07",type:"pull",weight:10.0,sets:3},{date:"2025-10-11",type:"pull",weight:12.5,sets:3},{date:"2025-10-16",type:"pull",weight:10.0,sets:3},{date:"2025-10-28",type:"pull",weight:10.0,sets:3},{date:"2026-02-04",type:"pull",weight:12.5,sets:3},{date:"2026-03-26",type:"fbw",weight:15.0,sets:3},{date:"2026-03-31",type:"fbw",weight:12.0,sets:3},{date:"2026-04-09",type:"fbw",weight:12.0,sets:3},{date:"2026-04-15",type:"fbw",weight:12.0,sets:3},{date:"2026-04-17",type:"fbw",weight:12.0,sets:3},{date:"2026-04-21",type:"fbw",weight:12.0,sets:3},{date:"2026-05-07",type:"fbw",weight:12.0,sets:3},{date:"2026-05-22",type:"fbw",weight:15.0,sets:3},{date:"2026-05-30",type:"fbw",weight:15.0,sets:3}]},
  "Narciaż":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2025-10-07",type:"pull",weight:20.0,sets:3},{date:"2025-10-16",type:"pull",weight:22.0,sets:3},{date:"2025-10-28",type:"pull",weight:20.0,sets:3},{date:"2026-03-26",type:"fbw",weight:30.0,sets:3},{date:"2026-04-09",type:"fbw",weight:30.0,sets:3},{date:"2026-04-17",type:"fbw",weight:30.0,sets:3},{date:"2026-05-07",type:"fbw",weight:30.0,sets:3},{date:"2026-05-22",type:"fbw",weight:30.0,sets:3}]},
  "Rozpiętki tył":{muscle:"barki",trainings:["push","fbw"],history:[{date:"2025-09-29",type:"push",weight:20.0,sets:3},{date:"2025-10-08",type:"push",weight:30.0,sets:3},{date:"2026-05-22",type:"fbw",weight:5.0,sets:3}]},
  "Suwnica":{muscle:"nogi",trainings:["fbw"],history:[{date:"2026-03-26",type:"fbw",weight:150.0,sets:3},{date:"2026-04-17",type:"fbw",weight:170.0,sets:3},{date:"2026-04-21",type:"fbw",weight:170.0,sets:3},{date:"2026-05-07",type:"fbw",weight:170.0,sets:3},{date:"2026-05-12",type:"fbw",weight:180.0,sets:3},{date:"2026-05-19",type:"fbw",weight:170.0,sets:3},{date:"2026-05-24",type:"fbw",weight:180.0,sets:3}]},
  "Wiosłowanie":{muscle:"plecy",trainings:["pull"],history:[{date:"2025-09-21",type:"pull",weight:20.0,sets:3},{date:"2025-10-07",type:"pull",weight:10.0,sets:3},{date:"2025-10-11",type:"pull",weight:20.0,sets:3},{date:"2025-10-16",type:"pull",weight:20.0,sets:3}]},
  "Wiosłowanie ławka":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2026-05-30",type:"fbw",weight:25.0,sets:3}]},
  "Wyciąg góra szeroko":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:50.0,sets:3},{date:"2025-09-26",type:"pull",weight:55.0,sets:3},{date:"2025-10-01",type:"pull",weight:55.0,sets:3},{date:"2025-10-07",type:"pull",weight:55.0,sets:3},{date:"2025-10-11",type:"pull",weight:60.0,sets:3},{date:"2025-10-16",type:"pull",weight:60.0,sets:3},{date:"2025-10-24",type:"pull",weight:65.0,sets:3},{date:"2025-10-28",type:"pull",weight:60.0,sets:3},{date:"2026-02-04",type:"pull",weight:75.0,sets:3},{date:"2026-03-26",type:"fbw",weight:75.0,sets:3},{date:"2026-03-31",type:"fbw",weight:75.0,sets:3},{date:"2026-04-09",type:"fbw",weight:75.0,sets:3},{date:"2026-04-15",type:"fbw",weight:70.0,sets:3},{date:"2026-04-17",type:"fbw",weight:75.0,sets:3},{date:"2026-04-21",type:"fbw",weight:75.0,sets:3},{date:"2026-05-07",type:"fbw",weight:75.0,sets:3},{date:"2026-05-12",type:"fbw",weight:80.0,sets:3},{date:"2026-05-15",type:"fbw",weight:80.0,sets:3},{date:"2026-05-22",type:"fbw",weight:75.0,sets:3},{date:"2026-05-30",type:"fbw",weight:80.0,sets:3}]},
  "Wyciąg góra wąsko":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:50.0,sets:3},{date:"2025-09-26",type:"pull",weight:55.0,sets:3},{date:"2025-10-01",type:"pull",weight:55.0,sets:3},{date:"2025-10-07",type:"pull",weight:55.0,sets:3},{date:"2025-10-11",type:"pull",weight:60.0,sets:3},{date:"2025-10-16",type:"pull",weight:60.0,sets:3},{date:"2025-10-24",type:"pull",weight:65.0,sets:3},{date:"2025-10-28",type:"pull",weight:60.0,sets:3},{date:"2026-02-04",type:"pull",weight:75.0,sets:3},{date:"2026-03-26",type:"fbw",weight:75.0,sets:3},{date:"2026-03-31",type:"fbw",weight:75.0,sets:3},{date:"2026-04-09",type:"fbw",weight:75.0,sets:3},{date:"2026-04-15",type:"fbw",weight:70.0,sets:3},{date:"2026-04-17",type:"fbw",weight:75.0,sets:3},{date:"2026-04-21",type:"fbw",weight:70.0,sets:3},{date:"2026-05-07",type:"fbw",weight:65.0,sets:3},{date:"2026-05-12",type:"fbw",weight:70.0,sets:3},{date:"2026-05-22",type:"fbw",weight:75.0,sets:3},{date:"2026-05-24",type:"fbw",weight:80.0,sets:3},{date:"2026-05-30",type:"fbw",weight:80.0,sets:3}]},
  "Wyciąg nisko wąsko":{muscle:"plecy",trainings:["pull","fbw"],history:[{date:"2025-09-21",type:"pull",weight:50.0,sets:3},{date:"2025-09-26",type:"pull",weight:55.0,sets:3},{date:"2025-10-01",type:"pull",weight:55.0,sets:3},{date:"2025-10-07",type:"pull",weight:55.0,sets:3},{date:"2025-10-11",type:"pull",weight:60.0,sets:3},{date:"2025-10-16",type:"pull",weight:60.0,sets:3},{date:"2025-10-24",type:"pull",weight:60.0,sets:3},{date:"2025-10-28",type:"pull",weight:65.0,sets:3},{date:"2026-02-04",type:"pull",weight:75.0,sets:3},{date:"2026-03-26",type:"fbw",weight:80.0,sets:3},{date:"2026-03-31",type:"fbw",weight:80.0,sets:3},{date:"2026-04-09",type:"fbw",weight:80.0,sets:3},{date:"2026-04-15",type:"fbw",weight:80.0,sets:3},{date:"2026-04-17",type:"fbw",weight:85.0,sets:3},{date:"2026-04-21",type:"fbw",weight:80.0,sets:3},{date:"2026-05-07",type:"fbw",weight:80.0,sets:3},{date:"2026-05-22",type:"fbw",weight:80.0,sets:3}]},
  "Wyciąg triceps":{muscle:"triceps",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:17.5,sets:3},{date:"2025-09-29",type:"push",weight:15.0,sets:3},{date:"2025-10-03",type:"push",weight:20.0,sets:3},{date:"2025-10-15",type:"push",weight:25.0,sets:3},{date:"2025-10-25",type:"push",weight:25.0,sets:3},{date:"2026-02-04",type:"push",weight:30.0,sets:3},{date:"2026-03-26",type:"fbw",weight:27.0,sets:3},{date:"2026-03-30",type:"fbw",weight:30.0,sets:3},{date:"2026-04-09",type:"fbw",weight:30.0,sets:3},{date:"2026-04-15",type:"fbw",weight:30.0,sets:3},{date:"2026-04-17",type:"fbw",weight:30.0,sets:3},{date:"2026-04-21",type:"fbw",weight:35.0,sets:3},{date:"2026-04-27",type:"fbw",weight:30.0,sets:3},{date:"2026-05-19",type:"fbw",weight:30.0,sets:3},{date:"2026-05-22",type:"fbw",weight:30.0,sets:3},{date:"2026-05-30",type:"fbw",weight:35.0,sets:3}]},
  "Wznosy bokiem":{muscle:"barki",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:7.5,sets:3},{date:"2025-09-29",type:"push",weight:10.0,sets:3},{date:"2025-10-03",type:"push",weight:10.0,sets:3},{date:"2025-10-08",type:"push",weight:10.0,sets:3},{date:"2025-10-15",type:"push",weight:10.0,sets:3},{date:"2025-10-25",type:"push",weight:10.0,sets:3},{date:"2026-02-04",type:"push",weight:10.0,sets:3},{date:"2026-03-26",type:"fbw",weight:10.0,sets:3},{date:"2026-03-30",type:"fbw",weight:10.0,sets:3},{date:"2026-04-15",type:"fbw",weight:10.0,sets:3},{date:"2026-04-21",type:"fbw",weight:10.0,sets:3},{date:"2026-04-27",type:"fbw",weight:12.0,sets:3},{date:"2026-05-15",type:"fbw",weight:7.0,sets:3},{date:"2026-05-19",type:"fbw",weight:7.0,sets:3},{date:"2026-05-22",type:"fbw",weight:7.0,sets:3}]},
  "Wznosy nad głowę":{muscle:"barki",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:12.5,sets:3},{date:"2025-09-29",type:"push",weight:15.0,sets:3},{date:"2025-10-03",type:"push",weight:12.5,sets:3},{date:"2025-10-08",type:"push",weight:15.0,sets:3},{date:"2025-10-15",type:"push",weight:15.0,sets:3},{date:"2025-10-25",type:"push",weight:15.0,sets:3},{date:"2026-02-04",type:"push",weight:20.0,sets:3},{date:"2026-03-26",type:"fbw",weight:22.0,sets:3},{date:"2026-03-30",type:"fbw",weight:27.0,sets:3},{date:"2026-04-15",type:"fbw",weight:20.0,sets:3},{date:"2026-04-17",type:"fbw",weight:22.0,sets:3},{date:"2026-04-21",type:"fbw",weight:22.0,sets:3},{date:"2026-04-27",type:"fbw",weight:22.0,sets:3},{date:"2026-05-12",type:"fbw",weight:22.0,sets:3},{date:"2026-05-15",type:"fbw",weight:25.0,sets:3},{date:"2026-05-19",type:"fbw",weight:22.0,sets:3},{date:"2026-05-22",type:"fbw",weight:20.0,sets:3},{date:"2026-05-30",type:"fbw",weight:22.0,sets:3}]},
  "Ławeczka triceps":{muscle:"triceps",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:12.5,sets:3},{date:"2025-09-29",type:"push",weight:10.0,sets:3},{date:"2025-10-03",type:"push",weight:10.0,sets:3},{date:"2025-10-25",type:"push",weight:25.0,sets:3},{date:"2026-02-04",type:"push",weight:30.0,sets:3},{date:"2026-03-26",type:"fbw",weight:27.0,sets:3},{date:"2026-03-30",type:"fbw",weight:30.0,sets:3},{date:"2026-04-15",type:"fbw",weight:25.0,sets:3},{date:"2026-04-17",type:"fbw",weight:30.0,sets:3},{date:"2026-04-27",type:"fbw",weight:27.0,sets:3}]},
  "Ławka płasko":{muscle:"klata",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:10.0,sets:3},{date:"2025-09-29",type:"push",weight:12.5,sets:3},{date:"2025-10-03",type:"push",weight:20.0,sets:3},{date:"2025-10-08",type:"push",weight:21.0,sets:3},{date:"2025-10-15",type:"push",weight:25.0,sets:3},{date:"2025-10-18",type:"push",weight:21.0,sets:3},{date:"2025-10-25",type:"push",weight:20.0,sets:3},{date:"2026-02-04",type:"push",weight:30.0,sets:3},{date:"2026-03-26",type:"fbw",weight:30.0,sets:3},{date:"2026-03-30",type:"fbw",weight:30.0,sets:3},{date:"2026-04-09",type:"fbw",weight:25.0,sets:3},{date:"2026-04-15",type:"fbw",weight:27.0,sets:3},{date:"2026-04-17",type:"fbw",weight:32.0,sets:3},{date:"2026-04-21",type:"fbw",weight:30.0,sets:3},{date:"2026-04-27",type:"fbw",weight:25.0,sets:3},{date:"2026-05-12",type:"fbw",weight:30.0,sets:3},{date:"2026-05-15",type:"fbw",weight:30.0,sets:3},{date:"2026-05-19",type:"fbw",weight:30.0,sets:3},{date:"2026-05-22",type:"fbw",weight:35.0,sets:3},{date:"2026-05-30",type:"fbw",weight:37.0,sets:3}]},
  "Ławka skośnie hantle":{muscle:"klata",trainings:["push","fbw"],history:[{date:"2025-09-22",type:"push",weight:10.0,sets:3},{date:"2025-09-29",type:"push",weight:15.0,sets:3},{date:"2025-10-03",type:"push",weight:17.5,sets:3},{date:"2025-10-08",type:"push",weight:17.5,sets:3},{date:"2025-10-15",type:"push",weight:17.5,sets:3},{date:"2025-10-18",type:"push",weight:17.5,sets:3},{date:"2025-10-25",type:"push",weight:20.0,sets:3},{date:"2026-02-04",type:"push",weight:25.0,sets:3},{date:"2026-03-26",type:"fbw",weight:25.0,sets:3},{date:"2026-03-30",type:"fbw",weight:27.0,sets:3},{date:"2026-04-09",type:"fbw",weight:27.0,sets:3},{date:"2026-04-15",type:"fbw",weight:27.0,sets:3},{date:"2026-04-17",type:"fbw",weight:27.0,sets:3},{date:"2026-04-21",type:"fbw",weight:27.0,sets:3},{date:"2026-04-27",type:"fbw",weight:27.0,sets:3},{date:"2026-05-12",type:"fbw",weight:27.0,sets:3},{date:"2026-05-19",type:"fbw",weight:27.0,sets:3},{date:"2026-05-22",type:"fbw",weight:25.0,sets:3},{date:"2026-05-30",type:"fbw",weight:30.0,sets:3}]},
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
// Get muscle for any exercise name (canonical or custom)
// getMuscle: exerciseDB is the source of truth
// Falls back to EXERCISES definitions if exerciseDB not available yet
const getMuscle = (exName, exerciseDB={}) => {
  if(exerciseDB[exName]) return exerciseDB[exName].muscle;
  const found = Object.values(EXERCISES).flat().find(e=>e.name===exName);
  return found ? found.muscle : null;
};

// Get all exercises (canonical unique + custom), sorted by muscle
// getAllExercises: read directly from exerciseDB (single source of truth)
// exerciseDB passed as arg from component state
const getAllExercises = (exerciseDB={}) => {
  return Object.entries(exerciseDB).map(([name, ex]) => ({
    name,
    muscle: ex.muscle,
    trainings: ex.trainings || [],
  })).sort((a,b) => a.name.localeCompare(b.name, 'pl'));
};

// Get exercise list for a session type (push/pull/fbw or muscle name)
// getExercisesForSession: get exercises for a training type or muscle group
// Uses exerciseDB as source of truth
// workoutTemplates: {push:["ExName",...], pull:null, fbw:null} - null = all
const getExercisesForSession = (type, exerciseDB={}, workoutTemplates={}) => {
  const isMuscleBased = !['push','pull','fbw','cardio'].includes(type);
  const template = workoutTemplates[type]; // null = all, array = custom selection

  let candidates;
  if(isMuscleBased) {
    // Muscle-based: all exercises for that muscle
    candidates = Object.entries(exerciseDB)
      .filter(([,ex]) => ex.muscle === type)
      .map(([name, ex]) => ({ name, muscle: ex.muscle, id: name }));
  } else {
    // Type-based (push/pull/fbw): exercises that include this training type
    candidates = Object.entries(exerciseDB)
      .filter(([,ex]) => Array.isArray(ex.trainings) && ex.trainings.includes(type))
      .map(([name, ex]) => ({ name, muscle: ex.muscle, id: name }));
  }

  // Apply template filter if set
  if(template && Array.isArray(template)) {
    candidates = candidates.filter(e => template.includes(e.name));
  }

  // Sort by muscle then name
  return candidates.sort((a,b) => {
    if(a.muscle !== b.muscle) return a.muscle.localeCompare(b.muscle);
    return a.name.localeCompare(b.name, 'pl');
  });
};

// ── AUDIO ─────────────────────────────────────────────────────────────────────
const playBeep = (freq=880, duration=80, vol=0.08) => {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration/1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration/1000);
    setTimeout(()=>ctx.close(), duration + 100);
  } catch {}
};

const autoBackup = (history, dayLogs) => {
  try { storage.set("gymtracker_backup", {history,dayLogs,savedAt:new Date().toISOString()}); } catch {}
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
@keyframes spin{to{transform:rotate(360deg)}}
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
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
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
  const [settings, setSettings] = useState(()=>storage.get("appSettings",{vibration:true,darkMode:true,notifications:false,stepGoal:10000,kcalGoal:1000}));
  const [weeklyGoals, setWeeklyGoals] = useState(()=>storage.get("weeklyGoals",{klata:9,plecy:12,barki:9,biceps:9,triceps:6,nogi:6}));
  // workoutTemplates: which exercise IDs are enabled for each training type
  // null = use defaults (all exercises), array = custom selection
  const [workoutTemplates, setWorkoutTemplates] = useState(()=>storage.get("workoutTemplates",{push:null,pull:null,fbw:null}));
  useEffect(()=>{ storage.set("workoutTemplates",workoutTemplates); },[workoutTemplates]);

  const [geminiKey,  setGeminiKey]  = useState(()=>storage.get("geminiKey",""));
  const [tdee,       setTdee]       = useState(()=>storage.get("tdee",2500));
  const [goalKcal,   setGoalKcal]   = useState(()=>storage.get("goalKcal",2200));
  useEffect(()=>{ storage.set("tdee",tdee); },[tdee]);
  const [aiEnabled,  setAiEnabled]  = useState(()=>storage.get("aiEnabled",false));
  useEffect(()=>{ storage.set("geminiKey", geminiKey); },[geminiKey]);
  useEffect(()=>{ storage.set("aiEnabled", aiEnabled); },[aiEnabled]);
  const [customExercises, setCustomExercises] = useState(()=>storage.get("customExercises",[]));
  const [hiddenExercises, setHiddenExercises] = useState(()=>storage.get("hiddenExercises",[]));
  useEffect(()=>{ storage.set("hiddenExercises",hiddenExercises); },[hiddenExercises]);
  const [dayLogs, setDayLogs]   = useState(()=>storage.get("dayLogs",{}));
  // ── EXERCISE_DB: single source of truth for all exercise data ──────────────
  const [exerciseDB, setExerciseDB] = useState(()=>{
    const saved = storage.get("exerciseDB", null);
    const ver   = storage.get("dataVersion", 0);

    // Helper: sanitize an exerciseDB object - ensure every entry has trainings+history
    const sanitize = (db) => {
      const out = {};
      Object.entries(db).forEach(([name, ex]) => {
        const trainings = Array.isArray(ex.trainings)
          ? ex.trainings
          : [...new Set((ex.history||[]).map(h=>h.type))];
        out[name] = {muscle: ex.muscle||"klata", trainings, history: ex.history||[]};
      });
      return out;
    };

    if(ver < DATA_VERSION) {
      // First run or version upgrade: merge saved with seed
      const base = (saved && typeof saved === "object" && !Array.isArray(saved))
        ? sanitize(saved) : {};
      const merged = sanitize({...EXERCISE_DB_SEED});
      // Keep user's history entries not already in seed
      Object.keys(base).forEach(name => {
        if(merged[name]) {
          const existingKeys = new Set(merged[name].history.map(h=>`${h.date}|${h.type}`));
          const userOnly = base[name].history.filter(h=>!existingKeys.has(`${h.date}|${h.type}`));
          merged[name] = {...merged[name],
            history:[...merged[name].history, ...userOnly].sort((a,b)=>a.date>b.date?1:-1)
          };
        } else {
          merged[name] = base[name]; // custom exercise from user
        }
      });
      storage.set("exerciseDB", merged);
      storage.set("dataVersion", DATA_VERSION);
      return merged;
    }

    // Normal load: always sanitize to fix any corrupt data
    if(saved && typeof saved === "object" && !Array.isArray(saved)) {
      const clean = sanitize(saved);
      return clean;
    }
    return EXERCISE_DB_SEED;
  });
  useEffect(()=>{ storage.set("exerciseDB", exerciseDB); },[exerciseDB]);

  // Derived flat history array for backward compat with stats/calendar
  const history = Object.entries(exerciseDB).flatMap(([name, ex])=>
    ex.history.map(h=>({...h, exercise:name}))
  ).sort((a,b)=>a.date>b.date?1:-1);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(()=>{ storage.set("appSettings",settings); },[settings]);
  useEffect(()=>{ storage.set("weeklyGoals",weeklyGoals); },[weeklyGoals]);
  useEffect(()=>{ storage.set("customExercises",customExercises); },[customExercises]);
  useEffect(()=>{ storage.set("dayLogs",dayLogs); },[dayLogs]);

  const todayStr = today();
  const saveDay  = useCallback((data)=>{
    setDayLogs(p=>{
      const prev = p[todayStr]||{};
      // Accumulate workoutTypes as array (support multiple workouts per day)
      let workoutTypes = prev.workoutTypes ? [...prev.workoutTypes] : (prev.workoutType ? [prev.workoutType] : []);
      if(data.workoutType && !workoutTypes.includes(data.workoutType)) {
        workoutTypes = [...workoutTypes, data.workoutType];
      }
      return {...p,[todayStr]:{...prev,...data, workoutTypes, workoutType: workoutTypes[workoutTypes.length-1]}};
    });
  },[todayStr]);

  const todayLog = dayLogs[todayStr]||{};
  const workoutDates = {};
  // Build from exerciseDB history - collect all types per date
  history.forEach(e=>{
    if(!workoutDates[e.date]) workoutDates[e.date]=[e.type];
    else if(!workoutDates[e.date].includes(e.type)) workoutDates[e.date]=[...workoutDates[e.date],e.type];
  });
  // Merge with dayLogs
  Object.entries(dayLogs).forEach(([d,l])=>{
    const types = l.workoutTypes || (l.workoutType ? [l.workoutType] : []);
    if(types.length) {
      if(!workoutDates[d]) workoutDates[d]=types;
      else workoutDates[d]=[...new Set([...workoutDates[d],...types])];
    }
  });

  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return !!(dayLogs[ds]?.workoutType||dayLogs[ds]?.workoutTypes?.length||(workoutDates[ds]&&workoutDates[ds].length>0)); });
  const streak = (()=>{ let s=0,d=new Date(); for(let i=0;i<30;i++){ const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; if(dayLogs[ds]?.workoutType||dayLogs[ds]?.workoutTypes?.length||(workoutDates[ds]&&workoutDates[ds].length>0)) s++; else if(i>0) break; d.setDate(d.getDate()-1); } return s; })();

  const aiActive = !!(aiEnabled && geminiKey.trim());
  const sharedProps = {history,exerciseDB,setExerciseDB,dayLogs,setDayLogs,saveDay,todayStr,todayLog,settings,setSettings,customExercises,setCustomExercises,hiddenExercises,setHiddenExercises,weeklyGoals,setWeeklyGoals,workoutDates,workoutTemplates,setWorkoutTemplates,aiActive,geminiKey,setGeminiKey,aiEnabled,setAiEnabled,tdee,setTdee,goalKcal,setGoalKcal};

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
        {showSettings && <SettingsModal settings={settings} setSettings={setSettings} weeklyGoals={weeklyGoals} setWeeklyGoals={setWeeklyGoals} history={history} dayLogs={dayLogs} exerciseDB={exerciseDB} geminiKey={geminiKey} setGeminiKey={setGeminiKey} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} onClose={()=>setShowSettings(false)} tdee={tdee} setTdee={setTdee} goalKcal={goalKcal} setGoalKcal={setGoalKcal}/>}
      </div>
    </>
  );
}


// ── TDEE CALCULATOR COMPONENT ─────────────────────────────────────────────────
function TdeeCalculator({settings,setSettings,history,dayLogs,setTdee,setGoalKcal}) {
  const bwHist = storage.get("bodyWeight",[]);
  const bwSorted = [...bwHist].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const currentWeight = bwSorted.length>0 ? Number(bwSorted[0].val) : 80;
  const now7 = new Date();
  const last7days = Array.from({length:7},(_,i)=>{ const d=new Date(now7); d.setDate(d.getDate()-i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const workoutsLast7 = [...new Set(history.filter(e=>last7days.includes(e.date)).map(e=>e.date))].length;
  const cardioLast7 = last7days.filter(d=>{ const l=dayLogs[d]; return l&&(l.workoutTypes?.includes("cardio")||l.workoutType==="cardio"); }).length;
  const avgSteps = Math.round(last7days.reduce((s,d)=>s+(dayLogs[d]?.steps||0),0)/7);

  const [height, setHeight] = useState(()=>settings.height||188);
  const [age,    setAge]    = useState(()=>settings.age||38);
  const [gender, setGender] = useState(()=>settings.gender||"male");
  const [goal,   setGoal]   = useState("cut");
  const [result, setResult] = useState(null);

  const calcTDEE = () => {
    const bmr = gender==="male" ? 10*currentWeight+6.25*height-5*age+5 : 10*currentWeight+6.25*height-5*age-161;
    const totalActive = workoutsLast7+cardioLast7;
    const actMult = avgSteps<5000&&totalActive===0?1.2:avgSteps<7500&&totalActive<=1?1.375:avgSteps<10000&&totalActive<=3?1.55:1.725;
    const tdeeCalc = Math.round(bmr*actMult);
    const goalKcalCalc = goal==="cut"?Math.round(tdeeCalc*0.8):goal==="bulk"?Math.round(tdeeCalc*1.1):tdeeCalc;
    setResult({bmr:Math.round(bmr),tdee:tdeeCalc,goalKcal:goalKcalCalc,actMult});
  };

  const applyResult = () => {
    if(!result) return;
    setTdee(result.tdee);
    setGoalKcal(result.goalKcal);
    setSettings(p=>({...p,height,age,gender}));
    alert("✅ Zastosowano w Diecie!");
  };

  const actLabel = result?(result.actMult<=1.2?"🪑 Siedzący":result.actMult<=1.375?"🚶 Lekko aktywny":result.actMult<=1.55?"🏃 Umiarkowanie aktywny":"💪 Bardzo aktywny"):"";

  return (
    <div>
      <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Oblicza TDEE na podstawie Twoich danych i aktywności z ostatnich 7 dni.</div>
      <div style={{background:"var(--card2)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
        <div style={{fontWeight:700,color:"var(--muted2)",marginBottom:8,fontSize:11,letterSpacing:.5}}>DANE Z APLIKACJI</div>
        {[["⚖️ Waga",currentWeight+" kg"],["🏋️ Treningi siłowe",workoutsLast7+"x"],["🚴 Cardio",cardioLast7+"x"],["👟 Śr. kroków/dzień",avgSteps.toLocaleString()]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
            <span style={{color:"var(--muted)"}}>{l}</span><strong>{v}</strong>
          </div>
        ))}
      </div>
      {[{l:"📏 Wzrost (cm)",v:height,set:setHeight,min:140,max:220},{l:"🎂 Wiek",v:age,set:setAge,min:15,max:80}].map(({l,v,set,min,max})=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
          <span style={{fontSize:13}}>{l}</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>set(p=>Math.max(min,p-1))} style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer"}}>−</button>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:22,minWidth:36,textAlign:"center"}}>{v}</span>
            <button onClick={()=>set(p=>Math.min(max,p+1))} style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer"}}>+</button>
          </div>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
        <span style={{fontSize:13}}>⚧️ Płeć</span>
        <div style={{display:"flex",gap:6}}>
          {[["male","♂️ Mężczyzna"],["female","♀️ Kobieta"]].map(([v,l])=>(
            <button key={v} onClick={()=>setGender(v)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${gender===v?"#ef4444":"var(--border)"}`,background:gender===v?"#ef444422":"var(--card2)",color:gender===v?"#ef4444":"var(--muted)",fontSize:11,cursor:"pointer",fontWeight:gender===v?700:400}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:13,marginBottom:8}}>🎯 Cel</div>
        <div style={{display:"flex",gap:6}}>
          {[["cut","🔥 Redukcja","-20%"],["maintain","⚖️ Utrzymanie","0%"],["bulk","💪 Masa","+10%"]].map(([v,l,d])=>(
            <button key={v} onClick={()=>setGoal(v)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${goal===v?"#ef4444":"var(--border)"}`,background:goal===v?"#ef444422":"var(--card2)",color:goal===v?"#ef4444":"var(--muted)",fontSize:10,cursor:"pointer",fontWeight:goal===v?700:400,textAlign:"center"}}>
              <div>{l}</div><div style={{fontSize:9,opacity:.7}}>{d}</div>
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-red" style={{width:"100%",marginTop:12}} onClick={calcTDEE}>🔢 Oblicz zapotrzebowanie</button>
      {result&&(
        <div style={{marginTop:12,background:"var(--card2)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontWeight:700,color:"var(--muted2)",marginBottom:8,fontSize:11,letterSpacing:.5}}>WYNIK – {actLabel}</div>
          {[["BMR (podstawowe)",result.bmr+" kcal","var(--text)"],["TDEE (zapotrzebowanie)",result.tdee+" kcal","#eab308"],["Cel kaloryczny",result.goalKcal+" kcal","#ef4444"]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:"var(--muted)",fontSize:13}}>{l}</span>
              <strong style={{color:c,fontSize:l.includes("Cel")?18:14}}>{v}</strong>
            </div>
          ))}
          <button className="btn btn-red" style={{width:"100%",marginTop:10}} onClick={applyResult}>✅ Zastosuj w Diecie</button>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:6,textAlign:"center"}}>Zaktualizuje TDEE i cel kalorii w Diecie</div>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────
function SettingsModal({settings,setSettings,weeklyGoals,setWeeklyGoals,history,dayLogs,exerciseDB={},geminiKey="",setGeminiKey,aiEnabled,setAiEnabled,onClose,tdee,setTdee,goalKcal,setGoalKcal}) {
  const tog = k => setSettings(p=>({...p,[k]:!p[k]}));
  const [stab, setStab] = useState("general"); // settings tab
  const [keyInput, setKeyInput] = useState("");
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div className="modal-title">USTAWIENIA</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>v{APP_VERSION}</div>
        </div>
        {/* TAB SWITCHER */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[["general","⚙️ Ogólne"],["tdee","🔢 Kalkulator"],["ai","🤖 AI"]].map(([id,label])=>(
            <button key={id} onClick={()=>setStab(id)}
              style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1.5px solid ${stab===id?"#ef4444":"var(--border)"}`,background:stab===id?"#ef444422":"var(--card2)",color:stab===id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:11,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>
        {stab==="general" && <>
        {[{k:"vibration",e:"📳",l:"Wibracja"},{k:"notifications",e:"🔔",l:"Powiadomienia"},{k:"darkMode",e:"🌙",l:"Tryb ciemny"}].map(({k,e,l})=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:15}}>{e} {l}</span>
            <div onClick={()=>tog(k)} style={{width:48,height:26,borderRadius:13,background:settings[k]?"#ef4444":"#333",cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,left:settings[k]?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
            </div>
          </div>
        ))}
        <div style={{marginTop:16,marginBottom:8,fontSize:13,fontWeight:700,color:"var(--muted2)",letterSpacing:.5}}>CELE AKTYWNOŚCI / DZIEŃ</div>
        {[
          {k:"stepGoal", e:"👟", l:"Cel kroków", min:1000, step:1000, unit:"kroków"},
          {k:"kcalGoal", e:"🔥", l:"Cel kcal aktywnych", min:100, step:100, unit:"kcal"},
        ].map(({k,e,l,min,step,unit})=>{
          const val = settings[k]||(k==="stepGoal"?10000:1000);
          return (
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{e} {l}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{val.toLocaleString()} {unit}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setSettings(p=>({...p,[k]:Math.max(min,val-step)}))} style={{width:34,height:34,borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:20,minWidth:50,textAlign:"center"}}>{val>=1000?val/1000+"k":val}</span>
                <button onClick={()=>setSettings(p=>({...p,[k]:val+step}))} style={{width:34,height:34,borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
          );
        })}
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
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{
  // Build data
  const allNames = Object.keys(exerciseDB).sort((a,b)=>a.localeCompare(b,"pl"));
  const allDates = [...new Set(
    Object.values(exerciseDB).flatMap(ex=>ex.history.map(h=>h.date))
  )].sort().reverse(); // daty malejąco - najnowsze po lewej
  const fmtDate = d=>{ const [y,m,day]=d.split("-"); return `${day}.${m}.${y}`; };
  const header = ["Ćwiczenie","Partia","Trening",...allDates.map(fmtDate)];
  const rows = allNames.map(name=>{
    const ex = exerciseDB[name];
    const histMap = {};
    (ex.history||[]).forEach(h=>{ histMap[h.date]=`${h.sets||3}x${h.weight}kg`; });
    const cells = allDates.map(d=>histMap[d]||"");
    return [name, ex.muscle||"", (ex.trainings||[]).join("/"), ...cells];
  });
  // Export as CSV with BOM (Excel compatible)
  const BOM = "\uFEFF";
  const csv = BOM + [header,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
  a.download = "gymtracker.csv";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}}>📊 Eksport CSV (Arkusz)</button>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>{ const d=JSON.stringify({history,dayLogs,exportDate:today()}); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([d],{type:"application/json"})); a.download="gymtracker-backup.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }}>📤 Backup JSON</button>
          <button className="btn btn-ghost" style={{width:"100%",color:"#ef4444",borderColor:"#ef444433"}} onClick={()=>{ if(confirm("Resetować wszystkie dane?")){ localStorage.clear(); window.location.reload(); } }}>🗑️ Resetuj dane</button>
        </div>
        </>}
        {stab==="tdee" && <TdeeCalculator settings={settings} setSettings={setSettings} history={history} dayLogs={dayLogs} setTdee={setTdee} setGoalKcal={setGoalKcal}/>}
        {stab==="ai" && (
          <div>
            {/* AI ON/OFF toggle */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600}}>🤖 Analiza AI posiłków</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Automatyczne liczenie kalorii ze zdjęcia lub opisu</div>
              </div>
              <div onClick={()=>{ if(!geminiKey.trim()){ alert("Najpierw wpisz klucz API!"); return; } setAiEnabled(p=>!p); }}
                style={{width:48,height:26,borderRadius:13,background:aiEnabled&&geminiKey?"#22c55e":"#333",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:aiEnabled&&geminiKey?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </div>
            </div>

            {/* Status badge */}
            <div style={{margin:"10px 0",padding:"8px 12px",borderRadius:8,background:aiEnabled&&geminiKey?"#22c55e22":"var(--card2)",border:`1px solid ${aiEnabled&&geminiKey?"#22c55e44":"var(--border)"}`}}>
              <span style={{fontSize:13,fontWeight:700,color:aiEnabled&&geminiKey?"#22c55e":"var(--muted)"}}>
                {aiEnabled&&geminiKey?"✅ AI aktywne":"⭕ AI nieaktywne"}
              </span>
              {geminiKey&&<span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>klucz: {geminiKey.slice(0,8)}...</span>}
            </div>

            {/* API Key section */}
            <div style={{marginTop:12}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--muted2)",marginBottom:8}}>KLUCZ GEMINI API</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,lineHeight:1.6,padding:"10px",background:"var(--card2)",borderRadius:8}}>
                <strong>Jak zdobyć darmowy klucz:</strong><br/>
                {"1️⃣ Wejdź na "}<strong>aistudio.google.com</strong><br/>
                {"2️⃣ Zaloguj się kontem Google"}<br/>
                {"3️⃣ Kliknij "}<strong>&quot;Get API Key&quot;</strong><br/>
                {"4️⃣ Wybierz "}<strong>&quot;Create API key&quot;</strong><br/>
                {"5️⃣ Skopiuj klucz i wklej poniżej"}<br/><br/>
                {"✅ "}<strong>1500 analiz dziennie za darmo</strong>
              </div>
              <input
                placeholder="Wklej klucz API (AIza...)"
                value={keyInput}
                onChange={e=>setKeyInput(e.target.value)}
                style={{width:"100%",background:"var(--card2)",border:`1px solid ${keyInput?"#7c3aed44":"var(--border)"}`,borderRadius:8,padding:"10px 12px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8}}
              />
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{ if(keyInput.trim()){ setGeminiKey(keyInput.trim()); setKeyInput(""); setAiEnabled(true); }}}
                  style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:keyInput.trim()?"#7c3aed":"var(--card2)",color:keyInput.trim()?"#fff":"var(--muted)",fontWeight:700,fontSize:13,cursor:keyInput.trim()?"pointer":"default"}}>
                  💾 Zapisz i aktywuj
                </button>
                {geminiKey&&<button onClick={()=>{ if(confirm("Usunąć klucz API?")){ setGeminiKey(""); setAiEnabled(false); }}}
                  style={{padding:"10px 14px",borderRadius:8,border:"1px solid #ef444433",background:"transparent",color:"#ef4444",fontSize:13,cursor:"pointer"}}>
                  🗑️
                </button>}
              </div>
            </div>
          </div>
        )}
        <button className="btn btn-red" onClick={onClose} style={{marginTop:16}}>Zamknij</button>
      </div>
    </div>
  );
}

// ── SCREEN: DZIŚ ──────────────────────────────────────────────────────────────
function ScreenToday({todayLog,saveDay,streak,last7,history,dayLogs,todayStr,onSettings,settings}) {
  const [steps,setSteps]     = useState(todayLog.steps||"");
  const [kcal,setKcal]       = useState(todayLog.calories||"");
  const now = new Date();
  const greet = now.getHours()<12?"Dzień dobry":now.getHours()<18?"Cześć":"Dobry wieczór";
  // Last workout = most recent entry (including today)
  const last = [...history].sort((a,b)=>b.date>a.date?1:-1)[0] || null;
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
        {(()=>{
          const STEP_GOAL = settings?.stepGoal||10000;
          const KCAL_GOAL = settings?.kcalGoal||1000;
          const todaySteps = todayLog.steps||0;
          const pct = Math.min(100, Math.round((todaySteps/STEP_GOAL)*100));
          const over = todaySteps >= STEP_GOAL;
          return todaySteps>0?(
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:over?"#22c55e":"var(--text)",lineHeight:1}}>{todaySteps.toLocaleString()}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>kroków · cel: {STEP_GOAL.toLocaleString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:(todayLog.calories||0)>=KCAL_GOAL?"#22c55e":"#ef4444"}}>{todayLog.calories||0}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>kcal · cel: {KCAL_GOAL}</div>
                </div>
              </div>
              <div style={{background:"var(--border)",borderRadius:8,height:10,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:8,background:over?"#22c55e":"#eab308",width:`${pct}%`,transition:"width .4s"}}/>
              </div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4,textAlign:"center"}}>
                {over?`✅ Cel osiągnięty! +${(todaySteps-STEP_GOAL).toLocaleString()} kroków`:`${(STEP_GOAL-todaySteps).toLocaleString()} kroków do celu`}
              </div>
            </div>
          ):null;
        })()}
        {(()=>{
          // Tygodniowy bilans kroków (pon–nd)
          const STEP_GOAL = settings?.stepGoal||10000;
          const KCAL_GOAL_W = settings?.kcalGoal||1000;
          const now = new Date();
          const dow = now.getDay();
          const mondayOffset = dow===0?-6:1-dow;
          const monday = new Date(now); monday.setDate(now.getDate()+mondayOffset);
          const week7 = Array.from({length:7},(_,i)=>{
            const d=new Date(monday); d.setDate(monday.getDate()+i);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          });
          const DAY_LABELS = ["Pn","Wt","Śr","Cz","Pt","Sb","Nd"];
          const weekSteps = week7.map(ds=>({ds, steps:dayLogs[ds]?.steps||0}));
          const totalWeek = weekSteps.reduce((s,d)=>s+d.steps,0);
          const maxSteps = Math.max(...weekSteps.map(d=>d.steps), STEP_GOAL);
          if(totalWeek===0) return null;
          const weekKcal = week7.map(ds=>({ds, kcal:dayLogs[ds]?.calories||0}));
          const totalKcalWeek = weekKcal.reduce((s,d)=>s+d.kcal,0);
          return (
            <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid var(--border)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--muted2)"}}>👟 Kroki – tydzień</div>
                <div style={{fontSize:13,fontWeight:700}}>{totalWeek.toLocaleString()} / {(STEP_GOAL*7).toLocaleString()} kroków</div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:4,height:70,marginBottom:2}}>
                {weekSteps.map((d,i)=>{
                  const h=d.steps>0?Math.max(8,Math.round((d.steps/maxSteps)*62)):0;
                  const isT=d.ds===todayStr;
                  const ok=d.steps>=STEP_GOAL;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{fontSize:8,color:isT?"var(--text)":"var(--muted)",height:14,display:"flex",alignItems:"flex-end",textAlign:"center",lineHeight:1}}>
                        {d.steps>0?(d.steps>=1000?Math.round(d.steps/1000)+"k":d.steps):""}
                      </div>
                      <div style={{width:"100%",height:h,borderRadius:3,background:h===0?"transparent":isT?(ok?"#22c55e":"#eab308"):ok?"#22c55e44":"#eab30833",border:h>0&&isT?`1px solid ${ok?"#22c55e":"#eab308"}`:"none"}}/>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:4,marginBottom:10}}>
                {weekSteps.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:d.ds===todayStr?"var(--text)":"var(--muted)",fontWeight:d.ds===todayStr?700:400}}>{DAY_LABELS[i]}</div>)}
              </div>
              {totalKcalWeek>0&&<>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--muted2)"}}>🔥 Kcal aktywne – tydzień</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>{totalKcalWeek.toLocaleString()} kcal</div>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:70,marginBottom:2}}>
                  {weekKcal.map((d,i)=>{
                    const KCAL_GOAL = settings?.kcalGoal||1000;
                    const maxK=Math.max(...weekKcal.map(x=>x.kcal),KCAL_GOAL);
                    const h=d.kcal>0?Math.max(8,Math.round((d.kcal/maxK)*62)):0;
                    const isT=d.ds===todayStr;
                    const ok=d.kcal>=KCAL_GOAL;
                    return (
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{fontSize:8,color:isT?"var(--text)":"var(--muted)",height:14,display:"flex",alignItems:"flex-end",textAlign:"center"}}>
                          {d.kcal>0?d.kcal:""}
                        </div>
                        <div style={{width:"100%",height:h,borderRadius:3,background:h===0?"transparent":isT?(ok?"#22c55e":"#ef4444"):ok?"#22c55e44":"#ef444433",border:h>0&&isT?`1px solid ${ok?"#22c55e":"#ef4444"}`:"none"}}/>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {weekKcal.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:d.ds===todayStr?"var(--text)":"var(--muted)",fontWeight:d.ds===todayStr?700:400}}>{DAY_LABELS[i]}</div>)}
                </div>
              </>}
            </div>
          );
        })()}
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
function ScreenTraining({history,exerciseDB,setExerciseDB,saveDay,todayStr,settings,customExercises,setCustomExercises,hiddenExercises,setHiddenExercises,workoutTemplates,setWorkoutTemplates}) {
  const [phase, setPhase]   = useState("select"); // select|session|cardio|exercises
  const [selType,setSelType]= useState(null);
  const [editEx, setEditEx] = useState(null); // {name,muscle,isCustom,originalName}
  const [showAdd,setShowAdd]= useState(false);
  const [newEx,  setNewEx]  = useState({name:"",muscle:"klata",trainings:[]});

  // All exercises including custom ones
  const allEx = getAllExercises(exerciseDB);

  const saveEditEx = () => {
    if(!editEx||!editEx.name.trim()) return;
    const newName = editEx.name.trim();
    const oldName = editEx.originalName;
    if(newName !== oldName) {
      // Rename: move record in exerciseDB to new key, keep all history
      setExerciseDB(prev=>{
        const updated = {...prev};
        if(updated[oldName]) {
          updated[newName] = {...updated[oldName], muscle:editEx.muscle, trainings:editEx.trainings||updated[oldName]?.trainings||[]};
          delete updated[oldName];
        } else {
          updated[newName] = {muscle:editEx.muscle, trainings:[], history:[]};
        }
        return updated;
      });
      // Update workoutTemplates: replace old name with new name in all templates
      setWorkoutTemplates(prev=>{
        const updated = {};
        Object.entries(prev).forEach(([tp, tmpl])=>{
          updated[tp] = Array.isArray(tmpl)
            ? tmpl.map(n => n===oldName ? newName : n)
            : tmpl;
        });
        return updated;
      });
    } else {
      // muscle or trainings changed (same name)
      setExerciseDB(prev=>({...prev,[oldName]:{
        ...prev[oldName],
        muscle:editEx.muscle,
        trainings:editEx.trainings||prev[oldName]?.trainings||[]
      }}));
    }
    setEditEx(null);
  };

  const deleteEx = () => {
    if(!editEx) return;
    const name = editEx.originalName;
    // Remove from exerciseDB (removes record + all history)
    setExerciseDB(prev=>{ const next={...prev}; delete next[name]; return next; });
    // Remove from customExercises if present
    setCustomExercises(p=>p.filter(e=>e.name!==name && e.originalName!==name));
    // Remove from hiddenExercises if present
    setHiddenExercises(p=>p.filter(n=>n!==name));
    setEditEx(null);
  };

  if(phase==="session") return <SessionView type={selType} history={history} exerciseDB={exerciseDB} setExerciseDB={setExerciseDB} todayStr={todayStr} onBack={()=>setPhase("select")} saveDay={saveDay} settings={settings} customExercises={customExercises} hiddenExercises={hiddenExercises} workoutTemplates={workoutTemplates}/>;
  if(phase==="cardio")  return <CardioView onBack={()=>setPhase("select")} saveDay={saveDay} todayStr={todayStr}/>;

  return (
    <div className="anim">
      <div className="ph"><div className="sub">Wybierz typ</div><div className="title">TRENING</div></div>
      {/* TAB SWITCHER */}
      <div style={{display:"flex",gap:8,margin:"0 16px 16px"}}>
        {[["select","💪 Trening"],["exercises","📋 Ćwiczenia"],["templates","⚙️ Szablony"]].map(([id,label])=>(
          <button key={id} onClick={()=>setPhase(id)}
            style={{flex:1,padding:10,borderRadius:12,border:`1.5px solid ${phase===id?"#ef4444":"var(--border)"}`,background:phase===id?"#ef444422":"var(--card2)",color:phase===id?"#ef4444":"var(--muted)",fontWeight:700,fontSize:11,cursor:"pointer"}}>
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
            <input className="inp" placeholder="Nazwa ćwiczenia *" value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Partia ciała:</div>
            <div className="chip-grid" style={{marginBottom:10}}>
              {MUSCLES.map(m=>(
                <button key={m} className={`chip ${newEx.muscle===m?"active":""}`} style={{color:newEx.muscle===m?MUSCLE_COLOR[m]:"var(--muted)",borderColor:newEx.muscle===m?MUSCLE_COLOR[m]:"var(--border)"}}
                  onClick={()=>setNewEx(p=>({...p,muscle:m}))}>{MUSCLE_LABEL[m]}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Dodaj do treningów (opcjonalnie):</div>
            <div className="chip-grid" style={{marginBottom:12}}>
              {["push","pull","fbw"].map(tp=>{
                const sel=(newEx.trainings||[]).includes(tp);
                return (
                  <button key={tp} className={`chip ${sel?"active":""}`}
                    style={{color:sel?TYPE_COLOR[tp]:"var(--muted)",borderColor:sel?TYPE_COLOR[tp]:"var(--border)"}}
                    onClick={()=>setNewEx(p=>({...p,trainings:sel?(p.trainings||[]).filter(t=>t!==tp):[...(p.trainings||[]),tp]}))}>
                    {tp.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-red" onClick={()=>{
              if(!newEx.name.trim()) return;
              setExerciseDB(prev=>({...prev,[newEx.name.trim()]:{muscle:newEx.muscle,trainings:newEx.trainings||[],history:[]}}));
              setNewEx({name:"",muscle:"klata",trainings:[]}); setShowAdd(false);
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
                const exData = exerciseDB[ex.name];
                const last = exData && exData.history.length > 0
                  ? exData.history[exData.history.length - 1]
                  : null;
                const isCustom = !EXERCISE_DB_SEED[ex.name];
                return (
                  <div key={ex.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)",opacity:hiddenExercises.includes(ex.name)?0.4:1}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500}}>
                        {ex.name}
                        {isCustom&&<span style={{fontSize:9,color:MUSCLE_COLOR[muscle],marginLeft:6,fontWeight:700}}>WŁASNE</span>}
                        {hiddenExercises.includes(ex.name)&&<span style={{fontSize:9,color:"#ef4444",marginLeft:6,fontWeight:700}}>UKRYTE</span>}
                      </div>
                      {last&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{fmt(last.date)} · {last.weight}kg</div>}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {hiddenExercises.includes(ex.name)&&(
                        <button onClick={()=>setHiddenExercises(p=>p.filter(n=>n!==ex.name))}
                          style={{background:"#22c55e22",border:"1px solid #22c55e44",borderRadius:8,padding:"0 10px",height:34,cursor:"pointer",color:"#22c55e",fontSize:12,fontWeight:700}}>
                          Przywróć
                        </button>
                      )}
                      <button onClick={()=>setEditEx({name:ex.name,muscle:ex.muscle,originalName:ex.name,isCustom,trainings:(exerciseDB[ex.name]?.trainings||[])})}
                        style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted2)"}}>
                        <Ic n="edit" s={14}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>}

      {phase==="templates" && (
        <div>
          <div style={{margin:"0 16px 8px",fontSize:12,color:"var(--muted)"}}>
            Zaznacz które ćwiczenia wchodzą do danego treningu.
          </div>
          {["push","pull","fbw"].map(trainingType=>{
            const template = workoutTemplates[trainingType]; // null=all, array=custom
            // Get all exercises that have this training type OR template overrides
            const allForType = Object.entries(exerciseDB)
              .filter(([,ex])=>
                Array.isArray(ex.trainings) && ex.trainings.includes(trainingType)
              )
              .map(([name,ex])=>({name, muscle:ex.muscle}))
              .sort((a,b)=>a.name.localeCompare(b.name,'pl'));
            const selectedNames = template || allForType.map(e=>e.name);
            const allSelected = allForType.every(e=>selectedNames.includes(e.name));
            return (
              <div key={trainingType} className="card" style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:TYPE_COLOR[trainingType],letterSpacing:1}}>
                    {trainingType.toUpperCase()}
                    <span style={{fontSize:12,color:"var(--muted)",marginLeft:8,fontFamily:"'DM Sans'",letterSpacing:0}}>
                      {allForType.length} ćw.
                    </span>
                  </div>
                  <button onClick={()=>setWorkoutTemplates(p=>({...p,[trainingType]:allSelected?[]:allForType.map(e=>e.name)}))}
                    style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--muted)",cursor:"pointer"}}>
                    {allSelected?"Odznacz wszystkie":"Zaznacz wszystkie"}
                  </button>
                </div>
                {allForType.length===0 && (
                  <div style={{fontSize:12,color:"var(--muted)",padding:"8px 0"}}>
                    Brak ćwiczeń przypisanych do {trainingType.toUpperCase()}.
                    Dodaj ćwiczenia w zakładce Ćwiczenia.
                  </div>
                )}
                {allForType.map(ex=>{
                  const isSelected = selectedNames.includes(ex.name);
                  const col = TYPE_COLOR[trainingType];
                  return (
                    <div key={ex.name}
                      onClick={()=>{
                        const current = workoutTemplates[trainingType]||allForType.map(e=>e.name);
                        const next = isSelected
                          ? current.filter(n=>n!==ex.name)
                          : [...current, ex.name];
                        setWorkoutTemplates(p=>({...p,[trainingType]:next}));
                      }}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)",cursor:"pointer"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:isSelected?"var(--text)":"var(--muted)"}}>{ex.name}</div>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginTop:2}}>{ex.muscle}</div>
                      </div>
                      <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${isSelected?col:"var(--border)"}`,background:isSelected?col+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {isSelected&&<Ic n="check" s={14} c={col}/>}
                      </div>
                    </div>
                  );
                })}
                {workoutTemplates[trainingType]!==null && (
                  <button onClick={()=>setWorkoutTemplates(p=>({...p,[trainingType]:null}))}
                    style={{width:"100%",marginTop:10,padding:"8px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:12,cursor:"pointer"}}>
                    Resetuj do domyślnych (wszystkie)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      
      {/* EDIT EXERCISE MODAL */}
      {editEx&&(
        <div className="modal-bg" onClick={()=>setEditEx(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">EDYTUJ ĆWICZENIE</div>
            <input className="inp" value={editEx.name} onChange={e=>setEditEx(p=>({...p,name:e.target.value}))} style={{marginBottom:12}}/>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Partia ciała:</div>
            <div className="chip-grid" style={{marginBottom:12}}>
              {MUSCLES.map(m=>(
                <button key={m} className={`chip ${editEx.muscle===m?"active":""}`}
                  style={{color:editEx.muscle===m?MUSCLE_COLOR[m]:"var(--muted)",borderColor:editEx.muscle===m?MUSCLE_COLOR[m]:"var(--border)"}}
                  onClick={()=>setEditEx(p=>({...p,muscle:m}))}>{MUSCLE_LABEL[m]}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Przypisz do treningów:</div>
            <div className="chip-grid" style={{marginBottom:16}}>
              {["push","pull","fbw"].map(tp=>{
                const sel = (editEx.trainings||[]).includes(tp);
                return (
                  <button key={tp} className={`chip ${sel?"active":""}`}
                    style={{color:sel?TYPE_COLOR[tp]:"var(--muted)",borderColor:sel?TYPE_COLOR[tp]:"var(--border)"}}
                    onClick={()=>setEditEx(p=>({...p,trainings:sel?(p.trainings||[]).filter(t=>t!==tp):[...(p.trainings||[]),tp]}))}>
                    {tp.toUpperCase()}
                  </button>
                );
              })}
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
function SessionView({type,history,exerciseDB={},setExerciseDB,todayStr,onBack,saveDay,settings,customExercises=[],hiddenExercises=[],workoutTemplates={}}) {
  const color = TYPE_COLOR[type]||MUSCLE_COLOR[type]||"#ef4444";
  const exList = getExercisesForSession(type, exerciseDB, workoutTemplates);
  const [excluded,    setExcluded]    = useState(new Set()); // POMIŃ - skip completely
  const [finished_ex, setFinishedEx]  = useState(new Set()); // ZAKOŃCZ - done early
  // Pre-fill weights from last workout for each exercise
  const [weights, setWeights] = useState(()=>{
    const initial = {};
    const allEx = Object.entries(exerciseDB);
    allEx.forEach(([name, ex])=>{
      if(ex.history && ex.history.length > 0) {
        initial[name] = String(ex.history[ex.history.length-1].weight);
      }
    });
    return initial;
  });
  const [done,      setDone]      = useState({});
  const [startTime]               = useState(Date.now());
  const [sessionId]               = useState(()=>Date.now()); // unique ID per session
  const [elapsed,   setElapsed]   = useState(0);
  const [note,      setNote]      = useState("");
  const [finished,  setFinished]  = useState(false);
  const [restEx,    setRestEx]    = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const REST = 180;

  useEffect(()=>{ const t=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000); return()=>clearInterval(t); },[startTime]);
  useEffect(()=>{
    if(restTimer===null) return;
    if(restTimer<=0){
      setRestTimer(null); setRestEx(null);
      if(settings?.vibration) vibrate([200,100,200,100,200]);
      playBeep(660, 200, 0.10); // koniec przerwy - nieco głośniejszy
      return;
    }
    if(restTimer<=3) playBeep(880, 60, 0.06); // ostatnie 3 sekundy - delikatne piknięcie
    const t=setTimeout(()=>setRestTimer(r=>r-1),1000);
    return()=>clearTimeout(t);
  },[restTimer]);
  useEffect(()=>{ let wl=null; const acq=async()=>{ try{ if("wakeLock" in navigator) wl=await navigator.wakeLock.request("screen"); }catch{} }; acq(); const re=()=>{if(document.visibilityState==="visible")acq();}; document.addEventListener("visibilitychange",re); return()=>{ document.removeEventListener("visibilitychange",re); if(wl)try{wl.release();}catch{} }; },[]);

  const getLastW = useCallback((name)=>{
    const ex = exerciseDB[name];
    if(ex && ex.history.length > 0) return ex.history[ex.history.length-1].weight;
    return null;
  },[exerciseDB]);
  const isPR = (name,w)=>{
    const ex = exerciseDB[name];
    if(!ex || ex.history.length === 0) return false;
    return w > Math.max(...ex.history.map(h=>h.weight));
  };

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
      .filter(ex => {
        const key = ex.id||ex.name;
        // Only save if user actually checked at least one set OR explicitly finished the exercise
        const hasDoneSets = (done[key]||[]).some(Boolean);
        const isFinished = finished_ex.has(key);
        return (hasDoneSets || isFinished) && !excluded.has(key);
      })
      .map(ex => {
        const key = ex.id||ex.name;
        const doneSetsCount = (done[key]||[]).filter(Boolean).length;
        // Use actual done sets; if none checked but has weight, assume 3 (user skipped checkboxes)
        const completedSets = doneSetsCount > 0 ? doneSetsCount : 3;
        return {
          date: todayStr, type, exercise: ex.name,
          weight: parseFloat(weights[key]) || 0,
          sets: completedSets,
          sessionId
        };
      });
    if(entries.length) {
      setExerciseDB(prev=>{
        const next = {...prev};
        entries.forEach(e=>{
          if(!next[e.exercise]) {
            next[e.exercise] = {muscle: getMuscle(e.exercise, prev), trainings:[e.type], history:[]};
          } else if(!(Array.isArray(next[e.exercise].trainings) && next[e.exercise].trainings.includes(e.type))) {
            // Add this training type if not already listed
            next[e.exercise] = {...next[e.exercise], trainings:[...(next[e.exercise].trainings||[]), e.type]};
          }
          // Remove existing entry for same sessionId (re-save same session), keep others
          next[e.exercise] = {
            ...next[e.exercise],
            history: [
              ...next[e.exercise].history.filter(h=>!(h.sessionId && h.sessionId===e.sessionId)),
              {date:e.date, type:e.type, weight:e.weight, sets:e.sets, sessionId:e.sessionId}
            ].sort((a,b)=>a.date>b.date?1:-1)
          };
        });
        return next;
      });
    }
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
        const aEx=excluded.has(ak), bEx=excluded.has(bk);
        const aFin=finished_ex.has(ak), bFin=finished_ex.has(bk);
        const aDone=(done[ak]||[]).filter(Boolean).length>=3;
        const bDone=(done[bk]||[]).filter(Boolean).length>=3;
        // Priority: normal > done/finished > excluded
        const aRank = aEx?2:aDone||aFin?1:0;
        const bRank = bEx?2:bDone||bFin?1:0;
        return aRank-bRank;
      }).map(ex=>{
        const key=ex.id||ex.name;
        const lastW=getLastW(ex.name);
        const w=parseFloat(weights[key])||0;
        const pr=w>0&&isPR(ex.name,w);
        const exDone=(done[key]||[]).filter(Boolean).length>=3;
        const isResting=restEx===key&&restTimer!==null;
        return (
          <div key={key} className="card" style={{opacity:excluded.has(key)?0.3:finished_ex.has(key)?0.6:exDone?0.7:1,border:isResting?`1.5px solid ${color}`:(finished_ex.has(key)?`1.5px solid #22c55e44`:undefined),transition:"opacity .3s"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{ex.name}</div><div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginTop:2}}>{ex.muscle}</div></div>
              <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                {pr&&<div style={{fontSize:10,fontWeight:700,color:"#eab308"}}>🏆 REKORD!</div>}
                {lastW&&<div style={{fontSize:11,color:"var(--muted)"}}>Ostatnio: <strong>{lastW}kg</strong></div>}
                <div style={{display:"flex",gap:4,marginTop:2}}>
                  <button onClick={()=>setExcluded(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);if(n.has(key))setFinishedEx(f=>{const ff=new Set(f);ff.delete(key);return ff;});return n;})}
                    style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"1px solid var(--border)",background:excluded.has(key)?"#ef444422":"transparent",color:excluded.has(key)?"#ef4444":"var(--muted)",cursor:"pointer",fontWeight:600}}>
                    {excluded.has(key)?"✗ Cofnij":"Pomiń"}
                  </button>
                  {!excluded.has(key)&&(
                    <button onClick={()=>{
                      setFinishedEx(f=>{const n=new Set(f);n.has(key)?n.delete(key):n.add(key);return n;});
                      setExcluded(f=>{const n=new Set(f);n.delete(key);return n;});
                    }}
                      style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:`1px solid ${finished_ex.has(key)?"#22c55e44":"var(--border)"}`,background:finished_ex.has(key)?"#22c55e22":"transparent",color:finished_ex.has(key)?"#22c55e":"var(--muted)",cursor:"pointer",fontWeight:600}}>
                      {finished_ex.has(key)?"✓ Zakończono":"Zakończ"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {isResting&&(
              <div style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontSize:10,color,fontWeight:700,letterSpacing:1}}>⏸ PRZERWA</div><div style={{fontFamily:"'Bebas Neue'",fontSize:36,color,lineHeight:1}}>{fmtTime(restTimer)}</div></div>
                <button onClick={()=>{setRestTimer(null);setRestEx(null);}} style={{background:color,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Pomiń</button>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <input type="number" step="0.5" placeholder="kg" value={weights[key]||""}
                onChange={e=>setWeights(p=>({...p,[key]:e.target.value}))}
                style={{flex:1,background:"var(--card2)",border:`1px solid ${weights[key]?"var(--border)":"#ef444433"}`,borderRadius:10,padding:"8px 14px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:16,outline:"none"}}/>
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
function ScreenDiet({saveDay,aiActive,geminiKey,setGeminiKey,aiEnabled,setAiEnabled,settings,tdee,setTdee,goalKcal,setGoalKcal}) {
  const [meals,setMeals]       = useState(()=>storage.get("meals",[]));

  const [showAdd,setShowAdd]   = useState(false);
  const [imgPrev,setImgPrev]   = useState(null);
  const [newMeal,setNewMeal]   = useState({name:"",kcal:"",protein:"",carbs:"",fat:""});
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiMode,     setAiMode]     = useState(false);
  const [aiDesc,     setAiDesc]     = useState("");
  const [aiPrompt,   setAiPrompt]   = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");

  const [histTab,setHistTab]   = useState("today");
  useEffect(()=>{ storage.set("meals",meals); },[meals]);
  const todayStr=today();
  const todayMeals=meals.filter(m=>m.date===todayStr);
  const totalKcal=todayMeals.reduce((s,m)=>s+(m.kcal||0),0);
  const pct=Math.min(100,Math.round((totalKcal/goalKcal)*100));
  const last7=Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; const label=["Pn","Wt","Śr","Cz","Pt","So","Nd"][d.getDay()===0?6:d.getDay()-1]; return{ds,label,kcal:meals.filter(m=>m.date===ds).reduce((s,m)=>s+(m.kcal||0),0)}; });
  const maxK=Math.max(...last7.map(d=>d.kcal),goalKcal,1);
  const handleImg=(e)=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>{ setImgPrev(ev.target.result); /* don't auto-analyze - wait for user to add desc and click Analizuj */ }; r.readAsDataURL(f); };

  const parseAiMacro = (text) => {
    // Extract JSON from AI response
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if(m) {
        const d = JSON.parse(m[0]);
        setNewMeal(p=>({...p,
          name: d.name||p.name||"",
          kcal: String(Math.round(d.kcal||0)),
          protein: String(Math.round(d.protein||0)),
          carbs: String(Math.round(d.carbs||0)),
          fat: String(Math.round(d.fat||0)),
        }));
      }
    } catch {}
    setAiLoading(false);
  };

  const AI_PROMPT = 'Jesteś ekspertem od żywienia. Oszacuj wartości odżywcze tego posiłku. Użyj standardowych porcji jeśli nie podano gramatur. Odpowiedz WYŁĄCZNIE w formacie JSON (zero innych słów): {"name":"nazwa posiłku po polsku","kcal":500,"protein":30,"carbs":60,"fat":15}';

  const callGemini = async (parts) => {
    const key = geminiKey.trim();
    if(!key) { alert("Wpisz klucz API Gemini!"); setAiLoading(false); return null; }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
      { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ contents:[{ parts }] }) }
    );
    const json = await res.json();
    if(json.error) {
      const code = json.error.code||0;
      const msg = json.error.message||"";
      if(code===429||msg.includes("429")||msg.includes("quota")||msg.includes("rate")) {
        alert("⏳ Limit zapytań – poczekaj minutę i spróbuj ponownie");
      } else if(code===400||msg.includes("API_KEY_INVALID")||msg.includes("invalid")) {
        alert("❌ Nieprawidłowy klucz API\nSprawdź klucz w Ustawieniach → AI");
      } else if(code===403||msg.includes("permission")||msg.includes("billing")) {
        alert("❌ Brak uprawnień\nSprawdź czy projekt Google ma włączone Generative Language API");
      } else {
        alert("Błąd Gemini ("+code+"): "+msg.slice(0,120));
      }
      setAiLoading(false); return null;
    }
    return json.candidates?.[0]?.content?.parts?.[0]?.text||"";
  };

  const analyzeImage = async (base64, extraDesc="") => {
    setAiLoading(true);
    try {
      const mediaType = base64.startsWith("data:image/png")?"image/png"
                       :base64.startsWith("data:image/webp")?"image/webp":"image/jpeg";
      const data64 = base64.split(",")[1];
      const text = await callGemini([
        {inline_data:{mime_type:mediaType,data:data64}},
        {text:AI_PROMPT+(extraDesc?"\n\nDodatkowy opis: "+extraDesc:"")}
      ]);
      if(text) parseAiMacro(text);
    } catch(e){ alert("Błąd: "+e.message); setAiLoading(false); }
  };

  const analyzeText = async (desc) => {
    if(!desc.trim()) return;
    setAiLoading(true);
    setAiMode(false);
    setAiPrompt(false);
    try {
      const text = await callGemini([
        {text: AI_PROMPT + "\n\nPosiłek: " + desc}
      ]);
      if(text) parseAiMacro(text);
    } catch(e){ alert("Błąd: "+e.message); setAiLoading(false); }
  };
  const saveMeal=()=>{ if(!newMeal.name)return; setMeals(p=>[{...newMeal,kcal:Number(newMeal.kcal)||0,protein:Number(newMeal.protein)||0,carbs:Number(newMeal.carbs)||0,fat:Number(newMeal.fat)||0,date:todayStr,time:new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}),id:Date.now(),img:imgPrev},...p]); setNewMeal({name:"",kcal:"",protein:"",carbs:"",fat:""}); setImgPrev(null); setShowAdd(false); };
  const histDates=[...new Set(meals.filter(m=>m.date!==todayStr).map(m=>m.date))].sort().reverse().slice(0,14);
  return (
    <div className="anim">
      <div className="ph"><div className="sub">Dziennik</div><div className="title">DIETA</div></div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:totalKcal>goalKcal?"#ef4444":"#22c55e"}}>{totalKcal}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>z {goalKcal} kcal celu · deficyt dzienny: <strong style={{color:"#22c55e"}}>{tdee-goalKcal>0?`-${tdee-goalKcal}`:"+"+Math.abs(tdee-goalKcal)} kcal</strong></div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setGoalKcal(p=>Math.max(100,p-100))} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:16,minWidth:40,textAlign:"center"}}>{goalKcal}</span>
            <button onClick={()=>setGoalKcal(p=>p+100)} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid var(--border)",marginBottom:4}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--muted2)"}}>⚡ Zapotrzebowanie (TDEE)</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>Twoje dzienne spalanie</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setTdee(p=>Math.max(100,p-100))} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:16,minWidth:40,textAlign:"center"}}>{tdee}</span>
            <button onClick={()=>setTdee(p=>p+100)} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
        </div>
        <div style={{background:"var(--border)",borderRadius:6,height:8,marginBottom:10}}><div style={{height:"100%",borderRadius:6,background:totalKcal>goalKcal?"#ef4444":"#22c55e",width:`${pct}%`,transition:"width .3s"}}/></div>
        {(()=>{
          const tP=todayMeals.reduce((s,m)=>s+(m.protein||0),0);
          const tC=todayMeals.reduce((s,m)=>s+(m.carbs||0),0);
          const tF=todayMeals.reduce((s,m)=>s+(m.fat||0),0);
          // Get latest body weight from storage
          const bwHistory = storage.get("bodyWeight",[]);
          const bwSorted = [...bwHistory].sort((a,b)=>new Date(b.date)-new Date(a.date));
          const bw = bwSorted.length > 0 ? Number(bwSorted[0].val) : 80;
          const goalP = Math.round(bw*1.9); // 1.6-2.2g/kg → środek ~1.9
          const goalC = Math.round(goalKcal*0.5/4); // 50% kcal / 4 kcal/g
          const goalFat = Math.round(goalKcal*0.28/9); // 28% kcal / 9 kcal/g
          const bars = [
            {l:"🥩 Białko",v:tP,g:goalP,u:"g",c:"#ef4444"},
            {l:"🍞 Węgle",v:tC,g:goalC,u:"g",c:"#eab308"},
            {l:"🧈 Tłuszcze",v:tF,g:goalFat,u:"g",c:"#3b82f6"},
          ];
          return (
            <div style={{marginTop:6}}>
              {bars.map(({l,v,g,u,c})=>{
                const pct=Math.min(100,Math.round((v/g)*100));
                const over=v>g;
                return (
                  <div key={l} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:12,color:"var(--muted2)",fontWeight:600}}>{l}</span>
                      <span style={{fontSize:12}}>
                        <strong style={{color:over?"#ef4444":c}}>{v}{u}</strong>
                        <span style={{color:"var(--muted)"}}> / {g}{u}</span>
                      </span>
                    </div>
                    <div style={{background:"var(--border)",borderRadius:4,height:7}}>
                      <div style={{height:"100%",borderRadius:4,background:over?"#ef4444":c,width:`${pct}%`,transition:"width .3s"}}/>
                    </div>
                  </div>
                );
              })}
              <div style={{fontSize:10,color:"var(--muted)",marginTop:2,textAlign:"right"}}>
                cel białka: {Math.round(bw*1.6)}–{Math.round(bw*2.2)}g/dzień ({bw}kg × 1.6–2.2g)
              </div>
            </div>
          );
        })()}
      </div>
      {/* DZIENNY PASEK POSTĘPU */}
      {(()=>{
        const todayKcal = todayMeals.reduce((s,m)=>s+(m.kcal||0),0);
        const remaining = goalKcal - todayKcal;
        const pct = Math.min(100, Math.round((todayKcal/goalKcal)*100));
        const over = todayKcal > goalKcal;
        return (
          <div className="card" style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Dziś</div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:32,lineHeight:1,color:over?"#ef4444":"var(--text)"}}>
                  {todayKcal} <span style={{fontSize:16,color:"var(--muted)"}}>/ {goalKcal} kcal</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:over?"#ef4444":"#22c55e"}}>
                  {over?"+":""}{over?todayKcal-goalKcal:remaining}
                </div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{over?"przekroczone":"pozostało"}</div>
              </div>
            </div>
            <div style={{background:"var(--border)",borderRadius:8,height:14,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:8,background:over?"#ef4444":"#22c55e",width:`${pct}%`,transition:"width .4s",position:"relative"}}>
                {pct>15&&<span style={{position:"absolute",right:8,top:0,bottom:0,display:"flex",alignItems:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{pct}%</span>}
              </div>
            </div>
            {!over&&<div style={{fontSize:11,color:"var(--muted)",marginTop:6,textAlign:"center"}}>
              możesz zjeść jeszcze <strong style={{color:"#22c55e"}}>{remaining} kcal</strong>
              {remaining>0&&<span style={{color:"var(--muted)"}}> · ok. {Math.round(remaining/3)} kcal na posiłek (3 posiłki)</span>}
            </div>}
            {over&&<div style={{fontSize:11,color:"#ef4444",marginTop:6,textAlign:"center",fontWeight:600}}>
              Przekroczono cel o {todayKcal-goalKcal} kcal
            </div>}
          </div>
        );
      })()}

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

      {/* TYGODNIOWY DEFICYT KALORYCZNY */}
      {(()=>{
        const now = new Date();
        // Tydzień Pon–Nd (nie ostatnie 7 dni)
        const dow = now.getDay(); // 0=nd, 1=pn, ..., 6=sob
        const mondayOffset = dow === 0 ? -6 : 1 - dow; // ile dni do poniedziałku
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const week7 = Array.from({length:7},(_,i)=>{
          const d=new Date(monday); d.setDate(monday.getDate()+i);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        });
        // Ile zjedzone w tym tygodniu łącznie
        const totalEaten  = week7.reduce((s,ds)=>s+meals.filter(m=>m.date===ds).reduce((a,m)=>a+(m.kcal||0),0), 0);
        const totalTarget = goalKcal * 7;            // pula tygodniowa = cel × 7
        const remaining   = totalTarget - totalEaten; // ile zostało z puli
        const onTrack     = remaining >= 0;
        const pct         = Math.min(100, Math.round((totalEaten / totalTarget) * 100));
        // Dni pozostałe w tygodniu (od jutra do niedzieli)
        const todayDs     = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const daysLeft    = week7.filter(d=>d>todayDs).length;
        const daysDone    = week7.filter(d=>d<=todayDs).length;
        const kcalPerDay  = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;
        // Rzeczywisty deficyt/nadwyżka vs TDEE
        const totalTdee   = tdee * 7;
        const realDeficit = totalTdee - totalEaten;  // + = deficyt, - = nadwyżka
        const isDeficit   = realDeficit >= 0;
        const fatKg       = (Math.abs(realDeficit) / 7000).toFixed(2);
        return (
          <div className="card" style={{marginBottom:12}}>
            <div className="ctitle">Bilans tygodniowy</div>

            {/* SEKCJA 1: ILE ZOSTAŁO Z PULI */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:2}}>
                    Pula {totalTarget.toLocaleString()} kcal − zjedzone {totalEaten.toLocaleString()} kcal
                  </div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:42,lineHeight:1,color:onTrack?"#22c55e":"#ef4444"}}>
                    {onTrack?remaining.toLocaleString():"-"+Math.abs(remaining).toLocaleString()}
                    <span style={{fontSize:20}}> kcal</span>
                  </div>
                  <div style={{fontSize:13,color:onTrack?"#22c55e":"#ef4444",marginTop:2,fontWeight:600}}>
                    {onTrack?"możesz jeszcze zjeść":"przekroczono pulę"}
                  </div>
                  {daysLeft>0&&onTrack&&<div style={{fontSize:11,color:"var(--muted2)",marginTop:2}}>
                    ≈ <strong style={{color:"#22c55e"}}>{kcalPerDay} kcal/dzień</strong> przez {daysLeft} {daysLeft===1?"dzień":"dni"}
                  </div>}
                </div>
              </div>
              <div style={{background:"var(--border)",borderRadius:8,height:10,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:8,background:pct>100?"#ef4444":"#22c55e",width:`${Math.min(100,pct)}%`,transition:"width .4s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--muted)",marginTop:4}}>
                <span>0</span>
                <span style={{fontWeight:600,color:pct>100?"#ef4444":"var(--muted)"}}>{pct}%</span>
                <span>{totalTarget.toLocaleString()} kcal</span>
              </div>
            </div>

            {/* SEPARATOR */}
            <div style={{borderTop:"1px solid var(--border)",marginBottom:12}}/>

            {/* SEKCJA 2: DEFICYT KALORYCZNY vs TDEE */}
            <div>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>
                Zapotrzebowanie {totalTdee.toLocaleString()} − zjedzone {totalEaten.toLocaleString()} kcal
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:32,lineHeight:1,color:isDeficit?"#22c55e":"#ef4444"}}>
                    {isDeficit?"-":"+"}{Math.abs(realDeficit).toLocaleString()}
                    <span style={{fontSize:16}}> kcal</span>
                  </div>
                  <div style={{fontSize:12,color:isDeficit?"#22c55e":"#ef4444",fontWeight:600,marginTop:2}}>
                    {isDeficit?"deficyt tygodniowy":"nadwyżka tygodniowa"}
                  </div>
                </div>
                <div style={{textAlign:"right",background:isDeficit?"#22c55e22":"#ef444422",borderRadius:12,padding:"8px 16px",border:`1px solid ${isDeficit?"#22c55e44":"#ef444444"}`}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:isDeficit?"#22c55e":"#ef4444"}}>
                    {isDeficit?"-":"+"}{fatKg} kg
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>tłuszczu (est.)</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TYGODNIOWY BILANS MAKRO */}
      {(()=>{
        const now = new Date();
        const dow = now.getDay();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const week7 = Array.from({length:7},(_,i)=>{
          const d=new Date(monday); d.setDate(monday.getDate()+i);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        });
        const wMeals = meals.filter(m=>week7.includes(m.date));
        const wP=wMeals.reduce((s,m)=>s+(m.protein||0),0);
        const wC=wMeals.reduce((s,m)=>s+(m.carbs||0),0);
        const wF=wMeals.reduce((s,m)=>s+(m.fat||0),0);
        const wKcal=wMeals.reduce((s,m)=>s+(m.kcal||0),0);
        if(wKcal===0) return null;
        const bwHist2 = storage.get("bodyWeight",[]);
        const bwLast = [...bwHist2].sort((a,b)=>new Date(b.date)-new Date(a.date));
        const bw = bwLast.length > 0 ? Number(bwLast[0].val) : 80;
        const goalPweek=Math.round(bw*1.9)*7;
        return (
          <div className="card" style={{marginBottom:8}}>
            <div className="ctitle">Makro – ten tydzień</div>
            {[
              {l:"🥩 Białko",v:wP,g:goalPweek,c:"#ef4444",unit:"g"},
              {l:"🍞 Węgle",v:wC,g:Math.round(goalKcal*0.5/4)*7,c:"#eab308",unit:"g"},
              {l:"🧈 Tłuszcze",v:wF,g:Math.round(goalKcal*0.28/9)*7,c:"#3b82f6",unit:"g"},
            ].map(({l,v,g,c,unit})=>{
              const pct=Math.min(100,Math.round((v/g)*100));
              const over=v>g;
              return (
                <div key={l} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:"var(--muted2)",fontWeight:600}}>{l}</span>
                    <span style={{fontSize:12}}><strong style={{color:over?"#ef4444":c}}>{v}{unit}</strong><span style={{color:"var(--muted)"}}> / {g}{unit}</span></span>
                  </div>
                  <div style={{background:"var(--border)",borderRadius:4,height:7}}>
                    <div style={{height:"100%",borderRadius:4,background:over?"#ef4444":c,width:`${pct}%`,transition:"width .3s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      <div style={{margin:"0 16px 12px"}}>
        <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-red" style={{background:showAdd?"#333":"#ef4444"}}>{showAdd?"✕ Anuluj":"+ Dodaj posiłek"}</button>
      </div>
      {showAdd&&(
        <div className="card">
          {imgPrev&&(
            <div style={{marginBottom:8}}>
              <img src={imgPrev} alt="" style={{width:"100%",borderRadius:10,maxHeight:180,objectFit:"cover"}}/>
              {aiActive&&(
                <div style={{marginTop:6}}>
                  <textarea
                    placeholder="Opcjonalnie: opisz porcję lub składniki..."
                    value={aiDesc} onChange={e=>setAiDesc(e.target.value)}
                    style={{width:"100%",minHeight:56,background:"var(--card2)",border:"1px solid #7c3aed44",borderRadius:8,padding:"8px 10px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:12,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:6}}
                  />
                  <button onClick={()=>analyzeImage(imgPrev, aiDesc)}
                    style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    🤖 Analizuj zdjęcie
                  </button>
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <Ic n="cam" s={20}/><span style={{fontSize:10,color:"var(--muted)"}}>Aparat</span><input type="file" accept="image/*" capture="environment" onChange={handleImg} style={{display:"none"}}/>
            </label>
            <label style={{flex:1,background:"var(--card2)",border:"1.5px dashed var(--border)",borderRadius:10,padding:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <span style={{fontSize:20}}>🖼️</span><span style={{fontSize:10,color:"var(--muted)"}}>Galeria</span><input type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
            </label>
            <button onClick={()=>{ if(aiActive) setAiMode(m=>!m); }}
              title={aiActive?"Analiza AI":"Aktywuj AI w Ustawieniach → 🤖 AI"}
              style={{flex:1,background:aiActive&&aiMode?"#7c3aed22":"var(--card2)",border:`1.5px dashed ${aiActive&&aiMode?"#7c3aed":"var(--border)"}`,borderRadius:10,padding:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:aiActive?"pointer":"not-allowed",color:aiActive?(aiMode?"#a78bfa":"var(--muted)"):"var(--border)",opacity:aiActive?1:0.4}}>
              <span style={{fontSize:20}}>🤖</span>
              <span style={{fontSize:10}}>{aiActive?"AI":"AI 🔒"}</span>
            </button>
          </div>

          {/* AI loading indicator */}
          {aiLoading&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#7c3aed22",borderRadius:10,marginBottom:8,border:"1px solid #7c3aed44"}}>
              <span style={{fontSize:16}}>🤖</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:"#a78bfa",fontWeight:600}}>Analizuję...</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>AI szacuje kalorie i makro</div>
              </div>
              <div style={{width:20,height:20,border:"2px solid #7c3aed",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            </div>
          )}

          {/* AI panel */}
          {aiMode&&!aiLoading&&(
            <div style={{marginBottom:8,background:"#7c3aed22",borderRadius:10,padding:10,border:"1px solid #7c3aed44"}}>

              {/* API Key input - shown if not saved */}
              {!geminiKey&&(
                <div style={{marginBottom:8,padding:"8px 10px",background:"#ef444422",borderRadius:8,border:"1px solid #ef444444"}}>
                  <div style={{fontSize:11,color:"#ef4444",fontWeight:700,marginBottom:4}}>⚠️ Wymagany klucz Gemini API</div>
                  <div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>
                    Pobierz za darmo na <strong>platform.openai.com</strong> → Get API Key
                  </div>
                  <input
                    placeholder="Wklej klucz AIza..."
                    value={geminiKeyInput}
                    onChange={e=>setGeminiKeyInput(e.target.value)}
                    style={{width:"100%",background:"var(--card2)",border:"1px solid #7c3aed44",borderRadius:8,padding:"8px 10px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:12,outline:"none",boxSizing:"border-box"}}
                  />
                  <button onClick={()=>{ if(geminiKeyInput.trim()){setGeminiKey(geminiKeyInput.trim()); setGeminiKeyInput(""); }}}
                    style={{width:"100%",marginTop:6,padding:"8px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Zapisz klucz
                  </button>
                </div>
              )}

              {/* Description input */}
              <div style={{fontSize:11,color:"#a78bfa",marginBottom:6,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>🤖 Opisz posiłek:</span>
                {geminiKey&&<button onClick={()=>setGeminiKey("")}
                  style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"1px solid #7c3aed44",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>
                  zmień klucz
                </button>}
              </div>
              <textarea
                placeholder="np. płatki górskie z mlekiem 300ml i bananem, kurczak 150g z ryżem 100g, 2 kanapki z serem i szynką..."
                value={aiDesc}
                onChange={e=>setAiDesc(e.target.value)}
                style={{width:"100%",minHeight:80,background:"var(--card2)",border:"1px solid #7c3aed44",borderRadius:8,padding:"8px 10px",color:"var(--text)",fontFamily:"'DM Sans'",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box"}}
              />
              <div style={{fontSize:10,color:"var(--muted)",margin:"4px 0 8px"}}>
                💡 Im więcej szczegółów (gramy, marka) tym dokładniej
              </div>
              <button onClick={()=>analyzeText(aiDesc)} disabled={!aiDesc.trim()}
                style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:aiDesc.trim()?"#7c3aed":"var(--card2)",color:aiDesc.trim()?"#fff":"var(--muted)",fontWeight:700,fontSize:14,cursor:aiDesc.trim()?"pointer":"default",transition:"all .2s"}}>
                🤖 Analizuj
              </button>
            </div>
          )}
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
            {(()=>{
              const dp=dm.reduce((s,m)=>s+(m.protein||0),0);
              const dc=dm.reduce((s,m)=>s+(m.carbs||0),0);
              const df=dm.reduce((s,m)=>s+(m.fat||0),0);
              return (
                <div style={{display:"flex",gap:6,marginTop:8,paddingTop:6,borderTop:"1px solid var(--border)"}}>
                  {[["🥩",dp,"#ef4444"],["🍞",dc,"#eab308"],["🧈",df,"#3b82f6"]].map(([e,v,c])=>(
                    <div key={e} style={{flex:1,textAlign:"center",background:"var(--card2)",borderRadius:8,padding:"4px 2px"}}>
                      <div style={{fontSize:13,fontWeight:700,color:c}}>{v}g</div>
                      <div style={{fontSize:10,color:"var(--muted)"}}>{e}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}):<div style={{textAlign:"center",padding:24,color:"var(--muted)",fontSize:13}}>Brak historii</div>
      )}
    </div>
  );
}
// ── SCREEN: KALENDARZ ─────────────────────────────────────────────────────────
function ScreenCalendar({history,exerciseDB={},dayLogs,workoutDates,weeklyGoals,setWeeklyGoals,customExercises}) {
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
  const getDayTypes = d=>{
    const types = workoutDates[ds(d)];
    if(types && Array.isArray(types)) return types;
    if(types) return [types];
    const logType = dayLogs[ds(d)]?.type;
    return logType ? [logType] : [];
  };

  // Series per muscle for month
  const monthStr = `${y}-${String(m+1).padStart(2,"0")}`;
  const monthTotals = {push:0,pull:0,fbw:0};
  history.filter(e=>e.date.startsWith(monthStr)).forEach(e=>{ if(monthTotals[e.type]!==undefined) monthTotals[e.type]+=(e.sets||0); });

  // Weekly muscle series
  const now2=new Date(); const dow=(now2.getDay()+6)%7;
  const wkStart=new Date(now2); wkStart.setDate(now2.getDate()-dow); wkStart.setHours(0,0,0,0);
  const wkDays=Array.from({length:7},(_,i)=>{ const d=new Date(wkStart); d.setDate(wkStart.getDate()+i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const muscleSets={};
  history.filter(e=>wkDays.includes(e.date)).forEach(e=>{ const mu=getMuscle(e.exercise, exerciseDB); if(mu) muscleSets[mu]=(muscleSets[mu]||0)+(Number(e.sets)||0); });
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
            const tps=getDayTypes(d);
            const primaryCol = tps.length>0 ? (TYPE_COLOR[tps[0]]||"#e8d5b0") : null;
            const isT=ds(d)===todayStr;
            const hasCardio = tps.includes("cardio");
            const hasStrength = tps.some(t=>["push","pull","fbw"].includes(t));
            // Background: primary type color
            const bgCol = primaryCol ? primaryCol+"33" : "var(--card2)";
            return (
              <div key={d} className="cal-cell" style={{background:bgCol,color:primaryCol||"var(--muted)",fontWeight:isT?700:400,boxShadow:isT?"0 0 0 1.5px var(--text)":"none"}} onClick={()=>setSelDay(d)}>
                {d}
                {tps.length===1&&primaryCol&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:primaryCol}}/>}
                {tps.length>1&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",display:"flex",gap:2}}>
                  {tps.slice(0,2).map(t=><div key={t} style={{width:4,height:4,borderRadius:"50%",background:TYPE_COLOR[t]||"#e8d5b0"}}/>)}
                </div>}
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
        const selTypes=getDayTypes(selDay);
        const tp=selTypes[0]||null;
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
                    <div><div className="ex-name">{e.exercise}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.sets||0}×</div></div>
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
function ScreenStats({history,exerciseDB={},dayLogs,customExercises=[]}) {
  const [activeTab,   setActiveTab]   = useState("muscle_last");
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
  const allEx = getAllExercises(exerciseDB);

  const getExForGroup = (group) => {
    const allExercises = getAllExercises(exerciseDB);
    if(["push","pull","fbw"].includes(group)){
      return [...new Set(
        allExercises.filter(e=>e.trainings&&e.trainings.includes(group)).map(e=>e.name)
      )];
    }
    return [...new Set(allExercises.filter(e=>e.muscle===group).map(e=>e.name))];
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
  // Helper: get muscle from exerciseDB first, then fallback
  const getMuscleFn = (name) => getMuscle(name, exerciseDB);
  const getLastMuscle=(muscle)=>{
    const names=new Set(getAllExercises(exerciseDB).filter(e=>e.muscle===muscle).map(e=>e.name));
    history.forEach(e=>{ if(getMuscle(e.exercise, exerciseDB)===muscle) names.add(e.exercise); });
    const entries=history.filter(e=>names.has(e.exercise)).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!entries.length) return null;
    const lastDate=entries[0].date;
    const seen=new Set();
    const lastEntries=entries.filter(e=>{if(e.date===lastDate&&!seen.has(e.exercise)){seen.add(e.exercise);return true;}return false;});
    return {date:lastDate,entries:lastEntries};
  };

  const getBestPerEx=(muscle)=>{
    const names=new Set(getAllExercises(exerciseDB).filter(e=>e.muscle===muscle).map(e=>e.name));
    history.forEach(e=>{ if(getMuscle(e.exercise, exerciseDB)===muscle) names.add(e.exercise); });
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
        {[{id:"muscle_last",label:"💪 Partie"},{id:"exercises",label:"📈 Ćwiczenia"},{id:"body",label:"⚖️ Sylwetka"},{id:"week",label:"📅 Tygodnie"}].map(t=>(
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
                  <div><div className="ex-name">{fmt(e.date)}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.type?.toUpperCase()} · {e.sets||0}×</div></div>
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
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{l:"📏 Wzrost",k:"height",unit:"cm",placeholder:"188",step:1},{l:"🎂 Wiek",k:"age",unit:"lat",placeholder:"38",step:1}].map(({l,k,unit,placeholder,step})=>{
              const val = storage.get("appSettings",{})[k]||"";
              return (
                <div key={k} style={{background:"var(--card2)",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>{l}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input type="number" step={step} placeholder={placeholder}
                      defaultValue={val}
                      onChange={e=>{ const v=parseInt(e.target.value); if(v>0) storage.set("appSettings",{...storage.get("appSettings",{}),height:k==="height"?v:storage.get("appSettings",{}).height,age:k==="age"?v:storage.get("appSettings",{}).age}); }}
                      style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--text)",fontFamily:"'Bebas Neue'",fontSize:22}}/>
                    <span style={{fontSize:11,color:"var(--muted)"}}>{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
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
        // Also collect cardio from dayLogs
        const wMap={};
        history.forEach(e=>{
          const ws=getWS(e.date);
          if(!wMap[ws])wMap[ws]={push:new Set(),pull:new Set(),fbw:new Set(),cardio:new Set()};
          if(wMap[ws][e.type]) wMap[ws][e.type].add(e.date);
        });
        // Add cardio from dayLogs
        Object.entries(dayLogs).forEach(([d,l])=>{
          const types = l.workoutTypes||(l.workoutType?[l.workoutType]:[]);
          if(types.includes("cardio")) {
            const ws=getWS(d);
            if(!wMap[ws]) wMap[ws]={push:new Set(),pull:new Set(),fbw:new Set(),cardio:new Set()};
            wMap[ws].cardio.add(d);
          }
        });
        const weeks=Object.entries(wMap).sort((a,b)=>a[0]>b[0]?-1:1).slice(0,8);
        return (
          <div className="card">
            <div className="ctitle">Podsumowanie tygodni</div>
            {!weeks.length&&<div style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:13}}>Brak danych</div>}
            {weeks.map(([ws,data])=>{
              const pN=data.push?.size||0,lN=data.pull?.size||0,fN=data.fbw?.size||0,cN=data.cardio?.size||0;
              const total=pN+lN+fN+cN;
              const we=new Date(ws); we.setDate(we.getDate()+6);
              return (
                <div key={ws} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:11,color:"var(--muted2)",fontWeight:600}}>{fmt(ws)} – {fmt(we.toISOString().slice(0,10))}</span>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#ef4444"}}>{total}x</span>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[["PUSH",pN,"#ef4444"],["PULL",lN,"#3b82f6"],["FBW",fN,"#22c55e"],["CARDIO",cN,"#eab308"]].map(([l,n,c])=>(
                      <div key={l} style={{flex:1,textAlign:"center",background:n>0?c+"22":"var(--card2)",borderRadius:8,padding:"6px 2px",border:n>0?`1px solid ${c}44`:"none"}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:n>0?c:"var(--muted)"}}>{n}x</div>
                        <div style={{fontSize:8,color:"var(--muted)",letterSpacing:.3}}>{l}</div>
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
