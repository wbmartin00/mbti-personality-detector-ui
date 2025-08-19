document.addEventListener('DOMContentLoaded', init);

let consoleTypingTimeouts = [];
let scientistTextTimeouts = [];
let outlineGroupRef = null;   // holds the <g> that all aqua outlines live in


function init() {  
  const svg = document.getElementById('mbti-wheel');

  /* --- sweeping clipPath (fixed-width beam) --- */
  const sweepClip  = createSVG('clipPath', {
    id: 'sweep-clip',
    clipPathUnits: 'userSpaceOnUse'   // use SVG coordinates directly
  });

  const beamWidth = 250;     // width of the light beam
  const sweepRect = createSVG('rect', {
    id: 'sweep-rect',
    x: -1080,              // start just off the left edge of viewBox
    y: 0,
    width: beamWidth,
    height: 1150
  });
  sweepClip.appendChild(sweepRect);
  svg.appendChild(sweepClip);

  // Mirror the clip rect so you can see it while debugging
  /*
  const debugOutline = createSVG('use', {
    href: '#sweep-rect',              // reference the rect inside the clipPath
    fill: 'none',
    stroke: 'red',
    'stroke-width': 5,
    'vector-effect': 'non-scaling-stroke', // keep 2px even if scaled/rotated
    'pointer-events': 'none'               
  });
  svg.appendChild(debugOutline);
  */


  //function sweepAngled(sweepRect, delay = 2000, duration = 1000, angleDeg = 45, yTarget)
  sweepAngled(sweepRect, delay = 2000, duration = 850, angleDeg = 45, yTarget = -550);


  // outline group that will be clipped by the rectangle
  const outlineGroup = createSVG('g', {
    class: 'stroke-outline-group',
    'clip-path': 'url(#sweep-clip)'
  });
  svg.appendChild(outlineGroup);
  outlineGroupRef = outlineGroup;   // so createArc() can drop strokes in

  // prepare <defs> to hold the text‐arcs
  const defs = createSVG('defs', {});
  svg.appendChild(defs);
  

  const outerTypes  = ["ENFP","INFP","ISFP","ESFP","ESTP","ISTP","INTP","ENTP"];
  const outerColors = ["#065284","#106722ff","#065284","#065284","#065284","#065284","#065284","#065284"];
  const innerTypes  = ["INFJ","ENFJ","ESFJ","ISFJ","ISTJ","ESTJ","ENTJ","INTJ"];
  const innerColors = ["#065284", "#065284", "#065284", "#065284", "#065284", "#065284", "#065284", "#065284"];
  
  const outerTypesColors = ["#589274", "#589274", "#020503ff", "#589274", "#589274", "#589274", "#589274", "#589274"];
  const innerTypesColors = ["#000000ff", "#589274", "#589274", "#000000ff", "#000000ff", "#589274", "#589274", "#589274"];


  const functionsOutter   = ["⎡Extraverted Ne Intuition⎤","⎡Introverted Fi Feeling⎤","⌊Extraverted Se Sensing⎦", "⌊Introverted Ti Thinking⎦"];
  const functionsInner = ["⎡Introverted Ni Intuition⎤", "⎡Extraverted Fe Feeling⎤", "⌊Introverted Se Sensing⎦", "⌊Extraverted Te Thinking⎦"];

  const functionsOutterColors = ["#62407A", "#6192B0", "#00572A", "#E97C9C"];

  const functionsInnerColors = ["#9780A7", "#065284", "#589274", "#A6121F"];

  // radii definitions
  const outerR1 = 200, outerR2 = 280;
  const innerR1 =  93, innerR2 = 160;
  const midR    = (innerR2 + outerR1)/2;   // ≈170 for function labels
  const count  = 8;
  const offset = -112.5;       // start at top
  const step   = 360 / count;  // 45° per slice
  
  // draw rings + build text‐paths
  for (let i = 0; i < count; i++) {
    const centerAng = offset + i * step;
    const sa = (centerAng - step/2), ea = centerAng + step/2; 
    //sa = starting angle, ea = ending angle
    
    // slice shape (outer)
    createArc(outerR1, outerR2, sa +0.55, ea, svg, outerTypes[i], 'outer', i);
    
    // define text‐arc path for this outer slice
    const oMid = (outerR1 + outerR2)/2 -1.5;
    createArcPath(sa, ea, oMid, `outerPath${i}`, defs);
    
    // slice shape (inner)
    createArc(innerR1, innerR2, sa + 1, ea, svg, innerTypes[i], 'inner', i);
    
    // define text‐arc path for inner slice
    const iMid = (innerR1 + innerR2)/2;
    createArcPath(sa, ea, iMid, `innerPath${i}`, defs);
  }
    // define text‐arc paths for the four function labels spanning two segments
  for (let j = 0; j < functionsOutter.length; j++) {
    const funcCenter = offset -20 + j * step * 2;
    const startAng   = funcCenter - step + 0.8;
    const endAng     = funcCenter + step;
    createArcPath(startAng, endAng, outerR2 +15, `funcOPath${j}`, defs);
    createArcPath(startAng-4.5, endAng, innerR2 + 15,`funcIPath${j}`, defs);
  }
  
  // place outer & inner labels along those arcs
  //function placeTextOnPath(text, href, cls, svg)
  for (let i = 0; i < count; i++) {
    placeTextOnPath(outerTypes[i], `#outerPath${i}`, `outter-type`, svg);
    placeTextOnPath(innerTypes[i], `#innerPath${i}`, `inner-type`, svg);
  }
    for (let i = 0; i < 4; i++) {
    placeTextOnPath(functionsOutter[i],   `#funcOPath${i}`,  'func', svg);
    placeTextOnPath(functionsInner[i],   `#funcIPath${i}`,  'Innerfunc', svg);
  }
  // center circle + title
  svg.appendChild(createSVG('circle', { r: innerR1, fill: 'none' }));
  svg.appendChild(createSVG('text', { class: 'center-title-1',
    y: -10, 'text-anchor':'middle','font-size':28, fill:'#333'
  }, "Cognitive"));
  svg.appendChild(createSVG('text', { class: 'center-title-2',
    y:  30, 'text-anchor':'middle','font-size':27, fill:'#333'
  }, "Functions"));

  //add click-event listener to arc segments + retrieve personality type of segment
  document.querySelectorAll('.arc-segment').forEach(el => {
    el.addEventListener('click', (e) => {
      // Remove 'clicked' and 'model-highlighted' class from all segments
      document.querySelectorAll('.arc-segment').forEach(segment => {
        segment.classList.remove('clicked');
        segment.classList.remove('model-highlighted');
      });

      // Add 'clicked' class to the clicked segment
      e.target.classList.add('clicked');

      // Retrieve type and pass it to typeOutText function
      const arcSegmentName = e.target.getAttribute('arc-segment-name');
      typeOutText('type-output', personalityTypeDescriptions[arcSegmentName]);

      const typeLabels = document.querySelectorAll('text.outter-type, text.inner-type');

      //remove 'clicked' and 'model-highlighted' classes from text labels
      typeLabels.forEach(typeLabel => {
        typeLabel.classList.remove('clicked', 'model-highlighted');
      });

      //add 'clicked' class to selected text label
      const matchingLabel = document.querySelector(`text[label="${arcSegmentName}"]`);
      if (matchingLabel) {
        matchingLabel.classList.add('clicked');
      };

    });
  });

  document.querySelectorAll('.arc-segment').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      e.target

    })
  });

}

// draw a filled ring‐segment
function createArc(r1, r2, sa, ea, svg, arcSegmentName = '', ring ='', idx = 0) {
  const toRad = Math.PI/180;
  const x1 = r1*Math.cos(sa*toRad), y1 = r1*Math.sin(sa*toRad);
  const x2 = r2*Math.cos(sa*toRad), y2 = r2*Math.sin(sa*toRad);
  const x3 = r2*Math.cos(ea*toRad), y3 = r2*Math.sin(ea*toRad);
  const x4 = r1*Math.cos(ea*toRad), y4 = r1*Math.sin(ea*toRad);
  const largeArc = (ea-sa)>180 ? 1 : 0;
  const d = [
    `M${x1},${y1}`,
    `L${x2},${y2}`,
    `A${r2},${r2} 0 ${largeArc},1 ${x3},${y3}`,
    `L${x4},${y4}`,
    `A${r1},${r1} 0 ${largeArc},0 ${x1},${y1}`,
    'Z'
  ].join(' ');
  const p = createSVG('path', {
    d,
    class: 'arc-segment',
    'arc-segment-name': arcSegmentName,
    'data-ring': ring,
    'data-idx': String(idx)
  });
  svg.appendChild(p);


  // Duplicate outlines for animation
  if (outlineGroupRef) {
    const outline = createSVG('path', {
      d,
      class: 'arc-outline',
      'data-ring': ring,
      'data-idx': String(idx),
      fill: 'none',
      stroke: 'none'
    });
    outlineGroupRef.appendChild(outline);
  }

}

// define the arc paths in <defs> for text to follow
function createArcPath(sa, ea, r, id, defs) {
  const toRad = Math.PI/180;
  const x1 = r*Math.cos(sa*toRad), y1 = r*Math.sin(sa*toRad);
  const x2 = r*Math.cos(ea*toRad), y2 = r*Math.sin(ea*toRad);
  const largeArc = (ea-sa)>180 ? 1 : 0;
  let d;
  // open arc (no closing back to start)
  if (sa >= 0-5 && sa < 180) {
    d = `M${x2},${y2} A${r},${r} 0 ${largeArc},0 ${x1},${y1}`;
  }
  else {
    d = `M${x1},${y1} A${r}, ${r} 0 ${largeArc},1 ${x2},${y2}`;
  }
  defs.appendChild(createSVG('path',{id, d}));
}

// attach a <textPath> to one of the <defs> arcs
function placeTextOnPath(text, href, cls, svg) {
  const t = createSVG('text',{class: cls, dy: '0', 'label': text});
  const tp = createSVG('textPath', {
    class: cls,
    href,
    startOffset: '50%',
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    style: `letter-spacing:0.75px;`
  }, text);
  t.appendChild(tp);
  svg.appendChild(t);
}

// helper to create any type of SVG element
function createSVG(tag, attrs, txt) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (let k in attrs) el.setAttribute(k, attrs[k]);
  if (txt) el.textContent = txt;
  return el;
}

//animate typing on the screen
function typeOutText(elementId, text, speed = 10)
{
  const el = document.getElementById(elementId);
  el.textContent = '';

  if (elementId === 'scientist-text') {
    scientistTextTimeouts.forEach(timeout => clearTimeout(timeout));
    scientistTextTimeouts = [];
  }
  else {
    consoleTypingTimeouts.forEach(timeout => clearTimeout(timeout));
    consoleTypingTimeouts = [];
  }

  let i = 0;

  function typeChar() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      const timeout = setTimeout(typeChar, speed);
      if (elementId === 'scientist-text') {
        scientistTextTimeouts.push(timeout);
      }
      else {
        consoleTypingTimeouts.push(timeout);
      }
    }
  }
  typeChar();
}

//highlight the svg arc segment and call typeOutText for it
function modelHighlightSVG(type) {

  //remove clicked class from any previously clicked element
  document.querySelectorAll('.arc-segment').forEach(segment => {
        segment.classList.remove('clicked', 'model-highlighted', 'model-highlighted-persist');
  });
  
  const typeLabels = document.querySelectorAll('text.outter-type, text.inner-type');

  //remove clicked class from labels as well
  typeLabels.forEach(typeLabel => {
    typeLabel.classList.remove('clicked', 'model-highlighted');
  });
  
  // Add 'model-highlighted' class to the clicked segment
  const match = document.querySelector(`[arc-segment-name="${type}"]`);
  if (match) {
    match.classList.add('model-highlighted', 'model-highlighted-persist');
    typeOutText('type-output', personalityTypeDescriptions[type]);
  }

  const matchingLabel = document.querySelector(`text[label="${type}"]`);
    if (matchingLabel) {
      matchingLabel.classList.add('model-highlighted');
    };
};

// utility easing
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function sweepAngled(sweepRect, delay = 2000, duration = 1000, angleDeg = 45, yTarget) {
  const beamW = parseFloat(sweepRect.getAttribute('width'));   // 250
  const beamH = parseFloat(sweepRect.getAttribute('height'));  // 600
  const viewW = 600;                        // width of viewBox
  const startX = -beamW - viewW;            // off-left
  const endX   = viewW + beamW;             // off-right
  const fixedY = yTarget;                   // top of viewBox
  const startTime = performance.now() + delay;

  function frame(now) {
    if (now < startTime) {
      return requestAnimationFrame(frame);
    }
    // normalize progress [0–1]
    const t = Math.min((now - startTime) / duration, 1);
    // current x
    const x = startX + (endX - startX) * t;
    sweepRect.setAttribute('x', x);
    sweepRect.setAttribute('y', fixedY);

    // compute center for rotation
    const cx = x + beamW / 2;
    const cy = fixedY + beamH / 2;
    sweepRect.setAttribute('transform',
      `rotate(${angleDeg}, ${cx}, ${cy})`
    );

    if (t < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function flashStroke(el, { color='rgba(116,223,214,1)', width=2, fadeIn=90, hold=160, fadeOut=260 } = {}) {
  return new Promise(resolve => {
    el.style.stroke = color;
    el.style.strokeWidth = String(width);
    // el.style.strokeLinejoin = 'round';
    // el.style.strokeLinecap = 'round';
    // el.style.filter = 'drop-shadow(0 0 6px rgba(116,223,214,0.9))';

    el.style.transition = 'none';
    el.style.strokeOpacity = '0';
    el.getBoundingClientRect(); // reflow

    el.style.transition = `stroke-opacity ${fadeIn}ms ease-out`;
    el.style.strokeOpacity = '1';

    setTimeout(() => {
      el.style.transition = `stroke-opacity ${fadeOut}ms ease-in`;
      el.style.strokeOpacity = '0';

      setTimeout(() => {
        // cleanup
        el.style.removeProperty('stroke');
        el.style.removeProperty('stroke-width');
        el.style.removeProperty('stroke-linejoin');
        el.style.removeProperty('stroke-linecap');
        el.style.removeProperty('filter');
        el.style.removeProperty('stroke-opacity');
        el.style.removeProperty('transition');
        resolve();
      }, fadeOut + 20);
    }, fadeIn + hold);
  });
}

// Compute one long sequence, outer (0-7) then inner (0-7)
function getRingSequence() {
  const outer = [...document.querySelectorAll('.arc-segment[data-ring="outer"]')]
    .sort((a,b) => (+a.dataset.idx) - (+b.dataset.idx));
  const inner = [...document.querySelectorAll('.arc-segment[data-ring="inner"]')]
    .sort((a,b) => (+a.dataset.idx) - (+b.dataset.idx));
  return [...outer, ...inner];
}

// Concurrent trail animation highlighter
function highlightRingTrail({
  fadeIn = 50,
  hold = 60,
  fadeOut = 450,   // longer fadeOut = trail is visible longer
  stagger = 70,    // start next segment after this delay
  loop = false
} = {}) {
  const seq = getRingSequence();
  if (!seq.length) return;

  // Fire each segment with an increasing delay
  seq.forEach((el, i) => {
    setTimeout(() => {
      flashStroke(el, { fadeIn, hold, fadeOut }); 
    }, i * stagger);
  });

  // keep looping
  const cycle = (seq.length - 1) * stagger + fadeIn + hold + fadeOut;
  if (loop) {
    setTimeout(() => highlightRingTrail({ fadeIn, hold, fadeOut, stagger, loop }), cycle + 40);
  }
}

window.startRingTrail = (opts) => highlightRingTrail(opts);

// Run continuous animation for certain duration
function startRingTrailFor(durationMs = 3000, {
  fadeIn = 20, hold = 10, fadeOut = 300, stagger = 85
} = {}) {
  const seq = getRingSequence();
  if (!seq.length) return () => {};

  let i = 0;
  let timer = null;
  const t0 = performance.now();

  function step() {
    const elapsed = performance.now() - t0;
    if (elapsed >= durationMs) return; // stops scheduling new segments

    const el = seq[i % seq.length];
    flashStroke(el, { fadeIn, hold, fadeOut }); // overlaps with previous ones
    i += 1;
    timer = setTimeout(step, stagger);
  }

  step();

  // returns cancel handle if need to stop early
  return () => { if (timer) clearTimeout(timer); };
}

window.startRingTrailFor = startRingTrailFor;

const personalityTypeDescriptions = {
  
  ENTP: `ENTPs, known as “The Visionaries,” are innovative, energetic thinkers who thrive on exploring possibilities and pushing boundaries. Highly curious and quick-witted, ENTPs enjoy analyzing complex problems and devising creative solutions, often challenging established norms in the process. They are skilled communicators, using their charisma and intellectual agility to engage and persuade others. Although ENTPs are enthusiastic about new ideas and ventures, they may grow bored with routine tasks or rigid structures, constantly seeking new intellectual stimulation. Their adaptability and confidence in taking calculated risks enable them to excel in entrepreneurial roles and dynamic environments.`,
  ENFP: `ENFPs, known as “The Champions,” are enthusiastic, creative, and compassionate individuals driven by their desire to inspire and connect deeply with others. They possess remarkable emotional intuition, enabling them to empathize effortlessly and support those around them. ENFPs thrive on possibilities, often seeing potential and meaning in every interaction and experience. Naturally curious and imaginative, they excel at communicating ideas in a compelling, authentic, and persuasive manner. Though they tend to shy away from strict routines or rigid structures, their adaptability and genuine warmth make them excellent collaborators and inspiring leaders.`,
  INFP: `INFPs, known as “The Idealists,” are deeply introspective, empathetic, and guided by a profound sense of authenticity and personal values. They are intuitive and perceptive, constantly seeking deeper meaning and purpose in life’s experiences. INFPs have a powerful drive to understand themselves and others, often dedicating considerable emotional energy to supporting and uplifting those around them. Creative and imaginative, they see potential where others may not, dreaming of possibilities for a better, kinder world. While preferring flexibility and openness over rigid structure, INFPs can be fiercely dedicated when a cause aligns deeply with their core values.`,
  ISFP: `ISFPs, known as “The Adventurers,” are gentle, artistic souls who approach life with an open heart and keen appreciation for sensory experiences. Highly observant and attuned to their surroundings, ISFPs find joy in creativity, often expressing themselves through art, music, or practical hands-on activities. They prioritize authenticity and personal freedom, typically choosing to follow their instincts rather than conform to external expectations. Quietly compassionate and deeply empathetic, ISFPs offer unwavering support and understanding to those they care about. Though usually reserved, they possess a spontaneous, adventurous spirit that leads them to embrace new experiences and environments.`,
  ESFP: `ESFPs, known as “The Performers,” are vibrant, outgoing individuals who thrive on social interaction and spontaneous experiences. Energetic and playful, they excel at engaging others with their warmth, charisma, and genuine enthusiasm for life. ESFPs live firmly in the present moment, keenly attuned to sensory pleasures and tangible experiences rather than abstract ideas. They enjoy being at the center of activity, often bringing humor, joy, and an infectious sense of fun wherever they go. Practical yet flexible, ESFPs easily adapt to changing circumstances and have a talent for responding creatively under pressure. Ultimately, ESFPs distinguish themselves through their lively personalities, sincere empathy, and a natural ability to connect meaningfully with others.`,
  ESTP: `ESTPs, known as “The Dynamo,” are energetic, action-oriented individuals who thrive in dynamic, fast-paced environments. Bold and charismatic, they excel at responding swiftly and decisively, making them natural problem-solvers in high-pressure situations. ESTPs enjoy engaging directly with the world, learning best through hands-on experience and practical application rather than abstract theories. Their confidence and resourcefulness enable them to take risks and navigate challenges with ease. Though occasionally impulsive, ESTPs possess keen observational skills, quickly reading situations and adapting their strategies accordingly.`,
  ISTP: `ISTPs, known as “The Craftspeople,” are analytical, practical, and independent individuals who excel in problem-solving and hands-on tasks. With their calm, reserved nature, ISTPs prefer to observe their surroundings closely, acting efficiently and effectively when necessary. They have an innate ability to understand how things work, often showing impressive technical and mechanical skills. ISTPs thrive in environments where they can apply their logical thinking to practical challenges, favoring action and experience over abstract theory. Highly adaptable, they respond well to changing conditions and rarely become flustered under pressure.`,
  INTP: `INTPs, known as “The Thinkers,” are analytical, intellectually curious individuals driven by an endless quest for knowledge and understanding. They approach the world through logic and reason, constantly dissecting ideas, theories, and systems to uncover underlying principles. INTPs thrive when exploring abstract concepts, frequently questioning norms and pushing boundaries to discover new perspectives. Often reserved and introspective, they prefer independent thinking and deeply value autonomy in their pursuits. While they may seem detached on the surface, INTPs possess a profound depth of creativity and innovation.`,
  INTJ: `INTJs, known as “The Architects,” are insightful, strategic thinkers characterized by their independence, confidence, and relentless pursuit of excellence. Driven by logic and long-term vision, they excel in identifying complex patterns and devising innovative solutions to challenging problems. INTJs value efficiency, competence, and structured planning, preferring to work autonomously and systematically toward their goals. Although reserved, their deep commitment to their ideas makes them decisive and determined leaders. While their pragmatic and rational nature may sometimes come across as overly critical, INTJs hold themselves and others to high standards, always seeking growth and improvement.`,
  INFJ: `INFJs, known as “The Counselors,” are insightful, empathetic individuals dedicated to understanding the complexities of human relationships and the deeper meanings in life. Driven by strong intuition and a deeply held value system, INFJs seek authentic connections and have a natural talent for guiding and inspiring others. Often reserved yet passionately committed to their ideals, they strive tirelessly toward creating harmony and meaningful change. INFJs easily perceive underlying emotions and motivations, enabling them to offer profound insights and compassionate support to those around them. While generally gentle and accommodating, they can exhibit firm determination when advocating for their beliefs or defending those they care about.`,
  ENFJ: `ENFJs, known as “The Teachers,” are charismatic, empathetic individuals who excel at connecting with people and inspiring meaningful growth. Driven by a genuine desire to help others, they naturally build strong interpersonal relationships and thrive in social environments. ENFJs possess an intuitive understanding of emotions and motivations, allowing them to encourage harmony, resolve conflicts, and foster cooperation. Gifted communicators, they skillfully articulate their ideas and values, often inspiring others to pursue a shared vision or common goal. While compassionate and supportive, ENFJs also demonstrate determined leadership when advocating for causes close to their heart.`,
  ESFJ: `ESFJs, known as “The Caregivers,” are warm-hearted, sociable individuals who excel at fostering community and cultivating a sense of belonging. Deeply attuned to the needs and feelings of those around them, they draw on keen emotional intelligence to offer practical help and heartfelt encouragement. ESFJs thrive in cooperative settings where clear roles and traditions guide collective efforts, often organizing events, resources, and people with meticulous attention to detail. Gifted at reading social dynamics, they effortlessly build rapport, mediate conflicts, and motivate teams toward shared goals. Their steadfast sense of duty and loyalty means they follow through on commitments and uphold the values of any group they serve.`,
  ISFJ: `ISFJs, known as “The Defenders,” are dependable, compassionate individuals who thrive on creating stability and comfort for those around them. Guided by a strong sense of responsibility, they quietly observe the needs of others and step in with thoughtful, practical support—often before anyone thinks to ask. ISFJs excel at preserving traditions and honoring shared values, providing a reassuring sense of continuity in families, teams, and communities. Detail-oriented and meticulous, they manage tasks with quiet efficiency, ensuring projects run smoothly and everyone feels included. Their warm empathy and understated diplomacy help ease tensions and foster harmonious relationships, even in stressful situations.`,
  ISTJ: `ISTJs, known as “The Inspectors,” are dependable, organized, and deeply committed to duty and tradition. They approach life methodically, favoring practicality and logic over speculation or abstract theories. ISTJs thrive in structured environments, often developing detailed plans and procedures to manage tasks efficiently. They have a strong sense of responsibility, consistently following through on promises and obligations. Preferring clear rules and standards, ISTJs seek stability and predictability in both their professional and personal lives. Their loyalty, thoroughness, and disciplined nature make them reliable team members and valued leaders who ensure that commitments are always honored and quality standards maintained.`,
  ESTJ: `ESTJs, known as “The Executives,” are decisive, organized leaders who thrive on establishing structure and maintaining order. Grounded in practicality, they tackle challenges with clear logic and a results-oriented mindset, ensuring projects are completed efficiently and on schedule. Their strong sense of duty drives them to honor commitments, uphold traditions, and enforce policies that safeguard group stability. Confident communicators, ESTJs articulate expectations plainly and motivate teams by setting high standards and modeling consistent work ethic. They excel at spotting inefficiencies and rapidly implementing systematic solutions, often taking charge in crisis situations to restore order.`,
  ENTJ: `ENTJs, known as “The Commanders,” are strategic, determined leaders who excel at turning bold visions into tangible results. Visionary yet pragmatic, they rapidly assess complex situations, pinpoint inefficiencies, and craft long-range plans that maximize growth and efficiency. With confident communication and persuasive charisma, ENTJs articulate clear objectives, delegate effectively, and galvanize teams to embrace ambitious challenges. They prize competence and logical reasoning, holding themselves - and everyone around them - to uncompromising performance standards. Energized by competition and measurable progress, ENTJs thrive in fast-paced environments where innovation and decisive action drive success.`
 };