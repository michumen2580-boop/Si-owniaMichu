# GymTracker Pro 💪

## Instrukcja – GitHub Pages (tylko telefon)

### Krok 1 – Załóż konto GitHub
1. Wejdź na **github.com** w Chrome
2. "Sign up" → podaj email, hasło, nazwę użytkownika
3. Potwierdź email

### Krok 2 – Nowe repozytorium
1. Kliknij "+" (prawy górny róg) → "New repository"
2. Nazwa: **gymtracker** (dokładnie tak!)
3. Ustaw "Public"
4. Kliknij "Create repository"

### Krok 3 – Wgraj pliki przez github.dev
1. W adresie przeglądarki zmień `github.com` na `github.dev`
   - Przykład: `github.dev/TWOJA_NAZWA/gymtracker`
2. Otworzy się edytor (jak VS Code w przeglądarce)
3. Kliknij ikonę plików po lewej stronie
4. Utwórz strukturę folderów i wgraj pliki:

```
gymtracker/
├── index.html
├── package.json
├── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx
    └── App.jsx
```

5. Po wgraniu wszystkich plików kliknij ikonę "Source Control" (gałąź po lewej)
6. Wpisz wiadomość np. "pierwsza wersja" → kliknij "Commit & Push"

### Krok 4 – Włącz GitHub Pages
1. Wróć na **github.com** → Twoje repozytorium
2. Kliknij "Settings" (górny pasek)
3. W lewym menu: "Pages"
4. Source: **GitHub Actions**
5. Zapisz

### Krok 5 – Poczekaj na build
1. Kliknij zakładkę "Actions" w repozytorium
2. Zobaczysz workflow "Deploy GymTracker" – czeka ~2 minuty
3. Gdy pojawi się zielony ✓ – gotowe!
4. Link do aplikacji: `https://TWOJA_NAZWA.github.io/gymtracker/`

### Krok 6 – Instalacja na Androidzie
1. Otwórz link w **Chrome**
2. Menu (3 kropki) → **"Zainstaluj aplikację"**
3. Potwierdź → ikona na pulpicie! 🎉

---

## Aktualizacje w przyszłości
Gdy dostaniesz nową wersję aplikacji (np. z dietą AI):
1. Wejdź na github.dev
2. Podmień plik `src/App.jsx`
3. Commit & Push → aplikacja automatycznie się zaktualizuje!
