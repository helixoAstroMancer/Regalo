const canvas = document.getElementById('sunCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

/* Configuracion(No toques nada no queremos errores) */
const params = {
  stemColor: '#2e7d32',
  stemWidth: 20,
  leafColor: '#4aab48',
  leafVeinColor: '#2e7d32',
  petalInner: '#f2b900',
  petalOuter: '#ffd84a',
  centerDark: '#52341f',
  centerLight: '#7b4828',
  petalCount: 80,    
  petalLength: 170,
  petalWidth: 48,
  seedsCount: 800,           
  seedSize: 3,
  growthDuration: 7000,      
  petalStagger: 30,         
  leafCount: 4
};

/* animacion - recuerda hacerlo bailar como grud XD */
const startTime = performance.now();
let lastTime = startTime;

function lerp(a,b,t){ return a + (b-a)*t; }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function getFlowerBase() {
  // base y cabeza
  const w = window.innerWidth;
  const h = window.innerHeight;
  const baseX = w * 0.5;
  const baseY = h * 0.92;
  return { baseX, baseY };
}

/* viento */
function windOffset(t, scale=1) {
  return Math.sin(t * 0.0009) * 6 * scale + Math.sin(t * 0.0027) * 3 * scale;
}

/* tallo */
function drawStem(cx, baseY, growT, tNow) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const fullHeight = Math.min(window.innerHeight * 0.45, 520);
  const height = fullHeight * growT;
  const controlOffsetX = 120 * (1 - growT) + 20 * growT;
  const topY = baseY - height;
  const sway = windOffset(tNow, 2) * (2 - growT*0.2);

  ctx.strokeStyle = params.stemColor;
  ctx.lineWidth = params.stemWidth;
  ctx.beginPath();

  const cp1x = cx - controlOffsetX + sway * 0.6;
  const cp1y = baseY - height * 0.35;
  const cp2x = cx + controlOffsetX * 0.3 + sway * 0.2;
  const cp2y = baseY - height * 0.75;

  ctx.moveTo(cx, baseY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cx + sway, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, params.stemWidth * 0.28);
  ctx.strokeStyle = 'rgba(120,200,120,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx + 3, baseY - 4);
  ctx.bezierCurveTo(cp1x + 3, cp1y - 3, cp2x + 2, cp2y - 2, cx + sway + 2, topY + 6);
  ctx.stroke();
  ctx.restore();
  return { topX: cx + sway, topY };
}

/*hojas*/
function drawLeaf(cx, cy, direction, growT, tNow, idx) {
  ctx.save();

  const length = lerp(70, 170, clamp(growT, 0, 1));
  const width = lerp(28, 82, clamp(growT, 0, 1));
  const phase = idx * 0.6;
  const sway = windOffset(tNow + idx*100, 0.9);

  ctx.translate(cx, cy);
  ctx.rotate(direction * (Math.PI/10) + (sway * 0.006));
  ctx.fillStyle = params.leafColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(direction * length * 0.25, -length*0.25, direction * length*0.8, -length*0.5, direction * length, 0);
  ctx.bezierCurveTo(direction * length*0.8, length*0.5, direction * length*0.25, length*0.25, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(35,90,30,0.18)';
  ctx.beginPath();
  ctx.moveTo(direction * length*0.15, -length*0.05);
  ctx.quadraticCurveTo(direction * length*0.6, -length*0.3, direction * length*0.9, 0);
  ctx.quadraticCurveTo(direction * length*0.6, length*0.25, direction * length*0.15, length*0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = params.leafVeinColor;
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = 0.22;
  const veins = 10;

  for (let i=1;i<=veins;i++){
    const t = i / (veins+1);
    ctx.beginPath();
    ctx.moveTo(direction * length * 0.06, 0);
    const vx = direction * (length * (0.2 + t*0.75));
    const vy = (t - 0.5) * (width*0.8);
    ctx.quadraticCurveTo(direction * length * 0.35, vy*0.25, vx, vy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
/*petalos*/
function drawPetal(cx, cy, angle, progress, idx, tNow) {
  ctx.save();

  const length = params.petalLength * (0.88 + 0.18 * Math.sin(idx*1.3));
  const width = params.petalWidth * (0.85 + 0.35 * Math.cos(idx*0.9));
  const open = Math.pow(progress, 0.9);
  const wind = windOffset(tNow + idx*50, 0.6);
  const rot = angle + (wind * 0.006) * (1 - open*0.2);

  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const grad = ctx.createLinearGradient(0, -length*0.1, 0, -length);
  grad.addColorStop(0, shade(params.petalInner, -8));
  grad.addColorStop(0.5, params.petalInner);
  grad.addColorStop(1, params.petalOuter);

  ctx.fillStyle = grad;

  const p0 = {x: 0, y: 0};
  const p1 = {x: width * 0.25, y: -length * (0.25 + 0.1*(1-open)) * open};
  const p2 = {x: width * 0.6, y: -length * (0.6 + 0.15*(1-open)) * open};
  const p3 = {x: 0, y: -length * open};
  const p2b = {x: -width * 0.6, y: -length * (0.6 + 0.15*(1-open)) * open};
  const p1b = {x: -width * 0.25, y: -length * (0.25 + 0.1*(1-open)) * open};

  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  ctx.bezierCurveTo(p2b.x, p2b.y, p1b.x, p1b.y, p0.x, p0.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.moveTo(p0.x + 2, p0.y + 2);
  ctx.bezierCurveTo(p1.x + 2, p1.y + 2, p2.x + 2, p2.y + 2, p3.x + 2, p3.y + 2);
  ctx.bezierCurveTo(p2b.x + 2, p2b.y + 2, p1b.x + 2, p1b.y + 2, p0.x + 2, p0.y + 2);
  ctx.closePath();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.12;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(2, -length*0.4, 0, -length*0.85*open);
  ctx.stroke();
  ctx.restore();
}

function shade(hex, amt){
  const c = hex.replace('#','');
  const num = parseInt(c,16);
  let r = (num >> 16) + amt;
  let g = (num >> 8 & 0x00FF) + amt;
  let b = (num & 0x0000FF) + amt;
  r = clamp(Math.round(r), 0, 255);
  g = clamp(Math.round(g), 0, 255);
  b = clamp(Math.round(b), 0, 255);
  return `rgb(${r},${g},${b})`;
}

/* centro */
function drawSeeds(cx, cy, seedCount, radiusMax, tNow) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < seedCount; i++) {
    const a = i * golden;
    const r = Math.sqrt(i / seedCount) * radiusMax;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const rot = a * 0.8 + (Math.sin(tNow*0.002 + i*0.01) * 0.1);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const shadeAmt = -8 + (i%7 - 3) * 2;
    ctx.fillStyle = shade(params.centerDark, shadeAmt);
    ctx.beginPath();
    ctx.ellipse(0, 0, params.seedSize * (0.7 + (i%3)*0.15), params.seedSize * (1.2 - (i%5)*0.08), 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(-0.4, -0.6, 0.5, 0.25, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, radiusMax*0.25, cx, cy, radiusMax*1.02);
  g.addColorStop(0, 'rgba(0,0,0,0.06)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radiusMax*1.02, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

/* Maestro cantee */
function animate(tNow) {
  const elapsed = tNow - startTime;
  const total = params.growthDuration;
  const growT = clamp(elapsed / total, 0, 1);

  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { baseX, baseY } = getFlowerBase();

  ctx.save();
  ctx.fillStyle = 'rgba(40, 30, 20, 0.06)';
  ctx.beginPath();
  ctx.ellipse(baseX, baseY + 6, 220, 24, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
  /*preguntale a chat gpt >:( el hizo esta parte */
  const eased = easeOutCubic(growT);
  const stem = drawStem(baseX, baseY, eased, tNow);
  const leafAppearT = clamp((elapsed - 500) / (total * 0.6), 0, 1);
  const maxLeaves = params.leafCount;
  for (let i = 0; i < maxLeaves; i++) {
    const frac = i / (maxLeaves - 1 || 1);
    const leafGrowLocal = clamp((elapsed - 400 - i*180) / 1200, 0, 1);
    const ly = baseY - eased * (Math.min(window.innerHeight*0.45,520)) * (0.25 + 0.6 * frac);
    const lx = baseX + (Math.sin(frac * 3.2 + tNow*0.0006) * 8) * (1 - eased*0.1);
    const direction = (i % 2 === 0) ? -1 : 1;
    drawLeaf(lx, ly, direction, leafGrowLocal * eased, tNow, i);
  }

  // 3) Flower head: center point (top of stem) is where head will be
  const headX = stem.topX;
  const headY = stem.topY;

  // 4) Petals: each petal opens with its own delay
  const petalBaseDelay = 1200; // start opening after this ms
  for (let i = 0; i < params.petalCount; i++) {
    // per-petal timing staggered
    const petalStart = petalBaseDelay + i * params.petalStagger;
    const localElapsed = elapsed - petalStart;
    const petalProgress = clamp(localElapsed / 800, 0, 1);
    const angle = (i / params.petalCount) * Math.PI * 2;
    drawPetal(headX, headY, angle, petalProgress, i, tNow);
  }

  const seedsStart = petalBaseDelay + params.petalCount * params.petalStagger * 0.65;
  if (elapsed > seedsStart) {

    const radiusMax = params.petalLength * 0.52 * 0.95;
    const seedProgress = clamp((elapsed - seedsStart) / 900, 0, 1);
  
    ctx.save();
    const centerR = Math.max(18, 38 * seedProgress);
    const ringGrad = ctx.createRadialGradient(headX, headY, centerR*0.2, headX, headY, radiusMax*1.05);
    
    ringGrad.addColorStop(0, params.centerLight);
    ringGrad.addColorStop(0.55, params.centerDark);
    ringGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
    
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(headX, headY, radiusMax*1.02 * seedProgress, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    const countNow = Math.floor(params.seedsCount * seedProgress);
    drawSeeds(headX, headY, countNow, radiusMax * seedProgress, tNow);
  }

  ctx.save();
  const vgrad = ctx.createRadialGradient(baseX, baseY - (Math.min(window.innerHeight*0.45,520) * eased) - 10, 20,
  baseX, baseY, Math.max(window.innerWidth, window.innerHeight) * 0.9);
  vgrad.addColorStop(0, 'rgba(255,255,255,0.0)');
  vgrad.addColorStop(1, 'rgba(220,220,220,0.06)');
  ctx.fillStyle = vgrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();

  if (growT >= 0.999) {
    showPoem();
  }

  requestAnimationFrame(animate);
}

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
let poemShown = false;
function showPoem() {
  requestAnimationFrame(()=> {
  });
}

requestAnimationFrame(animate);


/* poema */

window.addEventListener('DOMContentLoaded', () => {
  const poem = document.getElementById('poem');
  const toggleBtn = document.getElementById('togglePoem');

  setTimeout(() => {
    poem.classList.add('visible');
  }, params.growthDuration + 2000);

  setTimeout(() => {
    toggleBtn.style.display = 'block';
  }, params.growthDuration);

  toggleBtn.addEventListener('click', () => {
    poem.classList.toggle('visible');
  });
});
