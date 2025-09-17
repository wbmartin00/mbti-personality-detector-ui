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


typeOutText('scientist-text', 'Paste or upload a piece of writing to detect their personality type!', speed = 20);


//Center content on load

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function centerViewportX() {
  const scroller = document.scrollingElement || document.documentElement;
  const total = scroller.scrollWidth;     
  const view  = window.innerWidth;
  const x = Math.max(0, (total - view) / 2);
    scroller.scrollLeft = x;
}


window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    centerViewportX();
    // small safety retries for any late layouts
    setTimeout(centerViewportX, 0);
    setTimeout(centerViewportX, 60);
  });
});


const walkFrames = [
  "images/walk1.png",
  "images/walk2.png",
  "images/walk-1.png",
  "images/walk0.png",
  "images/scientist paper.jpg",
  "images/eureka.jpeg"
];

walkFrames.forEach(src => {
  const img = new Image();
  img.src = src;
});

//think + walk function

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




    function move() {
        let previousTimestamp = null;

        function animate(timestamp) {
            if (!previousTimestamp) previousTimestamp = timestamp;
            const deltaTime = timestamp - previousTimestamp;
            previousTimestamp = timestamp;

            const elapsed = timestamp - start;
            const directionMultiplier = elapsed < 950 ? 1 : -1;

            scientistX += directionMultiplier * 0.15 * deltaTime; // Adjust speed
            scientistMediaContainer.style.transform = `translateX(${scientistX}px)`;

            if (directionMultiplier === 1 && moveDirection !== 'right') {
                moveDirection = 'right';
                scientistImage.style.transform = `scaleX(1)`; 
            } else if (directionMultiplier === -1 && moveDirection !== 'left') {
                moveDirection = 'left';
                scientistImage.style.transform = `scaleX(-1)`;
            }

            if (elapsed < 1900) {
                requestAnimationFrame(animate);
            } else {
                moving = false;
            }


            //console.log('deltaTime:', deltaTime.toFixed(2), 'ms');   <---testing frame rate for button hit vs hitting enter key. 

            scientistText.classList.add('text-stay');
        }

        requestAnimationFrame(animate);
    }

    move();

    setTimeout(() => {
        scientistX = 0;
        scientistMediaContainer.style.transform = `translateX(0px)`;
    }, 1901);

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

//pre-send / send handler

let canSend = true;

async function handleSend(textInput) {
    if (!canSend) return;
    canSend = false;

    const text = textInput;
    let result = '';
    result = await getModelResult(text);
    console.log(result);

    requestAnimationFrame(() => think(result));

    setTimeout(() => {
        canSend = true;
    }, 6000);
}


// Enter key listener

textInputField = document.querySelector('.text-input');

textInputField.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        if (textInputField.value == "") {
            typeOutText("scientist-text", "Hmm...  Enter some text and try again!", speed = 80);
            return;
        }
        await handleSend(e.target.value);
    }
});

// Button click listener (mirrors Enter key)
document.querySelector('.enter-button').addEventListener('mousedown', async (e) => {
    e.preventDefault();
    const input = document.querySelector('.text-input');

    if (input.value == "") {
        typeOutText("scientist-text", "Hmm...  Enter some text and try again!", speed = 80);
        return;
    }
    await handleSend(input.value);
});


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

//file upload button functionality

document.addEventListener('DOMContentLoaded', () => {
    const fileUploadButton = document.querySelector('.file-upload-button');
    const fileInput = document.getElementById('file-input');

    fileUploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.txt')) {
            // Plain text
            const reader = new FileReader();
            reader.onload = async (e) => {
                const contents = e.target.result;
                await handleSend(contents);
                console.log(contents);
            };
            reader.readAsText(file);
        }

        else if (fileName.endsWith('.docx')) {
            // DOCX using Mammoth
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;

                const result = await mammoth.extractRawText({ arrayBuffer });
                await handleSend(result.value);

                console.log(result.value);

            };
            reader.readAsArrayBuffer(file);
        }

        else if (fileName.endsWith('.pdf')) {
            // PDF using pdf.js
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

                let allText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    allText += pageText + '\n';
                }

                await handleSend(allText);
                console.log(allText);
            };
            reader.readAsArrayBuffer(file);
        }

        else {
            typeOutText('scientist-text',"Ahem.... that file type is unsupported. Please use .txt, .docx, or .pdf", speed = 20);
        }
    });
});

//drag and drop files functionality

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
// Safer client timeout + retry
async function getModelResult(text) {
  const attempt = async (timeoutMs) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

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
        const msg = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${msg || res.statusText}`);
      }
        const data = await res.json();
        console.log(data.prediction);
        return data.prediction;

    } finally {
      clearTimeout(t);
    }
  };

  try {
    // First attempt with 30s
    return await attempt(40000);
  } catch (err) {
    console.warn('first attempt failed, retrying one more time...', err);
    // One quick warm retry with 15s
    return await attempt(15000);
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
