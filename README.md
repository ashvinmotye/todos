# Focus Todo PWA

A framework-free todo Progressive Web App built with HTML, CSS, and plain JavaScript.

## Features

- Create, edit, complete, delete, search, and filter tasks
- Due dates and priorities
- Browser persistence using `localStorage`
- Offline app shell using a service worker
- Install prompt on supporting browsers
- Responsive and keyboard-accessible interface
- Persistent light/dark mode with system-theme detection
- No build tools and no dependencies

## Run locally

Service workers do not run from a `file://` URL. Serve the folder through localhost instead.

### Python

```bash
cd focus-todo-pwa
python3 -m http.server 8080
```

Open `http://localhost:8080`.

### Node

```bash
npx serve .
```

## Test the PWA

1. Open the app in Chrome or Edge.
2. Add a few tasks, then refresh the page.
3. In DevTools, open **Application → Service Workers**.
4. Enable **Offline** in DevTools and reload.
5. Use the browser install action or the app's **Install app** button when available.

## Important development note

When changing cached files, update `CACHE_NAME` in `sw.js`, for example from `focus-todo-shell-v2` to `focus-todo-shell-v3`. This causes old caches to be removed when the new service worker activates.

## File structure

```text
focus-todo-pwa/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── store.js
│   └── ui.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Suggested next steps

- Replace `localStorage` with IndexedDB
- Add task categories and recurring tasks
- Add drag-and-drop ordering
- Add cloud sync and authentication
- Add notifications for due tasks
