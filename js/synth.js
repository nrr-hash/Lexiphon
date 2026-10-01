/* Lexiphon synth: a monophonic-style voice in the vintage manner, written for the Web Audio API.
   Three oscillators into a mixer, a 24 dB low-pass filter with its own contour, a loudness contour,
   glide, pitch and modulation wheels, then drive, echo, room and a limiter. Each archetype is a preset;
   the blend dials mix them in real time. The beds are synthesised loops (see tools/make_assets.py).
   No DOM in here, so the engine can be rendered offline and measured. */
(function(root){
"use strict";

var NAMES = ["Innocent","Explorer","Sage","Hero","Outlaw","Magician","Regular Guy/Gal","Lover","Jester","Caregiver","Creator","Ruler"];
var FILES = {"Innocent":"innocent","Explorer":"explorer","Sage":"sage","Hero":"hero","Outlaw":"outlaw","Magician":"magician","Regular Guy/Gal":"regular","Lover":"lover","Jester":"jester","Caregiver":"caregiver","Creator":"creator","Ruler":"ruler"};
var LOOP = 6;           /* seconds in a bed loop */
var MARGIN = .3;        /* seconds of the same periodic audio either side of it, so decoder padding never falls inside the loop */
var BEDROOT = 9;        /* the beds sit on A */

var SCALES = {
  major:[0,2,4,5,7,9,11], mixolydian:[0,2,4,5,7,9,10], dorian:[0,2,3,5,7,9,10], minor:[0,2,3,5,7,8,10],
  phrygian:[0,1,3,5,7,8,10], lydian:[0,2,4,6,7,9,11], pent:[0,2,4,7,9,12,14]
};

/* w: wave per oscillator; r: frequency ratio; d: detune in cents; l: level.
   cut/res/con: filter cutoff (Hz), resonance, contour depth (octaves).
   A D S R: loudness contour. fA fD fS: filter contour. */
var PRESETS = {
  "Innocent":        {w:["sine","sine","tri"],       r:[2,4,5.4],   d:[0,3,-4],   l:[.7,.45,.3],  nz:0,   cut:5200, res:.7, con:.5, A:.002, D:.9,  S:0,   R:1.2, fA:.001, fD:.3,  fS:.5,  vib:2, lfo:5,   rev:.45, dly:.25, dlyT:.75,  drv:0,   scale:"pent",       swing:0,   g:0.9, bed:.9},
  "Explorer":        {w:["tri","saw","tri"],         r:[1,1,2],      d:[0,6,-6],   l:[.7,.5,.3],   nz:.02, cut:1800, res:3,  con:2,  A:.03,  D:.3,  S:.5,  R:.5, fA:.04,  fD:.4,  fS:.4,  vib:4, lfo:4.5, rev:.4,  dly:.35, dlyT:.75,  drv:.1,  scale:"mixolydian", swing:0,   g:1.1, bed:1},
  "Sage":            {w:["sine","tri","sine"],       r:[1,1,2],      d:[0,2,0],    l:[.8,.3,.15], nz:0,   cut:2600, res:1,  con:1,  A:.005, D:.5,  S:.05, R:.8, fA:.002, fD:.3,  fS:.3,  vib:1, lfo:4,   rev:.25, dly:.15, dlyT:.5,   drv:0,   scale:"dorian",     swing:0,   g:1.0, bed:1},
  "Hero":            {w:["saw","saw","square"],      r:[1,1,.5],      d:[0,9,-7],   l:[.8,.7,.6],   nz:0,   cut:3000, res:3.5,con:2.6,A:.01,  D:.2,  S:.6,  R:.25,fA:.005, fD:.25, fS:.5,  vib:2, lfo:5.5, rev:.18, dly:.1,  dlyT:.5,   drv:.35, scale:"mixolydian", swing:0,   g:0.9, bed:1},
  "Outlaw":          {w:["square","saw","pulseN"],   r:[1,1,.5],      d:[0,14,-10], l:[.8,.6,.6],   nz:.15, cut:1500, res:6,  con:3,  A:.002, D:.12, S:.4,  R:.12,fA:.001, fD:.12, fS:.2,  vib:0, lfo:7,   rev:.1,  dly:.15, dlyT:.375, drv:.85, scale:"phrygian",   swing:.45,   g:0.55, bed:1},
  "Magician":        {w:["sine","tri","sine"],       r:[1,2,3],      d:[0,8,-9],   l:[.6,.5,.35],  nz:.03, cut:2200, res:4,  con:1.6,A:.25,  D:.6,  S:.5,  R:1.6,fA:.3,   fD:.8,  fS:.6,  vib:8, lfo:5.8, rev:.7,  dly:.45, dlyT:1,    drv:.05, scale:"lydian",     swing:0,   g:0.6, bed:1},
  "Regular Guy/Gal": {w:["saw","tri","saw"],         r:[1,1,2],      d:[0,4,-3],   l:[.7,.6,.25],  nz:0,   cut:1700, res:1.6,con:2.6,A:.004, D:.3,  S:.08, R:.3, fA:.002, fD:.25, fS:.15, vib:1, lfo:4.5, rev:.15, dly:.1,  dlyT:.5,   drv:.1,  scale:"pent",       swing:.08, g:2.0, bed:1},
  "Lover":           {w:["tri","saw","sine"],        r:[1,1,.5],      d:[0,5,0],    l:[.7,.45,.5],  nz:.04, cut:850,  res:1.8,con:1.4,A:.22,  D:.5,  S:.65, R:1.1,fA:.25,  fD:.6,  fS:.55, vib:9, lfo:5.2, rev:.55, dly:.3,  dlyT:.75,  drv:.08, scale:"minor",      swing:.72, g:0.8, bed:1},
  "Jester":          {w:["square","pulseW","tri"],   r:[1,2,1],      d:[0,7,-7],   l:[.6,.45,.4],  nz:0,   cut:3400, res:2.5,con:2,  A:.002, D:.12, S:.15, R:.1, fA:.001, fD:.1,  fS:.3,  vib:0, lfo:6,   rev:.12, dly:.25, dlyT:.375, drv:.1,  scale:"major",      swing:.18, g:2.3, bed:1},
  "Caregiver":       {w:["sine","tri","sine"],       r:[1,1,2],      d:[0,3,0],    l:[.8,.4,.2],   nz:.01, cut:1500, res:.8, con:.9, A:.12,  D:.6,  S:.4,  R:1.3,fA:.15,  fD:.5,  fS:.6,  vib:3, lfo:4.2, rev:.5,  dly:.2,  dlyT:.75,  drv:0,   scale:"pent",       swing:.6,   g:0.65, bed:1},
  "Creator":         {w:["saw","tri","square"],      r:[1,1,2],      d:[0,12,-9],  l:[.7,.6,.35],  nz:0,   cut:2400, res:4.5,con:3,  A:.008, D:.25, S:.35, R:.35,fA:.004, fD:.3,  fS:.3,  vib:3, lfo:5.5, rev:.3,  dly:.35, dlyT:.75,  drv:.15, scale:"lydian",     swing:.04, g:1.35, bed:1},
  "Ruler":           {w:["saw","saw","square"],      r:[1,1,.5],      d:[0,7,-5],   l:[.8,.7,.5],   nz:0,   cut:950,  res:3,  con:2.2,A:.09,  D:.35, S:.65, R:.6, fA:.08,  fD:.4,  fS:.55, vib:3, lfo:4.8, rev:.35, dly:.1,  dlyT:.5,   drv:.3,  scale:"major",      swing:0,   g:0.85, bed:1}
};
var DEFAULT = {w:["saw","saw","square"], r:[1,1,.5], d:[0,7,-5], l:[.8,.6,.5], nz:0, cut:1800, res:2.5, con:2.4, A:.01, D:.4, S:.5, R:.4, fA:.01, fD:.35, fS:.4, vib:2, lfo:5, rev:.25, dly:.15, dlyT:.5, drv:.15, scale:"major", swing:0, g:1, bed:1};

function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
function clamp(x, a, b){ return Math.min(b, Math.max(a, x)); }
function lerpLog(a, b, t){ return Math.exp(Math.log(a) * (1 - t) + Math.log(b) * t); }

/* blend: numeric fields by weight (times and cutoff on a log scale), wave-shaping fields by rank */
function blend(voices){
  var V = voices.filter(function(v){ return v.w > 0 && PRESETS[v.name]; }).sort(function(a, b){ return b.w - a.w; });
  if(!V.length) return {P:JSON.parse(JSON.stringify(DEFAULT)), shares:{}, top:null};
  var sum = V.reduce(function(a, v){ return a + v.w; }, 0), P = {}, shares = {};
  V.forEach(function(v){ shares[v.name] = v.w / sum; });
  ["cut","A","D","R","fA","fD","dlyT"].forEach(function(k){ var acc = 0; V.forEach(function(v){ acc += Math.log(Math.max(1e-4, PRESETS[v.name][k])) * v.w / sum; }); P[k] = Math.exp(acc); });
  ["res","con","S","fS","nz","vib","lfo","rev","dly","drv","swing","bed","g"].forEach(function(k){ var acc = 0; V.forEach(function(v){ acc += PRESETS[v.name][k] * v.w / sum; }); P[k] = acc; });
  P.dlyT = PRESETS[V[0].name].dlyT;
  P.w = []; P.r = []; P.d = []; P.l = [];
  for(var k = 0; k < 3; k++){ var o = PRESETS[V[k % V.length].name]; P.w.push(o.w[k]); P.r.push(o.r[k]); P.d.push(o.d[k]); P.l.push(o.l[k] * (0.6 + 0.4 * shares[V[k % V.length].name] * V.length)); }
  P.scale = PRESETS[V[0].name].scale;
  return {P:P, shares:shares, top:V[0].name};
}

function pulseWave(ctx, duty){
  var n = 48, re = new Float32Array(n), im = new Float32Array(n);
  for(var k = 1; k < n; k++){ re[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI); im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI); }
  return ctx.createPeriodicWave(re, im);
}

function Synth(ctx, opt){
  opt = opt || {};
  var s = this; s.ctx = ctx; s.t0 = ctx.currentTime;
  s.voices = []; s.P = JSON.parse(JSON.stringify(DEFAULT)); s.shares = {}; s.top = null;
  s.trim = {cut:5, res:5, con:5, space:5, bed:3, vol:7, glide:60, tempo:110, transpose:0};
  s.lastFreq = 0; s.active = []; s.bend = 0; s.mod = 0; s.beds = {}; s.fxBuf = {}; s.waves = {};
  var g = function(v){ var n = ctx.createGain(); n.gain.value = v; return n; };
  /* the signal path: voice bus, drive, then dry, echo and room in parallel, and the bed alongside */
  s.bus = g(1);
  s.pre = g(1); s.shaper = ctx.createWaveShaper(); s.shaper.oversample = "2x";
  var curve = new Float32Array(1024); for(var i = 0; i < 1024; i++){ var x = i / 512 - 1; curve[i] = Math.tanh(x * 2.4); } s.shaper.curve = curve;
  s.dry = g(1); s.wet = g(0); s.post = g(1); s.sum = g(1);
  s.bus.connect(s.dry); s.bus.connect(s.pre); s.pre.connect(s.shaper); s.shaper.connect(s.wet);
  s.dry.connect(s.sum); s.wet.connect(s.sum); s.sum.connect(s.post);
  s.hp = ctx.createBiquadFilter(); s.hp.type = "highpass"; s.hp.frequency.value = 28; s.post.connect(s.hp);
  s.mix = g(1); s.hp.connect(s.mix);
  s.dlySend = g(0); s.dly = ctx.createDelay(2); s.dlyFb = g(.38); s.dlyTone = ctx.createBiquadFilter(); s.dlyTone.type = "lowpass"; s.dlyTone.frequency.value = 2600;
  s.hp.connect(s.dlySend); s.dlySend.connect(s.dly); s.dly.connect(s.dlyTone); s.dlyTone.connect(s.dlyFb); s.dlyFb.connect(s.dly); s.dlyTone.connect(s.mix);
  s.revSend = g(0); s.conv = ctx.createConvolver(); s.conv.buffer = impulse(ctx, 2.6); s.revOut = g(.9);
  s.hp.connect(s.revSend); s.revSend.connect(s.conv); s.conv.connect(s.revOut); s.revOut.connect(s.mix);
  s.bedBus = g(1); s.bedLP = ctx.createBiquadFilter(); s.bedLP.type = "lowpass"; s.bedLP.frequency.value = 7000; s.bedBus.connect(s.bedLP); s.bedLP.connect(s.mix);
  s.comp = ctx.createDynamicsCompressor(); s.comp.threshold.value = -16; s.comp.knee.value = 14; s.comp.ratio.value = 4; s.comp.attack.value = .004; s.comp.release.value = .22;
  s.lim = ctx.createDynamicsCompressor(); s.lim.threshold.value = -3; s.lim.knee.value = 0; s.lim.ratio.value = 20; s.lim.attack.value = .001; s.lim.release.value = .08;
  s.vol = g(.3); s.analyser = ctx.createAnalyser(); s.analyser.fftSize = 1024; s.analyser.smoothingTimeConstant = .72;
  s.mix.connect(s.comp); s.comp.connect(s.lim); s.lim.connect(s.vol); s.vol.connect(s.analyser); s.analyser.connect(ctx.destination);
  /* wheels: pitch bend in cents, and a low-frequency oscillator whose depth the mod wheel sets */
  s.bendSrc = ctx.createConstantSource(); s.bendSrc.offset.value = 0; s.bendSrc.start();
  s.cutSrc = ctx.createConstantSource(); s.cutSrc.offset.value = 0; s.cutSrc.start();   /* filter cutoff trim, in cents */
  s.resSrc = ctx.createConstantSource(); s.resSrc.offset.value = 0; s.resSrc.start();   /* filter emphasis trim, in dB */
  s.lfo = ctx.createOscillator(); s.lfo.type = "sine"; s.lfo.frequency.value = 5; s.vibDepth = g(0); s.fltDepth = g(0);
  s.lfo.connect(s.vibDepth); s.lfo.connect(s.fltDepth); s.lfo.start();
  var N = ctx.sampleRate * 2, nb = ctx.createBuffer(1, N, ctx.sampleRate), d = nb.getChannelData(0); for(var j = 0; j < N; j++) d[j] = Math.random() * 2 - 1; s.noiseBuf = nb;
  Synth.last = s;
  s.apply();
}

/* a dark, slowly decaying stereo room, generated rather than sampled */
function impulse(ctx, secs){
  var n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for(var c = 0; c < 2; c++){ var d = b.getChannelData(c), lp = 0;
    for(var i = 0; i < n; i++){ var t = i / n, a = .05 + .9 * t; lp += a * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - t, 2.4) * (i < 400 ? i / 400 : 1); } }
  return b;
}

Synth.prototype.wave = function(name){
  var s = this, c = s.ctx;
  if(name === "pulseW") return s.waves.pW || (s.waves.pW = pulseWave(c, .25));
  if(name === "pulseN") return s.waves.pN || (s.waves.pN = pulseWave(c, .1));
  return null;
};
Synth.prototype.setVoices = function(list){ var b = blend(list); this.voices = list; this.P = b.P; this.shares = b.shares; this.top = b.top; this.apply(); this._beds(); };
Synth.prototype.setTrim = function(o){ for(var k in o) this.trim[k] = o[k]; this.apply(); this._beds(); };
/* the trim dials centre on 5: they push the preset, they do not replace it */
Synth.prototype.eff = function(){
  var P = this.P, T = this.trim, e = {};
  e.cut = clamp(P.cut, 80, 16000); e.cutCents = (T.cut - 5) * .42 * 1200;       /* the trim is applied live, see apply() */
  e.res = clamp(P.res, .2, 16); e.resDb = clamp((T.res - 5) * 2.4, -13, 8);
  e.con = clamp(P.con + (T.con - 5) * .45, 0, 6);
  e.rev = clamp(P.rev + (T.space - 5) * .11, 0, 1);
  e.dly = clamp(P.dly + (T.space - 5) * .07, 0, .9);
  e.glide = clamp(T.glide / 1000, 0, .6);
  return e;
};
Synth.prototype.apply = function(){
  var s = this, c = s.ctx, t = c.currentTime, e = s.eff(), P = s.P, tc = .06;
  s.revSend.gain.setTargetAtTime(e.rev * .85, t, tc);
  s.dlySend.gain.setTargetAtTime(e.dly * .7, t, tc);
  s.dly.delayTime.setTargetAtTime(clamp(P.dlyT * 60 / s.trim.tempo, .05, 1.9), t, .08);
  s.pre.gain.setTargetAtTime(1 + P.drv * 4, t, tc);
  s.wet.gain.setTargetAtTime(P.drv * .9 / (1 + P.drv * 1.5), t, tc);
  s.dry.gain.setTargetAtTime(1 - P.drv * .55, t, tc);
  s.lfo.frequency.setTargetAtTime(P.lfo, t, .1);
  s.vibDepth.gain.setTargetAtTime(P.vib * 1.0 + s.mod * 55, t, .05);
  s.fltDepth.gain.setTargetAtTime(s.mod * 420, t, .05);
  s.vol.gain.setTargetAtTime(s.muted ? 0 : Math.pow(clamp(s.trim.vol / 10, 0, 1), 1.6) * .9, t, .03);
  s.bendSrc.offset.setTargetAtTime(s.bend, t, .02);
  s.cutSrc.offset.setTargetAtTime(e.cutCents, t, .03);
  s.resSrc.offset.setTargetAtTime(e.resDb, t, .03);
};
Synth.prototype.setMuted = function(m){ this.muted = !!m; this.apply(); };
Synth.prototype.setBend = function(cents){ this.bend = cents; this.bendSrc.offset.setTargetAtTime(cents, this.ctx.currentTime, .02); };
Synth.prototype.setMod = function(v){ this.mod = clamp(v, 0, 1); this.apply(); };

/* ---- notes ---- */
Synth.prototype._play = function(t, midi, dur, vel, fast){
  var s = this, c = s.ctx, P = s.P, e = s.eff(), f = hz(midi), glide = e.glide, v = {osc:[], nodes:[], t:t};
  vel = vel == null ? .8 : vel;
  var g = c.createGain(); g.gain.value = 0;
  var lp1 = c.createBiquadFilter(), lp2 = c.createBiquadFilter(); lp1.type = lp2.type = "lowpass"; lp1.Q.value = clamp(e.res * 2.2, 0, 22); lp2.Q.value = -3;
  var mixer = c.createGain(); mixer.gain.value = .5 * (P.g || 1);
  var start = s.lastFreq && glide > 0 ? s.lastFreq : f; s.lastFreq = f;
  for(var k = 0; k < 3; k++){
    var o = c.createOscillator(), w = P.w[k], pw = s.wave(w), lv = c.createGain();
    if(pw) o.setPeriodicWave(pw); else o.type = w === "tri" ? "triangle" : w === "saw" ? "sawtooth" : w;
    o.frequency.setValueAtTime(start * P.r[k], t);
    if(glide > 0) o.frequency.setTargetAtTime(f * P.r[k], t, glide / 3); else o.frequency.setValueAtTime(f * P.r[k], t);
    o.detune.value = P.d[k]; s.bendSrc.connect(o.detune); s.vibDepth.connect(o.detune);
    lv.gain.value = P.l[k] * (w === "sine" ? 1.0 : .7); o.connect(lv); lv.connect(mixer); o.start(t); v.osc.push(o); v.nodes.push(lv);
  }
  if(P.nz > .005){ var ns = c.createBufferSource(), ng = c.createGain(); ns.buffer = s.noiseBuf; ns.loop = true; ng.gain.value = P.nz * .5; ns.connect(ng); ng.connect(mixer); ns.start(t, Math.random() * 1.5); v.osc.push(ns); v.nodes.push(ng); }
  mixer.connect(lp1); lp1.connect(lp2); lp2.connect(g); g.connect(s.bus);
  s.fltDepth.connect(lp1.detune); s.fltDepth.connect(lp2.detune);
  s.cutSrc.connect(lp1.detune); s.cutSrc.connect(lp2.detune); s.resSrc.connect(lp1.Q);
  /* filter contour */
  var track = Math.pow(2, (midi - 60) / 12 * .33), base = clamp(e.cut * track, 60, 15000), peak = clamp(base * Math.pow(2, e.con), 60, 18000), sus = clamp(base * Math.pow(2, e.con * P.fS), 60, 18000);
  var fA = Math.max(.002, dur == null ? P.fA : Math.min(P.fA, dur * .8)), fD = Math.max(.02, P.fD);
  if(fast) fA = Math.min(fA, .03);
  [lp1.frequency, lp2.frequency].forEach(function(p){ p.setValueAtTime(base, t); p.setTargetAtTime(peak, t, fA / 3); p.setTargetAtTime(sus, t + fA, fD / 3); });
  /* loudness contour */
  var A = dur == null ? P.A : Math.min(P.A, dur * .8), D = P.D, peakG = vel;
  if(fast) A = Math.min(A, .025);   /* a re-struck word continues; it does not begin again */
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peakG, t + Math.max(.002, A)); g.gain.setTargetAtTime(peakG * P.S, t + Math.max(.002, A), D / 3);
  v.g = g; v.lp = [lp1, lp2]; v.base = base; v.R = P.R; v.mixer = mixer;
  s.active.push(v); if(s.active.length > 10) s._release(s.active[0], c.currentTime);
  var stopAt;
  if(dur != null){ stopAt = s._release(v, t + dur); }
  return {v:v, freq:f};
};
Synth.prototype._release = function(v, t){
  var s = this, R = Math.max(.03, v.R);
  if(v.done) return v.stopAt;
  v.done = true;
  var hold = function(p){ if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { var x = p.value; p.cancelScheduledValues(t); p.setValueAtTime(x, t); } };
  if(t <= s.ctx.currentTime + .001){ hold(v.g.gain); v.lp.forEach(function(l){ hold(l.frequency); }); }
  v.g.gain.setTargetAtTime(0, t, R / 3);
  v.lp.forEach(function(l){ l.frequency.setTargetAtTime(v.base, t, R / 4); });
  v.stopAt = t + R * 1.6 + .1;
  v.osc.forEach(function(o){ try{ o.stop(v.stopAt); }catch(err){} });
  var ended = v.osc[0]; ended.onended = function(){ s._free(v); };
  return v.stopAt;
};
Synth.prototype._free = function(v){
  var s = this, i = s.active.indexOf(v); if(i >= 0) s.active.splice(i, 1);
  v.osc.forEach(function(o, k){ try{ if(k < 3){ s.bendSrc.disconnect(o.detune); s.vibDepth.disconnect(o.detune); } o.disconnect(); }catch(err){} });
  v.lp.forEach(function(l, k){ try{ s.fltDepth.disconnect(l.detune); s.cutSrc.disconnect(l.detune); if(k === 0) s.resSrc.disconnect(l.Q); l.disconnect(); }catch(err){} });
  try{ v.g.disconnect(); v.mixer.disconnect(); }catch(err){}
  v.nodes.forEach(function(n){ try{ n.disconnect(); }catch(err){} });
};
/* scheduled note, length known: for the text played back */
Synth.prototype.note = function(t, midi, dur, vel, fast){ return this._play(t, midi, dur, vel, fast); };
/* held note: for the keyboard; release it later with off() */
Synth.prototype.on = function(midi, vel, t, fast){ return this._play(t == null ? this.ctx.currentTime + .005 : t, midi, null, vel, fast); };
/* cut a note short at time t (scheduled or held) with a quick fade, so a replacement in a new timbre can take over */
Synth.prototype.steal = function(h, t, rel){
  var v = h && h.v; if(!v) return; rel = rel || .05;
  var hold = function(p){ if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); };
  hold(v.g.gain); v.g.gain.setTargetAtTime(0, t, rel / 3); v.lp.forEach(function(l){ hold(l.frequency); });
  v.done = true; v.stopAt = t + rel * 1.6 + .05; v.osc.forEach(function(o){ try{ o.stop(v.stopAt); }catch(err){} });
  var s = this; v.osc[0].onended = function(){ s._free(v); };
};
Synth.prototype.off = function(h){ if(h && h.v) this._release(h.v, this.ctx.currentTime); };
Synth.prototype.allOff = function(){ var s = this; s.active.slice().forEach(function(v){ s._release(v, s.ctx.currentTime); }); s.lastFreq = 0; };
Synth.prototype.scaleNote = function(rootMidi, degree){ var sc = SCALES[this.P.scale] || SCALES.major; return rootMidi + sc[clamp(degree, 0, 6)]; };

/* ---- beds and switch sounds ---- */
Synth.prototype.loadBeds = function(base){ this.bedBase = base; this._beds(); };
Synth.prototype._bed = function(name){
  var s = this, c = s.ctx, b = s.beds[name];
  if(b) return b;
  b = s.beds[name] = {state:"loading", gain:c.createGain()}; b.gain.gain.value = 0; b.gain.connect(s.bedBus);
  fetch(s.bedBase + FILES[name] + ".mp3").then(function(r){ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(function(ab){ return new Promise(function(ok, no){ c.decodeAudioData(ab, ok, no); }); })
    .then(function(buf){ var src = c.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = MARGIN; src.loopEnd = MARGIN + LOOP; src.connect(b.gain);
      src.playbackRate.value = Math.pow(2, s.trim.transpose / 12); src.start(c.currentTime, MARGIN + ((c.currentTime - s.t0) % LOOP + LOOP) % LOOP); b.src = src; b.state = "ready"; s._beds(); })
    .catch(function(){ b.state = "failed"; });
  return b;
};
Synth.prototype._beds = function(){
  var s = this, t = s.ctx.currentTime; if(!s.bedBase || !s.armed) return;
  NAMES.forEach(function(n){
    var share = s.shares[n] || 0, b = s.beds[n];
    if(share > 0 && !b) b = s._bed(n);
    if(b && b.state !== "failed") b.gain.gain.setTargetAtTime(share * s.P.bed * clamp(s.trim.bed / 10, 0, 1) * .9, t, .3);
    if(b && b.src) b.src.playbackRate.setTargetAtTime(Math.pow(2, s.trim.transpose / 12), t, .2);
  });
};
Synth.prototype.arm = function(){ this.armed = true; this._beds(); };
Synth.prototype.loadFx = function(base, names){
  var s = this, c = s.ctx;
  names.forEach(function(n){ fetch(base + n + ".wav").then(function(r){ return r.arrayBuffer(); }).then(function(ab){ return new Promise(function(ok, no){ c.decodeAudioData(ab, ok, no); }); })
    .then(function(b){ s.fxBuf[n] = b; }).catch(function(){}); });
};
Synth.prototype.fx = function(n, gain, rate){
  var s = this, b = s.fxBuf[n]; if(!b) return;
  var src = s.ctx.createBufferSource(), g = s.ctx.createGain(); src.buffer = b; src.playbackRate.value = rate || 1; g.gain.value = gain == null ? .5 : gain; src.connect(g); g.connect(s.mix); src.start();
};
Synth.prototype.level = function(){ /* rms of the output, 0..1, for the visuals */
  var a = this.analyser; if(!this._td) this._td = new Float32Array(a.fftSize); a.getFloatTimeDomainData(this._td);
  var x = 0; for(var i = 0; i < this._td.length; i++) x += this._td[i] * this._td[i]; return Math.sqrt(x / this._td.length);
};

Synth.last = null;
Synth.NAMES = NAMES; Synth.PRESETS = PRESETS; Synth.SCALES = SCALES; Synth.blend = blend; Synth.hz = hz; Synth.LOOP = LOOP; Synth.MARGIN = MARGIN; Synth.BEDROOT = BEDROOT;
root.LexiSynth = Synth;
})(typeof window !== "undefined" ? window : this);
