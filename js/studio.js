/* ---------- Lexiphon: a voice profile, applied to a brief or held against a draft ---------- */
(function(){
"use strict";
var root = document.getElementById("lx"); if(!root || !window.LEXI_ENGINE || !window.LEXI_BRAND) return;
var E = window.LEXI_ENGINE, B = window.LEXI_BRAND, escHtml = E.escHtml, CUES = E.CUES, ARCH = E.ARCH, NAMEIX = E.NAMEIX;
var EMB = {"Innocent":"innocent","Explorer":"explorer","Sage":"sage","Hero":"hero","Outlaw":"outlaw","Magician":"magician","Regular Guy/Gal":"regular","Lover":"lover","Jester":"jester","Caregiver":"caregiver","Creator":"creator","Ruler":"ruler"};
function $(id){ return document.getElementById(id); }

/* ---------- state ---------- */
var mode = "write", briefId = "jug", off = {}, preset = "Caregiver";
var prof = {tone:B.toneOf("Caregiver"), lead:"auto", person:"auto", rhythm:"auto", words:"auto", gaps:"flag"};

/* "My voice": formality and enthusiasm measured from the opening of this page; humour and respect set by ear */
function myVoice(){
  var src = [].slice.call(document.querySelectorAll(".intro p")).map(function(p){ return p.textContent; }).join(" ").replace(/\s+/g, " ");
  var m = src ? B.measure(src) : null;
  return {tone:{casual:m ? m.tone.casual : 45, funny:15, irreverent:15, enthusiastic:m ? m.tone.enthusiastic : 25}, lead:"proof", person:"we", rhythm:"varied", words:"none", gaps:"flag", measured:m};
}

/* ---------- start from ---------- */
function drawStart(){
  var h = '<span class="lx-cap">Start from</span><button type="button" class="lx-mine" data-preset="mine" aria-pressed="' + (preset === "mine") + '" data-tip="mine">My voice</button><span class="lx-arch">';
  ARCH.forEach(function(a){ h += '<button type="button" data-preset="' + escHtml(a.name) + '" aria-pressed="' + (preset === a.name) + '" aria-label="' + escHtml(a.name) + '" data-tip="arch" style="--ac:' + CUES[a.name].col + '"><img src="images/emblems/' + EMB[a.name] + '.svg" alt="" width="20" height="20" decoding="async"></button>'; });
  $("lxStart").innerHTML = h + '</span><span class="lx-now" id="lxNow"></span>';
}
$("lxStart").addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("button[data-preset]"); if(!b) return;
  preset = b.dataset.preset;
  if(preset === "mine") prof = myVoice();
  else prof = {tone:B.toneOf(preset), lead:"auto", person:"auto", rhythm:"auto", words:"auto", gaps:prof.gaps};
  drawStart(); drawProfile(); run(); });

/* ---------- the profile: six layers ---------- */
var LEADS = [["auto","Auto"],["proof","Evidence"],["benefit","Benefit"],["audience","Reader"],["what","What it is"]];
var PERSONS = [["auto","Auto"],["it","Third person"],["you","To you"],["we","As the brand"]];
var RHYTHMS = [["auto","Auto"],["short","Short"],["varied","Varied"],["long","Long"]];
var GAPS = [["flag","Mark the gap"],["omit","Leave it out"]];
var LEADNAME = {proof:"the evidence", benefit:"the benefit", audience:"the reader", what:"what it is"}, PERSONNAME = {it:"third person", you:"to you", we:"as the brand"};
function seg(layer, opts, val, derived){
  return '<div class="lx-seg" role="radiogroup" aria-label="' + layer + '">' + opts.map(function(o){
    var lab = o[0] === "auto" && derived ? "Auto · " + derived : o[1];
    return '<button type="button" role="radio" data-layer="' + layer + '" data-v="' + o[0] + '" aria-checked="' + (val === o[0]) + '">' + escHtml(lab) + '</button>'; }).join("") + '</div>';
}
function drawProfile(){
  var d = B.derive(prof), t = prof.tone;
  var tone = B.TONE.map(function(x){ var v = t[x.k];
    return '<div class="lx-dial"><span class="lo">' + x.lo + '</span><input type="range" min="0" max="100" step="5" value="' + v + '" data-tone="' + x.k + '" aria-label="' + x.lo + ' to ' + x.hi + '" aria-valuetext="' + v + ' of 100, towards ' + (v >= 50 ? x.hi : x.lo).toLowerCase() + '"><span class="hi">' + x.hi + '</span></div>'; }).join("");
  var words = '<select id="lxWords" aria-label="Words"><option value="auto"' + (prof.words === "auto" ? " selected" : "") + '>Auto · ' + escHtml(d.near) + '’s list</option><option value="none"' + (prof.words === "none" ? " selected" : "") + '>The brief’s own words</option>' +
    ARCH.map(function(a){ return '<option value="' + escHtml(a.name) + '"' + (prof.words === a.name ? " selected" : "") + '>' + escHtml(a.name) + '’s list</option>'; }).join("") + '</select>';
  var row = function(n, name, tip, ctl, why){ return '<div class="lx-layer"><p class="lx-ln"><b>' + n + '</b> ' + name + '<button type="button" class="lx-q" data-tip="' + tip + '" aria-label="About ' + name.toLowerCase() + '">?</button></p>' + ctl + (why ? '<p class="lx-why">' + escHtml(why) + '</p>' : '') + '</div>'; };
  $("lxProfile").innerHTML = '<p class="lx-cap">The profile</p>' +
    row(1, "Tone", "tone", tone, "Nearest archetype: " + d.near + ".") +
    row(2, "What leads", "lead", seg("lead", LEADS, prof.lead, LEADNAME[d.lead]), prof.lead === "auto" ? "Auto: " + d.why.lead + "." : "") +
    row(3, "Point of view", "person", seg("person", PERSONS, prof.person, PERSONNAME[d.person]), prof.person === "auto" ? "Auto: " + d.why.person + "." : "") +
    row(4, "Rhythm", "rhythm", seg("rhythm", RHYTHMS, prof.rhythm, d.rhythm.charAt(0).toUpperCase() + d.rhythm.slice(1)), (prof.rhythm === "auto" ? "Auto: " + d.why.rhythm + ". " : "") + "Register: " + d.why.register + ".") +
    row(5, "Words", "words", words, "") +
    row(6, "Claims", "claims", seg("gaps", GAPS, prof.gaps), "A missing fact is " + (prof.gaps === "flag" ? "marked, never filled." : "left out, never filled."));
  var c = d.words ? CUES[d.words].col : "#e8a24a"; root.style.setProperty("--v1", c);
  $("lxNow").textContent = preset === "mine" ? "My voice: formality and enthusiasm measured from this page’s opening, humour and respect set by ear." : "Starting from " + preset + "’s place on the dials.";
}
$("lxProfile").addEventListener("input", function(e){ var r = e.target; if(!r.dataset || !r.dataset.tone) return; prof.tone[r.dataset.tone] = +r.value; preset = null; drawStartSoft(); runSoon(); });
$("lxProfile").addEventListener("change", function(e){ var r = e.target;
  if(r.dataset && r.dataset.tone){ clearTimeout(rs); drawProfileLabels(); run(); return; }
  if(r.id === "lxWords"){ prof.words = r.value; drawProfile(); run(); } });
$("lxProfile").addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("button[data-layer]"); if(!b) return;
  prof[b.dataset.layer] = b.dataset.v; drawProfile(); run();
  var again = $("lxProfile").querySelector('button[data-layer="' + b.dataset.layer + '"][data-v="' + b.dataset.v + '"]'); if(again) again.focus({preventScroll:true}); });
function drawStartSoft(){ $("lxStart").querySelectorAll("button[data-preset]").forEach(function(b){ b.setAttribute("aria-pressed", "false"); }); $("lxNow").textContent = "Your own setting."; }
var rs = 0; function runSoon(){ clearTimeout(rs); rs = setTimeout(function(){ drawProfileLabels(); run(); }, 60); }
/* while a dial moves, refresh only the Auto labels, so the slider keeps focus */
function drawProfileLabels(){ var d = B.derive(prof);
  [["lead", LEADNAME[d.lead], d.why.lead], ["person", PERSONNAME[d.person], d.why.person], ["rhythm", d.rhythm.charAt(0).toUpperCase() + d.rhythm.slice(1), d.why.rhythm]].forEach(function(x){
    var b = $("lxProfile").querySelector('button[data-layer="' + x[0] + '"][data-v="auto"]'); if(b) b.textContent = "Auto · " + x[1];
    if(prof[x[0]] === "auto" && b){ var w = b.parentNode.nextElementSibling; if(w && w.classList.contains("lx-why")) w.textContent = "Auto: " + x[2] + "." + (x[0] === "rhythm" ? " Register: " + d.why.register + "." : ""); } });
  var o = $("lxWords"); if(o) o.options[0].textContent = "Auto · " + d.near + "’s list";
  var tw = $("lxProfile").querySelector(".lx-layer .lx-why"); if(tw) tw.textContent = "Nearest archetype: " + d.near + ".";
  root.style.setProperty("--v1", (d.words ? CUES[d.words].col : "#e8a24a")); }

/* ---------- words: the profile's list, with each fact's locked words kept ---------- */
function voiceIx(d){ return d.words ? NAMEIX[d.words] : null; }
function voiced(text, locks, d){
  var keep = [], t = text, ix = voiceIx(d), sel = ix == null ? [] : [ix], m = {}; if(ix != null) m[ix] = 10;
  (locks || []).forEach(function(w){ t = t.replace(new RegExp("\\b(" + E.esc(w) + ")\\b", "gi"), function(x){ keep.push(x); return "zzqlock" + (keep.length - 1) + "q"; }); });
  var v = E.voiceSwap(t, sel, m), g = E.registerPass(v.text, sel, m, d.bias);
  return {out:g.text.replace(/zzqlock(\d+)q/g, function(x, n){ return keep[+n]; }), log:v.log, n:v.n};
}
function markAdds(src, out, log){
  var dm = E.diffMarks(src, out), Bt = dm.B, html = "", q = {};
  (log || []).forEach(function(e){ if(e.drop) return; (e.to.match(E.WORD) || []).forEach(function(w){ (q[w.toLowerCase()] = q[w.toLowerCase()] || []).push(e); }); });
  Bt.forEach(function(tk, k){ html += escHtml(k === 0 ? out.slice(0, tk.at) : out.slice(Bt[k-1].at + Bt[k-1].t.length, tk.at));
    if(dm.add[k] && /[A-Za-z]/.test(tk.t)){ var ent = q[tk.t.toLowerCase()] && q[tk.t.toLowerCase()].shift();
      html += ent ? '<mark class="d-add" data-a="' + escHtml(ent.arch) + '" data-r="' + ent.row + '" tabindex="0" role="button" aria-haspopup="dialog" style="--ac:' + CUES[ent.arch].col + '" title="' + escHtml("The brief says “" + ent.from + "”. " + ent.arch + "’s list says “" + ent.to + "”.") + '">' + escHtml(tk.t) + '</mark>'
                  : '<mark class="d-reg" title="Register: contraction or full form">' + escHtml(tk.t) + '</mark>'; }
    else html += escHtml(tk.t); });
  return html;
}

/* no one-word widows: the last two words of a paragraph never part (fact tags are not words) */
function bindEnds(el){
  var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {acceptNode:function(n){ return n.parentElement.closest("a.fx") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }}), tn = [], state = 0, pos = null;
  while(w.nextNode()) tn.push(w.currentNode);
  for(var n = tn.length - 1; n >= 0; n--){ var s = tn[n].nodeValue;
    for(var k = s.length - 1; k >= 0; k--){ var sp = /\s/.test(s[k]);
      if(state === 0){ if(!sp) state = 1; }
      else if(state === 1){ if(sp){ state = 2; pos = [n, k]; } }
      else if(!sp){ var t = tn[pos[0]].nodeValue; tn[pos[0]].nodeValue = t.slice(0, pos[1]) + "\u00a0" + t.slice(pos[1] + 1); return; } } }
}
/* ---------- write from a brief ---------- */
function curBrief(){ for(var i = 0; i < B.BRIEFS.length; i++) if(B.BRIEFS[i].id === briefId) return B.BRIEFS[i]; return B.BRIEFS[0]; }
function locks(b, ids){ var l = []; ids.forEach(function(id){ var f = B.factById(b, id); if(f && f.lock) l = l.concat(f.lock); }); return l; }
function tags(ids){ return ids.map(function(id){ return '<a class="fx" href="#fx-' + id + '" data-f="' + id + '" aria-label="from fact ' + id.slice(1) + '">' + id + '</a>'; }).join(""); }
function runWrite(){
  var b = curBrief(), pc = B.compose(b, prof, off), d = pc.d, all = [], swaps = 0;
  function one(text, ids, isEnd){ var v = isEnd ? {out:E.registerPass(text, [], {}, d.bias).text, log:[], n:0} : voiced(text, locks(b, ids), d); swaps += v.n; all.push(v.out); return markAdds(text, v.out, v.log); }
  $("lxBriefs").innerHTML = B.BRIEFS.map(function(x){ return '<button type="button" data-brief="' + x.id + '" aria-pressed="' + (x.id === b.id) + '">' + escHtml(x.label) + ' <i>' + escHtml(x.tag) + '</i></button>'; }).join("");
  var ae = document.activeElement, keep = ae && $("lxPiece").contains(ae) && ae.matches("mark[data-r]") ? [ae.dataset.r, ae.dataset.a] : null;
  $("lxPiece").innerHTML = (pc.head.text ? '<p class="pc-h">' + one(pc.head.text, pc.head.ids) + tags(pc.head.ids) + '</p>' : '') + '<p class="pc-b">' +
    pc.body.map(function(s){ return s.gap ? '<span class="gap">' + escHtml(s.text) + '</span>' : one(s.text, s.ids) + tags(s.ids); }).join(" ") + '</p><p class="pc-e">' + one(pc.end.text, [], true) + '</p>';
  $("lxPiece").querySelectorAll("p").forEach(bindEnds);
  if(keep){ var nm = $("lxPiece").querySelector('mark[data-r="' + keep[0] + '"][data-a="' + String(keep[1]).replace(/"/g, "") + '"]'); if(nm) nm.focus({preventScroll:true}); }
  $("lxFacts").innerHTML = '<p class="lx-cap">The brief <span>' + escHtml(b.note) + ' Untick a fact to take it out of the brief.</span></p><ul>' + b.facts.map(function(f){
    var u = pc.used[f.id], txt = f.it.replace(/\{S\}/g, function(m, at){ return at === 0 ? b.name.charAt(0).toUpperCase() + b.name.slice(1) : b.name; });
    return '<li id="fx-' + f.id + '" class="' + (off[f.id] ? "out" : u ? "on" : "idle") + '"><label><input type="checkbox" data-fact="' + f.id + '"' + (off[f.id] ? "" : " checked") + '><b>' + f.id + '</b> <span class="k">' + escHtml(B.label(b, f.kind)) + '</span> ' + escHtml(txt) + '</label>' + (f.src ? '<span class="src">' + escHtml(f.src) + '</span>' : '') + '</li>'; }).join("") + '</ul>';
  var full = all.join(" "), fig = B.checkFigures(b, full), used = Object.keys(pc.used).length, live = b.facts.filter(function(f){ return !off[f.id]; }).length;
  $("lxChecks").innerHTML = chk(true, used + " of " + live + " facts used") + chk(!fig.stray.length, fig.stray.length ? "not in the brief: " + escHtml(fig.stray.join(", ")) : fig.count + (fig.count === 1 ? " figure" : " figures") + ", all in the brief") +
    chk(!pc.gaps, pc.gaps ? pc.gaps + (pc.gaps === 1 ? " gap" : " gaps") + " marked, none filled" : "no gaps") + chk(true, "no claim added") + (swaps ? chk(true, swaps + (swaps === 1 ? " word" : " words") + " from " + escHtml(d.words) + "’s list") : "");
}
function chk(ok, t){ return '<span class="' + (ok ? "ok" : "warn") + '">' + t + '</span>'; }
$("lxBriefs").addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("button[data-brief]"); if(!b) return; briefId = b.dataset.brief; off = {}; run(); });
$("lxFacts").addEventListener("change", function(e){ var c = e.target; if(!c.dataset || !c.dataset.fact) return; if(c.checked) delete off[c.dataset.fact]; else off[c.dataset.fact] = 1; run();
  var again = $("lxFacts").querySelector('input[data-fact="' + c.dataset.fact + '"]'); if(again) again.focus({preventScroll:true}); });
function hiFact(id){ root.querySelectorAll(".hi").forEach(function(x){ x.classList.remove("hi"); }); if(!id) return; var li = $("fx-" + id); if(li) li.classList.add("hi"); root.querySelectorAll('a.fx[data-f="' + id + '"]').forEach(function(a){ a.classList.add("hi"); }); }
$("lxPiece").addEventListener("mouseover", function(e){ var a = e.target.closest && e.target.closest("a.fx"); hiFact(a ? a.dataset.f : null); });
$("lxFacts").addEventListener("mouseover", function(e){ var li = e.target.closest && e.target.closest("li[id^=fx-]"); hiFact(li ? li.id.slice(3) : null); });
$("lxPiece").addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("a.fx"); if(!a) return; e.preventDefault(); var li = $("fx-" + a.dataset.f); if(li){ li.scrollIntoView({block:"nearest"}); hiFact(a.dataset.f); } });

/* ---------- check a draft ---------- */
var ta = $("stText"), view = "marked";
var SAMPLES = [["opening", "This page’s opening"], ["slopText", "Machine draft"], ["cleanText", "Edited pitch"], ["piece", "The piece just written"]];
function drawSamples(){ $("lxSamples").innerHTML = '<span class="lx-cap">Try</span>' + SAMPLES.map(function(s){ return '<button type="button" data-sample="' + s[0] + '">' + s[1] + '</button>'; }).join("") +
  '<span class="lx-views" role="group" aria-label="View"><button type="button" data-view="marked" aria-pressed="' + (view === "marked") + '">Marked</button><button type="button" data-view="rewritten" aria-pressed="' + (view === "rewritten") + '">Rewritten to the profile</button></span>'; }
$("lxSamples").addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("button"); if(!b) return;
  if(b.dataset.view){ view = b.dataset.view; drawSamples(); run(); return; }
  var s = b.dataset.sample; if(s === "piece"){ ta.value = lastPiece(); } else if(s === "opening"){ ta.value = [].slice.call(document.querySelectorAll(".opening-lede, .intro p")).map(function(x){ return x.textContent.trim(); }).join(" ").replace(/\s+/g, " "); } else { var el = $(s); ta.value = el ? el.innerText.replace(/\s+/g, " ").trim() : ""; } run(); });
function lastPiece(){ var t = $("lxPiece").cloneNode(true); t.querySelectorAll("a.fx, .gap").forEach(function(x){ x.remove(); }); return [].slice.call(t.querySelectorAll("p")).map(function(p){ return p.textContent.trim(); }).join(" ").replace(/\s+/g, " "); }
var ABSRX = /\b(?:best|greatest|fastest|leading|ultimate|unrivall?ed|unbeatable|unmatched|world-class|guaranteed|perfect)\b|#1\b|\bnumber one\b/gi;
var FIGRX = /(?<![A-Za-z0-9])£?\$?€?\d[\d.,]*(?:\s?(?:%|per cent|percent|kHz|Hz|dB|kg|km|litres?|mm|cm|years?|months?|weeks?|days?|hours?|minutes?|x))?/gi;
function runCheck(){
  var text = ta.value.replace(/\s+/g, " ").trim(), d = B.derive(prof);
  if(!text){ $("lxDraft").innerHTML = '<span class="lx-empty">Paste a draft, or try one of the samples above.</span>'; $("lxReport").innerHTML = ""; $("lxChecks").innerHTML = ""; return; }
  var m = B.measure(text), ix = voiceIx(d), T = d.rhythm === "short" ? {cv:.6, ac:-.2, len:11, end:80} : d.rhythm === "long" ? {cv:.55, ac:-.1, len:22, end:80} : {cv:.65, ac:-.2, len:16, end:80};
  var tr = E.transform(text, ix, T, d.bias);
  /* spans to mark: figures, absolute claims, the page's own tell list */
  var spans = [];
  function add(rx, cls, why){ var re = new RegExp(rx.source, rx.flags.indexOf("g") >= 0 ? rx.flags : rx.flags + "g"), x; while((x = re.exec(text)) !== null){ if(!x[0]) { re.lastIndex++; continue; } spans.push({a:x.index, b:x.index + x[0].length, cls:cls, why:why}); } }
  add(FIGRX, "m-fig", "A figure: it needs a source before it goes out.");
  add(ABSRX, "m-abs", "An absolute claim: it needs proof, or a softer word.");
  var tells = 0; (window.LEXI_TELLS || []).forEach(function(t){ var before = spans.length; add(t.rx, "m-tell", "On the house list of phrases that read as machine-written: " + t.label + "."); tells += spans.length - before; });
  spans.sort(function(x, y){ return x.a - y.a || (y.b - y.a) - (x.b - x.a); });
  var html = "", at = 0; spans.forEach(function(s){ if(s.a < at) return; html += escHtml(text.slice(at, s.a)) + '<mark class="' + s.cls + '" title="' + escHtml(s.why) + '">' + escHtml(text.slice(s.a, s.b)) + '</mark>'; at = s.b; });
  html += escHtml(text.slice(at));
  if(view === "rewritten"){ var sents = E.splitSentences(tr.out);
    $("lxDraft").innerHTML = (function(){ var dm = E.diffMarks(text, tr.out), Bt = dm.B, h = "", q = {};
      tr.log.forEach(function(e){ if(e.drop) return; (e.to.match(E.WORD) || []).forEach(function(w){ (q[w.toLowerCase()] = q[w.toLowerCase()] || []).push(e); }); });
      Bt.forEach(function(tk, k){ var gap = k === 0 ? tr.out.slice(0, tk.at) : tr.out.slice(Bt[k-1].at + Bt[k-1].t.length, tk.at);
        h += escHtml(gap) + (dm.del[k] ? '<del class="d-del">' + escHtml(dm.del[k].join(" ")) + '</del> ' : '');
        if(dm.add[k]){ var ent = /[A-Za-z]/.test(tk.t) && q[tk.t.toLowerCase()] && q[tk.t.toLowerCase()].shift();
          h += ent ? '<mark class="d-add" data-a="' + escHtml(ent.arch) + '" data-r="' + ent.row + '" tabindex="0" role="button" aria-haspopup="dialog" style="--ac:' + CUES[ent.arch].col + '">' + escHtml(tk.t) + '</mark>' : '<mark class="d-reg">' + escHtml(tk.t) + '</mark>'; }
        else h += escHtml(tk.t); });
      return h; })() + '<p class="lx-note">' + (sents.length ? tr.swaps + (tr.swaps === 1 ? " word" : " words") + (d.words ? " from " + escHtml(d.words) + "’s list" : "") + ", " + (tr.splits + tr.merges) + " sentence joins or splits, " + (tr.contracted + tr.expanded) + " register changes. A rule cannot read meaning: check every change." : "") + '</p>'; }
  else $("lxDraft").innerHTML = html;
  /* the report, layer by layer */
  var dt = function(a, b){ return Math.abs(a - b) <= 20; }, st = m.st, PN = {it:"the third person", you:"the reader", we:"the speaker"};
  var rows = [
    ["Tone", dt(m.tone.casual, prof.tone.casual) && dt(m.tone.enthusiastic, prof.tone.enthusiastic),
      "On the formal-to-casual dial the draft sits at " + m.tone.casual + " and the profile at " + prof.tone.casual + ", judged from " + m.contr + (m.contr === 1 ? " contraction" : " contractions") + " and the word lengths. On enthusiasm the draft sits at " + m.tone.enthusiastic + " and the profile at " + prof.tone.enthusiastic + ", from " + m.excl + (m.excl === 1 ? " exclamation mark, " : " exclamation marks, ") + m.intens + (m.intens === 1 ? " intensifier, and " : " intensifiers, and ") + m.absol.length + (m.absol.length === 1 ? " absolute claim." : " absolute claims.") + " Humour and respect are for your ear: no rule here measures them."],
    ["Point of view", m.person === d.person, "Written mostly from " + PN[m.person] + "; the profile speaks " + PERSONNAME[d.person] + "."],
    ["Rhythm", m.rhythm === d.rhythm, st ? "Sentences average " + Math.round(m.mean) + " words, from " + Math.min.apply(null, E.splitSentences(text).map(function(s){ return E.wordsIn(s).length; }).filter(Boolean)) + " to " + Math.max.apply(null, E.splitSentences(text).map(function(s){ return E.wordsIn(s).length; })) + ", spread " + (st.cv || 0).toFixed(2) + ". That reads as " + m.rhythm + "; the profile asks for " + d.rhythm + "." : "Too short to read."],
    ["Words", !tells, (tr.swaps ? tr.swaps + (tr.swaps === 1 ? " word has" : " words have") + " an alternative in " + escHtml(d.words || "") + "’s list (see Rewritten). " : d.words ? "No word here has an entry in " + escHtml(d.words) + "’s list. " : "") + (tells ? tells + (tells === 1 ? " phrase is" : " phrases are") + " on the house list, marked red." : "Nothing from the house list.")],
    ["Claims", !m.figs.length && !m.absol.length, (m.figs.length ? m.figs.length + (m.figs.length === 1 ? " figure needs" : " figures need") + " a source, marked amber. " : "No figures. ") + (m.absol.length ? "Absolute claims: " + escHtml(m.absol.join(", ")) + ". " : "") + "Whether any of it is true is a question for the sources, not for Lexiphon."]
  ];
  var inLine = rows.filter(function(r){ return r[1]; }).length;
  lastResult = {words:E.wordsIn(text).length, sentences:E.splitSentences(text).length, inLine:inLine, figs:m.figs.length, abs:m.absol.length, tells:tells,
    who:preset === "mine" ? "My voice, measured from this page’s opening" : preset ? preset + "’s place on the dials" : "a setting of the visitor’s own",
    dials:"formal to casual " + prof.tone.casual + ", serious to funny " + prof.tone.funny + ", respectful to irreverent " + prof.tone.irreverent + ", matter-of-fact to enthusiastic " + prof.tone.enthusiastic,
    rows:rows.map(function(r){ return [r[0], r[1], plain(r[2])]; }), marked:html};
  $("lxReport").innerHTML = '<p class="lx-cap">Against the profile</p><ul>' + rows.map(function(r){ return '<li class="' + (r[1] ? "ok" : "warn") + '"><b>' + r[0] + '.</b> ' + r[2] + '</li>'; }).join("") + '</ul><button type="button" class="lx-learn" id="lxLearn" data-tip="learn">Make this draft the profile</button>' +
    '<p class="lx-send"><a class="btn" id="lxMail" href="' + escHtml(mailFor(lastResult)) + '">Send me this result</a><button type="button" class="btn btn-alt" id="lxPrint">Print this check</button><span>The email carries the scores, not your draft.</span></p>';
  $("lxChecks").innerHTML = chk(!m.figs.length, m.figs.length + (m.figs.length === 1 ? " figure" : " figures") + " to source") + chk(!m.absol.length, m.absol.length + " absolute " + (m.absol.length === 1 ? "claim" : "claims")) + chk(!tells, tells + " house-list " + (tells === 1 ? "phrase" : "phrases")) + chk(true, rows.filter(function(r){ return r[1]; }).length + " of 5 layers in line");
  lastMeasure = m;
}
var lastMeasure = null, lastResult = null, ct = 0;
function plain(h){ var t = document.createElement("div"); t.innerHTML = h; return t.textContent; }
/* the result as an email to me: scores and the report, never the visitor's text */
function mailFor(R){
  var head = ["Hello Nathaniel,", "", "I ran a draft through Lexiphon on your page. The result is below; my draft is not included.", "",
    "Draft: " + R.words + " words, " + R.sentences + (R.sentences === 1 ? " sentence." : " sentences."),
    "Profile: " + R.who + " (" + R.dials + ").",
    "Layers in line: " + R.inLine + " of 5.",
    "Figures to source: " + R.figs + ". Absolute claims: " + R.abs + ". House-list phrases: " + R.tells + "."];
  var detail = R.rows.map(function(r){ return r[0] + (r[1] ? " (in line): " : " (off the profile): ") + r[2]; });
  var tail = ["", "What I would like to discuss:", ""];
  var subject = "Lexiphon check: " + R.inLine + " of 5 layers in line";
  function url(lines){ return "mailto:nathan667@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\r\n")); }
  var brief = R.rows.map(function(r){ return r[0] + ": " + (r[1] ? "in line." : "off the profile."); });
  var tries = [url(head.concat([""], detail, tail)), url(head.concat([""], brief, tail)), url(head.concat(tail))];
  for(var i = 0; i < tries.length; i++){ if(tries[i].length <= 1900) return tries[i]; }
  return tries[2];
}
/* the result as one printed page, with the draft marked */
function printCheck(){
  var R = lastResult; if(!R) return;
  var old = document.getElementById("lxSheet"); if(old) old.remove();
  var sh = document.createElement("div"); sh.id = "lxSheet";
  var day = new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
  sh.innerHTML = '<div class="ls-head"><b>Draft check</b><span>Lexiphon, nrr-hash.github.io/Lexiphon, ' + escHtml(day) + '</span></div>' +
    '<p class="ls-meta">' + R.words + ' words, ' + R.sentences + (R.sentences === 1 ? ' sentence' : ' sentences') + ', checked against ' + escHtml(R.who) + ' (' + escHtml(R.dials) + '). ' + R.inLine + ' of 5 layers in line.</p>' +
    '<h2>The draft, marked</h2><div class="ls-draft">' + R.marked + '</div>' +
    '<p class="ls-key"><span><mark class="m-tell">Red</mark> a phrase on the house list of machine-written tells.</span> <span><mark class="m-fig">Amber</mark> a figure that needs a source.</span> <span><mark class="m-abs">Dark amber</mark> an absolute claim.</span></p>' +
    '<h2>Against the profile</h2><ul>' + R.rows.map(function(r){ return '<li><b>' + escHtml(r[0]) + (r[1] ? ', in line.' : ', off the profile.') + '</b> ' + escHtml(r[2].replace(" (see Rewritten)", "")) + '</li>'; }).join("") + '</ul>' +
    '<p class="ls-limit">Lexiphon runs on rules in the browser. It cannot tell whether a claim is true, and it cannot hear humour or respect.</p>' +
    '<p class="ls-foot">Nathaniel Robertson, content specialist. A content audit checks a whole library this way, by rule and then by hand. nathan667@gmail.com. I reply within one working day.</p>';
  document.body.appendChild(sh);
  document.documentElement.classList.add("lx-printing");
  window.print();
}
window.addEventListener("afterprint", function(){ document.documentElement.classList.remove("lx-printing"); var sh = document.getElementById("lxSheet"); if(sh) sh.remove(); });
ta.addEventListener("input", function(){ clearTimeout(ct); ct = setTimeout(run, 160); });
$("lxReport").addEventListener("click", function(e){ if(e.target.closest && e.target.closest("#lxPrint")){ printCheck(); return; } if(!(e.target.closest && e.target.closest("#lxLearn")) || !lastMeasure) return;
  var m = lastMeasure; prof.tone.casual = m.tone.casual; prof.tone.enthusiastic = m.tone.enthusiastic; prof.person = m.person; prof.rhythm = m.rhythm; preset = null;
  drawStart(); drawStartSoft(); $("lxNow").textContent = "Learnt from your draft: formality, enthusiasm, point of view, and rhythm. Humour and respect stay where you set them."; drawProfile(); run(); });

/* ---------- mode ---------- */
function setMode(m, noFill){ mode = m; $("lxWrite").hidden = m !== "write"; $("lxCheck").hidden = m !== "check";
  $("lxModes").querySelectorAll("button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false"); });
  if(m === "check" && !ta.value && !noFill){ ta.value = lastPiece(); } run(); }
/* the hero's button: open the draft check, empty, for the visitor's own text */
document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("[data-lx=check]"); if(!a) return; setMode("check", true); setTimeout(function(){ ta.focus({preventScroll:true}); }, 600); });
$("lxModes").addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("button[data-mode]"); if(b && b.dataset.mode !== mode) setMode(b.dataset.mode); });
function run(){ if(mode === "write") runWrite(); else runCheck(); }

/* ---------- thesaurus: another word from the same voice; the choice holds wherever the word appears ---------- */
var thesEl = document.createElement("div"); thesEl.id = "syThes"; thesEl.setAttribute("role", "dialog"); thesEl.setAttribute("aria-label", "Alternatives"); thesEl.hidden = true; document.body.appendChild(thesEl);
var thesFor = null;
function openThes(mk){
  var row = +mk.dataset.r, arch = mk.dataset.a, L = E.LEX[row], cands = L.cands[arch] || [], k = E.CHOICE[row + "|" + arch] || 0, src = L.src[0].split(":")[0];
  thesFor = {row:row, arch:arch, mk:mk};
  thesEl.style.setProperty("--ac", CUES[arch].col);
  thesEl.innerHTML = '<b><i aria-hidden="true"></i>' + escHtml(arch) + ' and “' + escHtml(src) + '”</b><span>Each choice applies wherever this word appears.</span><div class="th-b">' +
    cands.map(function(c, i){ return '<button type="button" data-k="' + i + '" aria-pressed="' + (i === k) + '">' + escHtml(c[0] === "!" ? "(drop the word)" : c[0]) + '</button>'; }).join("") + '</div>' +
    (E.SCREEN[src] ? '<span class="th-s">Left out on purpose, because the house lists flag them: ' + escHtml(E.SCREEN[src].join(", ")) + '.</span>' : '');
  thesEl.hidden = false; var r = mk.getBoundingClientRect(), w = thesEl.offsetWidth, hh = thesEl.offsetHeight, vw = document.documentElement.clientWidth;
  var top = r.bottom + 8; if(top + hh > innerHeight - 8) top = Math.max(8, r.top - hh - 8);
  thesEl.style.left = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2)) + "px"; thesEl.style.top = top + "px";
  var on = thesEl.querySelector('[aria-pressed="true"]'); if(on) on.focus({preventScroll:true});
}
function closeThes(back){ thesEl.hidden = true; var f = thesFor; thesFor = null; if(back && f){ var m = root.querySelector('mark[data-r="' + f.row + '"][data-a="' + f.arch.replace(/"/g, "") + '"]'); if(m) m.focus({preventScroll:true}); } }
root.addEventListener("click", function(e){ var mk = e.target.closest && e.target.closest("mark[data-r]"); if(mk){ e.preventDefault(); openThes(mk); } });
root.addEventListener("keydown", function(e){ var mk = e.target.closest && e.target.closest("mark[data-r]"); if(mk && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); openThes(mk); } });
thesEl.addEventListener("click", function(e){ var b = e.target.closest("button[data-k]"); if(!b || !thesFor) return; E.CHOICE[thesFor.row + "|" + thesFor.arch] = +b.dataset.k; var f = thesFor; closeThes(false); run();
  var m = root.querySelector('mark[data-r="' + f.row + '"][data-a="' + f.arch.replace(/"/g, "") + '"]'); if(m) m.focus({preventScroll:true}); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape"){ if(!thesEl.hidden) closeThes(true); hideTip(); } });
document.addEventListener("pointerdown", function(e){ if(!thesEl.hidden && !thesEl.contains(e.target) && !(e.target.closest && e.target.closest("mark[data-r]"))) closeThes(false); });
window.addEventListener("scroll", function(){ if(!thesEl.hidden) closeThes(false); }, {passive:true});

/* ---------- plain-language help: hover, focus, or tap ---------- */
var TIPS = {
  tone:["Tone","Four dials after the Nielsen Norman Group’s dimensions of tone of voice. On Auto, the other layers follow them: an enthusiastic voice leads with the benefit, a formal one writes in the third person and spells words out, a funny one keeps lines short."],
  lead:["What leads","Which fact the piece puts first, after the headline. Choosing what to say first, and what to leave out, is most of a brand’s voice."],
  person:["Point of view","Who speaks to whom: about the product in the third person, straight to the reader, or as the brand itself."],
  rhythm:["Rhythm","Short lines and fragments, short pairs joined, or measured sentences joined with semicolons. Short also means fewer facts."],
  words:["Words","Whose word list chooses the vocabulary. On Auto, the archetype nearest to the tone lends its list. Every word in every list was screened against the house lists."],
  claims:["Claims","A voice may only use the facts in the brief. When the profile wants a fact the brief does not have, Lexiphon marks the gap or leaves it out. It never fills it."],
  mine:["My voice","A profile of the voice on this page. Formality and enthusiasm are measured from the page’s opening paragraphs; humour and respect are set by ear; it leads with the evidence and speaks as the writer."],
  arch:["Archetype","Sets the four tone dials to where this archetype sits, by my reading of Mark and Pearson, and returns every other layer to Auto."],
  learn:["Make this draft the profile","Sets formality, enthusiasm, point of view, and rhythm from what the draft measures. Humour and respect stay as you set them, because no rule here can measure them."]
};
var tipEl = document.createElement("div"); tipEl.id = "syTip"; tipEl.setAttribute("role", "tooltip"); tipEl.hidden = true; document.body.appendChild(tipEl);
var tipFor = null, tipT = 0;
function showTip(el){ var k = el.dataset.tip, d = TIPS[k]; if(!d) return; var n = d[0];
  if(k === "arch"){ var nm = el.getAttribute("aria-label"), c = B.LANDMARK[nm]; n = nm; d = [nm, CUES[nm].tone + " On the dials: formality " + c[0] + ", humour " + c[1] + ", irreverence " + c[2] + ", enthusiasm " + c[3] + "."]; }
  tipEl.innerHTML = "<b>" + escHtml(n) + "</b><span>" + escHtml(d[1]) + "</span>"; tipEl.hidden = false; tipFor = el; el.setAttribute("aria-describedby", "syTip");
  var r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight, vw = document.documentElement.clientWidth, top = r.top - h - 8; if(top < 8) top = r.bottom + 8;
  tipEl.style.left = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2)) + "px"; tipEl.style.top = top + "px"; }
function hideTip(){ clearTimeout(tipT); if(tipFor){ tipFor.removeAttribute("aria-describedby"); tipFor = null; } tipEl.hidden = true; }
root.addEventListener("mouseover", function(e){ var el = e.target.closest && e.target.closest("[data-tip]"); if(!el){ return; } if(el === tipFor) return; clearTimeout(tipT); tipT = setTimeout(function(){ showTip(el); }, 380); });
root.addEventListener("mouseout", function(e){ var el = e.target.closest && e.target.closest("[data-tip]"); if(el && !(e.relatedTarget && el.contains(e.relatedTarget))) hideTip(); });
root.addEventListener("focusin", function(e){ var el = e.target.closest && e.target.closest("[data-tip]"); if(el) showTip(el); });
root.addEventListener("focusout", hideTip);
root.addEventListener("click", function(e){ var q = e.target.closest && e.target.closest(".lx-q"); if(!q) return; if(tipFor === q) hideTip(); else showTip(q); });
window.addEventListener("scroll", hideTip, {passive:true});

/* ---------- start ---------- */
drawStart(); drawProfile(); drawSamples(); setMode("write");
})();
