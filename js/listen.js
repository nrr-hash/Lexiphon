/* ---------- listen: a text played as music, the same way every time ---------- */
(function(){
"use strict";
var AC = window.AudioContext || window.webkitAudioContext;
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!AC) return;
var ctx = null, master = null, wet = null, playing = null, raf = 0, SPAN = 0, wrapping = false;

/* D minor pentatonic across two octaves: warm, and it cannot clash */
var SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
var BASE = 146.83; /* D3 */
function hz(deg, oct){ var d = Math.max(0, Math.min(SCALE.length - 1, deg)); return BASE * Math.pow(2, (SCALE[d] + 12 * (oct || 0)) / 12); }
function syllables(w){ var m = w.toLowerCase().replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g); return Math.max(1, m ? m.length : 1); }

function setup(){
  if(ctx) return;
  ctx = new AC();
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.knee.value = 12; comp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(comp);
  meter = ctx.createAnalyser(); meter.fftSize = 2048; comp.connect(meter);
  /* a little room, kept low: the character is in the filter, not the reverb */
  var len = Math.floor(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for(var c = 0; c < 2; c++){ var d = ir.getChannelData(c), seed = c ? 7 : 3; for(var i = 0; i < len; i++){ seed = (seed * 16807) % 2147483647; d[i] = ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.6); } }
  var conv = ctx.createConvolver(); conv.buffer = ir;
  wet = ctx.createGain(); wet.gain.value = 0.1; wet.connect(conv); conv.connect(master);
  /* and a short tape-style echo, darkened on each repeat */
  echo = ctx.createGain(); echo.gain.value = 0.16;
  var dl = ctx.createDelay(1.5), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
  dl.delayTime.value = 0.29; fb.gain.value = 0.32; tone.type = "lowpass"; tone.frequency.value = 1800;
  echo.connect(dl); dl.connect(tone); tone.connect(fb); fb.connect(dl); tone.connect(master);
}
var echo = null, meter = null;
function drive(amount){
  var ws = ctx.createWaveShaper(), n = 1024, curve = new Float32Array(n);
  for(var i = 0; i < n; i++){ var x = i / (n - 1) * 2 - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); }
  ws.curve = curve; ws.oversample = "2x"; return ws;
}
/* one monophonic voice, built like a Minimoog: two detuned saws and a sub, into a resonant low-pass */
function monoVoice(){
  var v = {o: []}, mix = ctx.createGain(); mix.gain.value = 0.34;
  function osc(type, detune, gain){ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.detune.value = detune; g.gain.value = gain; o.connect(g); g.connect(mix); v.o.push(o); return o; }
  v.a = osc("sawtooth", -6, 0.5); v.b = osc("sawtooth", 7, 0.45); v.sub = osc("square", 0, 0.28);
  var sh = drive(1.8), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), vca = ctx.createGain();
  f1.type = f2.type = "lowpass"; f1.Q.value = 7; f2.Q.value = 0.8; f1.frequency.value = f2.frequency.value = 300;
  vca.gain.value = 0.0001;
  mix.connect(sh); sh.connect(f1); f1.connect(f2); f2.connect(vca); vca.connect(master); vca.connect(wet); vca.connect(echo);
  v.f1 = f1; v.f2 = f2; v.vca = vca;
  v.start = function(t){ v.o.forEach(function(o){ o.start(t); }); };
  v.stop = function(t){ v.o.forEach(function(o){ try{ o.stop(t); }catch(e){} }); };
  /* a note: glide to pitch, open the filter fast, let it fall back; the gate shapes the loudness */
  v.note = function(t, f, dur, opt){
    opt = opt || {};
    var glide = opt.glide == null ? 0.028 : opt.glide;
    [v.a, v.b].forEach(function(o){ o.frequency.setTargetAtTime(f, t, glide); });
    v.sub.frequency.setTargetAtTime(f / 2, t, glide);
    if(opt.sag){ var fs = f * Math.pow(2, -opt.sag / 1200); [v.a, v.b].forEach(function(o){ o.frequency.setTargetAtTime(fs, t + 0.03, dur * 0.5); }); v.sub.frequency.setTargetAtTime(fs / 2, t + 0.03, dur * 0.5); }
    var lo = opt.lo || 260, hi = opt.hi || 3200, peak = opt.peak || 0.5, rel = Math.max(0.05, dur * (opt.gate || 0.82));
    [v.f1, v.f2].forEach(function(fl){ fl.frequency.cancelScheduledValues(t); fl.frequency.setValueAtTime(lo, t); fl.frequency.linearRampToValueAtTime(hi, t + (opt.att || 0.012)); fl.frequency.setTargetAtTime(lo * 2.6, t + (opt.att || 0.012), opt.fall || 0.12); });
    v.vca.gain.cancelScheduledValues(t); v.vca.gain.setTargetAtTime(peak, t, 0.004); v.vca.gain.setTargetAtTime(peak * 0.62, t + 0.05, 0.08); v.vca.gain.setTargetAtTime(0.0001, t + rel, opt.tail || 0.06);
  };
  return v;
}
/* a short bass stab where each sentence begins: the executive register's pulse */
function bassStab(t, f, list){
  var o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), vca = ctx.createGain();
  o.type = "sawtooth"; o.frequency.value = f; fl.type = "lowpass"; fl.Q.value = 6;
  fl.frequency.setValueAtTime(900, t); fl.frequency.setTargetAtTime(120, t + 0.01, 0.06);
  vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(0.22, t + 0.006); vca.gain.setTargetAtTime(0.0001, t + 0.03, 0.07);
  o.connect(fl); fl.connect(vca); vca.connect(master); vca.connect(echo); o.start(t); o.stop(t + 0.6); list.push(o);
}
/* the bass under each sentence: a saw and a sub, held, the filter opening slowly */
function bassNote(t, f, dur, list){
  var mix = ctx.createGain(), fl = ctx.createBiquadFilter(), vca = ctx.createGain();
  [["sawtooth", 0, 0.5], ["square", -1200, 0.35]].forEach(function(s){ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = s[0]; o.frequency.value = f; o.detune.value = s[1]; g.gain.value = s[2]; o.connect(g); g.connect(mix); o.start(t); o.stop(t + dur + 1.2); list.push(o); });
  fl.type = "lowpass"; fl.Q.value = 4; fl.frequency.setValueAtTime(90, t); fl.frequency.linearRampToValueAtTime(520, t + Math.min(1.2, dur * 0.6)); fl.frequency.setTargetAtTime(160, t + dur, 0.3);
  vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(0.11, t + 0.35); vca.gain.setValueAtTime(0.11, t + Math.max(0.35, dur)); vca.gain.setTargetAtTime(0.0001, t + dur, 0.35);
  mix.connect(fl); fl.connect(vca); vca.connect(master); vca.connect(wet);
}

/* read a text into words, keeping which ones are tells, and where sentences end */
function wrap(el, sel){
  if(el._words) return el._words;
  sel = sel || ".tell"; wrapping = true;
  var words = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
  while((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(function(node){
    var parts = node.data.split(/(\s+)/), frag = document.createDocumentFragment(), tell = !!(node.parentElement && node.parentElement.closest(sel));
    parts.forEach(function(p){
      if(!p) return;
      if(/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); return; }
      var s = document.createElement("span"); s.className = "sw"; s.textContent = p; frag.appendChild(s);
      words.push({el: s, w: p, tell: tell});
    });
    node.parentNode.replaceChild(frag, node);
  });
  var sent = 0;
  words.forEach(function(x, i){ x.s = sent; if(/[.!?]["\u201d\u2019)]*$/.test(x.w)){ x.end = true; sent++; } else if(/[,;:]$/.test(x.w)) x.pause = true; });
  el._words = words; el._sentences = sent || 1; wrapping = false; el._stamp = el.innerHTML;
  return words;
}
/* the score: a timeline of notes, computed from the text alone */
function score(el, sel){
  var words = wrap(el, sel), t = 0, ev = [], sents = [], i0 = 0;
  words.forEach(function(x, i){
    var inS = words.filter(function(y){ return y.s === x.s; }), pos = inS.indexOf(x), n = inS.length;
    if(pos === 0){ sents.push({t: t, n: n, words: []}); i0 = i; }
    var dur = 0.11 + 0.035 * syllables(x.w);
    if(x.end) dur *= 2.2;
    var p = n > 1 ? pos / (n - 1) : 1, letters = x.w.replace(/[^A-Za-z]/g, "").length;
    var deg = x.end ? 0 : Math.round(2 + 4.2 * Math.sin(Math.PI * Math.min(p, 0.999)) + ((letters % 3) - 1));
    ev.push({t: t, dur: dur, deg: deg, tell: x.tell, end: !!x.end, el: x.el, s: x.s});
    sents[sents.length - 1].words.push(ev[ev.length - 1]);
    t += dur + (x.pause ? 0.18 : 0) + (x.end ? 0.42 : 0);
  });
  sents.forEach(function(s, k){ var last = s.words[s.words.length - 1]; s.dur = last.t + last.dur - s.t; s.root = [0, 2, 3, 1, 4][s.n % 5]; });
  return {ev: ev, sents: sents, total: t};
}
function drawScore(box, sc, own){
  var W = 100, total = own ? sc.total : Math.max(sc.total, SPAN || 0), h = "";
  sc.sents.forEach(function(s){
    var x = s.t / total * W, w = Math.max(0.6, s.dur / total * W - 0.6);
    h += '<rect class="ss" x="' + x.toFixed(2) + '" y="9" width="' + w.toFixed(2) + '" height="14" rx="1.6"/>';
  });
  sc.ev.forEach(function(e){ var x = e.t / total * W; h += '<rect class="' + (e.tell ? "sn tell" : e.end ? "sn end" : "sn") + '" x="' + x.toFixed(2) + '" y="' + (e.end ? 4 : e.tell ? 13 : 20 - e.deg * 1.2).toFixed(2) + '" width="' + Math.max(0.35, e.dur / total * W * 0.8).toFixed(2) + '" height="' + (e.end ? 24 : e.tell ? 6 : 2.4) + '" rx=".4"/>'; });
  box.innerHTML = '<svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">' + h + '<rect class="ph" x="0" y="0" width=".5" height="32"/></svg>';
  box._ph = box.querySelector(".ph");
}
function stop(){
  if(!playing) return;
  var p = playing; playing = null; cancelAnimationFrame(raf);
  try{ master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); }catch(e){}
  p.oscs.forEach(function(o){ try{ o.stop(ctx.currentTime + 0.2); }catch(e){} });
  p.btn.classList.remove("on"); p.btn.setAttribute("aria-pressed", "false"); p.btn.querySelector(".lb").textContent = "Listen";
  p.el.querySelectorAll(".sw.on").forEach(function(s){ s.classList.remove("on"); });
  if(p.box._ph) p.box._ph.setAttribute("x", "0");
}
function play(btn){
  setup(); if(ctx.state === "suspended") ctx.resume();
  var el = document.getElementById(btn.dataset.src), box = document.getElementById(btn.dataset.score);
  if(btn.dataset.live) el._words = null;
  var sc = score(el, btn.dataset.tell);
  drawScore(box, sc, !!btn.dataset.live);
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.8, ctx.currentTime);
  var t0 = ctx.currentTime + 0.12, oscs = [];
  sc.sents.forEach(function(s){ bassNote(t0 + s.t, hz(s.root, -1), s.dur, oscs); });
  var lead = monoVoice(); lead.start(t0 - 0.05);
  /* the executive register: tighter and more decisive; a design choice, not computed from the text */
  var ex = btn.dataset.register === "exec";
  if(ex) sc.sents.forEach(function(s){ bassStab(t0 + s.t, hz(s.root, -1), oscs); });
  var MINOR = [8, 7, 5, 3, 2, 0, -2], run = -1, prevTell = false;
  sc.ev.forEach(function(e){
    if(e.tell){ run = prevTell ? run + 1 : 0; prevTell = true; } else prevTell = false;
    if(e.tell){
      var semi = MINOR[run % MINOR.length], ft = BASE * Math.pow(2, semi / 12) * Math.pow(2, -32 / 1200);
      lead.note(t0 + e.t, ft, Math.max(0.16, e.dur * 1.1), {lo: 520, hi: 560, att: 0.02, fall: 0.4, peak: 0.36, gate: 0.85, glide: 0.04, sag: 45, tail: 0.09});
    }
    else if(e.end) lead.note(t0 + e.t, hz(0), e.dur + 0.3, ex ? {lo: 320, hi: 4600, peak: 0.62, gate: 0.9, glide: 0.03, att: 0.07, fall: 0.3, tail: 0.18} : {lo: 300, hi: 5200, peak: 0.6, gate: 0.95, glide: 0.07, fall: 0.35, tail: 0.25});
    else lead.note(t0 + e.t, hz(e.deg), Math.max(0.14, e.dur), ex ? {lo: 300, hi: 2800 + e.deg * 260, peak: 0.5, glide: 0.01, fall: 0.07, gate: 0.7} : {lo: 280, hi: 2400 + e.deg * 260, peak: 0.46, glide: 0.028, fall: 0.11});
  });
  lead.stop(t0 + sc.total + 1.6);
  oscs.push({stop: function(t){ lead.stop(t); }});
  playing = {btn: btn, el: el, box: box, oscs: oscs};
  btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); btn.querySelector(".lb").textContent = "Stop";
  var idx = -1;
  (function tick(){
    if(!playing || playing.btn !== btn) return;
    var now = ctx.currentTime - t0;
    if(box._ph) box._ph.setAttribute("x", Math.max(0, Math.min(99.5, now / Math.max(sc.total, SPAN) * 100)).toFixed(2));
    var k = -1; for(var i = 0; i < sc.ev.length; i++){ if(sc.ev[i].t <= now) k = i; else break; }
    if(k !== idx){ if(idx >= 0) sc.ev[idx].el.classList.remove("on"); if(k >= 0 && now < sc.total) sc.ev[k].el.classList.add("on"); idx = k; }
    if(now > sc.total + 1.2){ stop(); return; }
    raf = requestAnimationFrame(tick);
  })();
}
/* both scores share one time scale, so their lengths compare honestly */
document.querySelectorAll(".listen[data-src]:not([data-live])").forEach(function(btn){ var el = document.getElementById(btn.dataset.src); if(el) SPAN = Math.max(SPAN, score(el).total); });
document.querySelectorAll(".listen[data-src]").forEach(function(btn){
  var box = document.getElementById(btn.dataset.score), el = document.getElementById(btn.dataset.src);
  if(box && el){
    if(btn.dataset.live){
      var redraw = function(){ if(playing && playing.btn === btn) return; el._words = null; drawScore(box, score(el, btn.dataset.tell), true); };
      redraw();
      var tm = 0; new MutationObserver(function(){ if(wrapping || el.innerHTML === el._stamp) return; if(playing && playing.btn === btn) stop(); clearTimeout(tm); tm = setTimeout(redraw, 250); }).observe(el, {childList: true, subtree: true, characterData: true});
    } else drawScore(box, score(el));
  }
  btn.addEventListener("click", function(){ var mine = playing && playing.btn === btn; stop(); if(!mine) play(btn); });
});
window.__listen = {stop: function(){ stop(); }, score: score, level: function(){ if(!meter) return null; var a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); var pk = 0, s = 0; for(var i = 0; i < a.length; i++){ var v = Math.abs(a[i]); if(v > pk) pk = v; s += a[i] * a[i]; } return [pk, Math.sqrt(s / a.length)]; }};
})();
