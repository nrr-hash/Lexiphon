/* ---------- the concept pages: a deep-zoom viewer, one page at a time ---------- */
(function(){
"use strict";
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
var DZ = JSON.parse(document.getElementById("dz-data").textContent);
function tileSrc(k){ return "images/concepts/tiles/" + k + ".webp"; }
var EV = JSON.parse(document.getElementById("dz-evid").textContent);
document.querySelectorAll(".print").forEach(function(f, i){ var n = DZ[i] && DZ[i].pins ? DZ[i].pins.length : 0, st = f.querySelector(".p-stage"); if(n && st){ var c = document.createElement("span"); c.className = "p-pins"; c.textContent = n + " evidence pins"; st.insertBefore(c, st.querySelector(".p-open")); } });
var dlg = document.getElementById("dz"), stage = document.getElementById("dz-stage"), world = document.getElementById("dz-world");
var strip = document.getElementById("dz-strip"), view = document.getElementById("dz-view"), card = document.getElementById("z-ev");
var cur = -1, cam = {x: 0, y: 0, s: 1}, W = 1, H = 1, VW = 0, VH = 0, fitS = 1, pageEl = null, anim = null, inertia = null, raf = 0, lastT = 0, evAt = -1, stripH = 0, stripW = 0;
var lastFocus = null;
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function smin(){ return fitS * 0.5; }
var SMAX = 2.2;

function build(i){
  var d = DZ[i], html = "", y = 0, pinsHtml = "";
  W = Math.max.apply(null, d.segs.map(function(s){ return s.w; }));
  d.segs.forEach(function(sg, si){
    if(si > 0){ html += '<div class="dz-gap">' + d.gap + '</div>'; y += 90; }
    var thumb = si === 0 ? document.getElementById("pthumb-" + i).src : sg.thumb;
    var tl = sg.tiles.map(function(t){ return '<img alt="" decoding="async" data-t="' + t.k + '" style="top:' + t.y + 'px;width:' + sg.w + 'px;height:' + t.h + 'px">'; }).join("");
    var hi = sg.hi ? '<div class="dz-tiles hi" style="top:' + sg.hi.y + 'px;width:' + sg.w + 'px;height:' + sg.hi.h + 'px">' + sg.hi.tiles.map(function(t){ return '<img alt="" decoding="async" data-t="' + t.k + '" data-hi="1" style="top:' + t.y + 'px;width:' + sg.w + 'px;height:' + t.h + 'px">'; }).join("") + '</div>' : "";
    var pins = "";
    if(si === 0 && d.pins.length){
      pins = '<div class="dz-pins">' + d.pins.map(function(p){
        return p.hl.map(function(h){ return '<span class="z-hl" data-e="' + p.i + '" style="left:' + h[0] + '%;top:' + h[1] + '%;width:' + h[2] + '%;height:' + h[3] + '%"></span>'; }).join("")
          + '<button type="button" class="z-pin s-' + p.st + '" data-e="' + p.i + '" style="left:' + p.x + '%;top:' + p.y + '%" aria-label="Evidence, ' + EV[p.i].lab.toLowerCase() + ': ' + EV[p.i].q.replace(/"/g, "&quot;") + '"><span aria-hidden="true">' + p.g + '</span></button>';
      }).join("") + '</div>';
    }
    html += '<div class="dz-seg" style="width:' + sg.w + 'px;height:' + sg.h + 'px"><img class="dz-thumb" src="' + thumb + '" alt="' + (si ? "Concept page, continued: " : "Concept page: ") + d.t + '"><div class="dz-tiles" style="width:' + sg.w + 'px;height:' + sg.h + 'px">' + tl + '</div>' + hi + pins + '</div>';
    y += sg.h;
  });
  H = y;
  world.innerHTML = '<div class="dz-page" style="width:' + W + 'px">' + html + '</div>';
  pageEl = world.firstChild;
  /* the strip: the whole page in miniature, with the view marked on it */
  var sh = "";
  d.segs.forEach(function(sg, si){ if(si > 0) sh += '<div style="height:' + (90 / H * 100) + '%;background:#DDE5DA"></div>'; sh += '<img alt="" src="' + (si === 0 ? document.getElementById("pthumb-" + i).src : sg.thumb) + '" style="height:' + (sg.h / H * 100) + '%;width:100%;object-fit:fill">'; });
  d.pins.forEach(function(p){ var yy = (p.y / 100 * d.segs[0].h) / H * 100; sh += '<span class="dz-dot s-' + p.st + '" style="top:' + yy + '%"></span>'; });
  strip.innerHTML = sh + '<div class="dz-view" id="dz-view"></div>';
  view = document.getElementById("dz-view");
  document.getElementById("dz-t").textContent = d.t;
  document.getElementById("dz-scope").textContent = (i + 1) + " of " + DZ.length + ". " + d.scope + (d.pins.length ? ". " + d.pins.length + " evidence pins" : "");
  var pdf = document.getElementById("dz-pdf"); if(d.pdf){ pdf.hidden = false; pdf.href = d.pdf; } else pdf.hidden = true;
}
function sizeUp(){
  VW = stage.clientWidth; VH = stage.clientHeight;
  var phone = VW < 720, navRoom = phone ? 0 : 150;
  stripH = Math.min(VH - (phone ? 90 : 90), Math.max(160, VH - 90)); stripW = clamp(stripH * W / H, 18, phone ? 44 : 120); stripH = stripW * H / W;
  if(stripH > VH - 90){ stripH = VH - 90; stripW = stripH * W / H; }
  strip.style.width = stripW + "px"; strip.style.height = stripH + "px";
  fitS = Math.min((VW - navRoom - (phone ? 16 : 80)) / W, phone ? 1 : 1.2);
}
function fitView(){ return {x: W / 2 + (VW < 720 ? 0 : 60 / fitS), y: (VH / 2 - 72) / fitS, s: fitS}; }

function apply(){
  cam.s = clamp(cam.s, smin(), SMAX);
  var hx = VW / 2 / cam.s, hy = VH / 2 / cam.s;
  cam.x = W * cam.s < VW ? clamp(cam.x, W / 2 - hx * 0.4, W / 2 + hx * 0.4) : clamp(cam.x, hx * 0.2, W - hx * 0.2);
  cam.y = clamp(cam.y, Math.min(hy * 0.6, H / 2), Math.max(H - hy * 0.6, H / 2));
  world.style.transform = "translate(" + (VW / 2 - cam.x * cam.s).toFixed(2) + "px," + (VH / 2 - cam.y * cam.s).toFixed(2) + "px) scale(" + cam.s.toFixed(5) + ")";
  world.style.setProperty("--inv", (1 / cam.s).toFixed(5));
  var sw = W * cam.s;
  world.style.setProperty("--tl", sstep(520, 780, sw).toFixed(3));
  world.style.setProperty("--tl2", sstep(1.05, 1.5, cam.s).toFixed(3));
  world.style.setProperty("--pin", sstep(560, 860, sw).toFixed(3));
  if(pageEl) pageEl.classList.toggle("pins-on", sw > 700);
  var top = (cam.y - hy) / H, bot = (cam.y + hy) / H;
  view.style.top = clamp(top, 0, 1) * stripH + "px"; view.style.height = Math.max(6, (clamp(bot, 0, 1) - clamp(top, 0, 1)) * stripH) + "px";
  tilesSoon();
}
var tt = 0, ttTimer = 0;
function tilesSoon(){ var n = performance.now(); if(n - tt > 120){ tt = n; tiles(); } clearTimeout(ttTimer); ttTimer = setTimeout(tiles, 150); }
function tiles(){
  if(!pageEl) return;
  var sw = W * cam.s, need = sw > 480, needHi = cam.s > 1.02;
  world.querySelectorAll(".dz-tiles img").forEach(function(im){
    var hi = !!im.dataset.hi;
    if(!(hi ? needHi : need)) return;
    if(im._on) return;
    var r = im.getBoundingClientRect();
    if(r.bottom > -VH * 0.5 && r.top < VH * 1.5 && r.right > 0 && r.left < VW){ im.src = tileSrc(im.dataset.t); im._on = true; }
  });
}

/* motion */
function interpZoom(p0, p1){
  var rho = Math.SQRT2, ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];
  var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
  if(d2 < 1e-9){ S = Math.log(w1 / w0) / rho; i = function(t){ return [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)]; }; }
  else { var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + 4 * d2) / (4 * w0 * d1), b1 = (w1 * w1 - w0 * w0 - 4 * d2) / (4 * w1 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1); S = (r1 - r0) / rho;
    i = function(t){ var s = t * S, c0 = Math.cosh(r0), u = w0 / (2 * d1) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0)); return [ux0 + u * dx, uy0 + u * dy, w0 * c0 / Math.cosh(rho * s + r0)]; }; }
  i.S = Math.abs(S); return i;
}
function flyTo(v, opts){
  opts = opts || {}; v = {x: v.x, y: v.y, s: clamp(v.s, smin(), SMAX)};
  if(reduce || opts.instant){ anim = null; cam.x = v.x; cam.y = v.y; cam.s = v.s; apply(); return; }
  var I = interpZoom([cam.x, cam.y, VW / cam.s], [v.x, v.y, VW / v.s]);
  anim = {type: "fly", I: I, D: opts.dur || clamp(I.S * 380, 280, 850), t0: performance.now()}; world.classList.add("moving"); kick();
}
function toWorld(sx, sy){ var r = stage.getBoundingClientRect(); sx -= r.left; sy -= r.top; return {x: cam.x + (sx - VW / 2) / cam.s, y: cam.y + (sy - VH / 2) / cam.s, sx: sx, sy: sy}; }
function scaleAt(s2, cx, cy){ s2 = clamp(s2, smin(), SMAX); var p = toWorld(cx, cy); cam.s = s2; cam.x = p.x - (p.sx - VW / 2) / s2; cam.y = p.y - (p.sy - VH / 2) / s2; }
function zoomBy(f, cx, cy){
  var r = stage.getBoundingClientRect(); if(cx == null){ cx = r.left + VW / 2; cy = r.top + VH / 2; }
  var base = anim && anim.type === "zoom" ? anim.st : cam.s;
  anim = {type: "zoom", st: clamp(base * f, smin(), SMAX), ax: cx, ay: cy};
  if(reduce){ scaleAt(anim.st, cx, cy); anim = null; apply(); } kick();
}
function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
function frame(now){
  raf = 0; var dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
  if(anim && anim.type === "fly"){ var t = clamp((now - anim.t0) / anim.D, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, p = anim.I(e); cam.x = p[0]; cam.y = p[1]; cam.s = VW / p[2]; apply(); if(t >= 1){ anim = null; world.classList.remove("moving"); } }
  else if(anim && anim.type === "zoom"){ var ls = Math.log(cam.s), lt = Math.log(anim.st), n = ls + (lt - ls) * 0.24; if(Math.abs(lt - n) < 0.002) n = lt; scaleAt(Math.exp(n), anim.ax, anim.ay); apply(); if(n === lt) anim = null; }
  if(inertia){ cam.x -= inertia.vx * dt * 60 / cam.s; cam.y -= inertia.vy * dt * 60 / cam.s; inertia.vx *= 0.9; inertia.vy *= 0.9; apply(); if(Math.abs(inertia.vx) + Math.abs(inertia.vy) < 0.25){ inertia = null; world.classList.remove("moving"); } }
  if(anim || inertia) raf = requestAnimationFrame(frame); else lastT = 0;
}

/* gestures: drag to move, scroll or pinch to zoom, double-click to zoom in */
var ptrs = new Map(), drag = null, suppress = false;
stage.addEventListener("pointerdown", function(e){
  if(e.pointerType === "mouse" && e.button !== 0) return;
  if(e.target.closest(".z-pin")) return;
  ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY}); anim = null; inertia = null;
  if(ptrs.size === 1) drag = {x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, vx: 0, vy: 0, t: performance.now()};
  else if(ptrs.size === 2){ var a = [...ptrs.values()]; drag = {pinch: true, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2, moved: true}; }
});
stage.addEventListener("pointermove", function(e){
  if(!ptrs.has(e.pointerId) || !drag) return;
  ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if(drag.pinch && ptrs.size >= 2){ var a = [...ptrs.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx = (a[0].x + a[1].x) / 2, my = (a[0].y + a[1].y) / 2; cam.x -= (mx - drag.mx) / cam.s; cam.y -= (my - drag.my) / cam.s; scaleAt(cam.s * d / drag.d, mx, my); drag.d = d; drag.mx = mx; drag.my = my; world.classList.add("moving"); apply(); return; }
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if(!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5){ drag.moved = true; stage.classList.add("grabbing"); world.classList.add("moving"); try{ stage.setPointerCapture(e.pointerId); }catch(_){} }
  if(!drag.moved) return;
  var n = performance.now(), dtm = Math.max(1, n - drag.t); drag.vx = dx * 16 / dtm; drag.vy = dy * 16 / dtm; drag.t = n;
  cam.x -= dx / cam.s; cam.y -= dy / cam.s; drag.x = e.clientX; drag.y = e.clientY; apply();
});
function endPtr(e){
  if(!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if(drag && drag.pinch){ if(ptrs.size === 1){ var a = [...ptrs.values()][0]; drag = {x: a.x, y: a.y, sx: a.x, sy: a.y, moved: true, vx: 0, vy: 0, t: performance.now()}; } else { drag = null; world.classList.remove("moving"); } suppress = true; setTimeout(function(){ suppress = false; }, 60); return; }
  if(drag && drag.moved){ suppress = true; setTimeout(function(){ suppress = false; }, 60); if(!reduce && performance.now() - drag.t < 90 && Math.hypot(drag.vx, drag.vy) > 1){ inertia = {vx: drag.vx, vy: drag.vy}; kick(); } else world.classList.remove("moving"); }
  drag = null; stage.classList.remove("grabbing");
}
stage.addEventListener("pointerup", endPtr); stage.addEventListener("pointercancel", endPtr);
stage.addEventListener("wheel", function(e){
  e.preventDefault(); inertia = null;
  var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? VH : 1, dx = e.deltaX * k, dy = e.deltaY * k;
  if(!e.ctrlKey && (e.shiftKey || (Math.abs(dx) > Math.abs(dy) * 0.5 && Math.abs(dx) > 0.5))){ anim = null; cam.x += (e.shiftKey ? dy : dx) / cam.s; if(!e.shiftKey) cam.y += dy / cam.s; apply(); return; }
  zoomBy(Math.exp(-dy * (e.ctrlKey ? 0.012 : 0.0021)), e.clientX, e.clientY);
}, {passive: false});
stage.addEventListener("dblclick", function(e){ if(e.target.closest(".z-pin")) return; var p = toWorld(e.clientX, e.clientY), st = clamp(cam.s * (e.shiftKey ? 0.5 : 2), smin(), SMAX); flyTo({x: p.x - (p.sx - VW / 2) / st, y: p.y - (p.sy - VH / 2) / st, s: st}, {dur: 360}); });
stage.addEventListener("click", function(e){ if(suppress){ e.preventDefault(); e.stopPropagation(); return; } var p = e.target.closest(".z-pin"); if(p) showEv(+p.dataset.e, true); }, true);

/* strip navigator */
var sDrag = false;
function stripGo(e){ var r = strip.getBoundingClientRect(); cam.y = clamp((e.clientY - r.top) / r.height, 0, 1) * H; anim = null; apply(); }
strip.addEventListener("pointerdown", function(e){ sDrag = true; strip.setPointerCapture(e.pointerId); stripGo(e); });
strip.addEventListener("pointermove", function(e){ if(sDrag) stripGo(e); });
strip.addEventListener("pointerup", function(){ sDrag = false; });

/* keyboard */
dlg.addEventListener("keydown", function(e){
  var a = document.activeElement, onCtl = a && a.closest && a.closest("button,a");
  if(card && !card.hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")){ e.preventDefault(); showEv(evAt + (e.key === "ArrowRight" ? 1 : -1)); return; }
  function pan(dx, dy){ flyTo({x: cam.x + dx / cam.s, y: cam.y + dy / cam.s, s: cam.s}, {dur: 260}); }
  switch(e.key){
    case "+": case "=": e.preventDefault(); zoomBy(1.6); break;
    case "-": case "_": e.preventDefault(); zoomBy(1 / 1.6); break;
    case "0": case "Home": e.preventDefault(); flyTo(fitView()); break;
    case "End": e.preventDefault(); flyTo({x: cam.x, y: H - VH / 2 / cam.s, s: cam.s}); break;
    case "ArrowUp": e.preventDefault(); pan(0, -VH * 0.18); break;
    case "ArrowDown": e.preventDefault(); pan(0, VH * 0.18); break;
    case "ArrowLeft": e.preventDefault(); pan(-VW * 0.18, 0); break;
    case "ArrowRight": e.preventDefault(); pan(VW * 0.18, 0); break;
    case "PageDown": e.preventDefault(); pan(0, VH * 0.85); break;
    case "PageUp": e.preventDefault(); pan(0, -VH * 0.85); break;
    case " ": if(onCtl) return; e.preventDefault(); pan(0, (e.shiftKey ? -1 : 1) * VH * 0.85); break;
  }
});
dlg.addEventListener("cancel", function(e){ if(card && !card.hidden){ e.preventDefault(); closeEv(); } });
dlg.addEventListener("close", function(){ document.documentElement.style.overflow = ""; closeEv(true); world.innerHTML = ""; pageEl = null; cur = -1; setHash(""); if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll: false}); });

/* open, close, turn the page */
function open(i, opts){
  opts = opts || {};
  i = (i + DZ.length) % DZ.length;
  if(!dlg.open){ lastFocus = document.activeElement; if(dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); document.documentElement.style.overflow = "hidden"; }
  if(i !== cur){ cur = i; closeEv(true); build(i); sizeUp(); flyTo(fitView(), {instant: true}); setHash(DZ[i].id); }
  if(!opts.keepFocus) document.getElementById("dz-close").focus({preventScroll: true});
}
document.querySelectorAll(".print .p-open").forEach(function(b){ b.addEventListener("click", function(){ open(+b.dataset.i); }); });
document.getElementById("dz-close").addEventListener("click", function(){ dlg.close(); });
document.getElementById("dz-prev").addEventListener("click", function(){ open(cur - 1, {keepFocus: true}); });
document.getElementById("dz-next").addEventListener("click", function(){ open(cur + 1, {keepFocus: true}); });
document.getElementById("dz-in").addEventListener("click", function(){ zoomBy(1.8); });
document.getElementById("dz-out").addEventListener("click", function(){ zoomBy(1 / 1.8); });
document.getElementById("dz-fit").addEventListener("click", function(){ flyTo(fitView()); });
if(coarse) document.getElementById("dz-hint").textContent = "Pinch to zoom and drag to move.";
window.addEventListener("resize", function(){ if(!dlg.open) return; var ry = cam.y / H, rel = cam.s / fitS; sizeUp(); cam.s = fitS * rel; cam.y = ry * H; apply(); });

/* evidence: the claim on the page, its ledger entry in the card */
function pinEl(i){ return world.querySelector('.z-pin[data-e="' + i + '"]'); }
function pinView(i){
  var pin = pinEl(i), seg = pin.closest(".dz-seg"), px = parseFloat(pin.style.left) / 100 * seg.offsetWidth, py = parseFloat(pin.style.top) / 100 * seg.offsetHeight + seg.offsetTop;
  var s = VW < 720 ? Math.max(fitS, 0.62) : Math.max(fitS, 1.0), hx = VW / 2 / s;
  var x = W * s > VW ? clamp(px, hx - 10 / s, W - hx + 10 / s) : W / 2;
  return {x: x, y: py + (VW < 720 ? VH * 0.2 : VH * 0.14) / s, s: s};
}
function showEv(i, fly){
  i = (i + EV.length) % EV.length; evAt = i; var e = EV[i];
  var need = DZ.findIndex(function(d){ return d.id === e.p; });
  var turning = need !== cur;
  if(turning) open(need, {keepFocus: true});
  world.querySelectorAll(".z-hl.on,.z-pin.on").forEach(function(x){ x.classList.remove("on"); });
  world.querySelectorAll('.z-hl[data-e="' + i + '"]').forEach(function(x){ x.classList.add("on"); });
  var pin = pinEl(i); pin.classList.add("on");
  var tag = document.getElementById("ze-tag"); tag.textContent = e.lab; tag.style.setProperty("--pc", getComputedStyle(pin).getPropertyValue("--pc"));
  document.getElementById("ze-doc").textContent = e.doc;
  document.getElementById("ze-q").textContent = "\u201c" + e.q + "\u201d";
  document.getElementById("ze-n").textContent = e.n;
  document.getElementById("ze-count").textContent = (i + 1) + " of " + EV.length;
  card.hidden = false; dlg.classList.add("evon");
  if(fly !== false) flyTo(pinView(i), turning ? {instant: true} : {});
}
function closeEv(silent){ if(!card || card.hidden) return; card.hidden = true; dlg.classList.remove("evon"); world.querySelectorAll(".z-hl.on,.z-pin.on").forEach(function(x){ x.classList.remove("on"); }); evAt = -1; }
document.getElementById("ze-x").addEventListener("click", function(){ closeEv(); });
document.getElementById("ze-prev").addEventListener("click", function(){ showEv(evAt - 1); });
document.getElementById("ze-next").addEventListener("click", function(){ showEv(evAt + 1); });
document.querySelectorAll("#evTour, [data-evtour]").forEach(function(tour){ tour.addEventListener("click", function(){ showEv(0); }); });

/* links: #page-rega and the like open that page */
function setHash(id){ try{ var u = location.pathname + location.search + (id ? "#" + id : ""); if(u !== location.pathname + location.search + location.hash) history.replaceState(null, "", u); }catch(e){} }
function fromHash(){ var h = ""; try{ h = decodeURIComponent((location.hash || "").slice(1)); }catch(e){} var k = DZ.findIndex(function(d){ return d.id === h; }); if(k >= 0) open(k); }
window.addEventListener("hashchange", fromHash);
if(document.readyState === "complete") fromHash(); else window.addEventListener("load", fromHash);
window.DZV = {open: open, show: showEv, cam: function(){ return {cam: cam, fitS: fitS, W: W, H: H}; }};
})();
