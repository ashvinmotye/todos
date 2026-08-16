# Focus Todo PWA

A mobile-first, framework-free todo Progressive Web App with a premium mission-control interface inspired by Level90.

## Features

- Level90-style glass cards, Active/Completed tabs, and a halo-orb add button
- Add and edit tasks in a mobile bottom-sheet modal
- Separate Active and Completed views
- Due dates, priorities, and remaining-time badges
- First-launch name setup and a personalised greeting
- Persistent light and dark themes
- Immediate, reliable task completion with no delayed removal animation
- Create, complete, reopen, edit, and delete tasks
- Browser persistence using `localStorage`
- Offline app shell using a service worker
- Install prompt on supporting browsers
- Mobile-first, responsive, and keyboard-accessible interface
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

1. Open the app in a modern browser.
2. Add a few tasks, then refresh the page.
3. In DevTools, open **Application → Service Workers**.
4. Enable **Offline** in DevTools and reload.
5. Use the browser install action or the app's **Install app** button when available. On iPhone, open the site in Safari and use **Share → Add to Home Screen**.

## Deploy to GitHub Pages

Push every project file to the repository root, then configure:

```text
Settings → Pages
Source: Deploy from a branch
Branch: main
Folder: /(root)
```

The included `.nojekyll` file keeps deployment as a plain static site.

## Important development note

When changing cached files, update `CACHE_NAME` in `sw.js`. This causes old caches to be removed when the new service worker activates.

## File structure

```text
focus-todo-pwa/
├── .nojekyll
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

Task data, the saved user name, and the selected theme stay on the current device. They are not yet synchronised to the cloud.
