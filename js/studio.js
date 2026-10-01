/* ---------- studio: dials set targets, the panel measures, the visitor rewrites ---------- */
(function(){
"use strict";
var root = document.getElementById("studio"); if(!root) return;
/* the same maths as How a sentence lands, so both give the same numbers */
var ABBR = ["mr","mrs","ms","dr","prof","st","vs","etc","e.g","i.e","no","vol","pp","fig","al","inc","ltd","co","jr","sr"];
function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function splitSentences(text){
  text = text.replace(/(\d)\.(\d)/g, "$1<DOT>$2");
  ABBR.forEach(function(a){ text = text.replace(new RegExp("(^|[^\\w])("+esc(a)+")\\.", "gi"), "$1$2<DOT>"); });
  var parts = text.split(/(?<=[.!?])["'\u201d\u2019)\]]?\s+(?=["'\u201c\u2018(]?[A-Z0-9])/);
  return parts.map(function(p){ return p.replace(/<DOT>/g,".").trim(); }).filter(function(p){ return p && /[A-Za-z0-9]/.test(p); });
}
var WORD = /[A-Za-z0-9]+(?:['\u2019\-][A-Za-z0-9]+)*/g;
function wordsIn(s){ return s.match(WORD) || []; }
function stats(lengths){
  var n = lengths.length; if(!n) return null;
  var mean = lengths.reduce(function(a,b){return a+b;},0)/n;
  var sd = Math.sqrt(lengths.reduce(function(a,x){return a+(x-mean)*(x-mean);},0)/n);
  var ac = null;
  if(n>=3){ var den = lengths.reduce(function(a,x){return a+(x-mean)*(x-mean);},0);
    if(den===0){ ac = 0; } else { var num=0; for(var i=0;i<n-1;i++){ num += (lengths[i]-mean)*(lengths[i+1]-mean); } ac = num/den; } }
  return {n:n, words:lengths.reduce(function(a,b){return a+b;},0), mean:mean, cv: mean? sd/mean : 0, ac:ac};
}
function escHtml(s){ return s.replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
/* end focus: a sentence that closes on one of these hands its last beat to a function word */
var FUNC = {}; ("a an the this that these those it its they them their theirs he him his she her hers we us our ours you your yours i me my mine " +
  "of to in on at by for with from up out off over under about into onto upon as than then so too also and but or nor yet if " +
  "is are was were be been being am do does did done have has had will would shall should can could may might must not no " +
  "there here which who whom whose what when where why how one ones all some any each every much many more most very just only well now again " +
  "though although while whereas because until unless").split(" ").forEach(function(w){ FUNC[w] = 1; });
/* voice palettes: my own, after the twelve archetypes in Mark and Pearson (2001) */
var ARCH = [
  ["Innocent","simple pure honest clean fresh natural trust safe good gentle easy bright calm wholesome clear authentic candid cheerful decent earnest genuine happy harmony"],
  ["Explorer","discover explore wander travel frontier open free road path horizon beyond route wild roam trail escape"],
  ["Sage","know truth evidence research understand learn study reason fact source analysis data measure prove method expert wisdom rigour clarity"],
  ["Hero","win strong courage challenge fight master champion beat overcome push goal perform achieve tough grit victory"],
  ["Outlaw","break rebel defy radical raw overturn refuse rogue outsider dare riot shake burn upend rattle revolt"],
  ["Magician","magic change vision imagine dream spark possible reveal wonder alchemy shift catalyst ritual mystery"],
  ["Regular Guy/Gal","everyone people real plain practical ordinary together everyday fair friend neighbour team belong common straight"],
  ["Lover","love beauty beautiful desire intimate warm sensual touch close rich luxury indulge elegant adore heart romance"],
  ["Jester","fun play laugh joke silly enjoy wit cheeky lark grin mischief party bounce giggle"],
  ["Caregiver","care help support protect comfort nurture kind heal serve patient family shelter tend"],
  ["Creator","create make build design invent original idea compose shape draft prototype author studio sketch form"],
  ["Ruler","lead leader control order standard rule command govern authority stable secure manage system policy power responsible"]
].map(function(a){ return {name:a[0], stems:a[1].split(" ")}; });
/* cues per archetype: a mark colour for the tape, swatches, a register, a sound and a tone note (working notes, not measurements) */
var CUES = {
  "Innocent":{col:"#3f93cf", sw:["#ffffff","#6ab7e8","#f7e38a","#a8e6cf"], reg:"Plain", sound:"Light bells and glockenspiel, bright major chords", tone:"Optimistic, simple, transparent. Short sentences, gentle directness, plain honesty."},
  "Explorer":{col:"#c25400", sw:["#8a6a4a","#355e3b","#cc5500","#5f6b73"], reg:"Vivid", sound:"Driving percussion, raw acoustic strings, wind and gravel", tone:"Restless, daring, energetic. Verbs of motion and discovery, open space, a push past the comfort zone."},
  "Sage":{col:"#1f3a5f", sw:["#b8bec4","#8a95a0","#1f3a5f","#5d6b7a"], reg:"Formal", sound:"Minimalist electronics, precise Bach, crisp narration, no heavy percussion", tone:"Knowledgeable, objective, articulate. Data, insight and proof over emotion, in the voice of a trusted expert."},
  "Hero":{col:"#c62828", sw:["#d62828","#111111","#aab2b8","#2a4bb5"], reg:"Bold", sound:"Driving guitars, fast percussion, soaring brass, heartbeat tempos", tone:"Motivating, bold, direct. Action verbs, grit, and the overcoming of obstacles."},
  "Outlaw":{col:"#6d9a00", sw:["#1a1a1a","#a4d600","#ff2e93","#c1121f"], reg:"Bold", sound:"Heavy metal, distorted bass, industrial noise, sudden beat drops", tone:"Disruptive, provocative, unapologetic. Blunt, forceful phrasing aimed at broken or boring systems."},
  "Magician":{col:"#6a3fb5", sw:["#4b1f7a","#3f3d99","#141b4d","#c8ccd6"], reg:"Vivid", sound:"Ethereal synths, reverse delays, chimes, low vibrating hums", tone:"Charismatic and mystical. Expansive language, the turn from a pain point to a suddenly right answer."},
  "Regular Guy/Gal":{col:"#3b5b8c", sw:["#3b5b8c","#8b5e3c","#d9a520","#2f5d3a"], reg:"Plain", sound:"Folk and upbeat acoustic indie, unpolished voiceovers, everyday ambience", tone:"Friendly, pragmatic, unpretentious. Talks like a peer, in conversational rhythm, without jargon or airs."},
  "Lover":{col:"#9b111e", sw:["#9b111e","#6d1a2e","#b76e79","#f2c6c2"], reg:"Vivid", sound:"Smooth R&B, slow jazz, solo cello, close-mic’d breath", tone:"Intimate, sensual, passionate. A hushed, exclusive tone with evocative adjectives and slow pacing."},
  "Jester":{col:"#e0246f", sw:["#f5d90a","#8fd000","#ff3d8b","#ff6a00"], reg:"Plain", sound:"Upbeat pop, boings and whistles, record scratches, bouncy rhythms", tone:"Playful, punchy, irreverent. Unexpected contrasts, self-mockery, humour aimed at the industry’s own absurdity."},
  "Caregiver":{col:"#2f8f7c", sw:["#8fb8de","#6cc4b0","#f5efe6","#f4b6c2"], reg:"Plain", sound:"Soft acoustic guitar, gentle piano, warm ambient tones, unhurried tempos", tone:"Warm, reassuring, gentle. Leans on “you” and “we”, with soft words that imply safety and steady support."},
  "Creator":{col:"#e8702a", sw:["#f0712a","#c2185b","#00a8c6","#7b3fe4"], reg:"Vivid", sound:"Synth mixed with acoustic, building rhythms, textured soundscapes", tone:"Visionary, expressive, inspiring. Active verbs and sensory language, with the focus on making something new."},
  "Ruler":{col:"#9a7400", sw:["#14213d","#c9a227","#c9ccd1","#0b0b0b"], reg:"Formal", sound:"Orchestral brass, classical strings, deep voiceover, steady percussion", tone:"Authoritative, refined, definitive. No slang and no casual contractions. Imperatives, and facts stated without over-explaining."}
};
/* timbre per archetype for Play: oscillator shape and filter cutoff */
var AUD = {"Innocent":{w:"sine",c:3000},"Explorer":{w:"triangle",c:1800},"Sage":{w:"sine",c:2400},"Hero":{w:"sawtooth",c:3200},"Outlaw":{w:"square",c:1300},"Magician":{w:"sine",c:2000},
  "Regular Guy/Gal":{w:"triangle",c:1600},"Lover":{w:"triangle",c:700},"Jester":{w:"square",c:2800},"Caregiver":{w:"sine",c:1100},"Creator":{w:"sawtooth",c:2200},"Ruler":{w:"sawtooth",c:900}};
var NAMEIX = {}; ARCH.forEach(function(a, i){ NAMEIX[a.name] = i; });
function archOf(word){ var w = word.toLowerCase(), hit = [];
  ARCH.forEach(function(a,i){ for(var k=0;k<a.stems.length;k++){ var st = a.stems[k]; if(st.length < 4 ? w === st : w.indexOf(st) === 0){ hit.push(i); break; } } });
  var lf = typeof LEXFORMS !== "undefined" && LEXFORMS[w]; if(lf) Object.keys(lf).forEach(function(nm){ var ix = NAMEIX[nm]; if(ix != null && hit.indexOf(ix) < 0) hit.push(ix); });
  return hit; }
/* ---------- knobs: a glass disc inside a value ring; a ghost pointer shows where the text sits ---------- */
var svgDefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  '<radialGradient id="stDisc" cx="38%" cy="28%" r="85%"><stop offset="0" stop-color="#3d524a"/><stop offset=".55" stop-color="#18261f"/><stop offset="1" stop-color="#0b1511"/></radialGradient>' +
  '</defs></svg>';
root.insertAdjacentHTML("afterbegin", svgDefs);
var knobs = {}, C = 60;
function P(r, a){ var t = a * Math.PI / 180; return [C + Math.sin(t) * r, C - Math.cos(t) * r]; }
function arcPath(r, a1, a2){ if(Math.abs(a2 - a1) < .5) a2 = a1 + .5; var s = P(r, a1), e = P(r, a2), large = Math.abs(a2 - a1) > 180 ? 1 : 0, sweep = a2 > a1 ? 1 : 0;
  return "M" + s[0].toFixed(2) + " " + s[1].toFixed(2) + " A" + r + " " + r + " 0 " + large + " " + sweep + " " + e[0].toFixed(2) + " " + e[1].toFixed(2); }
function trimNum(v){ var s = (Math.round(v * 100) / 100).toString(); return s.replace(/^(-?)0\./, "$1."); }
function knobSVG(k){
  var g = P(39, 0);
  return '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="k-halo" cx="60" cy="60" r="52"/>' +
    '<path class="k-track" d="' + arcPath(47, -135, 135) + '" fill="none"/><path class="k-val" d="" fill="none"/>' +
    '<path class="k-arc" d="" stroke-opacity="0"/>' +
    '<g class="kr"><circle cx="60" cy="60" r="31" fill="url(#stDisc)" stroke="#ffffff" stroke-opacity=".2" stroke-width="1"/>' +
    '<circle cx="60" cy="60" r="25" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="1"/>' +
    '<line class="k-ptr" x1="60" y1="33" x2="60" y2="46" stroke-width="3.6" stroke-linecap="round"/></g>' +
    '<circle class="k-ghost" cx="' + g[0].toFixed(1) + '" cy="' + g[1].toFixed(1) + '" r="3.6" fill="none" style="display:none"/></svg>';
}
function makeKnob(el, onChange){
  var d = el.dataset, k = {el:el, key:d.k, min:+d.min, max:+d.max, step:+d.step, val:+d.val, dp:+(d.dp||0), names:d.names ? d.names.split(",") : null, onChange:onChange, readVal:null, state:0};
  var isOut = d.live != null, isMix = !!d.mix;
  el.innerHTML = '<span class="knob-l">' + escHtml(d.label) + '</span>' + knobSVG(k) + '<span class="knob-v"></span><span class="knob-r"><span class="sy-lamp"></span><span class="knob-rt"></span></span>';
  el.tabIndex = 0; el.setAttribute("role","slider"); el.setAttribute("aria-label", d.label + (isOut || isMix ? "" : " target"));
  el.setAttribute("aria-valuemin", k.min); el.setAttribute("aria-valuemax", k.max);
  k.rot = el.querySelector(".kr"); k.v = el.querySelector(".knob-v"); k.lamp = el.querySelector(".sy-lamp"); k.rt = el.querySelector(".knob-rt");
  k.arc = el.querySelector(".k-arc"); k.ghost = el.querySelector(".k-ghost"); k.vArc = el.querySelector(".k-val");
  if(!onChange || isOut || isMix){ k.lamp.style.display = "none"; }
  k.ang = function(v){ return -135 + (Math.min(k.max, Math.max(k.min, v)) - k.min) / (k.max - k.min) * 270; };
  function fmt(v){ return (k.names ? k.names[Math.round(v)] : v.toFixed(k.dp)) + (d.unit || ""); }
  k.draw = function(){
    if(k.readVal == null){ k.arc.setAttribute("stroke-opacity","0"); k.ghost.style.display = "none"; return; }
    var a1 = k.ang(k.val), a2 = k.ang(k.readVal), cls = k.state === 2 ? "k-on" : k.state === 1 ? "k-near" : "k-off";
    k.arc.setAttribute("d", arcPath(39, Math.min(a1, a2), Math.max(a1, a2))); k.arc.setAttribute("stroke-opacity","1"); k.arc.setAttribute("class", "k-arc " + cls);
    var g = P(39, a2); k.ghost.setAttribute("cx", g[0].toFixed(2)); k.ghost.setAttribute("cy", g[1].toFixed(2)); k.ghost.setAttribute("class", "k-ghost " + cls); k.ghost.style.display = "";
  };
  k.set = function(v, quiet){ v = Math.min(k.max, Math.max(k.min, Math.round(v / k.step) * k.step)); k.val = +v.toFixed(4);
    k.rot.setAttribute("transform","rotate(" + k.ang(k.val).toFixed(1) + " 60 60)");
    k.vArc.setAttribute("d", arcPath(47, -135, k.ang(k.val)));
    k.v.textContent = (k.names || isOut || isMix ? "" : "Target ") + fmt(k.val);
    el.setAttribute("aria-valuenow", k.val); el.setAttribute("aria-valuetext", fmt(k.val));
    k.draw(); if(!quiet && k.onChange) k.onChange(); };
  /* turning: grab anywhere on the dial with a mouse, or the knob itself with a finger; drag up or right to raise */
  var sx = 0, sy = 0, sv = 0, drag = false, moved = 0, lastTap = 0, svg = el.querySelector("svg"); k.def = k.val;
  el.addEventListener("pointerdown", function(e){
    if(e.pointerType === "touch" && !svg.contains(e.target)) return;
    if(e.button > 0) return;
    drag = true; moved = 0; sx = e.clientX; sy = e.clientY; sv = k.val;
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
    el.classList.add("turning"); e.preventDefault(); el.focus({preventScroll:true}); });
  el.addEventListener("pointermove", function(e){ if(!drag) return;
    var dx = e.clientX - sx, dy = sy - e.clientY; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    var px = e.shiftKey ? 900 : (e.pointerType === "touch" ? 200 : 170);
    k.set(sv + (dx + dy) / px * (k.max - k.min)); });
  function end(e){ if(!drag) return; drag = false; el.classList.remove("turning");
    if(e && e.pointerType === "touch" && moved < 6){ var now = Date.now(); if(now - lastTap < 320){ k.set(k.def); lastTap = 0; } else lastTap = now; } }
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("dblclick", function(e){ k.set(k.def); e.preventDefault(); });
  el.addEventListener("wheel", function(e){ e.preventDefault();
    var span = (k.max - k.min) / k.step, n = e.shiftKey || span <= 40 ? 1 : Math.round(span / 40);
    k.set(k.val + (e.deltaY < 0 || e.deltaX > 0 ? 1 : -1) * n * k.step); }, {passive:false});
  el.addEventListener("keydown", function(e){ var m = {ArrowUp:1, ArrowRight:1, ArrowDown:-1, ArrowLeft:-1, PageUp:10, PageDown:-10}[e.key];
    if(m){ k.set(k.val + m * k.step); e.preventDefault(); } else if(e.key === "Home"){ k.set(k.min); e.preventDefault(); } else if(e.key === "End"){ k.set(k.max); e.preventDefault(); } });
  k.set(k.val, true); knobs[k.key] = k; return k;
}
function reading(k, text, state, num){ if(!k) return; k.rt.textContent = text; k.lamp.className = "sy-lamp" + (state === 2 ? " on" : state === 1 ? " near" : "");
  k.readVal = (num == null || isNaN(num)) ? null : num; k.state = state; k.draw(); }
/* ---------- scope: sentence lengths traced on a phosphor screen ---------- */
var COL = {trace:"#8dffc0", glow:"rgba(125,255,178,.9)", wave:"rgba(255,255,255,.75)"}, scopeWave = false;
var scope = null, scopeRead = null, scopeData = {lens:[], weak:[], target:16, idx:-1};
function drawScope(){
  if(!scope){ scope = document.getElementById("syScope"); scopeRead = document.getElementById("syScopeRead"); if(!scope) return; }
  var dpr = Math.min(2, window.devicePixelRatio || 1), w = scope.clientWidth, h = scope.clientHeight; if(!w || !h) return;
  if(scope.width !== Math.round(w * dpr) || scope.height !== Math.round(h * dpr)){ scope.width = Math.round(w * dpr); scope.height = Math.round(h * dpr); }
  var g = scope.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  var rd = scopeRead ? scopeRead.offsetHeight : 18, top = 22, bot = h - rd - 14, left = 12, right = w - 12, lens = scopeData.lens, n = lens.length;
  g.strokeStyle = "rgba(95,217,154,.12)"; g.lineWidth = 1;
  for(var gx = 0; gx <= 8; gx++){ var x = left + (right - left) * gx / 8; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke(); }
  for(var gy = 0; gy <= 4; gy++){ var y = top + (bot - top) * gy / 4; g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke(); }
  var mx = Math.max(30, scopeData.target + 4, Math.max.apply(null, lens.concat([0])) + 2), Y = function(v){ return bot - (bot - top) * v / mx; };
  g.setLineDash([4, 4]); g.strokeStyle = "rgba(255,179,71,.75)"; g.beginPath(); g.moveTo(left, Y(scopeData.target)); g.lineTo(right, Y(scopeData.target)); g.stroke(); g.setLineDash([]);
  if(n){
    var X = function(i){ return n === 1 ? (left + right) / 2 : left + (right - left) * i / (n - 1); };
    g.shadowColor = COL.glow; g.shadowBlur = 8; g.strokeStyle = COL.trace; g.lineWidth = 2; g.beginPath();
    lens.forEach(function(v, i){ if(i === 0) g.moveTo(X(i), Y(v)); else g.lineTo(X(i), Y(v)); }); g.stroke();
    lens.forEach(function(v, i){ g.fillStyle = scopeData.weak[i] ? "#ff6a3d" : "#d7ffe9"; g.shadowColor = scopeData.weak[i] ? "rgba(255,106,61,.9)" : COL.glow; g.beginPath(); g.arc(X(i), Y(v), scopeData.idx === i ? 4.2 : 2.6, 0, Math.PI * 2); g.fill(); });
    if(scopeData.idx >= 0){ var cx = X(scopeData.idx); g.shadowBlur = 12; g.strokeStyle = "rgba(215,255,233,.55)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, bot); g.stroke(); }
    g.shadowBlur = 0;
  }
  if(scopeWave && synth){
    var an = synth.analyser, wb = drawScope.buf || (drawScope.buf = new Uint8Array(an.fftSize)); an.getByteTimeDomainData(wb);
    g.save(); g.shadowColor = COL.wave; g.shadowBlur = 6; g.strokeStyle = COL.wave; g.globalAlpha = .85; g.lineWidth = 1.4; g.beginPath();
    var mid = (top + bot) / 2, amp = (bot - top) * .9;
    for(var xi = 0; xi < 256; xi++){ var sv = (wb[Math.floor(xi * wb.length / 256)] - 128) / 128, px = left + (right - left) * xi / 255, py = mid - sv * amp; if(xi === 0) g.moveTo(px, py); else g.lineTo(px, py); }
    g.stroke(); g.restore();
  }
}
window.addEventListener("resize", function(){ drawScope(); });
if("IntersectionObserver" in window){ var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ root.classList.add("powered"); io.disconnect(); } }); }, {threshold:.25}); io.observe(root); } else root.classList.add("powered");
/* ---------- archetype selection and blend ---------- */
var archBox = document.getElementById("syArch"), mixBox = document.getElementById("syMix"), sel = [10, 2]; /* Creator and Sage by default */
var mix = {};
function drawArch(){
  archBox.innerHTML = "";
  ARCH.forEach(function(a, i){ var b = document.createElement("button"); b.type = "button"; b.innerHTML = '<span class="lp" aria-hidden="true"></span><span class="eb" aria-hidden="true"><img src="images/emblems/' + EMB[a.name] + '.svg" alt="" width="22" height="22" decoding="async"></span><span class="nm">' + escHtml(a.name) + '</span>';
    var on = sel.indexOf(i) >= 0; b.setAttribute("aria-pressed", on ? "true" : "false"); b.style.setProperty("--ac", CUES[a.name].col); b.title = CUES[a.name].reg + " register. " + (LEXLIST[a.name] ? LEXLIST[a.name].length : 0) + " words of its own.";
    if(!on && sel.length >= 3) b.disabled = true;
    b.addEventListener("click", function(){ var p = sel.indexOf(i); if(p >= 0) sel.splice(p,1); else if(sel.length < 3) sel.push(i); drawArch(); drawMix(); run(); synthFx("rocker"); previewSoon(); });
    archBox.appendChild(b); });
}
function drawMix(){
  mixBox.innerHTML = "";
  sel.forEach(function(i, n){ var d = document.createElement("div"); d.className = "knob"; d.dataset.k = "mix" + i; d.dataset.mix = "1";
    d.dataset.label = ARCH[i].name; d.dataset.min = 0; d.dataset.max = 10; d.dataset.step = 1; d.dataset.val = mix[i] != null ? mix[i] : (n === 0 ? 6 : 4); d.dataset.dp = 0;
    mixBox.appendChild(d); makeKnob(d, function(){ mix[i] = knobs["mix"+i].val; schedule(); previewSoon(); }); mix[i] = knobs["mix"+i].val; });
  if(!sel.length){ var p = document.createElement("p"); p.className = "sy-mixnote"; p.textContent = "Choose up to three archetypes, then blend them."; mixBox.appendChild(p); }
}
/* ---------- analysis ---------- */
/* ---------- the engine: the dials rewrite the text by rule, live, for every visitor ---------- */
/* ---------- the lexicons: every archetype chooses its own words for the same slot ---------- */
/* Each row is one slot of ordinary copy. "src" are the words it reads; each archetype then offers its own word for that slot,
   or none. Verbs are written as a base form and inflected by rule ("equip:equipped:equipping" marks an irregular),
   nouns as a singular. A "!" as the word means: drop the word. Guards keep a swap to the sense it was written for. */
var LEX = [
  /* verbs */
  {p:"v", src:["use"], skip:["to"], alt:{Sage:"apply", Ruler:"deploy", Hero:"wield", "Regular Guy/Gal":"lean on"}},
  {p:"v", src:["help"], g:"hw", alt:{Caregiver:"support", Sage:"assist", Hero:"back"}},
  {p:"v", src:["make:makes:made:making"], g:"np", alt:{Creator:"build:builds:built:building", Magician:"conjure"}},
  {p:"v", src:["get:gets:got:getting"], g:"np", alt:{Hero:"win:wins:won:winning", Explorer:"reach", Ruler:"secure", "Regular Guy/Gal":"grab:grabs:grabbed:grabbing", Jester:"snag:snags:snagged:snagging", Outlaw:"seize"}},
  {p:"v", src:["show:shows:showed:showing"], g:"np", alt:{Sage:"demonstrate", Magician:"reveal", Lover:"unveil", Creator:"present"}},
  {p:"v", src:["change"], alt:{Sage:"revise", Outlaw:"upend", Magician:"transmute", "Regular Guy/Gal":"switch", Creator:"reshape"}},
  {p:"v", src:["improve"], alt:{Sage:"refine", Hero:"strengthen", Creator:"rework", Lover:"perfect", Ruler:"upgrade", "Regular Guy/Gal":"polish"}},
  {p:"v", src:["check"], alt:{Sage:"verify:verifies:verified:verifying", Ruler:"audit", "Regular Guy/Gal":"look over", Hero:"test"}},
  {p:"v", src:["choose:chooses:chose:choosing"], alt:{Ruler:"select", Explorer:"pick", Jester:"cherry-pick"}},
  {p:"v", src:["deliver"], alt:{Creator:"produce", Caregiver:"provide", Hero:"land", "Regular Guy/Gal":"hand over", Jester:"serve up"}},
  {p:"v", src:["keep:keeps:kept:keeping"], g:"np", alt:{Sage:"retain", Ruler:"hold:holds:held:holding", "Regular Guy/Gal":"hang on to:hangs on to:hung on to:hanging on to", Lover:"treasure", Caregiver:"safeguard"}},
  {p:"v", src:["start"], skip:["with"], alt:{Explorer:"launch", Hero:"kick off", Jester:"fire up", Ruler:"commence", Magician:"spark"}},
  {p:"v", src:["find:finds:found:finding"], g:"np", skip:["out","that"], alt:{Sage:"identify:identifies:identified:identifying", Explorer:"discover", Outlaw:"dig up:digs up:dug up:digging up", "Regular Guy/Gal":"track down", Magician:"uncover"}},
  {p:"v", src:["need"], skip:["to"], alt:{Ruler:"require", Hero:"demand"}},
  {p:"v", src:["want"], skip:["to"], alt:{Lover:"desire", Explorer:"seek:seeks:sought:seeking"}},
  {p:"v", src:["build:builds:built:building"], alt:{Sage:"develop", Ruler:"establish", Magician:"conjure", Lover:"cultivate", Outlaw:"hammer out"}},
  {p:"v", src:["create"], alt:{Creator:"invent", Magician:"conjure", Sage:"devise", Ruler:"establish", "Regular Guy/Gal":"put together:puts together:put together:putting together"}},
  {p:"v", src:["explain"], alt:{Creator:"illustrate", Sage:"clarify:clarifies:clarified:clarifying", Caregiver:"talk through", "Regular Guy/Gal":"spell out:spells out:spelled out:spelling out", Ruler:"set out:sets out:set out:setting out"}},
  {p:"v", src:["explore"], alt:{Explorer:"scout", Sage:"examine"}},
  {p:"v", src:["learn"], skip:["from","to","that"], alt:{Sage:"study:studies:studied:studying", Explorer:"discover", "Regular Guy/Gal":"pick up:picks up:picked up:picking up"}},
  {p:"v", src:["understand:understands:understood:understanding"], alt:{Sage:"comprehend", Magician:"perceive", "Regular Guy/Gal":"get:gets:got:getting", Caregiver:"see:sees:saw:seeing"}},
  {p:"v", src:["fix"], alt:{Sage:"resolve", "Regular Guy/Gal":"sort out", Ruler:"remedy:remedies:remedied:remedying", Caregiver:"mend"}},
  {p:"v", src:["protect"], alt:{Caregiver:"shelter", Hero:"defend", Ruler:"safeguard"}},
  {p:"v", src:["love"], skip:["to"], alt:{Lover:"adore", Caregiver:"cherish"}},
  {p:"v", src:["enjoy"], alt:{Lover:"savour", Innocent:"delight in", Jester:"lap up:laps up:lapped up:lapping up"}},
  {p:"v", src:["write:writes:wrote:writing"], alt:{Creator:"compose", Sage:"document", Lover:"pen:pens:penned:penning"}},
  {p:"v", src:["reduce"], alt:{"Regular Guy/Gal":"cut:cuts:cut:cutting", Ruler:"curtail", Sage:"lower"}},
  {p:"v", src:["increase"], alt:{Hero:"boost", "Regular Guy/Gal":"bump up:bumps up:bumped up:bumping up", Sage:"raise"}},
  {p:"v", src:["give:gives:gave:giving"], skip:["up","in","back","away"], g:"np", alt:{Ruler:"grant", Caregiver:"offer"}},
  {p:"v", src:["see:sees:saw:seeing"], skip:["also","below","above"], g:"np", alt:{Sage:"observe", Explorer:"spot:spots:spotted:spotting"}},
  {p:"v", src:["travel"], alt:{Explorer:"roam"}},
  {p:"v", src:["run:runs:ran:running"], g:"np", alt:{Ruler:"operate"}},
  {p:"v", src:["transform"], g:"np", alt:{Sage:"convert", Creator:"reshape", Magician:"transmute", Ruler:"overhaul", Hero:"remake:remakes:remade:remaking"}},
  {p:"v", src:["solve"], g:"np", alt:{Sage:"resolve", Magician:"unravel", Hero:"crack", "Regular Guy/Gal":"sort out"}},
  {p:"v", src:["stop"], g:"np", alt:{Outlaw:"kill", Hero:"halt", Ruler:"cease"}},
  {p:"v", src:["ignore"], g:"np", alt:{Outlaw:"defy:defies:defied:defying", Sage:"disregard"}},
  {p:"v", src:["replace"], g:"np", alt:{Outlaw:"rip out:rips out:ripped out:ripping out", Sage:"supersede", Ruler:"substitute", "Regular Guy/Gal":"swap:swaps:swapped:swapping"}},
  /* adjectives */
  {p:"a", src:["good"], skip:["morning","luck","evening","afternoon","night"], alt:{Innocent:"fine", Sage:"sound", Hero:"strong", Ruler:"sterling", "Regular Guy/Gal":"decent", Lover:"lovely", Jester:"ace", Outlaw:"sharp"}},
  {p:"a", src:["great"], alt:{Jester:"brilliant", Lover:"wonderful", Hero:"outstanding", Innocent:"splendid"}},
  {p:"a", src:["big"], alt:{Ruler:"major", Jester:"huge", Explorer:"vast", Outlaw:"massive", Sage:"substantial"}},
  {p:"a", src:["small"], alt:{Sage:"modest", "Regular Guy/Gal":"little", Innocent:"tiny", Jester:"teeny", Ruler:"minor"}},
  {p:"a", src:["new"], alt:{Innocent:"fresh", Creator:"original", Jester:"brand-new", Sage:"novel"}},
  {p:"a", src:["simple"], alt:{Sage:"straightforward", Innocent:"plain", "Regular Guy/Gal":"no-nonsense", Ruler:"uncluttered", Outlaw:"stripped-back"}},
  {p:"a", src:["difficult"], alt:{Sage:"demanding", Hero:"gruelling", "Regular Guy/Gal":"tough", Outlaw:"brutal", Explorer:"testing"}},
  {p:"a", src:["quick"], alt:{Explorer:"swift", Hero:"rapid", Ruler:"prompt", Jester:"zippy", "Regular Guy/Gal":"speedy"}},
  {p:"a", src:["important"], alt:{Sage:"central", Ruler:"paramount", Hero:"decisive", Caregiver:"precious"}},
  {p:"a", src:["strong"], alt:{Hero:"formidable", Ruler:"commanding", Outlaw:"fierce", Caregiver:"steady", Explorer:"hardy"}},
  {p:"a", src:["beautiful"], alt:{Lover:"exquisite", Creator:"striking", Magician:"luminous", Innocent:"lovely", Jester:"gorgeous", Explorer:"majestic"}},
  {p:"a", src:["happy"], alt:{Innocent:"glad", Jester:"chuffed", Caregiver:"content", Lover:"delighted", "Regular Guy/Gal":"pleased"}},
  {p:"a", src:["interesting"], alt:{Explorer:"intriguing", Magician:"curious", Sage:"telling"}},
  {p:"a", src:["different"], skip:["from","to","than"], alt:{Sage:"distinct", Outlaw:"unorthodox", Magician:"uncommon", Jester:"offbeat"}},
  {p:"a", src:["easy"], alt:{"Regular Guy/Gal":"painless", Innocent:"simple"}},
  {p:"a", src:["safe"], skip:["to"], alt:{Ruler:"secure"}},
  {p:"a", src:["honest"], skip:["mistake"], alt:{Innocent:"candid", Outlaw:"blunt", "Regular Guy/Gal":"straight-talking", Sage:"frank"}},
  {p:"a", src:["smart"], alt:{Sage:"astute", "Regular Guy/Gal":"savvy", Creator:"ingenious"}},
  {p:"a", src:["real"], skip:["estate","time","terms","world"], alt:{Innocent:"genuine", "Regular Guy/Gal":"proper", Sage:"actual"}},
  {p:"a", src:["best"], g:"pre", alt:{Lover:"finest", Sage:"optimal", Jester:"tip-top"}},
  {p:"a", src:["boring"], alt:{Outlaw:"stale", "Regular Guy/Gal":"dull", Sage:"tedious"}},
  {p:"a", src:["many"], skip:["of"], alt:{Sage:"numerous", Ruler:"numerous", "Regular Guy/Gal":"loads of", Jester:"oodles of"}},
  {p:"a", src:["friendly"], alt:{Innocent:"kind", Caregiver:"warm", "Regular Guy/Gal":"approachable", Lover:"inviting", Jester:"cheery"}},
  {p:"a", src:["nice"], alt:{Innocent:"sweet", Lover:"lovely", "Regular Guy/Gal":"decent"}},
  {p:"a", src:["normal"], alt:{Outlaw:"conventional", Sage:"standard", "Regular Guy/Gal":"everyday"}},
  {p:"a", src:["attractive"], alt:{Lover:"alluring", Creator:"striking", Ruler:"refined"}},
  {p:"a", src:["surprising"], alt:{Magician:"uncanny", Jester:"cheeky"}},
  /* nouns */
  {p:"n", src:["problem"], alt:{Hero:"challenge", Sage:"question", "Regular Guy/Gal":"snag", Caregiver:"worry:worries", Jester:"hiccup", Magician:"puzzle"}},
  {p:"n", src:["idea"], alt:{Magician:"vision", Creator:"concept", Jester:"brainwave"}},
  {p:"n", src:["goal"], alt:{Ruler:"objective", Explorer:"destination", Hero:"target", "Regular Guy/Gal":"aim"}},
  {p:"n", src:["team"], alt:{"Regular Guy/Gal":"crew", Hero:"squad", Jester:"gang"}},
  {p:"n", src:["customer","client"], alt:{Caregiver:"person you serve:people you serve", "Regular Guy/Gal":"folk:folks", Ruler:"client", Lover:"guest", Jester:"punter"}},
  {p:"n", src:["company"], alt:{Ruler:"enterprise", "Regular Guy/Gal":"outfit", Hero:"firm", Sage:"organisation", Explorer:"venture:ventures"}},
  {p:"n", src:["project"], alt:{Explorer:"expedition", Hero:"mission", Ruler:"programme"}},
  {p:"n", src:["result"], alt:{Ruler:"outcome", Sage:"finding"}},
  {p:"n", src:["story:stories"], alt:{Creator:"narrative", Jester:"yarn", Lover:"tale", Explorer:"saga"}},
  {p:"n", src:["friend"], alt:{"Regular Guy/Gal":"mate", Caregiver:"companion", Jester:"pal"}},
  {p:"n", src:["expert"], alt:{Sage:"specialist", Ruler:"authority:authorities"}},
  {p:"n", src:["approach:approaches"], alt:{Sage:"method", "Regular Guy/Gal":"way", Creator:"technique"}},
  {p:"n", src:["risk"], alt:{Outlaw:"gamble", Explorer:"hazard", Sage:"exposure"}},
  {p:"n", src:["plan"], g:"nn", alt:{Creator:"blueprint", Ruler:"strategy:strategies", Explorer:"route"}},
  {p:"n", src:["tool"], alt:{"Regular Guy/Gal":"kit", Creator:"instrument", Sage:"instrument", Jester:"gizmo"}},
  {p:"n", src:["success:successes"], alt:{Hero:"victory:victories", Ruler:"mastery:masteries"}},
  /* adverbs: intensity cluster, matched by lemma; the formal voices drop the word */
  {p:"r", src:["very","really","extremely","truly"], skip:["the","this","that"], g:"adv", alt:{Sage:"!", Ruler:"!", Innocent:"truly", Explorer:"wildly", Hero:"absolutely", Outlaw:"downright", Magician:"uncannily", "Regular Guy/Gal":"pretty", Lover:"deeply", Jester:"ridiculously", Caregiver:"genuinely", Creator:"strikingly"}},
  {p:"r", src:["quickly"], alt:{Explorer:"swiftly", Hero:"rapidly", Ruler:"promptly", Jester:"in a flash", Magician:"in an instant"}},
  {p:"r", src:["about"], g:"num", alt:{Sage:"approximately", Ruler:"some", "Regular Guy/Gal":"roughly", Jester:"give or take"}}
];
/* further rows live in js/lexicon.js, loaded before this file */
if(typeof LEX_EXTRA !== "undefined") LEX = LEX.concat(LEX_EXTRA);
/* thinner voices get further words from LEX_PATCH; a word already in the row stays */
if(typeof LEX_PATCH !== "undefined") LEX.forEach(function(row){ var add = LEX_PATCH[row.p + ":" + row.src[0].split(":")[0]]; if(add) Object.keys(add).forEach(function(a){ if(!row.alt[a]) row.alt[a] = add[a]; }); });
/* ---------- the engine: lexicon swaps first, then register habits, then the rhythm pass ---------- */
function toSet(s){ var o = {}; s.split(" ").forEach(function(w){ o[w] = 1; }); return o; }
/* words that tell a verb from a noun, read from the word just before */
var NOUNPREV = toSet("a an the this that these those my your our their his her its whose some any no every each another such both all " +
  "of in for with by from on at as about into over under between per via " +
  "big small new good great major minor key main other several few many various recent latest first last next same own whole " +
  "one two three four five six seven eight nine ten hundred thousand " +
  "simple clear solid long short careful detailed single full fresh bold quick rapid slow easy hard");
var NEXTDET = toSet("a an the your our their my his her its this that these those more all some every any each no fewer less better another such both several many");
var SUBJAUX = toSet("is are was were has have had can will would could should may might must means matters comes remains");
var NPEND = toSet("and or but for in on at of from to with by as so that which who where when because than into over under across through about");
var NUMW = toSet("one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty sixty hundred thousand million half");
var LEXNAMES = ["Innocent","Explorer","Sage","Hero","Outlaw","Magician","Regular Guy/Gal","Lover","Jester","Caregiver","Creator","Ruler"];
/* inflection: "base", or "base:3sg:past:ing", or a phrase whose first word is inflected ("lean on") */
function inflV(spec){
  var parts = spec.split(":"); if(parts.length === 4) return parts;
  var sp = spec.split(" "), b = sp[0], rest = sp.length > 1 ? " " + sp.slice(1).join(" ") : "", s, d, g;
  s = /(s|x|z|ch|sh)$/.test(b) ? b + "es" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ies" : b + "s";
  d = /e$/.test(b) ? b + "d" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ied" : b + "ed";
  g = /[^e]e$/.test(b) ? b.slice(0, -1) + "ing" : b + "ing";
  return [b + rest, s + rest, d + rest, g + rest];
}
function inflN(spec){
  var parts = spec.split(":"); if(parts.length === 2) return parts;
  var pl = /(s|x|z|ch|sh)$/.test(spec) ? spec + "es" : /[^aeiou]y$/.test(spec) ? spec.slice(0, -1) + "ies" : spec + "s";
  return [spec, pl];
}
/* thesaurus: further candidates per word and voice, each screened against the Tier 1 and Tier 2 lists; the first is the default.
   SCREEN lists natural words the house lists flag, shown to the visitor as left out on purpose. A choice is kept per word and voice, never rotated (elegant variation is a tell). */
var MORE = {"use|Sage": ["employ"], "use|Ruler": ["employ"], "use|Hero": ["command"], "use|Regular Guy/Gal": ["rely on"], "help|Caregiver": ["guide"], "help|Sage": ["aid"], "help|Hero": ["stand with"], "make|Creator": ["shape"], "make|Magician": ["summon"], "get|Hero": ["earn", "claim"], "get|Explorer": ["find"], "get|Ruler": ["obtain"], "get|Regular Guy/Gal": ["pick up"], "get|Jester": ["bag"], "get|Outlaw": ["take"], "show|Sage": ["illustrate"], "show|Magician": ["unveil"], "show|Lover": ["present"], "show|Creator": ["display"], "change|Sage": ["amend"], "change|Outlaw": ["overturn"], "change|Magician": ["transform"], "change|Regular Guy/Gal": ["swap"], "change|Creator": ["remould"], "improve|Sage": ["sharpen"], "improve|Hero": ["reinforce"], "improve|Creator": ["polish"], "improve|Lover": ["refine"], "improve|Ruler": ["advance"], "check|Sage": ["confirm"], "check|Ruler": ["inspect"], "check|Regular Guy/Gal": ["go over"], "check|Hero": ["inspect"], "choose|Explorer": ["opt for"], "choose|Jester": ["hand-pick"], "deliver|Creator": ["generate"], "deliver|Caregiver": ["supply"], "deliver|Regular Guy/Gal": ["pass on"], "deliver|Jester": ["dish up"], "keep|Sage": ["preserve"], "keep|Ruler": ["maintain"], "keep|Regular Guy/Gal": ["hold on to"], "keep|Lover": ["cherish"], "start|Explorer": ["begin"], "start|Hero": ["get going"], "start|Jester": ["crank up"], "start|Ruler": ["initiate"], "start|Magician": ["ignite"], "find|Sage": ["locate"], "find|Explorer": ["uncover"], "find|Outlaw": ["unearth"], "find|Magician": ["unearth"], "need|Ruler": ["demand"], "need|Hero": ["call for"], "want|Lover": ["crave"], "want|Explorer": ["chase"], "build|Sage": ["construct"], "build|Ruler": ["set up"], "build|Magician": ["summon"], "build|Lover": ["grow"], "build|Outlaw": ["knock together"], "create|Creator": ["originate"], "create|Magician": ["summon"], "create|Sage": ["design"], "create|Ruler": ["set up"], "create|Regular Guy/Gal": ["knock together"], "explain|Creator": ["show"], "explain|Sage": ["spell out"], "explain|Caregiver": ["walk through"], "explain|Regular Guy/Gal": ["lay out"], "explain|Ruler": ["state"], "explore|Explorer": ["survey"], "explore|Sage": ["study"], "understand|Sage": ["grasp"], "understand|Magician": ["discern"], "understand|Regular Guy/Gal": ["follow"], "understand|Caregiver": ["appreciate"], "fix|Sage": ["correct"], "fix|Regular Guy/Gal": ["patch up"], "fix|Ruler": ["rectify"], "fix|Caregiver": ["repair"], "protect|Caregiver": ["guard"], "protect|Hero": ["shield"], "protect|Ruler": ["secure"], "protect|Sage": ["conserve"], "love|Lover": ["treasure"], "love|Caregiver": ["value"], "enjoy|Lover": ["relish"], "enjoy|Innocent": ["take pleasure in"], "enjoy|Jester": ["revel in"], "write|Creator": ["draft"], "write|Sage": ["record"], "write|Lover": ["inscribe"], "reduce|Regular Guy/Gal": ["trim"], "reduce|Sage": ["decrease"], "increase|Hero": ["lift"], "increase|Regular Guy/Gal": ["push up"], "increase|Sage": ["expand"], "give|Caregiver": ["extend"], "see|Sage": ["notice"], "travel|Explorer": ["wander"], "run|Ruler": ["manage"], "transform|Sage": ["adapt"], "transform|Creator": ["remould"], "transform|Magician": ["transfigure"], "transform|Ruler": ["restructure"], "transform|Hero": ["rebuild"], "solve|Sage": ["settle"], "solve|Magician": ["untangle"], "solve|Regular Guy/Gal": ["iron out"], "stop|Outlaw": ["shut down"], "stop|Hero": ["block"], "stop|Ruler": ["end"], "ignore|Outlaw": ["flout"], "ignore|Sage": ["overlook"], "replace|Outlaw": ["tear out"], "replace|Ruler": ["exchange"], "replace|Regular Guy/Gal": ["switch"], "good|Hero": ["firm"], "good|Regular Guy/Gal": ["proper"], "good|Jester": ["cracking"], "good|Sage": ["reliable"], "great|Jester": ["smashing"], "great|Lover": ["marvellous"], "great|Hero": ["superb"], "great|Innocent": ["lovely"], "big|Ruler": ["large"], "big|Jester": ["whopping"], "big|Explorer": ["broad"], "big|Outlaw": ["hefty"], "big|Sage": ["sizeable"], "small|Sage": ["slight"], "small|Regular Guy/Gal": ["tiny"], "small|Innocent": ["little"], "small|Jester": ["pint-sized"], "small|Ruler": ["slight"], "new|Creator": ["fresh"], "new|Sage": ["recent"], "simple|Sage": ["uncomplicated"], "simple|Innocent": ["clear"], "simple|Regular Guy/Gal": ["down-to-earth"], "simple|Outlaw": ["bare-bones"], "difficult|Sage": ["exacting"], "difficult|Hero": ["punishing"], "difficult|Regular Guy/Gal": ["hard"], "quick|Explorer": ["fleet"], "quick|Hero": ["brisk"], "quick|Ruler": ["immediate"], "quick|Jester": ["nippy"], "quick|Regular Guy/Gal": ["snappy"], "important|Sage": ["key"], "important|Hero": ["critical"], "important|Caregiver": ["dear"], "strong|Hero": ["mighty"], "strong|Caregiver": ["sturdy"], "strong|Explorer": ["tough"], "beautiful|Lover": ["graceful"], "beautiful|Creator": ["arresting"], "beautiful|Magician": ["radiant"], "beautiful|Innocent": ["pretty"], "beautiful|Explorer": ["grand"], "happy|Innocent": ["cheerful"], "happy|Lover": ["thrilled"], "happy|Regular Guy/Gal": ["glad"], "interesting|Explorer": ["absorbing"], "interesting|Sage": ["instructive"], "different|Sage": ["separate"], "different|Outlaw": ["unconventional"], "different|Magician": ["unusual"], "different|Jester": ["quirky"], "easy|Regular Guy/Gal": ["simple"], "easy|Innocent": ["straightforward"], "safe|Ruler": ["sound"], "honest|Innocent": ["open"], "honest|Outlaw": ["plain-spoken"], "honest|Regular Guy/Gal": ["upfront"], "honest|Sage": ["direct"], "smart|Sage": ["shrewd"], "smart|Creator": ["clever"], "real|Innocent": ["true"], "best|Lover": ["prime"], "best|Ruler": ["foremost"], "best|Jester": ["first-rate"], "boring|Outlaw": ["flat"], "boring|Regular Guy/Gal": ["dreary"], "boring|Sage": ["monotonous"], "many|Regular Guy/Gal": ["plenty of"], "many|Jester": ["heaps of"], "many|Ruler": ["multiple"], "friendly|Innocent": ["gentle"], "friendly|Caregiver": ["kindly"], "friendly|Regular Guy/Gal": ["easygoing"], "friendly|Lover": ["welcoming"], "friendly|Jester": ["chirpy"], "nice|Innocent": ["kind"], "nice|Lover": ["delightful"], "nice|Regular Guy/Gal": ["pleasant"], "normal|Outlaw": ["orthodox"], "normal|Sage": ["typical"], "normal|Regular Guy/Gal": ["ordinary"], "attractive|Lover": ["appealing"], "attractive|Creator": ["eye-catching"], "attractive|Ruler": ["polished"], "surprising|Magician": ["startling"], "surprising|Jester": ["unexpected"], "problem|Hero": ["obstacle"], "problem|Sage": ["issue"], "problem|Regular Guy/Gal": ["hitch"], "problem|Caregiver": ["concern"], "problem|Jester": ["wrinkle"], "problem|Magician": ["riddle"], "idea|Magician": ["notion"], "idea|Creator": ["notion"], "goal|Ruler": ["target"], "goal|Hero": ["objective"], "goal|Regular Guy/Gal": ["target"], "goal|Explorer": ["horizon"], "team|Regular Guy/Gal": ["group"], "team|Hero": ["unit"], "team|Jester": ["bunch"], "customer|Ruler": ["patron"], "customer|Lover": ["patron"], "company|Ruler": ["corporation"], "company|Regular Guy/Gal": ["firm"], "company|Sage": ["institution"], "company|Explorer": ["enterprise"], "project|Explorer": ["quest"], "project|Hero": ["campaign"], "project|Ruler": ["undertaking"], "result|Ruler": ["return"], "result|Sage": ["outcome"], "story|Creator": ["account"], "story|Jester": ["tale"], "story|Explorer": ["chronicle"], "story|Lover": ["account"], "friend|Regular Guy/Gal": ["pal"], "friend|Caregiver": ["confidant"], "friend|Jester": ["chum"], "expert|Sage": ["authority"], "expert|Ruler": ["master"], "approach|Sage": ["procedure"], "approach|Regular Guy/Gal": ["route"], "risk|Outlaw": ["wager"], "risk|Explorer": ["danger"], "plan|Creator": ["design"], "plan|Ruler": ["scheme"], "plan|Explorer": ["course"], "tool|Regular Guy/Gal": ["gear"], "tool|Creator": ["implement"], "tool|Sage": ["device"], "tool|Jester": ["gadget"], "success|Hero": ["triumph"], "success|Ruler": ["achievement"], "very|Hero": ["utterly"], "very|Outlaw": ["flat-out"], "very|Magician": ["strangely"], "very|Jester": ["absurdly"], "very|Caregiver": ["sincerely"], "quickly|Explorer": ["briskly"], "quickly|Jester": ["in no time"], "quickly|Magician": ["at once"], "about|Sage": ["roughly"], "about|Ruler": ["around"], "about|Regular Guy/Gal": ["around"], "about|Jester": ["more or less"]},
  SCREEN = {"use": ["leverage", "utilise"], "help": ["empower", "foster"], "improve": ["elevate", "optimise", "streamline"], "change": ["revolutionise"], "transform": ["revolutionise"], "create": ["forge"], "build": ["forge"], "start": ["embark on"], "explore": ["delve"], "show": ["showcase"], "explain": ["unpack"], "strong": ["robust"], "good": ["robust"], "new": ["cutting-edge", "innovative"], "important": ["crucial", "vital", "pivotal"], "beautiful": ["stunning", "breathtaking"], "many": ["myriad", "plethora"], "great": ["world-class", "top-notch"], "best": ["best-in-class"], "customer": ["stakeholders"], "tool": ["solution"], "reduce": ["streamline"], "increase": ["supercharge", "turbocharge", "skyrocket"], "interesting": ["captivating"], "attractive": ["stunning", "captivating"]},
  CHOICE = {};
var SRCIX = {}, LEXFORMS = {}, LEXLIST = {};
LEX.forEach(function(row, n){
  row.forms = [];
  row.src.forEach(function(s){ var f = row.p === "v" ? inflV(s) : row.p === "n" ? inflN(s) : [s.split(":")[0]]; row.forms.push(f);
    f.forEach(function(w, fi){ var key = w.toLowerCase(); (SRCIX[key] = SRCIX[key] || []).push({n:n, fi:fi}); }); });
  row.to = {}; row.cands = {};
  Object.keys(row.alt).forEach(function(a){ var raw = row.alt[a].split("|"), v = raw[0], list = raw.concat(MORE[row.src[0].split(":")[0] + "|" + a] || []);
    row.cands[a] = list.map(function(x){ return x === "!" ? ["!"] : row.p === "v" ? inflV(x) : row.p === "n" ? inflN(x) : [x]; }); row.to[a] = row.cands[a][0];
    if(v !== "!"){ row.cands[a].forEach(function(f){ f.forEach(function(w){ w.toLowerCase().split(" ").forEach(function(x){ if(x.length >= 4 && !(typeof FUNC !== "undefined" && FUNC[x])) (LEXFORMS[x] = LEXFORMS[x] || {})[a] = 1; }); }); }); }
    (LEXLIST[a] = LEXLIST[a] || []).push({from:row.forms[0][0], to:v === "!" ? "(drop)" : row.to[a][0], row:n, alts:row.cands[a].slice(1).map(function(f){ return f[0]; })}); });
});
function isPrevBreak(text, prev, t){ return !prev || /[.!?;:]/.test(text.slice(prev.end, t.at)); }
function guardOK(row, toks, k, text, fi){
  var t = toks[k], prev = k ? toks[k - 1] : null, next = toks[k + 1] || null, p = row.p;
  if(t.w.length > 1 && t.w === t.w.toUpperCase()) return false;
  var brk = isPrevBreak(text, prev, t);
  if(/^[A-Z]/.test(t.w) && !brk && prev) return false;
  if(/^[A-Z]/.test(t.w) && next && /^[A-Z]/.test(next.w) && /^\s+$/.test(text.slice(t.end, next.at))) return false;
  if(next && row.skip && row.skip.indexOf(next.lw) >= 0) return false;
  var gap = next ? text.slice(t.end, next.at) : "";
  if(row.g === "det" && !(next && NEXTDET[next.lw])) return false;
  if(row.g === "pre" && !(next && /^\s+$/.test(gap))) return false;
  if(row.g === "num" && !(next && (/^\d/.test(next.w) || NUMW[next.lw]))) return false;
  if(row.g === "adv" && !(next && /^\s+$/.test(gap))) return false;
  if(row.g === "np"){ var n1 = toks[k + 1], n2 = toks[k + 2], n3 = toks[k + 3];
    if(!(n1 && NEXTDET[n1.lw] && n2)) return false;
    if(n3 && !(/[.,;:!?]/.test(text.slice(n2.end, n3.at)) || NPEND[n3.lw])) return false; }
  if(row.g === "nn" && !(prev && !brk && NOUNPREV[prev.lw])) return false;
  if(row.g === "vo" && !(next && /^\s+$/.test(gap) && !NPEND[next.lw] && !SUBJAUX[next.lw])) return false;
  if(row.g === "hw"){ var seg = text.slice(t.end).split(/[.;:!?]/)[0]; if(!/\bwith\b/i.test(seg.slice(0, 60))) return false; }
  if(p === "v"){
    if(prev && !brk && NOUNPREV[prev.lw]) return false;
    if(next && SUBJAUX[next.lw]) return false;
    if(brk && fi === 1) return false;
  }
  return true;
}
function caseLike(src, w){ if(!w) return w; if(src.toUpperCase() === src && src.length > 1 && /[A-Z]/.test(src)) return w.toUpperCase(); if(src[0] === src[0].toUpperCase() && /[A-Za-z]/.test(src[0])) return w[0].toUpperCase() + w.slice(1); return w; }
function articleFor(w){ w = w.toLowerCase(); if(/^(hour|honest|honou?r|heir)/.test(w)) return "an"; if(/^(uni([^n]|$)|use|usu|eu|one|once|ubi)/.test(w)) return "a"; return /^[aeiou]/.test(w) ? "an" : "a"; }
function fixArticle(out, nextWord){
  var m = /(^|[^A-Za-z])(An?|an?)(\s+)$/.exec(out); if(!m || !nextWord) return out;
  var want = articleFor(nextWord); if(m[2][0] === "A") want = want[0].toUpperCase() + want.slice(1);
  return out.slice(0, m.index + m[1].length) + want + m[3];
}
function tokenize(text){ var t = [], re = new RegExp(WORD.source, "g"), m; while((m = re.exec(text)) !== null) t.push({w:m[0], lw:m[0].toLowerCase(), at:m.index, end:m.index + m[0].length}); return t; }
/* the twelve voices, each a name; weights come from the mix dials */
function activeVoices(sel, mix){ return sel.filter(function(i){ return (mix[i] || 0) > 0; }).map(function(i){ return {name:LEXNAMES[i] || ARCH[i].name, w:mix[i]}; }); }
function voiceSwap(text, sel, mix){
  var V = activeVoices(sel, mix), none = {text:text, n:0, drops:0, eligible:0, log:[], by:{}};
  if(!V.length) return none;
  var sumW = V.reduce(function(a, v){ return a + v.w; }, 0), rate = Math.min(1, sumW / 10), acc = 1 - rate, credit = {};
  var toks = tokenize(text), occ = [];
  toks.forEach(function(t, k){ var hits = SRCIX[t.lw]; if(!hits) return;
    for(var h = 0; h < hits.length; h++){ var row = LEX[hits[h].n], fi = hits[h].fi;
      var can = V.filter(function(v){ var to = row.to[v.name]; return to && (to[0] === "!" || to[Math.min(fi, to.length - 1)].toLowerCase() !== t.lw); });
      if(!can.length || !guardOK(row, toks, k, text, fi)) continue;
      occ.push({k:k, t:t, row:row, n:hits[h].n, fi:fi, can:can}); break; } });
  var out = "", last = 0, n = 0, drops = 0, log = [], by = {}, pendingCap = false;
  function push(s){ if(!s) return; if(pendingCap && /[A-Za-z]/.test(s)){ s = s.replace(/^([^A-Za-z]*)([a-z])/, function(m, a, b){ return a + b.toUpperCase(); }); pendingCap = false; } out += s; }
  occ.forEach(function(o){
    acc += rate; if(acc < 1 - 1e-9) return; acc -= 1;
    var tot = 0; o.can.forEach(function(v){ credit[v.name] = (credit[v.name] || 0) + v.w; tot += v.w; });
    var pick = o.can[0]; o.can.forEach(function(v){ if(credit[v.name] > credit[pick.name]) pick = v; }); credit[pick.name] -= tot;
    var cl = o.row.cands[pick.name], kk = Math.min(CHOICE[o.n + "|" + pick.name] || 0, cl.length - 1), to = cl[kk], rep = to[Math.min(o.fi, to.length - 1)];
    push(text.slice(last, o.t.at));
    if(rep === "!"){
      var nx = toks[o.k + 1], cap = /^[A-Z]/.test(o.t.w);
      out = fixArticle(out, nx ? nx.w : ""); last = o.t.end + (text[o.t.end] === " " ? 1 : 0); if(cap) pendingCap = true; drops++;
      log.push({arch:pick.name, from:o.t.w, to:"", drop:true, row:o.n, k:0}); by[pick.name] = (by[pick.name] || 0) + 1; n++; return; }
    var word = caseLike(o.t.w, rep); out = fixArticle(out, word); push(word); last = o.t.end; n++;
    log.push({arch:pick.name, from:o.t.w, to:word, row:o.n, k:kk}); by[pick.name] = (by[pick.name] || 0) + 1; });
  push(text.slice(last));
  return {text:out, n:n, drops:drops, eligible:occ.length, log:log, by:by};
}
/* register habits: the plain voices contract, the formal voices expand */
var CONTR = [["it is","it's"],["that is","that's"],["there is","there's"],["we are","we're"],["you are","you're"],["they are","they're"],["i am","i'm"],
  ["do not","don't"],["does not","doesn't"],["did not","didn't"],["is not","isn't"],["are not","aren't"],["cannot","can't"],["will not","won't"],
  ["we will","we'll"],["you will","you'll"],["they will","they'll"],["i will","i'll"]];
var EXPAND = {"it's":"it is","that's":"that is","there's":"there is","what's":"what is","here's":"here is","we're":"we are","you're":"you are","they're":"they are","i'm":"i am",
  "don't":"do not","doesn't":"does not","didn't":"did not","isn't":"is not","aren't":"are not","can't":"cannot","won't":"will not","wasn't":"was not","weren't":"were not",
  "hasn't":"has not","haven't":"have not","wouldn't":"would not","couldn't":"could not","shouldn't":"should not","we'll":"we will","you'll":"you will","they'll":"they will","i'll":"i will"};
var PLAIN = {"Innocent":1,"Regular Guy/Gal":1,"Caregiver":1,"Jester":1}, FORMAL = {"Sage":1,"Ruler":1};
var CONTRMAP = {}; CONTR.forEach(function(c){ CONTRMAP[c[0]] = c[1]; });
function registerPass(text, sel, mix){
  var V = activeVoices(sel, mix), bias = V.reduce(function(a, v){ return a + (PLAIN[v.name] ? v.w : 0) - (FORMAL[v.name] ? v.w : 0); }, 0);
  var res = {text:text, contracted:0, expanded:0, log:[]}; if(!bias) return res;
  var s = Math.min(1, Math.abs(bias) / 10), acc = 1 - s, toks = tokenize(text), out = "", last = 0;
  for(var k = 0; k < toks.length; k++){
    var t = toks[k], rep = null, endAt = t.end, from = t.w, key = t.lw.replace(/’/g, "'");
    if(bias > 0 && toks[k + 1] && /^ $/.test(text.slice(t.end, toks[k + 1].at))){
      var pair = key + " " + toks[k + 1].lw, c = CONTRMAP[pair];
      if(c){ var after = text.slice(toks[k + 1].end, toks[k + 1].end + 2), needsWord = /^(it is|that is|there is|we are|you are|they are|i am|we will|you will|they will|i will)$/.test(pair);
        if(!needsWord || /^ [A-Za-z]/.test(after)){ rep = c.replace("'", "’"); endAt = toks[k + 1].end; from = t.w + " " + toks[k + 1].w; } } }
    if(bias < 0 && EXPAND[key]){ rep = EXPAND[key]; }
    if(!rep) continue;
    acc += s; if(acc < 1 - 1e-9) { if(endAt !== t.end) k++; continue; } acc -= 1;
    out += text.slice(last, t.at) + caseLike(t.w, rep); last = endAt; if(bias > 0) res.contracted++; else res.expanded++;
    res.log.push({from:from, to:caseLike(t.w, rep)}); if(endAt !== t.end) k++;
  }
  res.text = out + text.slice(last); return res;
}
/* rhythm and stress: split long sentences at natural joints, merge short neighbours, and keep the version closest to every target */
function properNouns(text){ var P = {}; splitSentences(text).forEach(function(s){ (s.match(WORD) || []).slice(1).forEach(function(w){ if(/^[A-Z]/.test(w)) P[w] = 1; }); }); return P; }
function lowerFirst(s, P){ var m = s.match(/^([A-Za-z][A-Za-z'\u2019\-]*)/); if(!m) return s; var w = m[1];
  if(P[w] || w === "I" || /[A-Z].*[A-Z]/.test(w) || /\d/.test(w) || w.length === 1 && w !== "A") return s; return w[0].toLowerCase() + s.slice(1); }
function capFirst(s){ return s.replace(/^(\W*)([a-z])/, function(m, a, b){ return a + b.toUpperCase(); }); }
function endsTerm(s){ return /[.!?]["'\u201d\u2019)\]]?$/.test(s); }
function splitsOf(s){
  var out = [], re = /(;\s+|:\s+|\s+[\u2013\u2014]\s+|,\s+(and|but|so|yet|which)\s+)/gi, m;
  while((m = re.exec(s)) !== null){
    var left = s.slice(0, m.index).replace(/[,;:\s]+$/, ""), right = s.slice(m.index + m[0].length), conj = (m[2] || "").toLowerCase();
    if(conj === "but" || conj === "yet" || conj === "so") right = conj + " " + right;
    if(conj === "which") right = "this " + right;
    if(wordsIn(left).length < 3 || wordsIn(right).length < 3) continue;
    if(conj && /,/.test(left) && wordsIn(right).length < 5) continue;
    out.push([left + ".", capFirst(right)]);
  }
  return out;
}
function mergeOf(a, b, P){
  if(!/\.$/.test(a) || !endsTerm(b)) return null;
  var A = a.replace(/\.$/, ""), startsConj = /^(And|But|So|Yet)\b/.test(b), B = lowerFirst(b, P);
  if(wordsIn(A).length + wordsIn(B).length > 44) return null;
  if(startsConj) return A + ", " + B;
  return A + (/,\s(and|but)\s/i.test(A) ? "; " : ", and ") + B;
}
function lossOf(sents, T){
  var lens = sents.map(function(s){ return wordsIn(s).length; }), st = stats(lens); if(!st) return 1e9;
  var strong = sents.filter(function(s){ var w = wordsIn(s); return w.length && !FUNC[w[w.length-1].toLowerCase()]; }).length, pct = strong / sents.length * 100;
  var l = Math.pow(st.cv - T.cv, 2) * 4 + Math.pow((st.mean - T.len) / T.len, 2) * 3 + Math.pow(Math.max(0, T.end - pct) / 100, 2) * 3;
  if(st.ac != null) l += Math.pow(st.ac - T.ac, 2) * .8;
  return l;
}
function reshape(text, T){
  var P = properNouns(text), sents = splitSentences(text), ops = {split:0, merge:0};
  if(sents.length < 1) return {sents:sents, ops:ops};
  var cur = lossOf(sents, T);
  for(var step = 0; step < 14; step++){
    var best = null, bestL = cur - 1e-4;
    for(var i = 0; i < sents.length; i++){
      splitsOf(sents[i]).forEach(function(pair){ var c = sents.slice(0, i).concat(pair, sents.slice(i + 1)), L = lossOf(c, T); if(L < bestL){ bestL = L; best = {c:c, k:"split"}; } });
      if(i < sents.length - 1){ var mg = mergeOf(sents[i], sents[i+1], P); if(mg){ var c2 = sents.slice(0, i).concat([mg], sents.slice(i + 2)), L2 = lossOf(c2, T); if(L2 < bestL){ bestL = L2; best = {c:c2, k:"merge"}; } } }
    }
    if(!best) break; sents = best.c; cur = bestL; ops[best.k]++;
  }
  return {sents:sents, ops:ops};
}
function transform(src){
  var T = {cv:knobs.cv.val, ac:knobs.ac.val, len:knobs.len.val, end:knobs.end.val};
  var v = voiceSwap(src, sel, mix), g = registerPass(v.text, sel, mix), r = reshape(g.text, T);
  return {out:r.sents.join(" "), swaps:v.n, by:v.by, log:v.log, eligible:v.eligible, contracted:g.contracted, expanded:g.expanded, splits:r.ops.split, merges:r.ops.merge};
}
/* change marks: a word-and-punctuation diff between input and output */
function tokens(s){ var out = [], re = /[A-Za-z0-9]+(?:['\u2019\-][A-Za-z0-9]+)*|[^\sA-Za-z0-9]/g, m; while((m = re.exec(s)) !== null) out.push({t:m[0], at:m.index}); return out; }
function diffMarks(a, b){
  var A = tokens(a), B = tokens(b), n = A.length, m = B.length, i, j;
  if(n * m > 400000) return {B:B, del:{}, add:B.map(function(){ return false; })};
  var L = []; for(i = 0; i <= n; i++){ L.push(new Uint16Array(m + 1)); }
  var ka = A.map(function(x){ return x.t.toLowerCase(); }), kb = B.map(function(x){ return x.t.toLowerCase(); });
  for(i = n - 1; i >= 0; i--) for(j = m - 1; j >= 0; j--) L[i][j] = ka[i] === kb[j] ? L[i+1][j+1] + 1 : Math.max(L[i+1][j], L[i][j+1]);
  var add = B.map(function(){ return true; }), del = {}; i = 0; j = 0;
  while(i < n && j < m){ if(ka[i] === kb[j]){ add[j] = A[i].t !== B[j].t; i++; j++; } else if(L[i+1][j] >= L[i][j+1]){ (del[j] = del[j] || []).push(A[i].t); i++; } else { j++; } }
  while(i < n){ (del[m] = del[m] || []).push(A[i].t); i++; }
  return {B:B, del:del, add:add};
}
function renderTape(src, out, sents, weak, log){
  var d = diffMarks(src, out), B = d.B, html = "", bounds = [], p = 0, changed = 0, q = {};
  (log || []).forEach(function(e){ if(e.drop) return; (e.to.match(WORD) || []).forEach(function(w){ (q[w.toLowerCase()] = q[w.toLowerCase()] || []).push(e); }); });
  sents.forEach(function(s){ var at = out.indexOf(s, p); bounds.push([at, at + s.length]); p = at + s.length; });
  var si = -1;
  function openTo(pos){ while(si + 1 < bounds.length && pos >= bounds[si + 1][0]){ if(si >= 0) html += "</span>"; si++; html += '<span class="s' + (weak[si] ? " weak" : "") + '" data-i="' + si + '">'; } }
  function delHTML(list){ changed += list.length; return list.map(function(x){ return '<del class="d-del">' + escHtml(x) + '</del>'; }).join(" "); }
  B.forEach(function(tk, k){
    openTo(tk.at);
    var gap = k === 0 ? "" : out.slice(B[k-1].at + B[k-1].t.length, tk.at);
    if(d.del[k]){ html += escHtml(gap) + delHTML(d.del[k]) + (/^[A-Za-z0-9]/.test(tk.t) ? " " : ""); } else html += escHtml(gap);
    if(d.add[k]){ changed++; var ent = q[tk.t.toLowerCase()] && q[tk.t.toLowerCase()].shift();
      html += ent ? '<mark class="d-add" data-a="' + escHtml(ent.arch) + '" data-r="' + ent.row + '" tabindex="0" role="button" aria-haspopup="dialog" style="--ac:' + CUES[ent.arch].col + '" title="' + escHtml(ent.arch + ": " + ent.from + " to " + ent.to) + '">' + escHtml(tk.t) + '</mark>' : '<mark class="d-add">' + escHtml(tk.t) + '</mark>'; } else html += escHtml(tk.t);
  });
  if(d.del[B.length]) html += " " + delHTML(d.del[B.length]);
  if(si >= 0) html += "</span>";
  return {html:html, changed:changed};
}
var ta = document.getElementById("stText"), pre = document.getElementById("syPreview"), lines = document.getElementById("syLines");
var last = {sentences:[], weak:[]};
function line(on, head, body){ return '<p class="sy-line"><span class="sy-lamp' + (on ? " on" : "") + '" aria-hidden="true"></span><span><b>' + head + '.</b> ' + body + '</span></p>'; }
/* ---------- lexicon cards: what each chosen archetype reaches for, and what it chose just now ---------- */
var lexSig = "";
function drawLex(tr){
  var box = document.getElementById("syLex"); if(!box) return;
  var used = {}; (tr.log || []).forEach(function(e){ used[e.arch + "|" + e.row] = 1; });
  var sig = sel.map(function(i){ return i + ":" + (mix[i] || 0); }).join(",") + "|" + Object.keys(used).sort().join(","); if(sig === lexSig) return; lexSig = sig;
  if(!sel.length){ box.innerHTML = ""; return; }
  box.innerHTML = '<p class="sy-cap sy-lex-h">Lexicons in play</p><div class="sy-cards">' + sel.map(function(i){
    var nm = ARCH[i].name, c = CUES[nm], list = (LEXLIST[nm] || []).slice(), w = mix[i] || 0, n = Object.keys(used).filter(function(k){ return k.indexOf(nm + "|") === 0; }).length;
    list.sort(function(a, b){ return (used[nm + "|" + b.row] ? 1 : 0) - (used[nm + "|" + a.row] ? 1 : 0); });
    var li = function(e){ return '<li' + (used[nm + "|" + e.row] ? ' class="on"' : '') + (e.alts && e.alts.length ? ' title="Also: ' + escHtml(e.alts.join(", ")) + '"' : '') + '><span>' + escHtml(e.from) + '</span> <b>' + escHtml(e.to) + '</b></li>'; };
    var top = list.slice(0, 12).map(li).join(""), more = list.slice(12).map(li).join("");
    return '<article class="sy-card' + (w ? '' : ' off') + '" style="--ac:' + c.col + '"><header><img class="ce" src="images/emblems/' + EMB[nm] + '.svg" alt="" width="30" height="30" decoding="async"><span class="sy-sw" aria-hidden="true">' + c.sw.map(function(x){ return '<i style="background:' + x + '"></i>'; }).join("") + '</span><b>' + escHtml(nm) + '</b><span class="sy-reg">' + c.reg + '</span></header>' +
      '<p class="sy-tone">' + escHtml(c.tone) + '</p><p class="sy-snd"><em>Sounds like</em> ' + escHtml(c.sound) + '.</p>' +
      '<p class="sy-cnt">' + (w ? n + (n === 1 ? " word" : " words") + ' chosen in this text. ' : 'Dial at 0, so it chooses nothing. ') + list.length + ' in its list.</p>' +
      '<ul class="sy-words">' + top + '</ul>' + (more ? '<details><summary>' + (list.length - 12) + ' more</summary><ul class="sy-words">' + more + '</ul></details>' : '') + '</article>'; }).join("") + '</div>';
}
var raf = 0; function schedule(){ if(raf) return; raf = (window.requestAnimationFrame || function(f){ return setTimeout(f, 16); })(function(){ raf = 0; run(); }); }
function run(){
  var srcText = ta.value.replace(/\s+/g, " ").trim(), tr = srcText ? transform(srcText) : {out:"", swaps:0, by:{}, log:[], eligible:0, contracted:0, expanded:0, splits:0, merges:0}, text = tr.out;
  var sents = text ? splitSentences(text) : [], lens = sents.map(function(s){ return wordsIn(s).length; });
  var st = stats(lens.filter(function(n){ return n > 0; }));
  var T = {cv:knobs.cv.val, ac:knobs.ac.val, len:knobs.len.val, end:knobs.end.val};
  var out = "";
  /* rhythm */
  if(!st || st.n < 2){ reading(knobs.cv,"",0); reading(knobs.ac,"",0); reading(knobs.len,"",0);
    out += line(false, "Rhythm", "Patch in at least two sentences to read the rhythm."); }
  else {
    var dcv = st.cv - T.cv, sCV = Math.abs(dcv) <= .08 ? 2 : Math.abs(dcv) <= .16 ? 1 : 0;
    var sAC = st.ac == null ? 0 : (Math.abs(st.ac - T.ac) <= .2 ? 2 : Math.abs(st.ac - T.ac) <= .4 ? 1 : 0);
    var dl = st.mean - T.len, sLN = Math.abs(dl) <= 3 ? 2 : Math.abs(dl) <= 6 ? 1 : 0;
    reading(knobs.cv, "Text " + st.cv.toFixed(2), sCV, st.cv); reading(knobs.ac, st.ac == null ? "Needs three sentences" : "Text " + st.ac.toFixed(2), sAC, st.ac); reading(knobs.len, "Text " + st.mean.toFixed(0) + " words", sLN, st.mean);
    var mx = Math.max.apply(null, lens), mn = Math.min.apply(null, lens), notes = [];
    if(sCV < 2) notes.push(dcv < 0 ? "Lengths are too even: they range from " + mn + " to " + mx + " words. Vary them more." : "Lengths swing harder than the target, from " + mn + " to " + mx + " words.");
    if(st.ac != null && sAC < 2) notes.push(st.ac > T.ac ? "Long and short sentences clump together. Break up the runs." : "Lengths alternate more strictly than the target.");
    if(sLN < 2) notes.push("Sentences average " + st.mean.toFixed(0) + " words against a target of " + T.len + ".");
    out += line(sCV === 2 && sAC === 2 && sLN === 2, "Rhythm", notes.length ? notes.join(" ") : "On target: spread " + st.cv.toFixed(2) + ", interleave " + (st.ac == null ? "n/a" : st.ac.toFixed(2)) + ", " + st.mean.toFixed(0) + " words a sentence.");
  }
  /* stress */
  var weak = sents.map(function(s){ var w = wordsIn(s); return w.length ? !!FUNC[w[w.length-1].toLowerCase()] : false; });
  if(!sents.length){ reading(knobs.end,"",0); out += line(false, "Stress", "Nothing to read yet."); }
  else { var strong = weak.filter(function(x){ return !x; }).length, pct = Math.round(strong / sents.length * 100), sEN = pct >= T.end - 5 ? 2 : pct >= T.end - 15 ? 1 : 0;
    reading(knobs.end, "Text " + pct + "%", sEN, pct);
    out += line(sEN === 2, "Stress", strong + " of " + sents.length + " sentences end on a content word (" + pct + "%)." + (strong < sents.length ? " The underlined ones hand their last beat to a function word." : "")); }
  /* voice */
  var toks = text.match(WORD) || [], counts = ARCH.map(function(){ return 0; }), hits = 0, used = {};
  toks.forEach(function(t){ var h = archOf(t); if(h.length){ hits++; used[t.toLowerCase()] = 1; h.forEach(function(i){ counts[i] += 1 / h.length; }); } });
  var voiceScope = null;
  if(!sel.length){ out += line(false, "Voice", "Choose up to three archetypes to set a target voice."); }
  else if(hits < 4){ out += line(false, "Voice", "Too few voice words to read. Try a longer passage."); }
  else {
    var tot = counts.reduce(function(a,b){ return a+b; }, 0), prof = counts.map(function(c){ return c / tot; });
    var wsum = sel.reduce(function(a,i){ return a + (mix[i] || 0); }, 0) || 1, match = 0;
    sel.forEach(function(i){ match += Math.min((mix[i] || 0) / wsum, prof[i]); });
    var top = prof.map(function(p,i){ return [p,i]; }).sort(function(a,b){ return b[0]-a[0]; }).slice(0,2).filter(function(x){ return x[0] > 0; }).map(function(x){ return ARCH[x[1]].name; });
    var sugg = []; sel.forEach(function(i){ ARCH[i].stems.forEach(function(s){ if(s.length >= 4 && !used[s] && sugg.length < 6 && (mix[i] || 0) > 0) sugg.push(s); }); });
    var pc = Math.round(match * 100); voiceScope = pc;
    out += line(pc >= 55, "Voice", "Blend match " + pc + "%. Strongest in the text: " + top.join(" and ") + "." + (pc < 55 && sugg.length ? " Words in the target voice: " + sugg.join(", ") + "." : ""));
  }
  lines.innerHTML = out;
  scopeData = {lens:lens, weak:weak, target:T.len, idx:-1}; drawScope();
  if(scopeRead || document.getElementById("syScopeRead")){ scopeRead = scopeRead || document.getElementById("syScopeRead");
    scopeRead.innerHTML = st ? "SPREAD <b>" + st.cv.toFixed(2) + "</b> INTERLEAVE <b>" + (st.ac == null ? "--" : st.ac.toFixed(2)) + "</b> LEN <b>" + st.mean.toFixed(0) + "</b> END <b>" + (sents.length ? Math.round(weak.filter(function(x){ return !x; }).length / sents.length * 100) + "%" : "--") + "</b> VOICE <b>" + (voiceScope == null ? "--" : voiceScope + "%") + "</b>" : "NO SIGNAL"; }
  /* the tape: the output, with every changed word and punctuation mark shown */
  var tp = text ? renderTape(srcText, text, sents, weak, tr.log) : {html:"", changed:0};
  /* a re-render replaces every word, so keep keyboard focus on the same coloured word */
  var ae = document.activeElement, keep = ae && ae !== document.body && pre.contains(ae) && ae.matches("mark[data-r]") ? [ae.dataset.r, ae.dataset.a] : null;
  /* a re-render replaces every word, so keep keyboard focus on the same coloured word */
  var ae = document.activeElement, keep = ae && ae !== document.body && pre.contains(ae) && ae.matches("mark[data-r]") ? [ae.dataset.r, ae.dataset.a] : null;
  pre.innerHTML = tp.html || '<span class="sy-tape-empty">Patch in some text to see it here.</span>';
  if(keep){ var nm = pre.querySelector('mark[data-r="' + keep[0] + '"][data-a="' + String(keep[1]).replace(/"/g, "") + '"]'); if(nm) nm.focus({preventScroll:true}); }
  if(keep){ var nm = pre.querySelector('mark[data-r="' + keep[0] + '"][data-a="' + String(keep[1]).replace(/"/g, "") + '"]'); if(nm) nm.focus({preventScroll:true}); }
  var sum = document.getElementById("syTapeSum");
  if(sum){ var bits = []; if(tr.splits) bits.push(tr.splits + (tr.splits === 1 ? " sentence split" : " sentences split")); if(tr.merges) bits.push(tr.merges + (tr.merges === 1 ? " pair joined" : " pairs joined"));
    if(tr.swaps){ var parts = Object.keys(tr.by).map(function(nm){ return tr.by[nm] + " " + nm; }); bits.push(tr.swaps + (tr.swaps === 1 ? " word chosen by the voices" : " words chosen by the voices") + " (" + parts.join(", ") + ")"); }
    if(tr.contracted) bits.push(tr.contracted + (tr.contracted === 1 ? " contraction" : " contractions")); if(tr.expanded) bits.push(tr.expanded + " written out in full");
    sum.textContent = !srcText ? "" : bits.length ? bits.join(", ") + "." : (activeVoices(sel, mix).length && !tr.eligible) ? "No word in this text has an entry in the chosen lexicons. Try the voice sample." : "No changes: the text already sits as close to these targets as the rules can take it."; }
  sel.forEach(function(i){ var kb = knobs["mix" + i]; if(kb) kb.rt.textContent = srcText ? (tr.by[ARCH[i].name] || 0) + " chosen" : ""; });
  var key = document.getElementById("syKey"); if(key) key.innerHTML = sel.map(function(i){ return '<span class="sy-keyi" style="--ac:' + CUES[ARCH[i].name].col + '"><i></i>' + escHtml(ARCH[i].name) + '</span>'; }).join("");
  drawLex(tr); applyTheme(); if(synth) syncSynth();
  last = {sentences:sents, weak:weak, out:text};
}
var tmr = 0; ta.addEventListener("input", function(){ clearTimeout(tmr); tmr = setTimeout(run, 140); });
root.querySelectorAll(".sy-chip[data-src]").forEach(function(b){ b.addEventListener("click", function(){ var s = b.dataset.src;
  if(s === "clear"){ ta.value = ""; } else { var src = document.getElementById(s); ta.value = src ? (s === "voiceText" ? src.textContent : src.innerText).replace(/\s+/g, " ").trim() : ""; } stop(); run(); }); });
/* ---------- sound: the synth, the keyboard, the wheels, and the colours that follow them ---------- */
var EMB = {"Innocent":"innocent","Explorer":"explorer","Sage":"sage","Hero":"hero","Outlaw":"outlaw","Magician":"magician","Regular Guy/Gal":"regular","Lover":"lover","Jester":"jester","Caregiver":"caregiver","Creator":"creator","Ruler":"ruler"};
var synthEl = document.getElementById("synth"), btn = document.getElementById("syPlay"), soundBtn = document.getElementById("sySound");
var actx = null, synth = null, soundOn = true, loopOn = true, prevVoices = "", prevKeyVal = null, rtT = 0, rtLast = 0, events = [], held = {}, heldOrder = [], kbOct = 0, bendV = 0, modV = 0, pl = {on:false, cur:-1}, syncSig = "";
var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function ensureAudio(){
  if(synth){ if(actx.state === "suspended") actx.resume(); return synth; }
  var AC = window.AudioContext || window.webkitAudioContext; if(!AC || !window.LexiSynth) return null;
  try{ actx = new AC({latencyHint:"interactive"}); }catch(e){ try{ actx = new AC(); }catch(e2){ return null; } }
  synth = new LexiSynth(actx); synth.loadBeds("audio/beds/"); synth.loadFx("audio/fx/", ["rocker","tick"]); synth.arm();
  syncSig = ""; syncSynth(); if(actx.state === "suspended") actx.resume(); return synth;
}
function keySemis(){ return (((knobs.key.val - 9 + 6) % 12) + 12) % 12 - 6; }
function syncSynth(){
  if(!synth) return;
  var V = activeVoices(sel, mix), T = {cut:knobs.cut.val, res:knobs.res.val, con:knobs.con.val, space:knobs.space.val, bed:knobs.bed.val, vol:knobs.vol.val, glide:knobs.glide.val, tempo:knobs.tempo.val, transpose:keySemis()};
  var sig = JSON.stringify([V, T, soundOn]); if(sig === syncSig) return; syncSig = sig;
  var vs = JSON.stringify(V), timbre = vs !== prevVoices || knobs.key.val !== prevKeyVal; prevVoices = vs; prevKeyVal = knobs.key.val;
  synth.setVoices(V); synth.setTrim(T); synth.setMuted(!soundOn);
  if(timbre && (pl.on || heldOrder.length)) retimbreSoon();
}
function synthFx(n){ if(synth && soundOn) synth.fx(n, .4); }
function setSound(on){ soundOn = on; soundBtn.setAttribute("aria-pressed", on ? "true" : "false"); soundBtn.querySelector(".sy-lamp").className = "sy-lamp" + (on ? " on" : ""); syncSig = ""; syncSynth(); }
soundBtn.addEventListener("click", function(){ setSound(!soundOn); if(soundOn){ ensureAudio(); syncSynth(); synthFx("tick"); } });
/* any dial that shapes the sound: update the synth now, and let the visitor hear what changed */
var pvT = 0;
function liveAudio(){ syncSynth(); previewSoon(); }
function previewSoon(){ if(!synth || !soundOn || pl.on) return; clearTimeout(pvT); pvT = setTimeout(preview, 420); }
function preview(){
  if(!synth || !soundOn || pl.on || Object.keys(held).length) return;
  var r = 48 + knobs.key.val, t = actx.currentTime + .03, step = 60 / knobs.tempo.val * .5;
  [0, 2, 4].forEach(function(d, i){ synth.note(t + i * step, synth.scaleNote(r, d), step * .92, .7); });
}

/* ---------- colour: the chosen archetypes' palettes drive the panel ---------- */
function hex2rgb(h){ h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function lumOf(c){ var f = function(v){ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
function tint(h, f){ return "rgb(" + hex2rgb(h).map(function(v){ return Math.round(v + (255 - v) * f); }).join(",") + ")"; }
var themeSig = "";
function applyTheme(){
  var V = activeVoices(sel, mix).sort(function(a, b){ return b.w - a.w; }), sig = V.map(function(v){ return v.name + v.w; }).join("|");
  if(sig === themeSig) return; themeSig = sig;
  var q = function(i, k){ return V[i] ? CUES[V[i].name][k] : null; };
  var c1 = q(0, "col") || "#e8a24a", c2 = q(1, "col") || (V[0] ? CUES[V[0].name].sw[1] : "#6ab7e8"), c3 = q(2, "col") || (V[1] ? CUES[V[1].name].sw[1] : V[0] ? CUES[V[0].name].sw[2] : "#e8702a");
  synthEl.style.setProperty("--v1", c1); synthEl.style.setProperty("--v2", c2); synthEl.style.setProperty("--v3", c3);
  COL.trace = V.length ? tint(c1, .55) : "#8dffc0"; COL.glow = V.length ? "rgba(" + hex2rgb(c1).join(",") + ",.9)" : "rgba(125,255,178,.9)"; COL.wave = tint(c2, .6);
  drawScope();
}
var lvl = 0; /* output level, used to keep the animation loop alive; nothing on screen pulses with it */

/* ---------- keyboard: 44 keys, F to C, in the archetype's colour ---------- */
var KLO = 41, KHI = 84, kEls = {}, keysEl = document.getElementById("syKeys");
(function(){
  var BLACK = {1:1, 3:1, 6:1, 8:1, 10:1}, whites = 0, m;
  for(m = KLO; m <= KHI; m++) if(!BLACK[m % 12]) whites++;
  var ww = 100 / whites, bw = ww * .62, wi = 0, frag = document.createDocumentFragment();
  for(m = KLO; m <= KHI; m++){ var d = document.createElement("div"), pc = m % 12; d.dataset.m = m; d.setAttribute("aria-hidden", "true");
    if(BLACK[pc]){ d.className = "k b"; d.style.left = (wi * ww - bw / 2) + "%"; d.style.setProperty("--bw", bw + "%"); }
    else { d.className = "k w"; wi++; if(pc === 0) d.dataset.c = "C" + (Math.floor(m / 12) - 1); }
    kEls[m] = d; frag.appendChild(d); }
  keysEl.appendChild(frag);
})();
function keyCol(){ var V = activeVoices(sel, mix).sort(function(a, b){ return b.w - a.w; }); return V.length ? CUES[V[0].name].col : "#e8a24a"; }
function wake(){ if(!soundOn) setSound(true); return ensureAudio(); }
function keyOn(m){
  var sy = wake(); if(!sy || held[m]) return;
  var prev = heldOrder[heldOrder.length - 1]; if(prev != null && held[prev]) sy.off(held[prev].h);
  held[m] = {h:sy.on(m, .85), col:keyCol()}; heldOrder.push(m); kick();
}
function keyOff(m){
  var e = held[m]; if(!e || !synth) return;
  synth.off(e.h); delete held[m]; var i = heldOrder.indexOf(m); if(i >= 0) heldOrder.splice(i, 1);
  var back = heldOrder[heldOrder.length - 1]; if(back != null && held[back]) held[back].h = synth.on(back, .7);
  kick();
}
function releaseKeys(){ heldOrder.slice().forEach(keyOff); heldOrder = []; }
var pdown = false, pkey = null;
function keyAt(x, y){ var el = document.elementFromPoint(x, y); el = el && el.closest ? el.closest(".k") : null; return el ? +el.dataset.m : null; }
keysEl.addEventListener("pointerdown", function(e){ var m = keyAt(e.clientX, e.clientY); if(m == null) return; pdown = true; keysEl.focus({preventScroll:true}); try{ keysEl.setPointerCapture(e.pointerId); }catch(err){} pkey = m; keyOn(m); e.preventDefault(); });
keysEl.addEventListener("pointermove", function(e){ if(!pdown) return; var m = keyAt(e.clientX, e.clientY); if(m != null && m !== pkey){ if(pkey != null) keyOff(pkey); pkey = m; keyOn(m); } });
function pend(){ if(!pdown) return; pdown = false; if(pkey != null) keyOff(pkey); pkey = null; }
keysEl.addEventListener("pointerup", pend); keysEl.addEventListener("pointercancel", pend); keysEl.addEventListener("lostpointercapture", pend);
var KMAP = {a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12, o:13, l:14, p:15, ";":16}, kbDown = {};
keysEl.addEventListener("keydown", function(e){
  if(e.ctrlKey || e.metaKey || e.altKey) return; var k = e.key.toLowerCase();
  if(k === "z" || k === "x"){ kbOct = Math.max(-2, Math.min(1, kbOct + (k === "x" ? 1 : -1))); e.preventDefault(); return; }
  if(KMAP[k] == null || e.repeat) return; var m = 60 + kbOct * 12 + KMAP[k]; if(m < KLO || m > KHI) return;
  e.preventDefault(); kbDown[k] = m; keyOn(m); });
keysEl.addEventListener("keyup", function(e){ var k = e.key.toLowerCase(); if(kbDown[k] != null){ keyOff(kbDown[k]); delete kbDown[k]; } });
keysEl.addEventListener("blur", function(){ kbDown = {}; releaseKeys(); });
function paintKeys(now){
  var act = {}; events.forEach(function(e){ if(e.t <= now && now < e.t + e.dur + .04) act[e.midi] = e.col; });
  for(var m = KLO; m <= KHI; m++){ var el = kEls[m], h = held[m], col = h ? h.col : act[m], on = !!col;
    if(el._on !== on || el._col !== col){ el._on = on; el._col = col; el.classList.toggle("down", on); if(col) el.style.setProperty("--kc", col); } }
}

/* ---------- wheels: pitch springs back, mod stays where it is ---------- */
function wheel(el, o){
  var v = o.val, drag = false, sy0 = 0, sv = 0, hh = 1, r2 = 0;
  function set(x, quiet){ v = Math.max(o.min, Math.min(1, x)); el.style.setProperty("--wy", (v * -34).toFixed(1) + "px"); el.setAttribute("aria-valuenow", v.toFixed(2)); el.classList.toggle("notch", o.min < 0 && Math.abs(v) < .03); if(!quiet) o.onChange(v); }
  function spring(){ var t0 = performance.now(), from = v; (function step(t){ var k = Math.min(1, (t - t0) / 260); set(k >= 1 ? 0 : from * (1 - k) * (1 - k)); if(k < 1) r2 = requestAnimationFrame(step); })(t0); }
  el.addEventListener("pointerdown", function(e){ drag = true; sy0 = e.clientY; sv = v; hh = el.clientHeight; try{ el.setPointerCapture(e.pointerId); }catch(err){} cancelAnimationFrame(r2); wake(); e.preventDefault(); el.focus({preventScroll:true}); });
  el.addEventListener("pointermove", function(e){ if(drag) set(sv + (sy0 - e.clientY) / (hh * .42)); });
  function end(){ if(!drag) return; drag = false; if(o.spring) spring(); }
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("dblclick", function(){ set(o.min < 0 ? 0 : 0); });
  el.addEventListener("keydown", function(e){ var m = {ArrowUp:.1, ArrowRight:.1, ArrowDown:-.1, ArrowLeft:-.1}[e.key]; if(m){ cancelAnimationFrame(r2); set(v + m); e.preventDefault(); } });
  el.addEventListener("keyup", function(e){ if(o.spring && /^Arrow/.test(e.key)) spring(); });
  set(o.val, true);
}
wheel(document.getElementById("syBend"), {min:-1, val:0, spring:true, onChange:function(x){ bendV = x; if(synth) synth.setBend(x * 200); }});
wheel(document.getElementById("syModW"), {min:0, val:0, spring:false, onChange:function(x){ modV = x; if(synth) synth.setMod(x); kick(); }});

/* ---------- the text, played: the dials are read again at every word, so changes are heard at once ---------- */
var AHEAD = .1; /* notes are scheduled a tenth of a second ahead, so a change is heard within that buffer */
function rootMidi(){ return 48 + knobs.key.val; }
function wordCol(word){ var h = archOf(word).filter(function(i){ return sel.indexOf(i) >= 0 && (mix[i] || 0) > 0; }); return h.length ? CUES[ARCH[h[0]].name].col : keyCol(); }
function startPlay(){
  var sy = wake(); if(!sy || !last.sentences.length) return; syncSynth();
  pl = {on:true, n:0, w:0, t:actx.currentTime + .05, cur:-1, done:false, endAt:0, timer:0, last:null}; events = [];
  btn.setAttribute("aria-pressed", "true"); btn.querySelector(".sy-play-l").textContent = "Stop"; btn.querySelector(".sy-lamp").className = "sy-lamp on"; pump(); kick();
}
function pump(){
  if(!pl.on) return; var guard = 0, ahead = actx.currentTime + AHEAD;
  while(pl.t < ahead && guard++ < 64 && scheduleWord()){}
  if(pl.done && actx.currentTime > pl.endAt){ stop(); return; }
  pl.timer = setTimeout(pump, 25);
}
function scheduleWord(){
  var sents = last.sentences;
  if(pl.n >= sents.length){
    if(loopOn && sents.length){ pl.n = 0; pl.w = 0; pl.t += 60 / knobs.tempo.val * 1.5; return true; }
    if(!pl.done){ pl.done = true; pl.endAt = pl.t + synth.P.R * 1.4 + .2; } return false; }
  var words = wordsIn(sents[pl.n]); if(!words.length || pl.w >= words.length){ pl.n++; pl.w = 0; return true; }
  var beat = 60 / knobs.tempo.val, word = words[pl.w], len = word.length, lastW = pl.w === words.length - 1, weak = last.weak[pl.n], strongW = !FUNC[word.toLowerCase()];
  var root = rootMidi(), midi = lastW ? (weak ? root - 2 : root + 12) : synth.scaleNote(root, Math.min(6, Math.max(0, len - 2)));
  var dur = beat * (.42 + Math.min(8, len) * .05) * (lastW ? 1.9 : 1), when = pl.t + (pl.w % 2 === 1 ? synth.P.swing * beat * .3 : 0), vel = lastW ? .95 : strongW ? .8 : .5;
  pl.last = {h:synth.note(when, midi, dur * .92, vel), t:when, dur:dur * .92, midi:midi, vel:vel, root:root};
  events.push({t:when, dur:dur * .92, midi:midi, col:wordCol(word), si:pl.n});
  pl.t += dur; pl.w++; if(pl.w >= words.length){ pl.t += beat * .8; pl.n++; pl.w = 0; }
  return true;
}
function stop(){
  clearTimeout(pl.timer); pl = {on:false, cur:-1}; if(synth) synth.allOff(); events = [];
  btn.setAttribute("aria-pressed", "false"); btn.querySelector(".sy-play-l").textContent = "Play"; btn.querySelector(".sy-lamp").className = "sy-lamp";
  pre.querySelectorAll(".playing").forEach(function(e){ e.classList.remove("playing"); }); scopeData.idx = -1; drawScope();
}
function playCursor(now){
  var cur = -1; for(var i = events.length - 1; i >= 0; i--){ if(events[i].t <= now){ cur = events[i].si; break; } }
  if(pl.on && cur >= 0 && cur !== pl.cur){ pl.cur = cur; pre.querySelectorAll(".playing").forEach(function(e){ e.classList.remove("playing"); }); var e2 = pre.querySelector('[data-i="' + cur + '"]'); if(e2) e2.classList.add("playing"); scopeData.idx = cur; }
  while(events.length && events[0].t + events[0].dur < now - .25) events.shift();
}
/* a change of voice or key re-strikes the word that is sounding, a tenth of a second later, in the new timbre */
function retimbreSoon(){ var gap = performance.now() - rtLast; clearTimeout(rtT); rtT = setTimeout(retimbre, Math.max(0, 120 - gap)); }
function retimbre(){
  if(!synth) return; rtLast = performance.now();
  var now = actx.currentTime, at = now + AHEAD;
  if(pl.on && pl.last){
    var L = pl.last, end = L.t + L.dur, from = Math.max(at, L.t);
    if(end > from + .08){ var root = rootMidi(), midi = L.midi + (root - L.root); synth.steal(L.h, from, .05);
      pl.last = {h:synth.note(from, midi, end - from, L.vel, true), t:from, dur:end - from, midi:midi, vel:L.vel, root:root}; } }
  var m = heldOrder[heldOrder.length - 1];
  if(m != null && held[m]){ synth.steal(held[m].h, at, .05); held[m].h = synth.on(m, .85, at, true); }
}
btn.addEventListener("click", function(){ if(pl.on) stop(); else startPlay(); });
var loopBtn = document.getElementById("syLoop");
loopBtn.addEventListener("click", function(){ loopOn = !loopOn; loopBtn.setAttribute("aria-pressed", loopOn ? "true" : "false"); loopBtn.querySelector(".sy-lamp").className = "sy-lamp" + (loopOn ? " on" : ""); synthFx("tick"); });
document.addEventListener("visibilitychange", function(){ if(document.hidden){ if(pl.on) stop(); if(heldOrder.length) releaseKeys(); } });
document.getElementById("syUseOut").addEventListener("click", function(){ if(!last.out) return; ta.value = last.out; stop(); run(); var sm = document.getElementById("syTapeSum"); if(sm) sm.textContent = "Output moved into the patch. The dials now work from this version."; });

/* ---------- plain-language help: hover, focus, or tap a label ---------- */
var TIPS = {
  cv:["Burstiness","How much your sentence lengths vary. Low means every sentence is about the same length. High mixes long sentences with short ones.","Try it: raise it if the text reads like a drumbeat."],
  ac:["Interleave","Whether long and short sentences take turns. Below zero they alternate. Above zero, long ones bunch together, and so do short ones.","Try it: pull it below zero for a steadier back and forth."],
  len:["Length","The average sentence length you are aiming for, in words. Lexiphon splits or joins sentences to get near it.","Try it: a low number for brisk copy, a high one for a slower read."],
  end:["End weight","How many sentences should finish on a word that carries meaning, such as a noun or a verb, and not on a small word like “it” or “of”.","Try it: raise it to make endings land harder."],
  mix:["Voice share","How strongly this voice shapes the text. At 0 it does nothing. The numbers across your chosen voices set each one’s share of the word changes, and their total sets how many eligible words change.","Try it: set two voices to 6 and 4 to blend them."],
  tempo:["Tempo","How fast the tune plays, in beats per minute. It also sets the spacing of the echo."],
  key:["Key","The note the melody is built on. It also retunes the looping backdrop to match."],
  glide:["Glide","How smoothly one note slides into the next. At 0 each note steps cleanly. Higher values slur them together.","Try it: around 100 for a singing slide."],
  cut:["Cutoff","How bright the sound is. Turn it down for a darker, softer tone and up for a sharper, brighter one.","Try it: turn it as the tune plays."],
  res:["Emphasis","How strongly the filter boosts the sound right at the cutoff. Higher values give a more nasal, singing edge."],
  con:["Contour","How far the brightness opens at the start of each note before it settles. Higher values give a sharper pluck."],
  space:["Space","How much echo and room sound surrounds the notes."],
  bed:["Bed","The volume of the looping backdrop that belongs to each voice you chose.","Try it: turn it up for atmosphere, down for the bare tune."],
  vol:["Volume","The overall loudness."],
  play:["Play","Plays your output text as a tune. Longer words play higher notes, small words play softly, and a sentence that ends on a strong word finishes on a high note."],
  loop:["Loop","Repeats the tune until you press Stop, so you can keep turning dials and hear what each one does."],
  sound:["Sound","Switches all sound on or off. Nothing plays until you press Play or a key."],
  bend:["Pitch wheel","Bends the pitch up or down for as long as you hold it. It springs back when you let go."],
  modw:["Mod wheel","Adds a gentle wobble to the pitch and a slow sweep to the brightness. It stays where you leave it."],
  keys:["Keyboard","Play it with the mouse or your finger, or use the A to semicolon keys on a computer keyboard. Z and X move down and up an octave."],
  scope:["Scope","Each dot is one sentence, and higher means longer. The dashed line is your Length target. Red dots end on a small word, and the white line follows the sound as it plays."],
  useout:["Use as input","Moves the rewritten text into the box, so the dials work from this version."]
};
var tipEl = document.createElement("div"); tipEl.id = "syTip"; tipEl.setAttribute("role", "tooltip"); tipEl.hidden = true; synthEl.appendChild(tipEl);
var tipFor = null, tipT = 0, tipAt = 0;
function tipKey(el){
  if(el.closest(".sy-arch button")) return "arch"; if(el.matches && el.matches(".knob[data-k]")) return el.dataset.mix ? "mix" : el.dataset.k;
  if(el.id === "syPlay") return "play"; if(el.id === "syLoop") return "loop"; if(el.id === "sySound") return "sound"; if(el.id === "syBend") return "bend"; if(el.id === "syModW") return "modw";
  if(el.id === "syKeys") return "keys"; if(el.classList.contains("sy-scope")) return "scope"; if(el.id === "syUseOut") return "useout"; return null;
}
function tipBody(el, k){
  if(k === "arch"){ var btn = el.closest(".sy-arch button"), nm = btn.querySelector(".nm").textContent, cu = CUES[nm], words = (LEXLIST[nm] || []).filter(function(e){ return e.to !== "(drop)"; }).slice(0, 4).map(function(e){ return e.to; });
    return {n:nm + ", " + cu.reg.toLowerCase() + " voice", t:cu.tone, x:"It reaches for words such as " + words.join(", ") + ". Choose up to three voices."}; }
  var d = TIPS[k]; if(!d) return null; var n = d[0]; if(k === "mix") n = el.dataset.label + " share";
  return {n:n, t:d[1], x:d[2] || ""};
}
function showTip(el){
  var k = tipKey(el); if(!k) return; var b = tipBody(el, k); if(!b) return;
  tipEl.innerHTML = "<b>" + escHtml(b.n) + "</b><span>" + escHtml(b.t) + "</span>" + (b.x ? "<em>" + escHtml(b.x) + "</em>" : ""); tipEl.hidden = false; tipEl.style.visibility = "hidden";
  var r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h2 = tipEl.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight, pad = 8;
  var left = Math.max(pad, Math.min(vw - w - pad, r.left + r.width / 2 - w / 2)), top = r.top - h2 - 10; if(top < pad) top = Math.min(vh - h2 - pad, r.bottom + 10);
  tipEl.style.left = left + "px"; tipEl.style.top = top + "px"; tipEl.style.visibility = ""; tipFor = el; tipAt = performance.now(); el.setAttribute("aria-describedby", "syTip");
}
function hideTip(){ clearTimeout(tipT); if(tipFor){ tipFor.removeAttribute("aria-describedby"); tipFor = null; } tipEl.hidden = true; }
function tipTarget(t){ return t && t.closest ? t.closest(".knob[data-k], .sy-arch button, #syPlay, #syLoop, #sySound, #syBend, #syModW, #syKeys, .sy-scope, #syUseOut") : null; }
synthEl.addEventListener("mouseover", function(e){ var el = tipTarget(e.target); if(!el || el === tipFor || (el.classList.contains("turning"))) return; clearTimeout(tipT); tipT = setTimeout(function(){ if(!el.classList.contains("turning")) showTip(el); }, 420); });
synthEl.addEventListener("mouseout", function(e){ var el = tipTarget(e.target); if(el && !el.contains(e.relatedTarget)) hideTip(); });
synthEl.addEventListener("focusin", function(e){ var el = tipTarget(e.target); if(el) showTip(el); });
synthEl.addEventListener("focusout", hideTip);
synthEl.addEventListener("pointerdown", function(e){ if(e.pointerType !== "touch") hideTip(); });
synthEl.addEventListener("click", function(e){ var lab = e.target.closest && e.target.closest(".knob-l, .wl"); if(!lab) return; var el = lab.closest(".knob") || lab.parentNode.querySelector(".sy-wheel"); if(!el) return; if(tipFor === el){ if(performance.now() - tipAt > 500) hideTip(); } else { hideTip(); showTip(el); } });
document.addEventListener("keydown", function(e){ if(e.key === "Escape") hideTip(); });
window.addEventListener("scroll", function(){ if(performance.now() - tipAt > 450) hideTip(); }, {passive:true});
document.addEventListener("pointerdown", function(e){ if(tipFor && !synthEl.contains(e.target)) hideTip(); });

/* ---------- thesaurus popover: choose another word for a voice; the choice applies wherever the word appears ---------- */
var thesEl = document.createElement("div"); thesEl.id = "syThes"; thesEl.setAttribute("role", "dialog"); thesEl.setAttribute("aria-label", "Choose another word"); thesEl.hidden = true; synthEl.appendChild(thesEl);
var thesFor = null;
function thesRender(row, arch){
  var r = LEX[row], cl = r.cands[arch], cur = Math.min(CHOICE[row + "|" + arch] || 0, cl.length - 1), src = r.forms[0][0], scr = SCREEN[r.src[0].split(":")[0]] || [];
  var btns = cl.map(function(f, k){ return '<button type="button" data-k="' + k + '" aria-pressed="' + (k === cur) + '">' + escHtml(f[0]) + '</button>'; }).join("");
  thesEl.style.setProperty("--ac", CUES[arch].col);
  thesEl.innerHTML = '<b><i aria-hidden="true"></i>' + escHtml(arch) + ' and “' + escHtml(src) + '”</b><span class="th-h">Words this voice can use instead. Pick one.</span><span class="th-b">' + btns + '</span>' +
    (scr.length ? '<span class="th-s">Left out on purpose, because the house lists flag them: ' + escHtml(scr.join(", ")) + '.</span>' : '') +
    '<span class="th-n">Your pick applies wherever “' + escHtml(src) + '” appears, so the voice stays consistent.</span>' + (cur ? '<button type="button" class="th-r" data-k="0">Back to “' + escHtml(cl[0][0]) + '”</button>' : '');
}
function openThes(mark){
  var row = +mark.dataset.r, arch = mark.dataset.a; hideTip(); thesFor = {row:row, arch:arch}; thesRender(row, arch); thesEl.hidden = false; thesEl.style.visibility = "hidden";
  var r = mark.getBoundingClientRect(), w = thesEl.offsetWidth, hh = thesEl.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight, pad = 8;
  var left = Math.max(pad, Math.min(vw - w - pad, r.left + r.width / 2 - w / 2)), top = r.bottom + 8; if(top + hh > vh - pad) top = Math.max(pad, r.top - hh - 8);
  thesEl.style.left = left + "px"; thesEl.style.top = top + "px"; thesEl.style.visibility = "";
  var on = thesEl.querySelector('[aria-pressed="true"]'); if(on) on.focus({preventScroll:true});
}
function closeThes(back){ thesEl.hidden = true; var f = thesFor; thesFor = null; if(back && f){ var m = pre.querySelector('mark[data-r="' + f.row + '"][data-a="' + f.arch.replace(/"/g, "") + '"]'); if(m) m.focus({preventScroll:true}); } }
pre.addEventListener("click", function(e){ var m = e.target.closest && e.target.closest("mark[data-r]"); if(m){ openThes(m); e.preventDefault(); } });
pre.addEventListener("keydown", function(e){ if((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("mark[data-r]")){ openThes(e.target); e.preventDefault(); } });
thesEl.addEventListener("click", function(e){
  var b = e.target.closest("button[data-k]"); if(!b || !thesFor) return; var f = thesFor;
  CHOICE[f.row + "|" + f.arch] = +b.dataset.k; run();
  var m = pre.querySelector('mark[data-r="' + f.row + '"][data-a="' + f.arch + '"]');
  if(m) openThes(m); else closeThes(false);
});
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !thesEl.hidden){ closeThes(true); } });
document.addEventListener("pointerdown", function(e){ if(!thesEl.hidden && !thesEl.contains(e.target) && !(e.target.closest && e.target.closest("mark[data-r]"))) closeThes(false); });
window.addEventListener("scroll", function(){ if(!thesEl.hidden) closeThes(false); }, {passive:true});
/* ---------- one animation loop: level, keys, cursor; it sleeps when the panel is off screen ---------- */
var frameId = 0, lastFrame = 0, onScreen = true;
function frame(ts){
  frameId = 0; if(!onScreen || document.hidden) return;
  if(ts - lastFrame >= 40){ lastFrame = ts;
    var now = actx ? actx.currentTime : 0, audible = false;
    if(synth){ var L = synth.level(); lvl += (Math.min(1, L * 4.5) - lvl) * .35; audible = L > .002; } else lvl *= .9;
    paintKeys(now); playCursor(now);
    if(audible || pl.on){ scopeWave = audible; drawScope(); } else if(scopeWave){ scopeWave = false; drawScope(); }
  }
  if(!reduce || pl.on || lvl > .01 || heldOrder.length) frameId = requestAnimationFrame(frame);
}
function kick(){ if(!frameId && onScreen) frameId = requestAnimationFrame(frame); }
if("IntersectionObserver" in window){ new IntersectionObserver(function(es){ onScreen = es[0].isIntersecting; if(onScreen) kick(); }, {threshold:0}).observe(synthEl); }
document.addEventListener("visibilitychange", kick);
if(!reduce) kick();
/* ---------- start ---------- */
root.querySelectorAll(".sy-row .knob[data-k]").forEach(function(el){ makeKnob(el, el.dataset.live != null ? liveAudio : schedule); });
drawArch(); drawMix();
var seed = document.getElementById("voiceText"); ta.value = seed ? seed.textContent.replace(/\s+/g, " ").trim() : "";
run();
})();
