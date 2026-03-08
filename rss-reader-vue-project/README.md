# RSS Feed Reader - Vue.js Projekt

Ein moderner RSS Feed Reader gebaut mit Vue 3 und Vite.

## Features

- ✅ RSS & Atom Feed Support
- ✅ Feeds hinzufügen/bearbeiten/löschen
- ✅ Feed aktivieren/deaktivieren
- ✅ Drag & Drop zum Sortieren
- ✅ Suchfunktion mit Highlighting
- ✅ Refresh all Feeds
- ✅ Kategorien direkt aus RSS/Atom/JSON extrahieren
- ✅ Artikel nach erkannter Kategorie filtern
- ✅ Sidebar mit Reiter-Navigation (`Filter`, `Feeds`, `Verwalten`)
- ✅ Sidebar-Statistik und Top-Link-Domains
- ✅ CORS-Proxy Fallback
- ✅ Robustes Daten-Loading (alte Daten bleiben bis neue geladen sind)
- ✅ LocalStorage Persistierung
- ✅ Mobile-responsive

## Installation

```bash
# Dependencies installieren
npm install
```

## Development

```bash
# Dev-Server starten (mit Hot-Reload)
npm run dev
```

Der Dev-Server läuft standardmäßig auf `http://localhost:5173`

## Build

```bash
# Production Build erstellen
npm run build
```

Die Build-Ausgabe wird in `dist/` gespeichert.

## Preview

```bash
# Production Build lokal testen
npm run preview
```

## Deployment (Railway)

Das Projekt ist auf Railway deploybar (Konfiguration in `railway.json`).

```bash
# Deploy aus dem Projektordner
railway up

# Domain anzeigen
railway domain
```

Aktuelle Railway-URL:
`https://media-scanner-rss-reader-production.up.railway.app`

## Projektstruktur

```
src/
├── main.js                 # App Entry Point
├── App.vue                 # Hauptkomponente
├── style.css               # Globale Styles
├── components/
│   ├── FeedCard.vue       # Feed-Karte mit Artikeln
│   ├── FeedSidebar.vue    # Sidebar mit Reitern, Filtern, Feeds, Verwaltung
│   ├── AddFeedModal.vue   # Modal zum Hinzufügen
│   ├── EditFeedModal.vue  # Modal zum Bearbeiten
│   └── SearchResults.vue  # Suchergebnisse
└── composables/
    └── useFeedManager.js  # Feed-Management Logik
```

## Technologien

- Vue 3 (Composition API mit `<script setup>`)
- Vite (Build Tool)
- LocalStorage API
- DOMParser (RSS/Atom Parsing)
- Fetch API (mit CORS Proxies + JSON-Fallback)

## Browser-Support

- Chrome/Edge (neueste Versionen)
- Firefox (neueste Versionen)
- Safari (neueste Versionen)
