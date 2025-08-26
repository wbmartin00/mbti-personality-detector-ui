const dropZoneBackground = document.getElementById('drop-zone'); //what changes color on file hover
const dropZoneOverlay = document.getElementById("drop-zone-overlay"); //accepts the dropped files, because the other elements (scientist, text input) would otherwise interfere with a clean drop anywhere on the monitor screen
const fileInput = document.getElementById("file-input");

const API_BASE = 'https://mbti-api.fly.dev'; // Fly.io app URL

let stepping = false; 
const stepFrames = ["images/walk1.png", "images/walk2.png", "images/walk-1.png", "images/walk0.png"];
let currentFrame = 0;


let moving = false;
let scientistX = 0;
let moveDirection = 'right';


function think(result) {

    startRingTrailFor(4000, {
        fadeIn: 20,
        hold: 10,
        fadeOut: 300,
        stagger: 85  
    });

    typeOutText('scientist-text', 'hmmm...', speed = 80);

    const scientistImage = document.querySelector('.scientist-pic');
    const scientistMediaContainer = document.querySelector('.scientist-media');
    const scientistVid = document.querySelector('.scientist-vid');
    const scientistText = document.querySelector('.scientist-text');

    stepping = true;
    const start = performance.now();

    let stepStart = null;   
    let lastStepFrameTime = 0;

    function step(timestamp) {
        if (!stepStart) stepStart = timestamp;
        const elapsed = timestamp - stepStart;

        if (lastStepFrameTime === 0 || elapsed - lastStepFrameTime >= 200) {
            currentFrame = (currentFrame + 1) % stepFrames.length;
            scientistImage.src = stepFrames[currentFrame];
            lastStepFrameTime = elapsed;
        }

        if (elapsed < 1900) {
            requestAnimationFrame(step);
        } else {
            stepping = false;
        }
    }
    scientistImage.src = stepFrames[0];
    currentFrame = 0;
    step(performance.now());

    function move(timestamp) {
        
        if (timestamp - start < 950) {
            scientistX += 1.5; // Scientist walk speed
            if (moveDirection !== 'right') {
                moveDirection = 'right';
                scientistMediaContainer.style.transform = `translateX(${scientistX}px)`;
                scientistImage.style.transform = `scaleX(1)`; 
            }
            else {
                scientistMediaContainer.style.transform = `translateX(${scientistX}px)`;
            }
        }
        else {
            scientistX -= 1.5; // Scientist walk speed
            if (moveDirection !== 'left') {
                moveDirection = 'left';
                scientistMediaContainer.style.transform = `translateX(${scientistX}px)`;
                scientistImage.style.transform = `scaleX(-1)`;
            }
            else {
                scientistMediaContainer.style.transform = `translateX(${scientistX}px)`;
            }
        }

        if (timestamp - start < 1900) {
            requestAnimationFrame(move);
        } else {
            moving = false;
        }

        scientistText.classList.add('text-stay');

    }
    move(performance.now());

    setTimeout(async () => {
        scientistImage.style.transform = `scaleX(1)`; 
        scientistImage.src = 'images/scientist.png';
    }, 1905);

    setTimeout(async () => {
        scientistImage.src = 'images/scientist paper.jpg';
    }, 2300)



    setTimeout(async () => {
        scientistImage.src = "images/eureka.jpeg";
        scientistImage.style.transform = `scaleX(1)`; 
        scientistImage.classList.remove('hide');
        scientistVid.classList.add('hide');
        scientistText.classList.remove('text-stay');
        typeOutText('scientist-text', `Your result is ${result}!`, speed = 80);
    }, 4000);

    setTimeout(async () => {
        modelHighlightSVG(result);
    }, 4001); 

    
};

//Manually hit enter to send text to model

let canSend = true;

document.querySelector('.text-input').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        if (!canSend) return;
        canSend = false;

        const text = e.target.value;
        let result = '';
        result = await getModelResult(text);
        console.log(result);

        think(result);

        setTimeout(() => {
            canSend = true;
        }, 6000);
    }
});

typeOutText('scientist-text', 'Paste or upload a piece of writing to detect their personality type!', speed = 20);


// ------  Dropzone overlay listeners  ---------

dropZoneBackground.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZoneOverlay.style.pointerEvents = "auto";
});

dropZoneOverlay.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.add("active");
});

dropZoneOverlay.addEventListener("dragleave", () => {
    dropZoneOverlay.classList.remove("active");
    dropZoneOverlay.style.pointerEvents = "none";
});

// ------  File import and parse from pdf, docx or txt -------

dropZoneOverlay.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZoneBackground.classList.remove("dragover");
    dropZoneOverlay.classList.remove("active");
    dropZoneOverlay.style.pointerEvents = "none";

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            //Delay to wait for thinking animation:
            const result = await getModelResult(text);
            console.log(result);
            think(result);
        
        };
        reader.readAsText(file);
    }

    else if (fileName.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            mammoth.extractRawText({ arrayBuffer: event.target.result })
                .then(async (result) => {
                    const text = result.value;
                    //Delay to wait for thinking animation:
                    result = await getModelResult(text);
                    console.log(text);
                    console.log(result);
                    think(result);
                })
                .catch(err => alert("Error reading DOCX file: " + err));
        };
        reader.readAsArrayBuffer(file);
    }

    else if (fileName.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const typedArray = new Uint8Array(event.target.result);
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
            let fullText = '';

            for (let i = 0; i < pdf.numPages; i++) {
                const page = await pdf.getPage(i + 1);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            //Delay to wait for thinking animation:

            const result = await getModelResult(fullText);
            console.log(fullText);
            console.log(result);
            think(result);
        };
        reader.readAsArrayBuffer(file);
    }

    else {
        typeOutText('scientist-text',"Ahem.... that file type is unsupported. Please use .txt, .docx, or .pdf", speed = 20);
    }
});


//Send text to the AI model
async function getModelResult(text) {
  // Client-side timeout so the UI doesn't wait forever
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000); // 5s

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',               
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(t);

    if (!res.ok) {
      // Catch server message for debugging
      const msg = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${msg || res.statusText}`);
    }

    const data = await res.json();
    // backend returns { prediction: "..." }
    return data.prediction;
  } catch (err) {
    clearTimeout(t);
    console.error('getModelResult failed:', err);
    // friendly error message in UI can go here
    throw err;
  }
}

//add class to trigger neon flicker animation

function randomFlicker() {
    const sign = document.querySelector('.title-personality-image');
    if (!sign) return;

    sign.classList.add('flicker-once');

    // Remove after animation so it can be reapplied
    setTimeout(() => {
        sign.classList.remove('flicker-once');
    }, 1000);

    // Next flicker between 4–9 seconds
    const nextTime = Math.random() * 9000 + 4000;
    setTimeout(randomFlicker, nextTime);
}

window.addEventListener('DOMContentLoaded', randomFlicker);
