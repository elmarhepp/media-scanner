# Media Scanner - RSS Feed Reader

## Projektübersicht

Dieses Workspace enthält einen RSS Feed Reader in zwei Varianten:

| Datei/Verzeichnis | Beschreibung |
|---|---|
| `rss-reader.html` | Original-Version: Vanilla HTML + JavaScript |
| `rss-reader-vue.html` | Vue 3 via CDN (Single-File) |
| `rss-reader-vue-project/` | Vue 3 + Vite (vollständiges Projekt) |

## Vue CDN Version (`rss-reader-vue.html`)

Direkt im Browser öffnen, kein Build-Schritt nötig.

## Vue Projekt (`rss-reader-vue-project/`)

### Setup & Starten

```bash
cd rss-reader-vue-project
npm install
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Production Build → dist/
npm run preview    # Production Build lokal testen
```

### Projektstruktur

```
src/
├── main.js
├── App.vue                    # Hauptkomponente, koordiniert State
├── style.css                  # Globale Styles
├── components/
│   ├── FeedCard.vue           # Feed-Karte mit Artikeln
│   ├── FeedSidebar.vue        # Sidebar mit Reitern (Filter/Feeds/Verwalten)
│   ├── AddFeedModal.vue       # Modal: Feed hinzufügen
│   ├── EditFeedModal.vue      # Modal: Feed bearbeiten
│   └── SearchResults.vue      # Suchergebnisse-Ansicht
└── composables/
    └── useFeedManager.js      # Gesamte Feed-Logik (laden, parsen, speichern)
```

## Architektur-Entscheidungen

### Robustes Daten-Loading
Alte Artikel bleiben sichtbar, bis neue erfolgreich von der API geliefert wurden.
In `useFeedManager.js → loadFeedContent()`:
- `feedLoading[id]` zeigt Lade-Spinner (ohne alte Daten zu löschen)
- `feedArticles[id]` wird **nur bei Erfolg** überschrieben
- `feedErrors[id]` wird nur bei Fehler gesetzt

### CORS-Proxy Fallback
Feeds werden über externe CORS-Proxies geladen (Browser-Einschränkung).
Reihenfolge in `CORS_PROXIES`:
1. `api.allorigins.win`
2. `corsproxy.io`
3. `api.codetabs.com`
4. `cors-anywhere.herokuapp.com`

Zusätzlich: JSON-Fallback über `rss2json`, falls XML-Proxies fehlschlagen.

### Kategorien aus Feed-Inhalten
- Pro Artikel werden Kategorien direkt aus Feed-Metadaten geholt.
- Quellen:
1. RSS: `<category>`, `<dc:subject>`
2. Atom: `<category term|label>`
3. rss2json: `categories`, `tags`
- Ergebnis: `article.categories` wird in der UI für Filterung und Darstellung genutzt.

### Sidebar-Navigation
- Sidebar ist in drei Reiter aufgeteilt:
1. `Filter`: Region, Profil, Thema, erkannte Kategorien, Top-Links
2. `Feeds`: konkrete Feed-Liste inkl. Drag & Drop / Aktiv-Status
3. `Verwalten`: Feed hinzufügen, Vorschlags-Feeds importieren
- Aktiver Reiter wird in `localStorage` persistiert.

### LocalStorage
- CDN-Version: Key `rss-feeds-vue`
- Projekt-Version: Key `rss-feeds-vue` (gleicher Key → gleiche Daten)

### Vue 3 Spezifika
- Composition API mit `<script setup>` in allen Komponenten
- Kein `v-if` und `v-for` auf demselben Element (v-if hat höhere Priorität)
- Aktive Feeds über `computed: activeFeeds` filtern, nicht per `v-if` im `v-for`

## Feed-Formate

Beide RSS und Atom werden unterstützt:
- **RSS**: `<item>` Elemente, `<pubDate>`, `<description>`
- **Atom**: `<entry>` Elemente, `<published>`, `<summary>`

## Bekannte Einschränkungen

- CORS-Proxies können langsam oder temporär nicht erreichbar sein
- Feeds werden direkt im Browser geparst (kein Backend)
- Maximal 10 Artikel pro Feed

## Deployment

- Railway-Konfiguration liegt in `rss-reader-vue-project/railway.json`.
- Deploy via `railway up` (im Projektordner), URL via `railway domain`.
