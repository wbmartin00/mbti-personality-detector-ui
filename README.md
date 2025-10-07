## MBTI Personality Detector — UI

A lightweight, retro-styled frontend for a DistilBERT-based MBTI personality type classifier. Type or paste text, drag and drop .pdf, .txt or .docx, and send it to a prediction API, and get a 1-of-16 MBTI label with optional scores accompanied by fun retro-monochrome animations.

Try it out here!: [https://wbmartin00.github.io/mbti-personality-detector-ui/](https://wbmartin00.github.io/mbti-personality-detector-ui/)

![](/images/ss1.png)

> This repository contains only the frontend (HTML/CSS/JS). It’s designed to work with a separate API that exposes a POST /predict endpoint.

---

##  Features
- Zero-build static app (plain HTML/CSS/JS) — open locally or host on GitHub Pages.
- Retro console aesthetic with a circular MBTI visualization (`MBTICircleSVG.js`).
- API-agnostic: works with any compatible `/predict` endpoint that accepts raw text and returns a type (and optionally probabilities).
- Single-file tweakability: point the UI at a different backend by editing one constant.

---

##  Project structure

```
.
├─ index.html            # App shell
├─ styles.css            # Theme and layout
├─ index.js              # App logic + API calls
├─ MBTICircleSVG.js      # Circular MBTI graphic + helpers
└─ images/               # UI assets
```

---

##  Configuration

Edit `index.js` and set your API base. For example:

```js
// index.js
const API_BASE = "https://your-mbti-api.example.com"; // no trailing slash
// UI will POST to `${API_BASE}/predict`
```

### Expected API contract (recommended)
- **Endpoint:** POST /predict
- **Request body:** `{"text": "<user input>"}`
- **Response (example):**
```json
{
  "label": "ENFP",
  "scores": { "ENFP": 0.62, "INFP": 0.18, "...": 0.00 }
}
```

If your backend uses different field names, map them in `index.js` where the response is parsed.

---

##  Run locally

You can double-click `index.html` to open it, but most browsers block `fetch()` from `file://` URLs. Use a tiny static server:

**Option A: Python (built-in)**
```bash
# from the repo root
python3 -m http.server 5500
# visit http://localhost:5500
```

**Option B: Node (serve)**
```bash
npm i -g serve
serve -l 5500
# visit http://localhost:5500
```

---

##  Deploy to GitHub Pages
1. Commit your changes to `main`.
2. In your repo on GitHub: **Settings → Pages**
   - **Source:** Deploy from a branch
   - **Branch:** `main` (root)
3. Save. Your site will build and appear at the URL shown on that page.

> Tip: Pages serves static files only. Ensure `API_BASE` points to a publicly reachable backend (e.g., Fly.io/Render/Railway). Do **not** embed secrets in this repo.

---

##  Customization ideas
- Swap in your own logo/assets under `images/`.
- Adjust the palette and glow effects in `styles.css`.
- Modify the MBTI wheel labels/positions in `MBTICircleSVG.js`.
- Display trait-level scores if your API returns them.

---

##  Quick health check

If the UI loads but predictions fail:
- Open DevTools → **Network** tab and submit a sample.
- Confirm the request is hitting `https://your-api/predict`.
- Check CORS on the backend (`Access-Control-Allow-Origin` should include your site origin or `*` for testing).
- Verify the response JSON field names match what `index.js` expects.

---

##  Roadmap (nice-to-haves)
- Loading state + error toasts
- Copy-link with prefilled text (`?q=...`)
- Persist last input via `localStorage`
- Accessibility pass and reduced-motion mode

---

##  License

MIT — see [LICENSE](./LICENSE).

---

##  Credits

Frontend by **Will Martin**. DistilBERT MBTI classifier served separately.  
Repository: `wbmartin00/mbti-personality-detector-ui`
