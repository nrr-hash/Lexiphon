/* Page behaviour: widow control, the headline, Telltale, the audit, the sentence demonstrations. */
(function(){
"use strict";
var WSEL = "p, li, dd, dt, h1, h2, h3, h4, summary, .p-cap, .fig-l, .fig-t, .ledger li > span:last-child, .pub a, .stress-line, .spine-detail, .sweep-count, .close-line, .weight-note, .role .when, .tagline, .card-meta b, .card-meta .line, .eng-card b, .eng-card span.who, blockquote, h5, .swept, .tt-h, .tt-p, .legend, .ballard, .ba-src, .st b, .st span, .both span, .lane-head p, .checks li, .obs, .plate-note, .armbox figcaption";
function bindLast(el){
  var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
  while((n = tw.nextNode())) nodes.push(n);
  var seenWord = false;
  for(var i = nodes.length-1; i >= 0; i--){
    var t = nodes[i].data;
    for(var j = t.length-1; j >= 0; j--){
      var c = t.charAt(j);
      if(c === "\u00A0"){ if(seenWord) return; }
      else if(/\s/.test(c)){ if(seenWord){ nodes[i].data = t.slice(0,j) + "\u00A0" + t.slice(j+1); return; } }
      else { seenWord = true; }
    }
  }
}
function dewidow(root){ if(root.matches && root.matches(WSEL)) bindLast(root); root.querySelectorAll(WSEL).forEach(bindLast); }
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- weight ramp ---------- */
function ramp(el, lo, hi, seat){
  var text = el.textContent.trim(); var words = text.split(/\s+/);
  var n = seat ? Math.max(1, parseInt(el.dataset.seat || "1", 10)) : 0, from = words.length - n, box = null;
  el.textContent = "";
  words.forEach(function(w,i){
    var s = document.createElement("span"); s.className = "w";
    var t = words.length>1 ? i/(words.length-1) : 1;
    s.style.setProperty("--wt", Math.round(lo + (hi-lo)*Math.pow(t,1.35)));
    s.style.color = "color-mix(in srgb, var(--ink) " + Math.round(55 + 45*t) + "%, var(--slate))";
    s.textContent = w;
    if(n && i >= from && !box){ box = document.createElement("span"); box.className = "seat"; el.appendChild(box); }
    (n && i >= from ? box : el).appendChild(s);
    if(i<words.length-1) (n && i >= from ? box : el).appendChild(document.createTextNode(" "));
  });
}
var lines = document.querySelectorAll("[data-ramp]");
lines.forEach(function(l){ ramp(l, 250, 900, true); });
document.querySelectorAll("[data-ramp-close]").forEach(function(l){ ramp(l, 260, 880, l.hasAttribute("data-seat")); });

/* compounds never break at their hyphen: each hyphenated word is held on one line */
function bindHyphens(root){
  var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: function(n){
    var p = n.parentElement; if(!p || p.closest(".nb, h-nb, script, style, textarea, svg, .spine3d, .swept, dialog")) return NodeFilter.FILTER_REJECT;
    return /[A-Za-z\u00C0-\u024F0-9]-[A-Za-z\u00C0-\u024F]/.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
  var nodes = [], n; while((n = tw.nextNode())) nodes.push(n);
  var rx = /[A-Za-z\u00C0-\u024F0-9\u2019'/]*[A-Za-z\u00C0-\u024F0-9]-[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F0-9\u2019'-]*[.,;:!?)\u201D]?/g;
  nodes.forEach(function(t){
    var s = t.data, last = 0, m, frag = document.createDocumentFragment(); rx.lastIndex = 0;
    while((m = rx.exec(s)) !== null){
      if(m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var sp = document.createElement("h-nb"); sp.textContent = m[0]; frag.appendChild(sp); last = m.index + m[0].length;
    }
    if(last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag, t);
  });
}
bindHyphens(document.body);
dewidow(document.body);
/* opener: strike each tell in turn, then the headline gains its weight */
var tells = document.querySelectorAll("#slopText .tell"), slopN = document.getElementById("slopN");
document.getElementById("slopW").textContent = (document.getElementById("slopText").textContent.match(/[A-Za-z0-9\u2019'-]+/g) || []).length;
document.getElementById("cleanW").textContent = (document.getElementById("cleanText").textContent.match(/[A-Za-z0-9\u2019'-]+/g) || []).length;
var hw = document.querySelectorAll("#headline .w");
hw.forEach(function(w){ w.dataset.wt = w.style.getPropertyValue("--wt"); });
function fitHeadline(){
  var h = document.getElementById("headline"), box = h.parentElement;
  if(window.innerWidth < 700){ h.style.fontSize = ""; return; }
  var clone = h.cloneNode(true); clone.removeAttribute("id");
  clone.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0;font-size:100px;white-space:nowrap";
  clone.querySelectorAll(".w").forEach(function(w){ if(w.dataset.wt) w.style.setProperty("--wt", w.dataset.wt); w.style.transition = "none"; });
  clone.querySelectorAll(".line").forEach(function(l){ l.style.display = "inline-block"; l.style.whiteSpace = "nowrap"; });
  document.body.appendChild(clone);
  var avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft || 0) - parseFloat(getComputedStyle(box).paddingRight || 0);
  function widestAt(px){ clone.style.fontSize = px + "px"; var m = 0; clone.querySelectorAll(".line").forEach(function(l){ m = Math.max(m, l.getBoundingClientRect().width); }); return m; }
  var size = 100;
  for(var it = 0; it < 4; it++){ var wv = widestAt(size); if(wv <= 0) break; size = size * avail / wv; }
  while(widestAt(size) > avail - 1 && size > 20){ size -= 0.5; }
  clone.remove();
  h.style.fontSize = Math.min(150, size).toFixed(2) + "px";
}
fitHeadline();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeadline);
window.addEventListener("resize", fitHeadline);
/* on a phone the headline wraps at its edge, so growing the weights would re-wrap it as it goes: no intro animation there */
if(!reduce && window.innerWidth >= 700){
  hw.forEach(function(w){ w.style.setProperty("--wt", 200); w.style.opacity = .25; });
  setTimeout(function(){ hw.forEach(function(w,i){ setTimeout(function(){ w.style.setProperty("--wt", w.dataset.wt); w.style.opacity = 1; }, i*70); }); }, 450);
}
(function(){
  var fired = false, box = document.getElementById("slopText");
  function play(){
    if(fired) return; fired = true;
    if(!reduce){ tells.forEach(function(t, k){ setTimeout(function(){ t.classList.add("hit"); slopN.textContent = k + 1; }, 300 + k * 170); });
      setTimeout(function(){ document.getElementById("slopAfter").classList.add("show"); }, 300 + tells.length * 170 + 250); }
    else { tells.forEach(function(t){ t.classList.add("hit"); }); slopN.textContent = tells.length; document.getElementById("slopAfter").classList.add("show"); }
  }
  if("IntersectionObserver" in window){ var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ play(); io.disconnect(); } }); }, {threshold: 0.45}); io.observe(box); } else play();
})();

/* ---------- terminal stress ---------- */
var pairs = [
  {name:"Rega", src:"Rega Planar 3 RS concept page, on the plinth.",
   draft:[["It will not ring, "],["which in the end is what matters most about it.","tail"]],
   dseat:"it", dnote:"The fact, <b>ring</b>, arrives early. A trailing clause takes the last beat and hands it to “it”.",
   pub:[["What matters is what it will not do. It will not "],["ring.","seat"]],
   pnote:"Two sentences. The first sets the question; the second lands on <b>ring</b> and stops."},
  {name:"Gordon Murray", src:"T.33 Spider concept page, on downforce.",
   draft:[["All of it goes into the road, and the driver hardly notices it, "],["in practice.","tail"]],
   dnote:"The contrast is buried mid-sentence, and a weak adjunct, “in practice”, holds the seat.",
   pub:[["The driver feels none of it. The road takes "],["all of it.","seat"]],
   pnote:"Tail cut, contrast split in two. Each half lands on its own weight, and the second lands on <b>all of it</b>."},
  {name:"Cambridge Audio", src:"DacMagic 200M concept page, on older amplifiers.",
   draft:[["Nothing needs to be retired, since old systems can learn new catalogues "],["this way.","tail"]],
   dnote:"A reason clause trails after the promise, and the sentence ends on “this way”, which weighs nothing.",
   pub:[["Old systems learn new catalogues. Nothing gets "],["retired.","seat"]],
   pnote:"Scaffolding moved forward into its own sentence. The promise lands last, on <b>retired</b>."}
];
var stressIdx = 0, showPub = false;
var chipsS = document.getElementById("stressChips");
pairs.forEach(function(p,i){
  var b = document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=p.name;
  b.setAttribute("aria-pressed", i===0?"true":"false");
  b.addEventListener("click", function(){ stressIdx=i; chipsS.querySelectorAll(".chip").forEach(function(c,j){c.setAttribute("aria-pressed", j===i?"true":"false");}); drawStress(); });
  chipsS.appendChild(b);
});
var bD = document.getElementById("btnDraft"), bP = document.getElementById("btnPub");
bD.addEventListener("click", function(){ showPub=false; drawStress(); });
bP.addEventListener("click", function(){ showPub=true; drawStress(); });
function drawStress(){
  var p = pairs[stressIdx], segs = showPub ? p.pub : p.draft, line = document.getElementById("stressLine");
  bD.setAttribute("aria-pressed", showPub?"false":"true"); bP.setAttribute("aria-pressed", showPub?"true":"false");
  line.innerHTML = "";
  segs.forEach(function(s){ var sp = document.createElement("span"); if(s[1]) sp.className = s[1]; sp.textContent = s[0]; line.appendChild(sp); });
  document.getElementById("stressSrc").textContent = showPub ? "Final line. " + p.src : "Draft constructed for comparison. " + p.src;
  document.getElementById("stressRead").innerHTML = showPub ? p.pnote : p.dnote;
  dewidow(line); dewidow(document.getElementById("stressRead")); dewidow(document.getElementById("stressSrc"));
}
drawStress();

/* ---------- rhythm meter ---------- */
var ABBR = ["mr","mrs","ms","dr","prof","st","vs","etc","e.g","i.e","no","vol","pp","fig","al","inc","ltd","co","jr","sr"];
function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function splitSentences(text){
  text = text.replace(/(\d)\.(\d)/g, "$1<DOT>$2");
  ABBR.forEach(function(a){ text = text.replace(new RegExp("(^|[^\\w])("+esc(a)+")\\.", "gi"), "$1$2<DOT>"); });
  var parts = text.split(/(?<=[.!?])["'\u201d\u2019)\]]?\s+(?=["'\u201c\u2018(]?[A-Z0-9])/);
  return parts.map(function(p){ return p.replace(/<DOT>/g,".").trim(); }).filter(function(p){ return p && /[A-Za-z0-9]/.test(p); });
}
function wordsIn(s){ return s.match(/[A-Za-z0-9]+(?:['\u2019\-][A-Za-z0-9]+)*/g) || []; }
function stats(lengths){
  var n = lengths.length; if(!n) return null;
  var mean = lengths.reduce(function(a,b){return a+b;},0)/n;
  var sd = Math.sqrt(lengths.reduce(function(a,x){return a+(x-mean)*(x-mean);},0)/n);
  var ac = null;
  if(n>=3){ var den = lengths.reduce(function(a,x){return a+(x-mean)*(x-mean);},0);
    if(den===0){ ac = 0; } else { var num=0; for(var i=0;i<n-1;i++){ num += (lengths[i]-mean)*(lengths[i+1]-mean); } ac = num/den; } }
  return {n:n, words:lengths.reduce(function(a,b){return a+b;},0), cv: mean? sd/mean : 0, ac:ac};
}
var LINCOLN = [26,16,44,32,14,19,8,40,32,22,8,12,38,16,19,13,19,36,8,7,6,25,78,18,68,74];
var passages = [
  {name:"Cambridge Audio", text:"Every digital recording you own, from a lossless download to the Bluetooth stream off your phone, is a waveform measured thousands of times a second and written down as figures. The figures are exact, and the figures are silent. Between your library and your loudspeakers stands one component whose whole job is to turn description back into the thing described, and the quality of everything you will ever hear through your system is decided there, at the moment of translation. DacMagic 200M is built around that moment. Stereo is an illusion of width, and it survives only if the left channel and the right keep out of each other\u2019s affairs. DacMagic 200M assigns a separate ESS DAC to each channel, along fully balanced signal paths. Specified leakage between them at 10kHz: below \u2212110dB, about one part in three hundred thousand. The violins stay on the left of the room, and the room stays wide. Nothing leaks. Nothing narrows."},
  {name:"Rega", text:"Rega\u2019s whole argument sits here, in a slab you might walk straight past. The industry\u2019s reflex is mass: heavier platters, heavier plinths, more weight thrown at the problem of holding the machine still. Rega goes the other way, and has done for half a century. Mass stores energy and gives it back late, smearing the signal as it returns, whereas a structure that is light and genuinely stiff stores almost none and so adds almost nothing of its own to what the stylus is trying to read. The RS plinth is built to be rigid, not heavy. Where the loads gather, between the tonearm mounting and the main hub bearing, Rega bonds a double brace of phenolic resin into a single stressed beam, so that the two points which must never move against each other are locked together into one rigid structure. The plinth you can see is the least interesting thing about it. What matters is what it will not do. It will not ring."},
  {name:"Gordon Murray", text:"Murray has spent a career taking things out. For three decades the supercar grew heavier with each generation, gaining turbochargers and motors and screens and the structure to carry all of it, until weight stopped being a thing engineers fought and quietly became a thing they merely managed. He refused. Underneath sits an iStream carbon monocoque, torsionally stiff, holding its shape against the twist that 617 PS would work into a softer structure. The driveshafts are gun-drilled hollow. The pedals are machined back until only the metal that carries load remains. Five hundred and fifty-seven PS to the tonne is a figure won mostly by what the car does without."},
  {name:"A flat draft", text:"Our platform helps teams create better content much faster. It uses advanced tools to improve every stage of writing. Teams can collaborate easily across many different channels. The results are consistent and reliable every single time. Customers see real improvements in their daily work. This is why leading brands trust our platform."},
  {name:"Lincoln, 1865", lincoln:true}
];
var rText = document.getElementById("rhythmText"), rChips = document.getElementById("rhythmChips");
var currentLincoln = false;
passages.forEach(function(p,i){
  var b = document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=p.name;
  b.setAttribute("aria-pressed", i===0?"true":"false");
  b.addEventListener("click", function(){
    rChips.querySelectorAll(".chip").forEach(function(c,j){ c.setAttribute("aria-pressed", j===i?"true":"false"); });
    if(p.lincoln){ currentLincoln = true; rText.value = "Second Inaugural Address, 4 March 1865. Sentence lengths as measured from the Avalon Project text: " + LINCOLN.join(", ") + "."; rText.readOnly = true; }
    else { currentLincoln = false; rText.readOnly = false; rText.value = p.text; }
    measure();
  });
  rChips.appendChild(b);
});
function drawBars(lengths){
  var box = document.getElementById("bars"), W = 520, H = 150, pad = 4, n = lengths.length;
  if(!n){ box.innerHTML = ""; return; }
  var max = Math.max(30, Math.max.apply(null, lengths)), bw = (W - pad*2)/n;
  var svg = '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">';
  lengths.forEach(function(L,i){
    var h = Math.max(2, (L/max)*(H-16)), x = pad + i*bw + bw*0.12, w = Math.max(2, bw*0.76);
    var short = L <= 8;
    svg += '<rect x="'+x.toFixed(1)+'" y="'+(H-h).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="1.5" fill="'+(short?'var(--carmine)':'var(--ink)')+'" opacity="'+(short?1:0.85)+'"><title>'+L+' words</title></rect>';
  });
  svg += '<line x1="0" y1="'+(H-0.5)+'" x2="'+W+'" y2="'+(H-0.5)+'" stroke="var(--rule)" /></svg>';
  box.innerHTML = svg;
}
function measure(){
  var lengths;
  if(currentLincoln){ lengths = LINCOLN.slice(); }
  else { lengths = splitSentences(rText.value).map(function(s){ return wordsIn(s).length; }).filter(function(n){return n>0;}); }
  var s = stats(lengths); drawBars(lengths);
  document.getElementById("rSent").textContent = s ? s.n : 0;
  document.getElementById("rWords").textContent = s ? s.words : 0;
  document.getElementById("rCV").textContent = s ? s.cv.toFixed(2) : "0";
  document.getElementById("rAC").textContent = s && s.ac!==null ? s.ac.toFixed(2).replace("-","\u2212") : "n/a";
  var v = document.getElementById("rVerdict");
  if(!s || s.n < 3){ v.textContent = "Add at least three sentences to read a pattern."; return; }
  var spread = s.cv >= 0.6 ? "Wide spread" : s.cv >= 0.4 ? "Moderate spread" : "Narrow spread: the lengths barely move";
  var inter = s.ac <= 0.2 ? "long and short alternate" : s.ac <= 0.4 ? "some clumping of similar lengths" : "similar lengths clump together";
  v.textContent = spread + ", and " + inter + ". Short sentences, eight words or fewer, show in red. For reference, Lincoln reads 0.74 and 0.18.";
}
rText.addEventListener("input", measure);
rText.value = passages[0].text; measure();
/* before-and-after readout, measured live */
(function(){
  var t = document.getElementById("baText"); if(!t) return;
  var L = splitSentences(t.textContent).map(function(x){ return wordsIn(x).length; }).filter(function(n){ return n > 0; });
  var st = stats(L); if(!st) return;
  document.getElementById("baS").textContent = st.n; document.getElementById("baW").textContent = st.words;
  document.getElementById("baCV").textContent = st.cv.toFixed(2);
  document.getElementById("baAC").textContent = st.ac === null ? "n/a" : st.ac.toFixed(2).replace("-","\u2212");
  var v = document.getElementById("baV");
  v.textContent = (st.cv >= 0.6 ? "Wide spread" : "Moderate spread") + ", though the two long openers sit together before the short close, so the interleave reads positive. Measured exactly as written.";
  dewidow(v);
})();


/* ---------- sweep ---------- */
var SLOP = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob("W1sxLCAiZGVsdmUgKGFsbCBmb3JtcykiLCAiXFxiZGVsdmUoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJ0YXBlc3RyeSAobWV0YXBob3JpY2FsKSIsICJcXGJ0YXBlc3RyeSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImEgc3ltcGhvbnkgb2YgKG1ldGFwaG9yaWNhbCkiLCAiXFxiYVxccytzeW1waG9ueVxccytvZlxcYiIsICJnaSJdLCBbMSwgInN5bXBob255IChtZXRhcGhvcmljYWwpIiwgIlxcYnN5bXBob255KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAia2FsZWlkb3Njb3BlIChtZXRhcGhvcmljYWwpIiwgIlxcYmthbGVpZG9zY29wZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImEgYmVhY29uIG9mIChtZXRhcGhvcmljYWwpIiwgIlxcYmFcXHMrYmVhY29uXFxzK29mXFxiIiwgImdpIl0sIFsxLCAiYmVhY29uIChtZXRhcGhvcmljYWwpIiwgIlxcYmJlYWNvbig/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImEgdGVzdGFtZW50IHRvIiwgIlxcYmFcXHMrdGVzdGFtZW50XFxzK3RvXFxiIiwgImdpIl0sIFsxLCAiZW1iYXJrIG9uIChhIGpvdXJuZXkpIiwgIlxcYmVtYmFya1xccytvblxcYiIsICJnaSJdLCBbMSwgImpvdXJuZXkgKG1ldGFwaG9yaWNhbCwgbWFya2V0aW5nKSIsICJcXGJqb3VybmV5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAidW5sZWFzaCIsICJcXGJ1bmxlYXNoKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAidW5sb2NrIChtZXRhcGhvcmljYWwpIiwgIlxcYnVubG9ja1xccytcXChtZXRhcGhvcmljYWxcXClcXGIiLCAiZ2kiXSwgWzEsICJ1bmxvY2sgdGhlIHBvdGVudGlhbCBvZiIsICJcXGJ1bmxvY2tcXHMrdGhlXFxzK3BvdGVudGlhbFxccytvZlxcYiIsICJnaSJdLCBbMSwgImVsZXZhdGUgKG1hcmtldGluZyBzZW5zZSkiLCAiXFxiZWxldmF0ZVxccytcXChtYXJrZXRpbmdcXHMrc2Vuc2VcXClcXGIiLCAiZ2kiXSwgWzEsICJlbGV2YXRlIHlvdXIiLCAiXFxiZWxldmF0ZVxccyt5b3VyXFxiIiwgImdpIl0sIFsxLCAiZW1wb3dlciIsICJcXGJlbXBvd2VyKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiZW1wb3dlcmluZyIsICJcXGJlbXBvd2VyaW5nKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiZm9zdGVyIiwgIlxcYmZvc3Rlcig/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgIm51cnR1cmUiLCAiXFxibnVydHVyZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImZvcmdlIChtZXRhcGhvcmljYWwpIiwgIlxcYmZvcmdlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiaGFybmVzcyAobWV0YXBob3JpY2FsKSIsICJcXGJoYXJuZXNzKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAic3BlYXJoZWFkICh2ZXJiKSIsICJcXGJzcGVhcmhlYWQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJzdXBlcmNoYXJnZSIsICJcXGJzdXBlcmNoYXJnZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgInR1cmJvY2hhcmdlIiwgIlxcYnR1cmJvY2hhcmdlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiZ2FtZS1jaGFuZ2VyIiwgIlxcYmdhbWVcXC1jaGFuZ2VyXFxiIiwgImdpIl0sIFsxLCAiZ2FtZS1jaGFuZ2luZyIsICJcXGJnYW1lXFwtY2hhbmdpbmdcXGIiLCAiZ2kiXSwgWzEsICJncm91bmRicmVha2luZyIsICJcXGJncm91bmRicmVha2luZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImN1dHRpbmctZWRnZSIsICJcXGJjdXR0aW5nXFwtZWRnZVxcYiIsICJnaSJdLCBbMSwgInN0YXRlLW9mLXRoZS1hcnQiLCAiXFxic3RhdGVcXC1vZlxcLXRoZVxcLWFydFxcYiIsICJnaSJdLCBbMSwgIm5leHQtbGV2ZWwiLCAiXFxibmV4dFxcLWxldmVsXFxiIiwgImdpIl0sIFsxLCAid29ybGQtY2xhc3MiLCAiXFxid29ybGRcXC1jbGFzc1xcYiIsICJnaSJdLCBbMSwgImJlc3QtaW4tY2xhc3MiLCAiXFxiYmVzdFxcLWluXFwtY2xhc3NcXGIiLCAiZ2kiXSwgWzEsICJ0b3Atbm90Y2giLCAiXFxidG9wXFwtbm90Y2hcXGIiLCAiZ2kiXSwgWzEsICJzeW5lcmd5IiwgIlxcYnN5bmVyZ3koPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJzeW5lcmdpc2UiLCAiXFxic3luZXJnaXNlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAicGFyYWRpZ20gc2hpZnQiLCAiXFxicGFyYWRpZ21cXHMrc2hpZnRcXGIiLCAiZ2kiXSwgWzEsICJob2xpc3RpYyIsICJcXGJob2xpc3RpYyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImVjb3N5c3RlbSAobG9vc2UgbWFya2V0aW5nIHNlbnNlKSIsICJcXGJlY29zeXN0ZW0oPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJsYW5kc2NhcGUgKG1ldGFwaG9yaWNhbDogdGhlIGRpZ2l0YWwgbGFuZHNjYXBlKSIsICJcXGJsYW5kc2NhcGUoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJyZWFsbSAobWV0YXBob3JpY2FsKSIsICJcXGJyZWFsbSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgIm5hdmlnYXRlIChtZXRhcGhvcmljYWwpIiwgIlxcYm5hdmlnYXRlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAibmF2aWdhdGluZyB0aGUgY29tcGxleGl0aWVzIG9mIiwgIlxcYm5hdmlnYXRpbmdcXHMrdGhlXFxzK2NvbXBsZXhpdGllc1xccytvZlxcYiIsICJnaSJdLCBbMSwgInVucGFjayAobWV0YXBob3JpY2FsKSIsICJcXGJ1bnBhY2soPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJkZWVwIGRpdmUiLCAiXFxiZGVlcFxccytkaXZlXFxiIiwgImdpIl0sIFsxLCAiZGl2ZSBpbnRvIiwgIlxcYmRpdmVcXHMraW50b1xcYiIsICJnaSJdLCBbMSwgImxldCdzIGRpdmUgaW4iLCAiXFxibGV0J3NcXHMrZGl2ZVxccytpblxcYiIsICJnaSJdLCBbMSwgIm15cmlhZCIsICJcXGJteXJpYWQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJwbGV0aG9yYSIsICJcXGJwbGV0aG9yYSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgIm11bHRpZmFjZXRlZCIsICJcXGJtdWx0aWZhY2V0ZWQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJpbnRyaWNhdGUiLCAiXFxiaW50cmljYXRlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiaW50cmljYWNpZXMiLCAiXFxiaW50cmljYWNpZXMoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJtZXRpY3Vsb3VzIiwgIlxcYm1ldGljdWxvdXMoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJtZXRpY3Vsb3VzbHkiLCAiXFxibWV0aWN1bG91c2x5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiZWZmb3J0bGVzc2x5IiwgIlxcYmVmZm9ydGxlc3NseSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImJvYXN0cyAodmVudWUgb3IgcHJvZHVjdCBhcyBzdWJqZWN0KSIsICJcXGJib2FzdHMoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJ2aWJyYW50IiwgIlxcYnZpYnJhbnQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJidXN0bGluZyIsICJcXGJidXN0bGluZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgIm5lc3RsZWQiLCAiXFxibmVzdGxlZCg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgInBpY3R1cmVzcXVlIiwgIlxcYnBpY3R1cmVzcXVlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiYnJlYXRodGFraW5nIiwgIlxcYmJyZWF0aHRha2luZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgInN0dW5uaW5nIiwgIlxcYnN0dW5uaW5nKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiY2FwdGl2YXRpbmciLCAiXFxiY2FwdGl2YXRpbmcoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJtZXNtZXJpc2luZyAobWVzbWVyaXppbmcpIiwgIlxcYm1lc21lcmlzaW5nKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAiZW50aHJhbGxpbmciLCAiXFxiZW50aHJhbGxpbmcoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJkYXp6bGluZyIsICJcXGJkYXp6bGluZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImF3ZS1pbnNwaXJpbmciLCAiXFxiYXdlXFwtaW5zcGlyaW5nXFxiIiwgImdpIl0sIFsxLCAiamF3LWRyb3BwaW5nIiwgIlxcYmphd1xcLWRyb3BwaW5nXFxiIiwgImdpIl0sIFsxLCAibXVzdC1zZWUiLCAiXFxibXVzdFxcLXNlZVxcYiIsICJnaSJdLCBbMSwgIm11c3QtaGF2ZSIsICJcXGJtdXN0XFwtaGF2ZVxcYiIsICJnaSJdLCBbMSwgImhpZGRlbiBnZW0iLCAiXFxiaGlkZGVuXFxzK2dlbVxcYiIsICJnaSJdLCBbMSwgInRyZWFzdXJlIHRyb3ZlIiwgIlxcYnRyZWFzdXJlXFxzK3Ryb3ZlXFxiIiwgImdpIl0sIFsxLCAiYSB3ZWFsdGggb2YiLCAiXFxiYVxccyt3ZWFsdGhcXHMrb2ZcXGIiLCAiZ2kiXSwgWzEsICJhIGhvc3Qgb2YiLCAiXFxiYVxccytob3N0XFxzK29mXFxiIiwgImdpIl0sIFsxLCAidmFzdCBhcnJheSIsICJcXGJ2YXN0XFxzK2FycmF5XFxiIiwgImdpIl0sIFsxLCAid2lkZSBhcnJheSIsICJcXGJ3aWRlXFxzK2FycmF5XFxiIiwgImdpIl0sIFsxLCAiZGl2ZXJzZSBhcnJheSIsICJcXGJkaXZlcnNlXFxzK2FycmF5XFxiIiwgImdpIl0sIFsxLCAiZXZlci1ldm9sdmluZyIsICJcXGJldmVyXFwtZXZvbHZpbmdcXGIiLCAiZ2kiXSwgWzEsICJldmVyLWNoYW5naW5nIiwgIlxcYmV2ZXJcXC1jaGFuZ2luZ1xcYiIsICJnaSJdLCBbMSwgInJhcGlkbHkgZXZvbHZpbmciLCAiXFxicmFwaWRseVxccytldm9sdmluZ1xcYiIsICJnaSJdLCBbMSwgImluIHRvZGF5J3MgZmFzdC1wYWNlZCB3b3JsZCIsICJcXGJpblxccyt0b2RheSdzXFxzK2Zhc3RcXC1wYWNlZFxccyt3b3JsZFxcYiIsICJnaSJdLCBbMSwgImluIHRvZGF5J3MgZGlnaXRhbCBhZ2UiLCAiXFxiaW5cXHMrdG9kYXknc1xccytkaWdpdGFsXFxzK2FnZVxcYiIsICJnaSJdLCBbMSwgImluIHRoZSB3b3JsZCBvZiAoYXMgb3BlbmVyKSIsICJcXGJpblxccyt0aGVcXHMrd29ybGRcXHMrb2ZcXGIiLCAiZ2kiXSwgWzEsICJ3ZWxjb21lIHRvIHRoZSB3b3JsZCBvZiIsICJcXGJ3ZWxjb21lXFxzK3RvXFxzK3RoZVxccyt3b3JsZFxccytvZlxcYiIsICJnaSJdLCBbMSwgImltYWdpbmUgYSB3b3JsZCB3aGVyZSIsICJcXGJpbWFnaW5lXFxzK2FcXHMrd29ybGRcXHMrd2hlcmVcXGIiLCAiZ2kiXSwgWzEsICJwaWN0dXJlIHRoaXMiLCAiXFxicGljdHVyZVxccyt0aGlzXFxiIiwgImdpIl0sIFsxLCAibG9vayBubyBmdXJ0aGVyIiwgIlxcYmxvb2tcXHMrbm9cXHMrZnVydGhlclxcYiIsICJnaSJdLCBbMSwgInNheSBnb29kYnllIHRvIiwgIlxcYnNheVxccytnb29kYnllXFxzK3RvXFxiIiwgImdpIl0sIFsxLCAic2F5IGhlbGxvIHRvIiwgIlxcYnNheVxccytoZWxsb1xccyt0b1xcYiIsICJnaSJdLCBbMSwgImVuZGxlc3MgcG9zc2liaWxpdGllcyIsICJcXGJlbmRsZXNzXFxzK3Bvc3NpYmlsaXRpZXNcXGIiLCAiZ2kiXSwgWzEsICJ0aGUgcG9zc2liaWxpdGllcyBhcmUgZW5kbGVzcyIsICJcXGJ0aGVcXHMrcG9zc2liaWxpdGllc1xccythcmVcXHMrZW5kbGVzc1xcYiIsICJnaSJdLCBbMSwgInRha2UgaXQgdG8gdGhlIG5leHQgbGV2ZWwiLCAiXFxidGFrZVxccytpdFxccyt0b1xccyt0aGVcXHMrbmV4dFxccytsZXZlbFxcYiIsICJnaSJdLCBbMSwgInJldm9sdXRpb25pc2UgKG1hcmtldGluZyBzZW5zZSkiLCAiXFxicmV2b2x1dGlvbmlzZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgInJldm9sdXRpb25hcnkgKG1hcmtldGluZyBzZW5zZSkiLCAiXFxicmV2b2x1dGlvbmFyeSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgInRyYW5zZm9ybWF0aXZlIChmaWxsZXIpIiwgIlxcYnRyYW5zZm9ybWF0aXZlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAic2Vpc21pYyBzaGlmdCIsICJcXGJzZWlzbWljXFxzK3NoaWZ0XFxiIiwgImdpIl0sIFsxLCAidW5jaGFydGVkIHRlcnJpdG9yeSIsICJcXGJ1bmNoYXJ0ZWRcXHMrdGVycml0b3J5XFxiIiwgImdpIl0sIFsxLCAic29hciB0byBuZXcgaGVpZ2h0cyIsICJcXGJzb2FyXFxzK3RvXFxzK25ld1xccytoZWlnaHRzXFxiIiwgImdpIl0sIFsxLCAicmVhY2ggbmV3IGhlaWdodHMiLCAiXFxicmVhY2hcXHMrbmV3XFxzK2hlaWdodHNcXGIiLCAiZ2kiXSwgWzEsICJza3lyb2NrZXQiLCAiXFxic2t5cm9ja2V0KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAibGllcyBhdCB0aGUgaGVhcnQgb2YgKGZpbGxlciBsb2NhdG9yKSIsICJcXGJsaWVzXFxzK2F0XFxzK3RoZVxccytoZWFydFxccytvZlxcYiIsICJnaSJdLCBbMSwgInRoZSBiZWF0aW5nIGhlYXJ0IG9mIiwgIlxcYnRoZVxccytiZWF0aW5nXFxzK2hlYXJ0XFxzK29mXFxiIiwgImdpIl0sIFsxLCAiY2FyZWZ1bGx5IGNyYWZ0ZWQiLCAiXFxiY2FyZWZ1bGx5XFxzK2NyYWZ0ZWRcXGIiLCAiZ2kiXSwgWzEsICJleHBlcnRseSBjcmFmdGVkIiwgIlxcYmV4cGVydGx5XFxzK2NyYWZ0ZWRcXGIiLCAiZ2kiXSwgWzEsICJ3aGltc2ljYWwiLCAiXFxid2hpbXNpY2FsKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsxLCAicGxheXMgYSBwaXZvdGFsIHJvbGUgaW4iLCAiXFxicGxheXNcXHMrYVxccytwaXZvdGFsXFxzK3JvbGVcXHMraW5cXGIiLCAiZ2kiXSwgWzEsICJwbGF5cyBhIGNydWNpYWwgcm9sZSBpbiIsICJcXGJwbGF5c1xccythXFxzK2NydWNpYWxcXHMrcm9sZVxccytpblxcYiIsICJnaSJdLCBbMSwgInVuZGVyc2NvcmVzIHRoZSBpbXBvcnRhbmNlIG9mIiwgIlxcYnVuZGVyc2NvcmVzXFxzK3RoZVxccytpbXBvcnRhbmNlXFxzK29mXFxiIiwgImdpIl0sIFsxLCAiaGlnaGxpZ2h0cyB0aGUgaW1wb3J0YW5jZSBvZiIsICJcXGJoaWdobGlnaHRzXFxzK3RoZVxccytpbXBvcnRhbmNlXFxzK29mXFxiIiwgImdpIl0sIFsxLCAiaXQncyBpbXBvcnRhbnQgdG8gbm90ZSB0aGF0IiwgIlxcYml0J3NcXHMraW1wb3J0YW50XFxzK3RvXFxzK25vdGVcXHMrdGhhdFxcYiIsICJnaSJdLCBbMSwgIml0J3Mgd29ydGggbm90aW5nIHRoYXQiLCAiXFxiaXQnc1xccyt3b3J0aFxccytub3RpbmdcXHMrdGhhdFxcYiIsICJnaSJdLCBbMSwgIndoZW4gaXQgY29tZXMgdG8iLCAiXFxid2hlblxccytpdFxccytjb21lc1xccyt0b1xcYiIsICJnaSJdLCBbMSwgImF0IHRoZSBlbmQgb2YgdGhlIGRheSIsICJcXGJhdFxccyt0aGVcXHMrZW5kXFxzK29mXFxzK3RoZVxccytkYXlcXGIiLCAiZ2kiXSwgWzEsICJuZWVkbGVzcyB0byBzYXkiLCAiXFxibmVlZGxlc3NcXHMrdG9cXHMrc2F5XFxiIiwgImdpIl0sIFsxLCAiaW4gYW4gaW5jcmVhc2luZ2x5IFthZGplY3RpdmVdIHdvcmxkIiwgIlxcYmluXFxzK2FuXFxzK2luY3JlYXNpbmdseVxccytcXHcrXFxzK3dvcmxkXFxiIiwgImdpIl0sIFsxLCAidGhlIHBlcmZlY3QgYmxlbmQgb2YiLCAiXFxidGhlXFxzK3BlcmZlY3RcXHMrYmxlbmRcXHMrb2ZcXGIiLCAiZ2kiXSwgWzEsICJhIHBlcmZlY3Qgc3Rvcm0gb2YiLCAiXFxiYVxccytwZXJmZWN0XFxzK3N0b3JtXFxzK29mXFxiIiwgImdpIl0sIFsxLCAid2hldGhlciB5b3UncmUgYSBzZWFzb25lZCBwcm9mZXNzaW9uYWwgb3IgYSBjb21wbGV0ZSBiZWdpbm5lciIsICJcXGJ3aGV0aGVyXFxzK3lvdSdyZVxccythXFxzK3NlYXNvbmVkXFxzK3Byb2Zlc3Npb25hbFxccytvclxccythXFxzK2NvbXBsZXRlXFxzK2JlZ2lubmVyXFxiIiwgImdpIl0sIFsxLCAiZnJvbSBodW1ibGUgYmVnaW5uaW5ncyIsICJcXGJmcm9tXFxzK2h1bWJsZVxccytiZWdpbm5pbmdzXFxiIiwgImdpIl0sIFsxLCAic3RvcmllZCBoaXN0b3J5IiwgIlxcYnN0b3JpZWRcXHMraGlzdG9yeVxcYiIsICJnaSJdLCBbMSwgInJpY2ggaGlzdG9yeSIsICJcXGJyaWNoXFxzK2hpc3RvcnlcXGIiLCAiZ2kiXSwgWzEsICJzdGVlcGVkIGluIGhpc3RvcnkiLCAiXFxic3RlZXBlZFxccytpblxccytoaXN0b3J5XFxiIiwgImdpIl0sIFsxLCAic3RhbmRzIGFzIChlbXB0eSBjb3B1bGEpIiwgIlxcYnN0YW5kc1xccythc1xcYiIsICJnaSJdLCBbMSwgInNob3djYXNlIChmaWxsZXIgdmVyYikiLCAiXFxic2hvd2Nhc2UoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJzaG93Y2FzaW5nIChmaWxsZXIgdmVyYikiLCAiXFxic2hvd2Nhc2luZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMSwgImluIGNvbmNsdXNpb24gKGluIHNob3J0LWZvcm0gY29weSkiLCAiXFxiaW5cXHMrY29uY2x1c2lvblxcYiIsICJnaSJdLCBbMSwgImluIHN1bW1hcnkgKGFzIHJlc3RhdGVtZW50IGNsb3NlcnMgaW4gc2hvcnQgY29weSkiLCAiXFxiaW5cXHMrc3VtbWFyeVxcYiIsICJnaSJdLCBbMSwgInRvIHN1bW1hcmlzZSAoYXMgcmVzdGF0ZW1lbnQgY2xvc2VycyBpbiBzaG9ydCBjb3B5KSIsICJcXGJ0b1xccytzdW1tYXJpc2VcXGIiLCAiZ2kiXSwgWzEsICJBcyBhbiBBSSBsYW5ndWFnZSBtb2RlbCIsICJcXGJhc1xccythblxccythaVxccytsYW5ndWFnZVxccyttb2RlbFxcYiIsICJnaSJdLCBbMSwgIkFzIG9mIG15IGxhc3Qga25vd2xlZGdlIHVwZGF0ZSIsICJcXGJhc1xccytvZlxccytteVxccytsYXN0XFxzK2tub3dsZWRnZVxccyt1cGRhdGVcXGIiLCAiZ2kiXSwgWzEsICJJIGhvcGUgdGhpcyBoZWxwcyIsICJcXGJpXFxzK2hvcGVcXHMrdGhpc1xccytoZWxwc1xcYiIsICJnaSJdLCBbMSwgIkdyZWF0IHF1ZXN0aW9uIiwgIlxcYmdyZWF0XFxzK3F1ZXN0aW9uXFxiIiwgImdpIl0sIFsxLCAiV2hhdCBhIGZhc2NpbmF0aW5nIHF1ZXN0aW9uIiwgIlxcYndoYXRcXHMrYVxccytmYXNjaW5hdGluZ1xccytxdWVzdGlvblxcYiIsICJnaSJdLCBbMSwgIkNlcnRhaW5seSEgKGFzIGEgcmVwbHkgb3BlbmVyKSIsICJcXGJjZXJ0YWlubHkhXFxiIiwgImdpIl0sIFsxLCAic2VhbWxlc3MiLCAiXFxic2VhbWxlc3MoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzEsICJzZWFtbGVzc2x5IiwgIlxcYnNlYW1sZXNzbHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJyb2J1c3QiLCAiXFxicm9idXN0KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAibGV2ZXJhZ2UgKHZlcmIpIiwgIlxcYmxldmVyYWdlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAidXRpbGlzZSAocHJlZmVyIHVzZSkiLCAiXFxidXRpbGlzZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInN0cmVhbWxpbmUiLCAiXFxic3RyZWFtbGluZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInN0cmVhbWxpbmVkIiwgIlxcYnN0cmVhbWxpbmVkKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAib3B0aW1pc2UgKGZpbGxlciBzZW5zZSkiLCAiXFxib3B0aW1pc2UoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJzY2FsYWJsZSIsICJcXGJzY2FsYWJsZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInNjYWxhYmlsaXR5IiwgIlxcYnNjYWxhYmlsaXR5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAiaW5ub3ZhdGl2ZSAoYXMgZmlsbGVyKSIsICJcXGJpbm5vdmF0aXZlKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAiaW5ub3ZhdGlvbiAoYXMgZmlsbGVyKSIsICJcXGJpbm5vdmF0aW9uKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAic29sdXRpb24gKHByb2R1Y3QgZXVwaGVtaXNtKSIsICJcXGJzb2x1dGlvbig/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInNvbHV0aW9ucyAocHJvZHVjdCBldXBoZW1pc20pIiwgIlxcYnNvbHV0aW9ucyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgIm9mZmVyaW5ncyIsICJcXGJvZmZlcmluZ3MoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJiZXN0IHByYWN0aWNlcyIsICJcXGJiZXN0XFxzK3ByYWN0aWNlc1xcYiIsICJnaSJdLCBbMiwgImFjdGlvbmFibGUgaW5zaWdodHMiLCAiXFxiYWN0aW9uYWJsZVxccytpbnNpZ2h0c1xcYiIsICJnaSJdLCBbMiwgImtleSB0YWtlYXdheXMiLCAiXFxia2V5XFxzK3Rha2Vhd2F5c1xcYiIsICJnaSJdLCBbMiwgInN0YWtlaG9sZGVycyAobG9vc2UgdXNlKSIsICJcXGJzdGFrZWhvbGRlcnMoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJhbGlnbiAoY29ycG9yYXRlIGZpbGxlcikiLCAiXFxiYWxpZ24oPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJhbGlnbm1lbnQgKGNvcnBvcmF0ZSBmaWxsZXIpIiwgIlxcYmFsaWdubWVudCg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInRvdWNoIGJhc2UiLCAiXFxidG91Y2hcXHMrYmFzZVxcYiIsICJnaSJdLCBbMiwgImNpcmNsZSBiYWNrIiwgIlxcYmNpcmNsZVxccytiYWNrXFxiIiwgImdpIl0sIFsyLCAibW92ZSB0aGUgbmVlZGxlIiwgIlxcYm1vdmVcXHMrdGhlXFxzK25lZWRsZVxcYiIsICJnaSJdLCBbMiwgImxvdy1oYW5naW5nIGZydWl0IiwgIlxcYmxvd1xcLWhhbmdpbmdcXHMrZnJ1aXRcXGIiLCAiZ2kiXSwgWzIsICJkcmlsbCBkb3duIiwgIlxcYmRyaWxsXFxzK2Rvd25cXGIiLCAiZ2kiXSwgWzIsICJncmFudWxhciIsICJcXGJncmFudWxhcig/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImdyYW51bGFyaXR5IiwgIlxcYmdyYW51bGFyaXR5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAiYmFuZHdpZHRoIChtZXRhcGhvcmljYWwpIiwgIlxcYmJhbmR3aWR0aCg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImNvcmUgY29tcGV0ZW5jeSIsICJcXGJjb3JlXFxzK2NvbXBldGVuY3lcXGIiLCAiZ2kiXSwgWzIsICJ2YWx1ZS1hZGQiLCAiXFxidmFsdWVcXC1hZGRcXGIiLCAiZ2kiXSwgWzIsICJ3aW4td2luIiwgIlxcYndpblxcLXdpblxcYiIsICJnaSJdLCBbMiwgImNvbXByZWhlbnNpdmUgKGZpbGxlcikiLCAiXFxiY29tcHJlaGVuc2l2ZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInNpZ25pZmljYW50IChvdXRzaWRlIHN0YXRpc3RpY3MpIiwgIlxcYnNpZ25pZmljYW50KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAic2lnbmlmaWNhbnRseSAob3V0c2lkZSBzdGF0aXN0aWNzKSIsICJcXGJzaWduaWZpY2FudGx5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAibm90YWJseSIsICJcXGJub3RhYmx5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAibW9yZW92ZXIiLCAiXFxibW9yZW92ZXIoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJmdXJ0aGVybW9yZSIsICJcXGJmdXJ0aGVybW9yZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImFkZGl0aW9uYWxseSIsICJcXGJhZGRpdGlvbmFsbHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJ1bHRpbWF0ZWx5IiwgIlxcYnVsdGltYXRlbHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJhcmd1YWJseSIsICJcXGJhcmd1YWJseSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInVuZG91YnRlZGx5IiwgIlxcYnVuZG91YnRlZGx5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAidW5kZW5pYWJseSIsICJcXGJ1bmRlbmlhYmx5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAiY2VydGFpbmx5IChtaWQtc2VudGVuY2UgYXNzZXJ0aW9uIHByb3BzKSIsICJcXGJjZXJ0YWlubHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJjbGVhcmx5IChtaWQtc2VudGVuY2UgYXNzZXJ0aW9uIHByb3BzKSIsICJcXGJjbGVhcmx5KD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAib2J2aW91c2x5IChtaWQtc2VudGVuY2UgYXNzZXJ0aW9uIHByb3BzKSIsICJcXGJvYnZpb3VzbHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJlc3NlbnRpYWxseSIsICJcXGJlc3NlbnRpYWxseSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImJhc2ljYWxseSIsICJcXGJiYXNpY2FsbHkoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJzaW1wbHkgcHV0IiwgIlxcYnNpbXBseVxccytwdXRcXGIiLCAiZ2kiXSwgWzIsICJpbiBlc3NlbmNlIiwgIlxcYmluXFxzK2Vzc2VuY2VcXGIiLCAiZ2kiXSwgWzIsICJhdCBpdHMgY29yZSIsICJcXGJhdFxccytpdHNcXHMrY29yZVxcYiIsICJnaSJdLCBbMiwgImNvbXBlbGxpbmciLCAiXFxiY29tcGVsbGluZyg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImNydWNpYWwiLCAiXFxiY3J1Y2lhbCg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgInZpdGFsIiwgIlxcYnZpdGFsKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAicGl2b3RhbCIsICJcXGJwaXZvdGFsKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFsyLCAidW5kZXJzY29yZSAodmVyYikiLCAiXFxidW5kZXJzY29yZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImhpZ2hsaWdodCAodmVyYiwgZmlsbGVyKSIsICJcXGJoaWdobGlnaHQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJzZXJ2ZSBhcyIsICJcXGJzZXJ2ZVxccythc1xcYiIsICJnaSJdLCBbMiwgInNlcnZlcyBhcyIsICJcXGJzZXJ2ZXNcXHMrYXNcXGIiLCAiZ2kiXSwgWzIsICJpcyBob21lIHRvIiwgIlxcYmlzXFxzK2hvbWVcXHMrdG9cXGIiLCAiZ2kiXSwgWzIsICJkYXRlcyBiYWNrIHRvIiwgIlxcYmRhdGVzXFxzK2JhY2tcXHMrdG9cXGIiLCAiZ2kiXSwgWzIsICJzaGVkIGxpZ2h0IG9uIiwgIlxcYnNoZWRcXHMrbGlnaHRcXHMrb25cXGIiLCAiZ2kiXSwgWzIsICJleHBsb3JlIChhcyBmaWxsZXIgdHJhbnNpdGlvbikiLCAiXFxiZXhwbG9yZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImNyYWZ0ZWQgKHN0YW5kYWxvbmUpIiwgIlxcYmNyYWZ0ZWQoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJzZWFzb25lZCAoYXMgaW4gc2Vhc29uZWQgcHJvZmVzc2lvbmFsKSIsICJcXGJzZWFzb25lZCg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImluIG9yZGVyIHRvIChwcmVmZXIgdG8pIiwgIlxcYmluXFxzK29yZGVyXFxzK3RvXFxiIiwgImdpIl0sIFsyLCAidmVyeSB1bmlxdWUgKGFuZCBhbGwgYWJzb2x1dGUtbW9kaWZpZXIgYWJ1c2UpIiwgIlxcYnZlcnlcXHMrdW5pcXVlXFxiIiwgImdpIl0sIFsyLCAiY29uY3JldGUgKHJlZmxleCBhZGplY3RpdmUgYmVmb3JlIGV2aWRlbmNlIG9yIGV4YW1wbGVzKSIsICJcXGJjb25jcmV0ZSg/OnN8ZXN8ZWR8ZHxpbmd8bHkpP1xcYiIsICJnaSJdLCBbMiwgImR5bmFtaWMgKGZpbGxlciBhZGplY3RpdmUpIiwgIlxcYmR5bmFtaWMoPzpzfGVzfGVkfGR8aW5nfGx5KT9cXGIiLCAiZ2kiXSwgWzIsICJpbXBhY3RmdWwiLCAiXFxiaW1wYWN0ZnVsKD86c3xlc3xlZHxkfGluZ3xseSk/XFxiIiwgImdpIl0sIFszLCAiVGhlIG5lZ2F0aXZlLXBhcmFsbGVsaXNtIHBpdm90OiBcIkl0J3Mgbm90IGp1c3QgWCIsICJcXGIoPzppdCc/c3x0aGlzIGlzKVxccytub3RcXHMranVzdFxcYnxcXGJpc24nP3RcXHMrYWJvdXRcXGIuezAsNjB9XFxiaXQnP3NcXHMrYWJvdXRcXGIiLCAiZ2kiXSwgWzMsICJcIm5vdCBvbmx5IC4uLiBidXQgYWxzb1wiIGFzIGEgZGVmYXVsdCBpbnRlbnNpZmllciIsICJcXGJub3Qgb25seVxcYi57MCw4MH1cXGJidXQgYWxzb1xcYiIsICJnaSJdLCBbMywgIlRoZSBlbSBkYXNoIGludGVycnVwdGlvbiBoYWJpdCIsICJcXHUyMDE0IiwgImdpIl0sIFszLCAiVGhlIGF1ZGllbmNlIHRyaWFkOiBcIndoZXRoZXIgeW91J3JlIFgsIFksIG9yIFpcIiIsICJcXGJ3aGV0aGVyIHlvdSc/cmVcXGIiLCAiZ2kiXSwgWzMsICJcIkxldCdzIGV4cGxvcmVcIiBhbmQga2luIGFzIHNlY3Rpb24gdHJhbnNpdGlvbnMiLCAiXFxibGV0Jz9zICg/OmV4cGxvcmV8ZGl2ZXx0YWtlIGEgbG9va3x1bnBhY2t8bG9vayBhdClcXGIiLCAiZ2kiXSwgWzMsICJUcmFpbGluZyBwYXJ0aWNpcGlhbCB0YWlsczogXCJtYWtpbmcgaXRcIiwgXCJlbnN1cmluZyB0aGF0XCIsIFwiYWxsb3dpbmcgeW91IHRvXCIuIERvdWJseSBiYW5uZWQ6IHNsb3AsIGFuZCBhIHN0b2xlbiB0ZXJtaW5hbCBzZWF0IiwgIlxcYig/Om1ha2luZyBpdHxlbnN1cmluZyB0aGF0fGFsbG93aW5nIHlvdSB0b3xlbmFibGluZyB5b3UgdG8pXFxiIiwgImdpIl0sIFszLCAiXCJlbnN1cmluZ1wiIGNoYWlucyIsICJcXGJlbnN1cmluZ1xcYiIsICJnaSJdLCBbMywgIkhlZGdpbmcgc3RhY2tzIiwgIlxcYml0IGNvdWxkIHBlcmhhcHMgYmUgYXJndWVkXFxifFxcYml0IG1pZ2h0IGJlIHNhaWQgdGhhdFxcYiIsICJnaSJdLCBbMywgIlRoZSBcIlg6IFdoeSBZIE1hdHRlcnNcIiBjb2xvbiBoZWFkbGluZSB0ZW1wbGF0ZSIsICJbXlxcbjpdezMsNjB9Olxccyp3aHlcXHMrW15cXG5dezIsNjB9XFxibWF0dGVyc1xcYiIsICJnaSJdLCBbMywgIkVtb2ppIGluIHByb2Zlc3Npb25hbCBjb3B5IiwgIltcXHV7MUYzMDB9LVxcdXsxRkFGRn1cXHUyNjAwLVxcdTI3QkZdIiwgImdpdSJdLCBbMywgIlRoZSBib3RoLXNpZGVzIGNsb3NlciIsICJcXGJ0aGUgY2hvaWNlIGRlcGVuZHMgb24geW91clxcYnxcXGJkZXBlbmRzIG9uIHlvdXIgKD86bmVlZHN8cHJpb3JpdGllcylcXGIiLCAiZ2kiXSwgWzMsICJTaWducG9zdCBzdGFja2luZyIsICJcXGIoPzptb3Jlb3ZlcnxmdXJ0aGVybW9yZXxhZGRpdGlvbmFsbHkpXFxiW14uXXswLDIwMH1cXC5bXi5dezAsMjAwfVxcYig/Om1vcmVvdmVyfGZ1cnRoZXJtb3JlfGFkZGl0aW9uYWxseSlcXGIiLCAiZ2kiXSwgWzMsICJUaGUgdGltZS1vcmllbnRpbmcgZm9ybXVsYTogXCJJbiB0aGUgeWVhcnMgdGhhdCBmb2xsb3dlZCwgWCBiZWNhbWUgWVwiIiwgIlxcYmluIHRoZSB5ZWFycyB0aGF0IGZvbGxvd2VkXFxiIiwgImdpIl0sIFszLCAiQW50aXRoZXNpcyBzY2FmZm9sZCBvdmVydXNlIiwgIlxcYndoaWxlIHNvbWUgYXJndWVcXGIuezAsODB9XFxib3RoZXJzICg/OmNvbnRlbmR8YXJndWV8bWFpbnRhaW4pXFxiIiwgImdpIl1d"), function(c){ return c.charCodeAt(0); })));
/* patterns are normalised on load: doctrine notes in brackets are labels, not text; both apostrophes match; consonant-y words take -ies and -ied */
function fixRx(src){
  src = src.replace(/\\s\+\\\([^)]*\\\)/g, "");
  src = src.replace(/\\?'/g, "['\u2019]");
  src = src.replace(/([b-df-hj-np-tv-z])y\(\?:s\|es\|ed\|d\|ing\|ly\)\?/g, "$1(?:y(?:s|ed|ing|ly)?|ies|ied)");
  return src;
}
var SLOPRX = SLOP.map(function(x){ try{ return {t:x[0], label:x[1], rx:new RegExp(fixRx(x[2]), x[3])}; }catch(e){ return null; } }).filter(Boolean);
window.LEXI_TELLS = SLOPRX; /* shared with Lexiphon’s draft check */
var sweepSets = [
  {name:"A machine draft", note:"Constructed for the demonstration.", text:"In today\u2019s evolving landscape, our platform serves as a testament to what teams can achieve. Additionally, it boasts a vibrant community that fosters collaboration and underscores our commitment to excellence. Let\u2019s delve into the intricate tapestry of features that showcase why we are a pivotal, groundbreaking partner."},
  {name:"Rega", note:"Rega Planar 3 RS concept page, on the arm.", text:"The RB330 is the part that quietly explains why a Rega punches so far above its station. Its job is unglamorous and absolute: hold the cartridge rigidly, move with almost no friction, and add no resonance of its own. The bearings are the tell. Rega specifies no measurable free play in them at all, and in practice one or two microns of pre load, a clearance finer than the eye can resolve. An arm with play does not lose detail so much as invent it. The RB330 has none to invent."},
  {name:"Gordon Murray", note:"T.33 Spider concept page, on the engine.", text:"Nothing forces the charge in. A ram scoop feeds four throttle bodies, the intake pressure rising with road speed to pack each cylinder fuller, the volumetric work done by motion, and as the spent gas leaves through the Inconel manifolds its trailing low pressure helps draw the next charge down. Three-quarters of the torque stands ready at 2,500 rpm, so the response carries almost none of the hysteresis a turbocharger sets between the foot and the engine. The needle answers at once."}
];
var swept = document.getElementById("swept"), sweepText = document.getElementById("sweepText"), sChips = document.getElementById("sweepChips");
var sweepNote = "";
function escHtml(s){ return s.replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function runSweep(text){
  var shr = document.getElementById("sweepShare"); if(shr){ shr.hidden = true; document.getElementById("sweepShareNote").textContent = ""; document.getElementById("sweepShareField").hidden = true; }
  var found = [];
  SLOPRX.forEach(function(p){ p.rx.lastIndex = 0; var m; while((m = p.rx.exec(text)) !== null){ if(m[0].length === 0){ p.rx.lastIndex++; continue; } found.push({s:m.index, e:m.index + m[0].length, t:p.t, label:p.label}); } });
  found.sort(function(a, b){ return a.s - b.s || (b.e - b.s) - (a.e - a.s) || a.t - b.t; });
  var keep = [], end = -1; found.forEach(function(f){ if(f.s >= end){ keep.push(f); end = f.e; } });
  var out = "", last = 0, n = {1:0, 2:0, 3:0};
  keep.forEach(function(f){ n[f.t]++; out += escHtml(text.slice(last, f.s)) + '<mark class="t' + f.t + '" title="' + escHtml(f.label) + '">' + escHtml(text.slice(f.s, f.e)) + "</mark>"; last = f.e; });
  out += escHtml(text.slice(last)); swept.innerHTML = out || "<span style='color:var(--slate)'>Nothing to test yet.</span>"; dewidow(swept);
  var words = (text.match(/[A-Za-z0-9\u2019']+/g)||[]).length, hits = keep.length;
  var c = document.getElementById("sweepCount"), sub = document.getElementById("sweepSub");
  if(!words){ c.textContent = ""; sub.textContent = ""; return; }
  if(hits === 0){ c.textContent = "Clean. Nothing from the house list in " + words + " words."; }
  else {
    var parts = []; if(n[1]) parts.push(n[1] + " to rewrite on sight"); if(n[2]) parts.push(n[2] + " needing a reason"); if(n[3]) parts.push(n[3] + " structural");
    c.textContent = hits + (hits === 1 ? " tell" : " tells") + " in " + words + " words: " + parts.join(", ") + "." + (hits >= 8 ? " It said nothing, " + hits + " times." : "");
  }
  sub.textContent = sweepNote; dewidow(c); dewidow(sub);
  if(shr && !sweepText.hidden) shr.hidden = false;
}
sweepSets.forEach(function(p,i){
  var b = document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=p.name;
  b.setAttribute("aria-pressed", i===0?"true":"false");
  b.addEventListener("click", function(){
    sChips.querySelectorAll(".chip").forEach(function(c,j){ c.setAttribute("aria-pressed", j===i?"true":"false"); });
    sweepText.hidden = true; swept.hidden = false; sweepNote = p.note; runSweep(p.text);
  });
  sChips.appendChild(b);
});
/* a visitor's own result, ready to carry back to their team */
var SHARE_URL = "https://nrr-hash.github.io/Lexiphon/";
document.getElementById("sweepCopy").addEventListener("click", function(){
  var line = document.getElementById("sweepCount").textContent.replace(/\u00a0/g, " ") + " Checked with Telltale, by Nathaniel Robertson: " + SHARE_URL;
  var note = document.getElementById("sweepShareNote"), f = document.getElementById("sweepShareField");
  function manual(){ f.hidden = false; f.value = line; f.focus(); f.select(); note.textContent = "Select the line and copy it."; }
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(line).then(function(){ f.hidden = true; note.textContent = "Copied, with a link back to the test."; }, manual); } else manual(); }catch(e){ manual(); }
});
document.getElementById("sweepEdit").addEventListener("click", function(){
  sChips.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed","false"); });
  sweepText.hidden = false; sweepText.value = ""; sweepText.focus(); sweepNote = "Your text, tested as you type. Nothing leaves this page.";
  runSweep("");
});
sweepText.addEventListener("input", function(){ runSweep(sweepText.value); });
sweepNote = sweepSets[0].note; runSweep(sweepSets[0].text);

/* ---------- self-audit: this page's own copy, run through the same list on every load ---------- */
(function(){
  var out = document.getElementById("auditR"), list = document.getElementById("auditL");
  if(!out || !list) return;
  var EXHIBITS = "#slopText, #swept, #sweepText, .ba-before blockquote, .cite, .stress-line, textarea, script, style, dialog, .audit, .sy-text, .sy-lines, .sy-draft, .sy-tape-wrap";
  var REASONS = [
    [/Furnitubes: Solutions/, "The title of Furnitubes’ own page, cited by name."],
    [/technical building solutions/, "Part of a sector name, technical building solutions."],
    [/Innovation Park/, "Part of a proper name, Vodafone’s Innovation Park."],
    [/Intel-optimised/, "Part of a technical term, Intel-optimised."],
    [/“optimised”/, "Cambridge Audio’s word, quoted under examination."],
    [/CEFR-aligned/, "Part of a technical term, CEFR-aligned."]
  ];
  var chunks = [];
  function walk(n){
    if(n.nodeType === 1){ if(n.matches(EXHIBITS)) return; if(getComputedStyle(n).display === "none") return; for(var c = n.firstChild; c; c = c.nextSibling) walk(c); }
    else if(n.nodeType === 3){ chunks.push(n.data); }
  }
  ["header.mast", "main", "footer"].forEach(function(q){ var r = document.querySelector(q); if(r) walk(r); });
  var text = chunks.join(" ").replace(/\s+/g, " ");
  var found = [];
  SLOPRX.forEach(function(p){ p.rx.lastIndex = 0; var m; while((m = p.rx.exec(text)) !== null){ if(!m[0].length){ p.rx.lastIndex++; continue; } found.push({s:m.index, e:m.index + m[0].length, t:p.t, label:p.label, hit:m[0]}); } });
  found.sort(function(a, b){ return a.s - b.s || (b.e - b.s) - (a.e - a.s) || a.t - b.t; });
  var keep = [], end = -1; found.forEach(function(f){ if(f.s >= end){ keep.push(f); end = f.e; } });
  var n = {1:0, 2:0, 3:0}, unexplained = 0;
  var words = (text.match(/[A-Za-z0-9\u2019']+/g) || []).length;
  list.innerHTML = "";
  keep.forEach(function(f){
    n[f.t]++;
    var win = text.slice(Math.max(0, f.s - 40), f.e + 40), why = null; for(var ri = 0; ri < REASONS.length; ri++){ if(REASONS[ri][0].test(win)){ why = REASONS[ri][1]; break; } }
    if(!why) unexplained++;
    var li = document.createElement("li");
    li.innerHTML = "<b>“" + escHtml(f.hit) + "”</b>, " + (f.t === 1 ? "to rewrite on sight" : f.t === 2 ? "needs a reason" : "structural pattern") + ". " + escHtml(why || "No reason recorded. This one should be rewritten.");
    list.appendChild(li);
  });
  if(!keep.length){ var li0 = document.createElement("li"); li0.textContent = "Nothing from the list was found."; list.appendChild(li0); }
  function say(k, one, many){ return k === 0 ? "no " + many : k + " " + (k === 1 ? one : many); }
  out.textContent = words.toLocaleString("en-GB") + " words tested: " + say(n[1], "phrase", "phrases") + " to rewrite on sight, " + say(n[2], "word", "words") + " needing a reason, and " + say(n[3], "structural pattern", "structural patterns") + "." + (keep.length ? (unexplained ? " " + unexplained + " without a recorded reason." : " Every mark has its reason below.") : "");
  dewidow(document.getElementById("audit"));
})();

/* ---------- sentence craft tabs ---------- */
(function(){
  var tabs = [document.getElementById("tabStress"), document.getElementById("tabRhythm")];
  if(!tabs[0]) return;
  function show(k, focus){
    tabs.forEach(function(t, i){
      var on = i === k; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if(focus) tabs[k].focus();
    if(k === 1 && typeof measure === "function") measure();
  }
  tabs.forEach(function(t, i){
    t.addEventListener("click", function(){ show(i, false); });
    t.addEventListener("keydown", function(e){
      if(e.key === "ArrowRight" || e.key === "ArrowLeft"){ e.preventDefault(); show((i + 1) % 2, true); }
      if(e.key === "Home"){ e.preventDefault(); show(0, true); }
      if(e.key === "End"){ e.preventDefault(); show(1, true); }
    });
  });
})();

/* ---------- in-page navigation without URLs ---------- */
document.querySelectorAll("[data-go]").forEach(function(b){
  b.addEventListener("click", function(e){ var t = document.getElementById(b.dataset.go); if(!t) return; var f = t.closest("details.fold"); if(f) f.open = true; if(t.classList.contains("demo-folded") && window.LEXI_UNFOLD) window.LEXI_UNFOLD(t); if(b.tagName === "A") e.preventDefault(); t.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"}); if(/^role-/.test(t.id)){ t.classList.remove("arrived"); void t.offsetWidth; t.classList.add("arrived"); } });
});

/* ---------- spine ---------- */
var surfaces = [
  {t:"Product essay", built:true, r:"The discerning buyer, on the product page. Six movements on one conceit: translation."},
  {t:"Dealer card", r:"The shopper at the shelf. Input count, headphone output, weight, and trial, all restated from the specification."},
  {t:"Owner’s forum voice", r:"The late-night listener. A drafted persona, labelled as such, and still held to the verbatim figures."},
  {t:"AI answer blocks", r:"Built for extraction and citation: self-contained answers of forty to sixty words, each figure attributed."},
  {t:"Buyer FAQ", r:"The first-time buyer, unsure. The questions buyers actually ask, with no figure dragged in for effect."},
  {t:"Image-to-video prompt", r:"The social feed. The product photograph holds the truth, so the prompt describes motion only."}
];
var svg = document.getElementById("spineSvg"), NS = "http://www.w3.org/2000/svg", cx = 260, cy = 200, R = 150;
function el(n, attrs, txt){ var e = document.createElementNS(NS, n); for(var k in attrs) e.setAttribute(k, attrs[k]); if(txt) e.textContent = txt; return e; }
var det = document.getElementById("spineDetail");
surfaces.forEach(function(s,i){
  var ang = -Math.PI/2 + i*(2*Math.PI/6), x = cx + R*Math.cos(ang), y = cy + R*Math.sin(ang)*0.86;
  svg.appendChild(el("line",{x1:cx,y1:cy,x2:x,y2:y,stroke:"var(--rule)","stroke-width":1.5}));
  s.x = x; s.y = y;
});
svg.appendChild(el("circle",{cx:cx,cy:cy,r:58,fill:"var(--carmine)"}));
svg.appendChild(el("text",{x:cx,y:cy-6,"text-anchor":"middle","font-size":"15","font-weight":"700",fill:"var(--paper)"},"One spine"));
svg.appendChild(el("text",{x:cx,y:cy+14,"text-anchor":"middle","font-size":"12",fill:"var(--paper)"},"verified once"));
surfaces.forEach(function(s,i){
  var g = el("g",{"class":"node",tabindex:"0",role:"button","aria-label":s.t});
  g.appendChild(el("circle",{cx:s.x,cy:s.y,r:11,fill:s.built?"var(--ink)":"var(--paper-2)",stroke:"var(--ink)","stroke-width":1.8}));
  var below = s.y > cy + 10, above = s.y < cy - 10;
  var ty = above ? s.y - 20 : below ? s.y + 30 : s.y + 30;
  g.appendChild(el("text",{x:s.x,y:ty,"text-anchor":"middle","font-size":"14","font-weight":"600",fill:"var(--ink)"},s.t));
  function pick(){ det.innerHTML = "<b>"+escHtml(s.t)+"</b><span>"+escHtml(s.r)+"</span>"; dewidow(det.querySelector("span")); dewidow(det.querySelector("b")); svg.querySelectorAll(".node circle").forEach(function(c){ c.setAttribute("stroke","var(--ink)"); c.setAttribute("stroke-width","1.8"); }); g.querySelector("circle").setAttribute("stroke","var(--carmine)"); g.querySelector("circle").setAttribute("stroke-width","3.5"); }
  g.addEventListener("click", pick);
  g.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); pick(); } });
  svg.appendChild(g);
  if(i===0) pick();
});

/* ---------- content engine in 3D ---------- */
(function(){
  var host = document.getElementById("spine3d"), canvas = document.getElementById("spineCanvas"), layer = document.getElementById("engCards");
  var WHO = ["The discerning buyer", "The shopper at the shelf", "The late-night listener", "Search and AI answers", "The first-time buyer", "The social feed"];
  var api = null, sel = 0, cards = [];
  function select(i){
    sel = i; var s = surfaces[i];
    det.innerHTML = "<b>" + escHtml(s.t) + "</b><span>" + escHtml(s.r) + "</span>"; dewidow(det.querySelector("span"));
    cards.forEach(function(c, k){ c.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    if(api){ api.focus(i); }
    else { svg.querySelectorAll(".node circle").forEach(function(c, k){ c.setAttribute("stroke", k === i ? "var(--amber)" : "var(--ink)"); c.setAttribute("stroke-width", k === i ? "3.5" : "1.8"); }); }
  }
  svg.querySelectorAll(".node").forEach(function(g, k){ g.addEventListener("click", function(){ select(k); }); });
  function webglOK(){ try{ var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }catch(e){ return false; } }
  function upgrade(){
  if(window.THREE && webglOK()){
    try{
      host.hidden = false;
      surfaces.forEach(function(s, i){
        var b = document.createElement("button"); b.type = "button"; b.className = "eng-card" + (s.built ? " built" : "");
        b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", s.t + ", for " + WHO[i]);
        b.innerHTML = '<p class="row1"><span class="tag">' + (s.built ? "Built" : "Drafted") + '</span><span class="idx">' + (i + 1) + " / " + surfaces.length + '</span></p><b>' + escHtml(s.t) + '</b><span class="who">' + escHtml(WHO[i]) + '</span>';
        b.addEventListener("click", function(){ select(i); }); layer.appendChild(b); cards.push(b);
      });
      dewidow(layer); api = build(); svg.style.display = "none";
    }catch(e){ host.hidden = true; svg.style.display = ""; api = null; layer.innerHTML = ""; cards = []; }
    select(sel);
  }
  }
  select(0);
  /* the 3D view is an enhancement on the SVG: fetch three.js only when the section is about to be seen */
  function loadThree(cb){ if(window.THREE) return cb(); var s = document.createElement("script"); s.src = "js/vendor/three.min.js"; s.onload = cb; document.head.appendChild(s); }
  var spineEl = document.querySelector("#spine .panel") || document.getElementById("spine"); /* the panel, so a folded demo on a phone loads nothing */
  if("IntersectionObserver" in window && spineEl){ new IntersectionObserver(function(es, ob){ if(es[0].isIntersecting){ ob.disconnect(); loadThree(upgrade); } }, {rootMargin:"700px 0px"}).observe(spineEl); }
  else loadThree(upgrade);

  function build(){
    var T = window.THREE, ORANGE = new T.Color("#E8832E"), SAGE = new T.Color("#9FC2AE"), MINT = new T.Color("#CFE6D8");
    var renderer = new T.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(36, 1.4, 0.1, 100);
    scene.fog = new T.Fog(0x0B1714, 14, 26);
    scene.add(new T.AmbientLight(0xffffff, 0.35));
    var key = new T.PointLight(0xE8832E, 2.2, 14); key.position.set(0, 0, 0); scene.add(key);
    var fill = new T.DirectionalLight(0xCFE6D8, 0.7); fill.position.set(-4, 6, 6); scene.add(fill);

    function glowTex(inner, outer){
      var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(0.35, outer); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
    }
    var GLOW = glowTex("rgba(255,214,170,1)", "rgba(232,131,46,.45)");

    /* core */
    var core = new T.Group(); scene.add(core);
    var gem = new T.Mesh(new T.IcosahedronGeometry(0.72, 0), new T.MeshStandardMaterial({color: 0xE8832E, emissive: 0x8A3A0C, emissiveIntensity: 0.9, flatShading: true, roughness: 0.3, metalness: 0.35}));
    core.add(gem);
    var cage = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.22, 1)), new T.LineBasicMaterial({color: SAGE, transparent: true, opacity: 0.55}));
    core.add(cage);
    var halo = new T.Sprite(new T.SpriteMaterial({map: GLOW, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false}));
    halo.scale.set(4.4, 4.4, 1); core.add(halo);
    function ringMesh(r, tube, col, op){ return new T.Mesh(new T.TorusGeometry(r, tube, 6, 160), new T.MeshBasicMaterial({color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false})); }
    var o1 = ringMesh(1.7, 0.012, ORANGE, 0.9); o1.rotation.x = Math.PI / 2.3; core.add(o1);
    var o2 = ringMesh(1.95, 0.008, SAGE, 0.6); o2.rotation.x = Math.PI / 1.7; o2.rotation.y = 0.6; core.add(o2);

    /* particle field: the fact base as data */
    var PN = 520, pg = new T.BufferGeometry(), pp = new Float32Array(PN * 3);
    for(var n = 0; n < PN; n++){ var rr = 5.2 + Math.random() * 3.2, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pp[n*3] = rr * Math.sin(ph) * Math.cos(th); pp[n*3+1] = rr * Math.cos(ph) * 0.55; pp[n*3+2] = rr * Math.sin(ph) * Math.sin(th); }
    pg.setAttribute("position", new T.BufferAttribute(pp, 3));
    var field = new T.Points(pg, new T.PointsMaterial({color: MINT, size: 0.045, transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending}));
    scene.add(field);

    /* floor grid */
    var grid = new T.PolarGridHelper(6.8, 12, 6, 96, 0x2F5A4B, 0x24453A); grid.position.y = -1.9; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);

    /* ring of surface anchors, light-streams and pulses */
    var ring = new T.Group(); scene.add(ring);
    var R = 4.5, N6 = surfaces.length, anchors = [], pulses = [];
    for(var i = 0; i < N6; i++){
      var ang = i * Math.PI * 2 / N6, y = (i % 2 ? -0.12 : 0.12), pos = new T.Vector3(Math.sin(ang) * R, y, Math.cos(ang) * R);
      var a = new T.Object3D(); a.position.copy(pos); a.userData = {ang: ang, i: i}; ring.add(a); anchors.push(a);
      var curve = new T.QuadraticBezierCurve3(new T.Vector3(0, 0, 0), new T.Vector3(pos.x * 0.5, pos.y + 1.1, pos.z * 0.5), pos);
      ring.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(48)), new T.LineBasicMaterial({color: ORANGE, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false})));
      for(var k = 0; k < 3; k++){
        var sp = new T.Sprite(new T.SpriteMaterial({map: GLOW, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false}));
        sp.scale.set(0.42, 0.42, 1); sp.userData = {c: curve, t: k / 3 + i * 0.09}; ring.add(sp); pulses.push(sp);
      }
      var node = new T.Mesh(new T.SphereGeometry(0.06, 12, 12), new T.MeshBasicMaterial({color: ORANGE})); node.position.copy(pos); ring.add(node);
    }

    /* sizing */
    var W = 0, H = 0;
    function size(){
      W = host.clientWidth; H = Math.round(Math.min(500, Math.max(360, W * 0.8)));
      renderer.setSize(W, H, false); canvas.style.height = H + "px";
      camera.aspect = W / H; var halfTan = Math.tan(camera.fov * Math.PI / 360), need = W < 560 ? 2 * R + 2.4 : 2 * R + 2.6;
      var d = Math.max(11, need / (2 * halfTan * camera.aspect) + 0.6);
      camera.position.set(0, d * 0.62, d); camera.lookAt(0, 0.25, 0); camera.updateProjectionMatrix();
    }
    size();
    if(window.ResizeObserver){ new ResizeObserver(size).observe(host); } else { window.addEventListener("resize", size); }

    /* interaction */
    var target = null, holdUntil = 0, dragging = false, lastX = 0, vel = 0, hovering = false;
    host.addEventListener("pointerenter", function(){ hovering = true; });
    host.addEventListener("pointerleave", function(){ hovering = false; holdUntil = performance.now() + 1200; });
    layer.addEventListener("focusin", function(){ hovering = true; });
    layer.addEventListener("focusout", function(){ hovering = false; });
    canvas.addEventListener("pointerdown", function(e){ dragging = true; lastX = e.clientX; vel = 0; target = null; canvas.classList.add("dragging"); if(canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId); wake(); });
    canvas.addEventListener("pointermove", function(e){ if(!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; ring.rotation.y += dx * 0.009; vel = dx * 0.009; holdUntil = performance.now() + 4000; wake(); });
    function end(){ dragging = false; canvas.classList.remove("dragging"); }
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    function norm(a){ while(a > Math.PI) a -= Math.PI * 2; while(a < -Math.PI) a += Math.PI * 2; return a; }
    var api = {focus: function(i){ target = ring.rotation.y + norm(-anchors[i].userData.ang - ring.rotation.y); holdUntil = performance.now() + 6000; if(reduce){ ring.rotation.y = target; target = null; } wake(); }};

    /* loop */
    var visible = true, raf = 0, last = performance.now(), v = new T.Vector3(), wp = new T.Vector3();
    function place(){
      anchors.forEach(function(a, k){
        a.getWorldPosition(wp); v.copy(wp).project(camera);
        var x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H, depth = (wp.z + R) / (2 * R);
        var sc = 0.74 + depth * 0.3, c = cards[k];
        c.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-50%) scale(" + sc.toFixed(3) + ")";
        c.style.opacity = (0.42 + depth * 0.58).toFixed(3); c.style.zIndex = String(Math.round(depth * 100) + (k === sel ? 200 : 0));
      });
    }
    function frame(now){
      raf = 0; var dt = Math.min(0.05, (now - last) / 1000), tt = now / 1000; last = now;
      if(!reduce){
        gem.rotation.y += dt * 0.5; gem.rotation.x += dt * 0.2; cage.rotation.y -= dt * 0.16; cage.rotation.z += dt * 0.05;
        o1.rotation.z += dt * 0.4; o2.rotation.z -= dt * 0.25; field.rotation.y += dt * 0.02;
        var pulse = 1 + Math.sin(tt * 2.2) * 0.06; halo.scale.set(4.4 * pulse, 4.4 * pulse, 1); key.intensity = 2 + Math.sin(tt * 2.2) * 0.3;
        if(target !== null){ var d = target - ring.rotation.y; ring.rotation.y += d * Math.min(1, dt * 4); if(Math.abs(d) < 0.001){ ring.rotation.y = target; target = null; } }
        else if(!dragging){ if(Math.abs(vel) > 0.0005){ ring.rotation.y += vel; vel *= 0.92; } else if(now > holdUntil && !hovering){ ring.rotation.y += dt * 0.1; } }
        pulses.forEach(function(sp){ sp.userData.t = (sp.userData.t + dt * 0.3) % 1; var t = sp.userData.t; sp.userData.c.getPoint(t, sp.position); sp.material.opacity = Math.sin(Math.PI * t); });
      } else {
        pulses.forEach(function(sp){ sp.userData.c.getPoint(sp.userData.t % 1, sp.position); sp.material.opacity = 0.8; });
      }
      ring.updateMatrixWorld(); place(); renderer.render(scene, camera);
      if(visible && !reduce) raf = requestAnimationFrame(frame);
    }
    function wake(){ if(!raf && visible){ last = performance.now(); raf = requestAnimationFrame(frame); } }
    if(window.IntersectionObserver){ new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) wake(); }, {threshold: 0.05}).observe(host); }
    wake();
    return api;
  }
})();
})();

/* the history folds on a phone, where Experience is the longest block; it opens for print and stays open without a script */
(function(){
  var fold = document.querySelector("details.fold"); if(!fold) return;
  if(window.matchMedia("(max-width:760px)").matches) fold.open = false;
  var was = fold.open;
  window.addEventListener("beforeprint", function(){ was = fold.open; fold.open = true; });
  window.addEventListener("afterprint", function(){ fold.open = was; });
})();

/* the CV card: hide on request, and hand focus back to the page */
(function(){ var x = document.getElementById("fcX"); if(!x) return; x.addEventListener("click", function(){ document.getElementById("fromCv").hidden = true; document.getElementById("main").focus({preventScroll:true}); }); })();

/* on a phone, "How I work" runs to about a third of the page: each demonstration folds to its heading and one line, and opens on request.
   Desktop, print, and a page without a script keep them open. Folded demos also hold back their opening animations and the 3D engine until opened. */
(function(){
  var mq = window.matchMedia("(max-width:760px)"), ids = ["tonality", "craft", "sweep", "beforeafter", "spine"];
  function nameOf(d){ var h = d.querySelector(".slop-kicker, h3"); return h ? h.textContent.trim() : "this demonstration"; }
  function set(d, open){ d.classList.toggle("demo-folded", !open); var b = d.querySelector(".demo-open"); if(!b) return;
    b.setAttribute("aria-expanded", open ? "true" : "false"); b.textContent = open ? "Close the demonstration" : "Open the demonstration";
    b.setAttribute("aria-label", (open ? "Close the demonstration: " : "Open the demonstration: ") + nameOf(d)); }
  window.LEXI_UNFOLD = function(d){ set(d, true); };
  function fold(){ ids.forEach(function(id){ var d = document.getElementById(id); if(!d) return;
    var b = d.querySelector(".demo-open");
    if(!b){ b = document.createElement("button"); b.type = "button"; b.className = "demo-open"; b.setAttribute("aria-controls", id);
      var after = d.querySelector(".explain .lead-in") || d.querySelector(".slop-intro"); after.insertAdjacentElement("afterend", b);
      b.addEventListener("click", function(){ var open = d.classList.contains("demo-folded"); set(d, open); if(!open) d.scrollIntoView({block:"start"}); }); }
    set(d, false); }); }
  if(mq.matches) fold();
  mq.addEventListener("change", function(e){ if(e.matches) fold(); else ids.forEach(function(id){ var d = document.getElementById(id); if(d) set(d, true); }); });
})();
