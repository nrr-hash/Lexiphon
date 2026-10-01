/* Lexiphon: a brand voice written down as a profile, and applied by rule.
   The profile has six layers. Tone is four dials after the Nielsen Norman Group's four dimensions of tone of voice (2016):
   formal to casual, serious to funny, respectful to irreverent, matter-of-fact to enthusiastic. Left on Auto, the tone sets
   what leads, the point of view, the rhythm, and the words; any of them can be set by hand. The twelve archetypes of
   Margaret Mark and Carol S. Pearson, The Hero and the Outlaw (2001), are fixed points in that tone space: the nearest one
   lends its word list. Their coordinates, and every rule below, are my judgement, not a measurement.
   Claims are a layer too: a voice can only use the facts in the brief, and when a fact it wants is missing it either marks
   the gap or leaves it out. It never fills it. */
(function(){
"use strict";

var BRIEFS = [
  {id:"jug", label:"A filter jug", tag:"invented", name:"the Lexi Jug", pron:"it", proper:["Lexi"],
   note:"Invented for this demonstration. There is no such product, and the figures are made up so that the check has something to check.",
   detailLabel:"the price",
   cta:"order a jug",
   facts:[
    {id:"F1", kind:"what", it:"{S} is a 2.4-litre water filter jug.", we:"We make {S}, a 2.4-litre water filter jug.", head:"A 2.4-litre water filter jug", nameHead:"The Lexi Jug, a 2.4-litre water filter jug"},
    {id:"F2", kind:"benefit", it:"{S} reduces limescale and the taste of chlorine in tap water.", you:"{S} reduces limescale and the taste of chlorine in your tap water.",
     imp:"Reduce limescale and the taste of chlorine in your tap water", np:"Tap water with less limescale and less chlorine taste", lock:["taste"]},
    {id:"F3", kind:"proof", it:"One cartridge lasts about four weeks for a household of two.", frag:"About four weeks per cartridge, for a household of two."},
    {id:"F4", kind:"feature", it:"The lid shows when the cartridge is due for a change.", you:"The lid shows you when the cartridge is due for a change.", lock:["shows","change"]},
    {id:"F5", kind:"audience", it:"{S} is made for homes in hard-water areas.", you:"If you live in a hard-water area, {S} is made for your home.", head:"For homes in hard-water areas"},
    {id:"F6", kind:"detail", it:"{S} costs £24, and replacement cartridges cost £5 each.", we:"We sell {S} for £24, and replacement cartridges for £5 each.", frag:"£24 for the jug. £5 a cartridge."}
   ]},
  {id:"author", label:"The author of this page", tag:"from this page", name:"Nathaniel Robertson", pron:"he", proper:["Nathaniel","Robertson","I","English","German","French","Malta","Gozo"],
   note:"Every fact is taken from this page, and the source line under each one quotes where.",
   detailLabel:"languages",
   cta:"ask for a content audit",
   facts:[
    {id:"F1", kind:"what", it:"{S} is a content specialist for source-checked B2B, B2C, and B2G writing.", we:"I am a content specialist for source-checked B2B, B2C, and B2G writing.",
     head:"Source-checked B2B, B2C, and B2G writing", nameHead:"Nathaniel Robertson, content specialist", lock:["writing"], src:"Masthead and “What I can do for you”: “Source-checked B2B, B2C, and B2G writing”."},
    {id:"F2", kind:"benefit", it:"Every claim {S} writes goes back to its source before it goes out.", you:"Every claim in your copy goes back to its source before it goes out.", we:"Every claim I write goes back to its source before it goes out.",
     np:"Every claim back to its source before it goes out", src:"Opening: “Every claim goes back to its source before it goes out.”", lock:["goes","back","source","claim","writes","write"]},
    {id:"F3", kind:"proof", it:"{S} works on four retained accounts, in three countries.", we:"I work on four retained accounts, in three countries.", frag:"Four retained accounts. Three countries.",
     src:"Experience: “Operate on four retained accounts”; Edited pitch: “Four retained accounts, in three countries”."},
    {id:"F4", kind:"feature", it:"{S} audits existing content libraries, scores them for machine-generated tells and search exposure, and prices the rebuild in writing.",
     you:"{S} audits your existing content library, scores it for machine-generated tells and search exposure, and prices the rebuild in writing.",
     we:"I audit existing content libraries, score them for machine-generated tells and search exposure, and price the rebuild in writing.",
     src:"“What I can do for you”: “Audits of existing content libraries, scored for machine-generated tells and search exposure, with the rebuild priced in writing.”", lock:["scores","score","prices","price"]},
    {id:"F5", kind:"audience", it:"{S} takes the dense material that regulated industries run on and turns it into English a buyer can trust.",
     you:"If you work in a regulated industry, {S} turns your specifications, standards, and contract small print into English a buyer can trust.",
     we:"I take the dense material that regulated industries run on and turn it into English a buyer can trust.",
     head:"For regulated industries", src:"Opening: “I take the dense material that regulated industries run on … and turn it into English a buyer can trust.”", lock:["take","takes","turn","turns","trust"]},
    {id:"F6", kind:"detail", it:"{S} works in English, German (C1), and French (B1), from Gozo, Malta.", we:"I work in English, German (C1), and French (B1), from Gozo, Malta.",
     frag:"English, German (C1), and French (B1). Based in Gozo, Malta.", src:"At a glance: “Languages English native, German C1, French B1”; “Base Gozo, Malta, and remote-ready”."}
   ]},
  {id:"payroll", label:"A payroll service", tag:"invented", name:"Lexi Payroll", pron:"it", proper:["Lexi","Payroll","HMRC","UK"],
   note:"Invented for this demonstration. There is no such service, and the figures are made up so that the check has something to check.",
   detailLabel:"the price",
   cta:"book a demo",
   facts:[
    {id:"F1", kind:"what", it:"{S} is a payroll service for UK companies.", we:"We run {S}, a payroll service for UK companies.", head:"A payroll service for UK companies", nameHead:"Lexi Payroll, a payroll service for UK companies"},
    {id:"F2", kind:"benefit", it:"{S} runs each pay run and files the reports to HMRC.", you:"{S} runs each pay run for you and files the reports to HMRC.",
     imp:"Hand over your pay runs and your HMRC filing", np:"Pay runs and HMRC filing, done for you", lock:["runs","files","reports"]},
    {id:"F3", kind:"proof", it:"A typical pay run takes under ten minutes to approve.", frag:"Under ten minutes to approve a typical pay run."},
    {id:"F4", kind:"feature", it:"Staff see their payslips in an app.", you:"Your staff see their payslips in an app.", lock:["see"]},
    {id:"F5", kind:"audience", it:"{S} is built for companies with 10 to 250 staff.", you:"If your company has 10 to 250 staff, {S} is built for it.", head:"For companies with 10 to 250 staff"},
    {id:"F6", kind:"detail", it:"{S} costs £4 per employee per month.", we:"We charge £4 per employee per month for {S}.", frag:"£4 per employee per month."}
   ]}
];


var KIND = {what:"what it is", benefit:"what it does", proof:"the evidence", feature:"a working detail", audience:"who it is for", detail:"the terms"};
var KINDS = ["proof","benefit","audience","what","feature","detail"];

/* tone: 0 to 100 on each dimension, the second-named end at 100 */
var TONE = [
  {k:"casual", lo:"Formal", hi:"Casual"},
  {k:"funny", lo:"Serious", hi:"Funny"},
  {k:"irreverent", lo:"Respectful", hi:"Irreverent"},
  {k:"enthusiastic", lo:"Matter-of-fact", hi:"Enthusiastic"}
];
/* where each archetype sits in tone space: my reading of Mark and Pearson, not theirs */
var LANDMARK = {
  "Innocent":[60,30,10,70], "Explorer":[60,20,40,80], "Sage":[20,10,10,20], "Hero":[40,10,30,90], "Outlaw":[80,40,90,70], "Magician":[40,20,30,80],
  "Regular Guy/Gal":[90,40,30,40], "Lover":[50,10,10,70], "Jester":[90,90,70,80], "Caregiver":[70,10,0,40], "Creator":[50,30,40,60], "Ruler":[10,0,10,30]
};
function toneOf(name){ var c = LANDMARK[name]; return {casual:c[0], funny:c[1], irreverent:c[2], enthusiastic:c[3]}; }
function nearest(t){ var best = null, bd = 1e9; Object.keys(LANDMARK).forEach(function(n){ var c = LANDMARK[n], d = Math.pow(c[0]-t.casual,2) + Math.pow(c[1]-t.funny,2) + Math.pow(c[2]-t.irreverent,2) + Math.pow(c[3]-t.enthusiastic,2); if(d < bd){ bd = d; best = n; } }); return best; }

/* from tone to the other layers; each result says which dial decided it */
function derive(p){
  var t = p.tone, d = {why:{}};
  if(p.lead !== "auto"){ d.lead = p.lead; d.why.lead = "set by hand"; }
  else if(t.enthusiastic >= 65){ d.lead = "benefit"; d.why.lead = "enthusiastic, so the benefit leads"; }
  else if(t.enthusiastic <= 35){ d.lead = "proof"; d.why.lead = "matter-of-fact, so the evidence leads"; }
  else if(t.casual >= 60 && t.irreverent <= 25){ d.lead = "audience"; d.why.lead = "casual and respectful, so the reader leads"; }
  else { d.lead = "what"; d.why.lead = "level tone, so it says what it is first"; }
  if(p.person !== "auto"){ d.person = p.person; d.why.person = "set by hand"; }
  else if(t.casual <= 30){ d.person = "it"; d.why.person = "formal, so the third person"; }
  else if(t.casual >= 55 || t.irreverent >= 60){ d.person = "you"; d.why.person = t.irreverent >= 60 ? "irreverent, so straight to the reader" : "casual, so straight to the reader"; }
  else { d.person = "we"; d.why.person = "neither formal nor casual, so the brand speaks"; }
  if(p.rhythm !== "auto"){ d.rhythm = p.rhythm; d.why.rhythm = "set by hand"; }
  else if(t.funny >= 60 || t.irreverent >= 60 || t.enthusiastic >= 75){ d.rhythm = "short"; d.why.rhythm = "lively tone, so short lines and fragments"; }
  else if(t.casual <= 30){ d.rhythm = "long"; d.why.rhythm = "formal, so measured, joined sentences"; }
  else { d.rhythm = "varied"; d.why.rhythm = "middle tone, so short pairs joined"; }
  d.near = nearest(t);
  if(p.words === "auto"){ d.words = d.near; d.why.words = "nearest archetype to this tone"; }
  else { d.words = p.words === "none" ? null : p.words; d.why.words = p.words === "none" ? "the brief’s own words" : "set by hand"; }
  d.bias = t.casual >= 60 ? Math.round((t.casual - 50) / 5) : t.casual <= 35 ? -Math.round((50 - t.casual) / 5) : 0;
  d.why.register = d.bias > 0 ? "casual, so contractions" : d.bias < 0 ? "formal, so every form written out" : "neither, so as the brief has it";
  d.head = t.casual <= 30 ? "name" : t.funny >= 60 ? "proof" : t.enthusiastic >= 65 ? (t.irreverent >= 40 || t.enthusiastic >= 80 ? "imperative" : "benefit") : d.lead === "audience" ? "audience" : "what";
  /* the closing line follows the most marked dial */
  var c;
  if(t.funny >= 65){ c = "Go on. {Cta}."; d.why.close = "funny"; }
  else if(t.irreverent >= 65){ c = "Skip the small talk. {Cta}."; d.why.close = "irreverent"; }
  else if(t.enthusiastic >= 70){ c = "{Cta} today."; d.why.close = "enthusiastic"; }
  else if(t.casual <= 15){ c = "To proceed, {cta}."; d.why.close = "formal"; }
  else if(t.casual >= 55 && t.irreverent <= 25){ c = "{Cta} whenever you are ready."; d.why.close = "casual and respectful"; }
  else if(t.enthusiastic <= 35){ c = "{Cta}, then judge it on the facts above."; d.why.close = "matter-of-fact"; }
  else { c = "{Cta}."; d.why.close = "level"; }
  d.close = c;
  return d;
}

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function wc(s){ return (s.match(/[A-Za-z0-9£][A-Za-z0-9£.,'’\-]*/g) || []).length; }
function factById(b, id){ for(var i = 0; i < b.facts.length; i++) if(b.facts[i].id === id) return b.facts[i]; return null; }
function label(b, k){ return k === "detail" ? b.detailLabel : KIND[k]; }
/* {S}: the name on first mention; after that the pronoun, but only when the sentence before was also about the subject */
function subjects(b){ var said = false, prevSubj = false;
  return function(s){ var startsSubj = /^\{S\}|^If [^,]*, \{S\}/.test(s);
    var out = s.replace(/\{S\}/g, function(m, at){ var w = said && prevSubj ? b.pron : b.name; said = true; return at === 0 ? cap(w) : w; });
    prevSubj = startsSubj || /\{S\}/.test(s); return out; }; }
function lowerStart(s, b){ var m = s.match(/^([A-Za-z]+)/); if(!m) return s; if(b.proper.indexOf(m[1]) >= 0 || /^[A-Z]{2,}/.test(m[1])) return s; return s.charAt(0).toLowerCase() + s.slice(1); }

/* the piece: only facts in the brief, in the order and shapes the profile chooses */
function compose(b, p, off){
  off = off || {};
  var d = derive(p), have = function(k){ for(var i = 0; i < b.facts.length; i++){ var f = b.facts[i]; if(f.kind === k && !off[f.id]) return f; } return null; };
  var base = p.tone.enthusiastic >= 60 ? ["benefit","feature","proof","what","audience","detail"] : p.tone.enthusiastic <= 35 ? ["proof","what","detail","feature","benefit","audience"] : ["benefit","proof","what","feature","audience","detail"];
  var order = [d.lead].concat(base.filter(function(k){ return k !== d.lead; }));
  var max = d.rhythm === "short" ? 2 : d.rhythm === "long" ? 4 : 3, frag = d.rhythm === "short";
  /* headline: the shape the tone asks for, from a fact that is there */
  var HK = {name:"what", what:"what", benefit:"benefit", imperative:"benefit", proof:"proof", audience:"audience"};
  var hk = HK[d.head], hf = have(hk), head;
  if(!hf){ hk = null; for(var i = 0; i < order.length && !hf; i++){ if(have(order[i])){ hk = order[i]; hf = have(hk); } } }
  if(!hf) head = {text:"", ids:[]};
  else {
    var ht = d.head === "name" && hk === "what" ? hf.nameHead : d.head === "imperative" && hk === "benefit" ? (hf.imp || hf.np) : hk === "benefit" ? hf.np : hk === "proof" ? (hf.frag || hf.it).split(". ")[0] : hk === "what" ? hf.head : hk === "audience" ? hf.head : null;
    if(!ht){ ht = subjects(b)(hf.it); }
    head = {text:ht.replace(/\.$/, "") + ".", ids:[hf.id], kind:hk};
  }
  var body = [], subj = subjects(b), n = 0;
  for(var j = 0; j < order.length && n < max; j++){ var k = order[j]; if(k === hk) continue;
    var f = have(k);
    if(!f){ var exists = b.facts.some(function(x){ return x.kind === k; });
      if(k === d.lead || j < max + 1){ n++; if(p.gaps === "flag") body.push({gap:true, text:"Needs " + label(b, k) + ": a fact, with its source.", ids:[], kinds:[k], frag:true, removed:exists}); }
      continue; }
    n++;
    var t = frag && f.frag ? f.frag : d.person === "we" && f.we ? f.we : d.person === "you" && f.you ? f.you : f.it;
    body.push({text:subj(t), ids:[f.id], kinds:[k], frag:frag && !!f.frag}); }
  if(d.rhythm !== "short"){
    var out = [];
    for(var q = 0; q < body.length; q++){ var a = body[q], c = body[q + 1];
      if(c && !a.gap && !c.gap && !a.frag && !c.frag && wc(a.text) + wc(c.text) <= 34 && !/^If /.test(c.text) && !/^(It|He|She|They)\b/.test(c.text) && !/, and /.test(a.text) && !/, and /.test(c.text)){
        out.push({text:a.text.replace(/\.$/, "") + (d.rhythm === "long" ? "; " : ", and ") + lowerStart(c.text, b), ids:a.ids.concat(c.ids), kinds:a.kinds.concat(c.kinds)}); q++; }
      else out.push(a); }
    body = out; }
  var end = d.close.replace("{Cta}", cap(b.cta)).replace("{cta}", b.cta);
  var used = {}; body.forEach(function(s){ s.ids.forEach(function(id){ used[id] = 1; }); }); head.ids.forEach(function(id){ used[id] = 1; });
  return {head:head, body:body, end:{text:end}, used:used, d:d, gaps:body.filter(function(s){ return s.gap; }).length};
}

/* every figure in the output must appear in the brief */
var NUMRE = /(?<![A-Za-z0-9])£?\d[\d.,]*(?:-litre|%)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred)\b/gi;
function figures(s){ return (s.match(NUMRE) || []).map(function(x){ return x.toLowerCase().replace(/[.,]$/, ""); }); }
function checkFigures(b, text){
  var pool = {}; b.facts.forEach(function(f){ ["it","we","you","frag","imp","np","head","nameHead"].forEach(function(k){ if(f[k]) figures(f[k]).forEach(function(x){ pool[x] = 1; }); }); });
  var found = figures(text), stray = found.filter(function(x){ return !pool[x]; });
  return {count:found.length, stray:stray};
}

/* reading a draft: what a rule can measure, and nothing it cannot */
var INTENS = "very really so incredibly amazing amazingly truly absolutely totally super extremely awesome fantastic love brilliant".split(" ");
var ABSOL = ["best","greatest","fastest","leading","ultimate","unrivalled","unrivaled","unbeatable","unmatched","number one","#1","world-class","guaranteed","perfect"];
function measure(text){
  var E = window.LEXI_ENGINE, sents = E.splitSentences(text), words = text.match(E.WORD) || [], n = words.length || 1;
  var lens = sents.map(function(s){ return E.wordsIn(s).length; }).filter(function(x){ return x > 0; }), st = E.stats(lens);
  var contr = (text.match(/\b\w+(?:n['’]t|['’](?:re|ve|ll|m|d))\b|\b(?:it|that|there|here|what|he|she|let|who)['’]s\b/gi) || []).length;
  var first = (text.match(/\b(?:i|me|my|we|us|our|ours)\b/gi) || []).length, second = (text.match(/\b(?:you|your|yours)\b/gi) || []).length;
  var excl = (text.match(/!/g) || []).length, intens = words.filter(function(w){ return INTENS.indexOf(w.toLowerCase()) >= 0; }).length;
  var low = " " + text.toLowerCase() + " ", absol = ABSOL.filter(function(a){ return new RegExp("[^a-z]" + a.replace(/[#]/g, "\\#") + "[^a-z]").test(low); });
  var wl = words.reduce(function(a, w){ return a + w.length; }, 0) / n, per = function(x){ return x / n * 100; };
  var mean = st ? st.mean : 0;
  var casual = Math.max(0, Math.min(100, Math.round(35 + per(contr) * 10 + Math.min(20, per(second) * 4) - Math.max(0, mean - 18) * 2 - Math.max(0, wl - 5) * 30)));
  var enth = Math.max(0, Math.min(100, Math.round(25 + per(excl) * 25 + per(intens) * 12 + absol.length * 8)));
  return {sentences:sents.length, words:words.length, st:st, mean:mean, contr:contr, first:first, second:second, excl:excl, intens:intens, absol:absol, wl:wl,
    figs:figures(text).filter(function(x){ return /\d/.test(x); }), tone:{casual:casual, enthusiastic:enth},
    person:second > first * 1.2 && second >= 2 ? "you" : first > second && first >= 2 ? "we" : "it",
    rhythm:mean && mean < 12 ? "short" : mean > 20 ? "long" : "varied"};
}

window.LEXI_BRAND = {BRIEFS:BRIEFS, KIND:KIND, KINDS:KINDS, TONE:TONE, LANDMARK:LANDMARK, toneOf:toneOf, nearest:nearest, derive:derive, compose:compose,
  checkFigures:checkFigures, measure:measure, factById:factById, label:label};
})();
