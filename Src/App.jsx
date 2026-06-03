import { useState, useEffect, useCallback } from "react";

const APP_VERSION = "3.2.0";
const DATA_VERSION = 7;

const storage = {
  get: (key, fallback = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];

const today = () => {
  const d = new Date();
  return `\( {d.getFullYear()}- \){String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const fmt = (d) => { if(!d) return ""; const [y,m,day]=d.split("-"); return `\( {day}. \){m}.${y}`; };

const EXERCISES = { /* ... (oryginalna lista bez zmian) ... */ };
const EXERCISE_ALIASES = { /* ... (oryginalne aliasy bez zmian) ... */ };

const resolveExercise = (name) => {
  if(EXERCISE_ALIASES[name]) return EXERCISE_ALIASES[name];
  const allEx = [...EXERCISES.push, ...EXERCISES.pull, ...EXERCISES.fbw];
  const found = allEx.find(e => e.name === name);
  if (found) return { name: found.name, muscle: found.muscle };
  return { name, muscle: null };
};

const NEW_FBW = [ /* ... oryginalna lista ... */ ];
const SEED_PUSH_PULL = [ /* ... oryginalna lista ... */ ];
const SEED_HISTORY = [...SEED_PUSH_PULL, ...NEW_FBW];

const MUSCLE_GROUPS = ["klata","plecy","barki","biceps","triceps","nogi","brzuch"];
const MUSCLE_COLORS = {klata:"#ef4444",plecy:"#3b82f6",barki:"#f97316",biceps:"#8b5cf6",triceps:"#eab308",nogi:"#22c55e",brzuch:"#06b6d4"};
const MUSCLE_LABELS = {klata:"Klatka",plecy:"Plecy",barki:"Barki",biceps:"Biceps",triceps:"Triceps",nogi:"Nogi",brzuch:"Brzuch"};

const getAllExercises = (customExercises = []) => {
  const base = [...EXERCISES.push, ...EXERCISES.pull, ...EXERCISES.fbw];
  const seen = new Set();
  const result = [];
  base.forEach(ex => { if (!seen.has(ex.name)) { seen.add(ex.name); result.push({ ...ex }); } });
  customExercises.forEach(ex => { if (!seen.has(ex.name)) { seen.add(ex.name); result.push(ex); } });
  return result;
};

const typeColor = {push:"#ef4444",pull:"#3b82f6",fbw:"#22c55e",cardio:"#eab308"};

// CSS (oryginalny)
const css = `...`; // (zostawiam Twój oryginalny CSS – jest bardzo długi)

const Icon = ({name, size=20, color="currentColor"}) => { /* ... oryginalna funkcja Icon ... */ };

const vibrate = (pattern = [100]) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {} };

// ==================== GŁÓWNY KOMPONENT ====================
export default function App() {
  const [tab, setTab] = useState("today");
  const [dayLogs, setDayLogs] = useState(() => storage.get("dayLogs", {}));
  const [customExercises, setCustomExercises] = useState(() => storage.get("customExercises", []));
  const [history, setHistory] = useState(() => {
    const savedVer = storage.get("dataVersion", 0);
    let saved = storage.get("gymHistory", null);
    if (!saved || savedVer < DATA_VERSION) {
      const base = saved || [];
      const existing = new Set(base.map(e => e.date + e.exercise));
      const merged = [...base, ...SEED_HISTORY.filter(e => !existing.has(e.date + e.exercise))];
      storage.set("gymHistory", merged);
      storage.set("dataVersion", DATA_VERSION);
      return merged;
    }
    return saved;
  });

  const [calDate, setCalDate] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selDay, setSelDay] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => storage.get("appSettings", { vibration: true, darkMode: true }));
  const [weeklyGoals, setWeeklyGoals] = useState(() => storage.get("weeklyGoals", { klata: 9, barki: 9, triceps: 6, plecy: 12, biceps: 9, nogi: 6 }));

  useEffect(() => { storage.set("customExercises", customExercises); }, [customExercises]);
  useEffect(() => { storage.set("dayLogs", dayLogs); }, [dayLogs]);
  useEffect(() => { storage.set("gymHistory", history); }, [history]);
  useEffect(() => { storage.set("appSettings", settings); }, [settings]);
  useEffect(() => { storage.set("weeklyGoals", weeklyGoals); }, [weeklyGoals]);

  const todayStr = today();
  const saveDay = useCallback((data) => {
    setDayLogs(prev => ({ ...prev, [todayStr]: { ...prev[todayStr], ...data } }));
  }, [todayStr]);

  return (
    <>
      <style>{css}</style>
      <div className={`app ${!settings.darkMode ? "light-mode" : ""}`}>
        <div className="screen">
          {tab === "today" && <ScreenToday /* ... props ... */ />}
          {tab === "training" && <ScreenTraining 
            history={history} 
            setHistory={setHistory} 
            saveDay={saveDay} 
            todayStr={todayStr} 
            settings={settings} 
            customExercises={customExercises} 
            setCustomExercises={setCustomExercises} 
          />}
          {tab === "diet" && <ScreenDiet todayLog={dayLogs[todayStr]||{}} saveDay={saveDay} />}
          {tab === "calendar" && <ScreenCalendar /* ... */ />}
          {tab === "stats" && <ScreenStats history={history} dayLogs={dayLogs} customExercises={customExercises} />}
        </div>

        {/* Nawigacja bez zmian */}
        <nav className="nav"> {/* ... oryginalna nawigacja ... */ } </nav>

        {showSettings && <SettingsModal /* ... */ />}
      </div>
    </>
  );
}

/* ==================== SCREEN TRAINING – NAPRAWIONY ==================== */
function ScreenTraining({history, setHistory, saveDay, todayStr, settings, customExercises, setCustomExercises}) {
  const [mainTab, setMainTab] = useState("workout");
  const [editEx, setEditEx] = useState(null);
  const [showAddEx, setShowAddEx] = useState(false);
  const [newEx, setNewEx] = useState({name: "", muscle: "klata"});

  const allEx = getAllExercises(customExercises);

  const saveEditEx = () => {
    if (!editEx?.name?.trim()) return;
    const newName = editEx.name.trim();
    const oldName = editEx.originalName;

    setCustomExercises(prev => {
      const idx = prev.findIndex(e => e.name === oldName);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], name: newName, muscle: editEx.muscle };
        return updated;
      }
      return [...prev, { id: `c_${Date.now()}`, name: newName, muscle: editEx.muscle }];
    });

    if (newName !== oldName) {
      setHistory(prev => prev.map(e => e.exercise === oldName ? { ...e, exercise: newName } : e));
    }
    setEditEx(null);
  };

  const deleteExercise = (ex) => {
    if (!confirm(`Usunąć "${ex.name}" razem z historią?`)) return;
    const name = ex.originalName || ex.name;
    setCustomExercises(prev => prev.filter(e => e.name !== name));
    setHistory(prev => prev.filter(e => e.exercise !== name));
    setEditEx(null);
  };

  const addNewExercise = () => {
    if (!newEx.name.trim()) return;
    setCustomExercises(prev => [...prev, { id: `c_${Date.now()}`, name: newEx.name.trim(), muscle: newEx.muscle }]);
    setNewEx({name: "", muscle: "klata"});
    setShowAddEx(false);
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-sub">Siłownia</div>
        <div className="page-title">TRENING</div>
      </div>

      <div style={{display:"flex", margin:"0 16px 12px", gap:8}}>
        {["workout", "exercises"].map(t => (
          <button key={t} onClick={() => setMainTab(t)}
            style={{flex:1, padding:"12px", borderRadius:12, background: mainTab===t ? "#ef4444" : "#222", color: mainTab===t ? "white" : "#aaa", fontWeight:600}}>
            {t === "workout" ? "Nowy trening" : "Moje ćwiczenia"}
          </button>
        ))}
      </div>

      {mainTab === "exercises" && (
        <>
          <div style={{margin:"0 16px 12px"}}>
            <button onClick={() => setShowAddEx(!showAddEx)} className="btn btn-primary">
              {showAddEx ? "✕ Anuluj" : "+ Dodaj ćwiczenie"}
            </button>
          </div>

          {showAddEx && (
            <div className="card">
              <input value={newEx.name} onChange={e => setNewEx(p => ({...p, name: e.target.value}))} placeholder="Nazwa ćwiczenia" style={{width:"100%", padding:12, marginBottom:12, borderRadius:10, background:"#222", border:"1px solid #444"}} />
              <select value={newEx.muscle} onChange={e => setNewEx(p => ({...p, muscle: e.target.value}))} style={{width:"100%", padding:12, marginBottom:12, borderRadius:10, background:"#222", border:"1px solid #444"}}>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
              </select>
              <button onClick={addNewExercise} className="btn btn-primary">Dodaj</button>
            </div>
          )}

          {MUSCLE_GROUPS.map(muscle => {
            const exs = allEx.filter(e => e.muscle === muscle);
            if (!exs.length) return null;
            return (
              <div key={muscle} className="card" style={{marginBottom:8}}>
                <div style={{fontFamily:"'Bebas Neue'", fontSize:18, color: MUSCLE_COLORS[muscle], marginBottom:8}}>
                  {MUSCLE_LABELS[muscle]}
                </div>
                {exs.map(ex => (
                  <div key={ex.id || ex.name} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #222"}}>
                    <div>{ex.name}</div>
                    <button onClick={() => setEditEx({name: ex.name, muscle: ex.muscle, originalName: ex.name})} style={{padding:"8px 12px", background:"#222", borderRadius:8}}>✏️</button>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* Modal edycji */}
      {editEx && (
        <div className="modal-backdrop" onClick={() => setEditEx(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">Edytuj ćwiczenie</div>
            <input value={editEx.name} onChange={e => setEditEx(p => ({...p, name: e.target.value}))} style={{width:"100%", padding:14, marginBottom:16, borderRadius:12, background:"#1a1a1a", border:"1px solid #444"}} />
            <div style={{marginBottom:16}}>
              <div style={{marginBottom:8, color:"#888"}}>Partia:</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
                {MUSCLE_GROUPS.map(m => (
                  <button key={m} onClick={() => setEditEx(p => ({...p, muscle: m}))}
                    style={{padding:"8px 16px", borderRadius:8, border: editEx.muscle === m ? `2px solid ${MUSCLE_COLORS[m]}` : "1px solid #444", background: editEx.muscle === m ? MUSCLE_COLORS[m]+"22" : "#222"}}>
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveEditEx}>Zapisz zmiany</button>
            <button className="btn btn-ghost" style={{marginTop:8, color:"#ef4444"}} onClick={() => deleteExercise(editEx)}>Usuń ćwiczenie</button>
            <button className="btn btn-ghost" style={{marginTop:8}} onClick={() => setEditEx(null)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Reszta komponentów (ScreenStats, ScreenCalendar itd.) – zostają w dużej części bez zmian, ale z poprawionym getAllExercises */
