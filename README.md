# MBTI Personality Detector — UI

This is the frontend for my DistilBERT model that classifies your personality type based on text input (out of the 16 MBTI personality types). 

Try it out here!: [https://wbmartin00.github.io/mbti-personality-detector-ui/](https://wbmartin00.github.io/mbti-personality-detector-ui/)

![](/images/ss1.png)

I went with a fun, vintage cold war theme. This is pure vanilla JS, with an interactive SVG radial menu, that allows users to select and learn more about the different personality types. 

There are a lot of fun animations and features I built in, but the main gist is that you can type, paste, drag-and-drop, or click upload to send your text file to the model for inference and an animation will display your result!

>This repo is only the frontend, the DistilBERT model and API have their own repos. 

The heavy lifting went into creating the SVG menu from scratch, and creating animations using just HTML/CSS/JS. It's really interesting seeing the limitations of vanilla JS/CSS when using their native animation features. There were lots of issues with jitter, frame rate and rendering that had to be worked through, especially when optimizing for mobile, for what I thought were simple use cases. 

Alas, this was a fun project where most of the image assets I generated from Dall-E or Midjourney, and then integrated and dynamically animated them with JS/CSS. 

Some cool features and animations include:

- Clickable arc segments reveal detailed type descriptions
- Scanlines, grime layers, phosphor glow, and neon sign flickers
- Highlight system distinguishes model predictions from user explorations
- SVG "sweeping highlight beam" animations using SVG `clipPath` and easing
- Radial menu outlines "highlight" animation around the circle as the model is "thinking"

###  Scientist Animation (Thinking & Reacting)

- The scientist character **walks, pauses, and reacts** as input is processed
- Animation timing is synced with model inference steps
- Mobile-friendly animation reworks ensure smooth UX on phones

###  Typing Console Output

- All messages (errors, prompts, predictions) are dynamically **typed out** character-by-character
- Dual typing animation systems for scientist captions and console text output
- Cancelable and reentrant animations for snappy feedback


##  Project structure

```
.
├─ index.html            # App shell
├─ styles.css            # Styling
├─ index.js              # App logic + API calls
├─ MBTICircleSVG.js      # SVG Radial Menu
└─ images/               # Image/PNG assets
```

---


##  If you want to use a different model on the backend:

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

## Credits 

- The SVG Radial Menu was originally inspired by ‘Cognitive Functions.svg’ (JakeBeech / Wikimedia Commons, CC0), though I then coded my own SVG version from scratch. 

---

##  License

MIT — see [LICENSE](./LICENSE).

---

