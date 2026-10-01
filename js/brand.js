/* Lexiphon briefs: one fact base, many voices.
   A brief is a short list of facts, each written once in a few grammatical shapes (third person, to the reader, as the
   speaker, as a fragment) and checked once. A voice decides which facts to use, in what order, from whose point of view,
   in what sentence shapes, and how to close. It cannot add a fact: every sentence of the output comes from a numbered fact,
   and the frames around them (a headline shape, a closing line) carry no claim of their own.
   The archetype method follows the house rule: one lead voice, up to two supporting voices, one seasoning voice. The lead
   sets structure, point of view, register, rhythm, and words. Each supporting voice makes sure the fact it cares about most
   is said. The seasoning voice writes the closing line and nothing else. Archetypes and quadrants after Margaret Mark and
   Carol S. Pearson, The Hero and the Outlaw (2001). The voice rules are mine. */
(function(){
"use strict";

/* {S} is the subject: the name on first mention, then the pronoun. Each fact keeps its source note. */
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

/* The voice rules. order: facts in priority. max: how many the lead says unprompted. person: "it" third person, "you" to
   the reader, "we" as the speaker. head: headline shape. frag: evidence and terms as fragments. join: "and" joins short
   pairs, "semi" joins them with a semicolon, "none" leaves sentences short. end: the closing line when this voice closes. */
var VOICE = {
  "Innocent":       {order:["benefit","what","feature","detail","proof","audience"], max:2, person:"you", head:"benefit", frag:false, join:"none", end:"{Cta}."},
  "Explorer":       {order:["benefit","feature","what","proof","audience","detail"], max:2, person:"you", head:"imperative", frag:true, join:"none", end:"{Cta} and see for yourself."},
  "Sage":           {order:["proof","benefit","what","feature","audience","detail"], max:3, person:"it", head:"name", frag:false, join:"and", end:"{Cta}, then judge it on the facts above."},
  "Hero":           {order:["benefit","proof","feature","what","audience","detail"], max:2, person:"you", head:"imperative", frag:true, join:"none", end:"{Cta} today."},
  "Outlaw":         {order:["benefit","detail","proof","what","feature","audience"], max:2, person:"you", head:"benefit", frag:true, join:"none", end:"Skip the small talk. {Cta}."},
  "Magician":       {order:["benefit","what","feature","proof","audience","detail"], max:2, person:"it", head:"benefit", frag:false, join:"and", end:"{Cta}. The first step is yours."},
  "Regular Guy/Gal":{order:["what","detail","benefit","feature","proof","audience"], max:3, person:"we", head:"what", frag:false, join:"none", end:"If it suits you, {cta}."},
  "Lover":          {order:["benefit","feature","what","audience","proof","detail"], max:2, person:"you", head:"benefit", frag:false, join:"and", end:"{Cta}, and make it yours."},
  "Jester":         {order:["benefit","proof","detail","what","feature","audience"], max:2, person:"you", head:"proof", frag:true, join:"none", end:"Go on. {Cta}."},
  "Caregiver":      {order:["audience","benefit","feature","proof","what","detail"], max:3, person:"you", head:"audience", frag:false, join:"and", end:"{Cta} whenever you are ready."},
  "Creator":        {order:["what","feature","benefit","proof","audience","detail"], max:2, person:"it", head:"what", frag:false, join:"semi", end:"{Cta}, and start from there."},
  "Ruler":          {order:["what","proof","feature","detail","benefit","audience"], max:3, person:"it", head:"name", frag:false, join:"semi", end:"To proceed, {cta}."}
};
var PERSON = {it:"in the third person", you:"to the reader", we:"as the speaker"};
var HEAD = {name:"the name", what:"what it is", benefit:"the benefit", imperative:"an instruction", proof:"the evidence", audience:"who it is for"};
var HEADKIND = {name:"what", what:"what", benefit:"benefit", imperative:"benefit", proof:"proof", audience:"audience"};
var JOIN = {and:"long: short pairs joined with “and”", semi:"measured: pairs joined with a semicolon", none:"short, one fact to a sentence"};

/* Mark and Pearson's four motivations. Opposite poles: stability against risk, belonging against independence. */
var QUAD = {"Creator":"stability","Caregiver":"stability","Ruler":"stability","Jester":"belonging","Regular Guy/Gal":"belonging","Lover":"belonging",
  "Hero":"mastery","Outlaw":"mastery","Magician":"mastery","Innocent":"independence","Explorer":"independence","Sage":"independence"};
var QUADNAME = {stability:"Stability and control", belonging:"Belonging and enjoyment", mastery:"Risk and mastery", independence:"Independence and fulfilment"};
var OPP = {stability:"mastery", mastery:"stability", belonging:"independence", independence:"belonging"};

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function wc(s){ return (s.match(/[A-Za-z0-9£][A-Za-z0-9£.,'’\-]*/g) || []).length; }
function factById(b, id){ for(var i = 0; i < b.facts.length; i++) if(b.facts[i].id === id) return b.facts[i]; return null; }
function factOfKind(b, k){ for(var i = 0; i < b.facts.length; i++) if(b.facts[i].kind === k) return b.facts[i]; return null; }

/* resolve {S}: the name on first mention, then the pronoun */
function subjects(b){
  var said = false;
  return function(s){ return s.replace(/\{S\}/g, function(m, at){ var w = said ? b.pron : b.name; said = true; return at === 0 ? cap(w) : w; }); };
}
function lowerStart(s, b){
  var m = s.match(/^([A-Za-z]+)/); if(!m) return s;
  if(b.proper.indexOf(m[1]) >= 0 || /^[A-Z]{2,}/.test(m[1])) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function shape(f, v){
  if(v.frag && f.frag) return {text:f.frag, frag:true};
  if(v.person === "we" && f.we) return {text:f.we};
  if(v.person === "you" && f.you) return {text:f.you};
  return {text:f.it};
}

function compose(b, roles){
  var lead = roles.lead, v = VOICE[lead]; if(!v) return null;
  var hk = HEADKIND[v.head], headFact = factOfKind(b, hk), head = "";
  if(v.head === "name") head = headFact.nameHead;
  else if(v.head === "imperative") head = headFact.imp || headFact.np;
  else if(v.head === "benefit") head = headFact.np;
  else if(v.head === "proof") head = headFact.frag.replace(/\.$/, "").split(". ")[0];
  else head = headFact.head;
  head = head.replace(/\.$/, "") + ".";
  /* what the lead says unprompted, then what each supporting voice insists on */
  var picks = [], by = {};
  v.order.forEach(function(k){ if(k !== hk && picks.length < v.max){ picks.push(k); by[k] = lead; } });
  (roles.support || []).forEach(function(s){ var sv = VOICE[s]; if(!sv) return;
    for(var i = 0; i < sv.order.length; i++){ var k = sv.order[i]; if(k === hk) continue; if(picks.indexOf(k) < 0){ picks.push(k); by[k] = s; } else if(by[k] === lead){ by[k] = lead + " and " + s; } break; } });
  picks.sort(function(a, c){ return v.order.indexOf(a) - v.order.indexOf(c); });
  var subj = subjects(b), body = [];
  picks.forEach(function(k){ var f = factOfKind(b, k); if(!f) return; var sh = shape(f, v);
    body.push({text:subj(sh.text), ids:[f.id], kinds:[k], by:[by[k]], frag:!!sh.frag}); });
  /* rhythm: the lead joins short neighbours, or leaves them short */
  if(v.join !== "none"){
    var joined = [];
    for(var i = 0; i < body.length; i++){
      var a = body[i], c = body[i + 1];
      if(c && !a.frag && !c.frag && wc(a.text) + wc(c.text) <= 34 && !/^If /.test(c.text) && !/^(It|He|She|They)\b/.test(c.text) && !/, and /.test(a.text)){
        var glue = v.join === "semi" ? "; " : ", and ";
        joined.push({text:a.text.replace(/\.$/, "") + glue + lowerStart(c.text, b), ids:a.ids.concat(c.ids), kinds:a.kinds.concat(c.kinds), by:a.by.concat(c.by), frag:false}); i++;
      } else joined.push(a);
    }
    body = joined;
  }
  /* the closing line: the seasoning voice writes it if there is one, otherwise the lead */
  var closer = roles.season && VOICE[roles.season] ? roles.season : lead, tpl = VOICE[closer].end;
  var end = tpl.replace("{Cta}", cap(b.cta)).replace("{cta}", b.cta);
  var sup = (roles.support || []).map(function(s){ var sv = VOICE[s]; if(!sv) return null; var k = null;
    for(var i = 0; i < sv.order.length; i++){ if(sv.order[i] !== hk){ k = sv.order[i]; break; } }
    var f = factOfKind(b, k); return {name:s, kind:k, label:k === "detail" ? b.detailLabel : KIND[k], id:f ? f.id : null, added:by[k] === s}; }).filter(Boolean);
  var used = {}; body.forEach(function(s){ s.ids.forEach(function(id){ used[id] = 1; }); }); if(headFact) used[headFact.id] = 1;
  return {head:{text:head, ids:[headFact.id], kind:hk}, body:body, end:{text:end, by:closer}, used:used,
    rules:{lead:lead, person:PERSON[v.person], head:HEAD[v.head], leadsWith:body.length ? (body[0].kinds[0] === "detail" ? b.detailLabel : KIND[body[0].kinds[0]]) : "", support:sup, join:JOIN[v.join], frag:v.frag, closer:closer}};
}

/* every figure in the output must appear in the brief */
var NUMRE = /£?\d[\d.,]*(?:-litre)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred)\b/gi;
function figures(s){ return (s.match(NUMRE) || []).map(function(x){ return x.toLowerCase().replace(/[.,]$/, ""); }); }
function checkFigures(b, text){
  var pool = {}; b.facts.forEach(function(f){ ["it","we","you","frag","imp","np","head","nameHead"].forEach(function(k){ if(f[k]) figures(f[k]).forEach(function(x){ pool[x] = 1; }); }); });
  var found = figures(text), stray = found.filter(function(x){ return !pool[x]; });
  return {count:found.length, stray:stray};
}

/* the house rule, checked against the quadrant map */
function checkRoles(roles){
  var out = [], lq = QUAD[roles.lead];
  if(!roles.lead) return out;
  (roles.support || []).forEach(function(s){ var q = QUAD[s];
    out.push(q === OPP[lq] ? {ok:false, t:s + " sits opposite the lead on the map (" + QUADNAME[q] + " against " + QUADNAME[lq] + "), so it pulls against it."}
                           : {ok:true, t:s + " supports from " + (q === lq ? "the same quadrant" : QUADNAME[q]) + "."}); });
  if(roles.season){ var sq = QUAD[roles.season];
    out.push(sq === lq ? {ok:false, t:"The seasoning comes from the lead’s own quadrant, so it adds no contrast."}
                       : {ok:true, t:roles.season + " seasons from " + QUADNAME[sq] + (sq === OPP[lq] ? ", the widest contrast available." : ".")}); }
  return out;
}

window.LEXI_BRAND = {BRIEFS:BRIEFS, VOICE:VOICE, QUAD:QUAD, QUADNAME:QUADNAME, OPP:OPP, KIND:KIND, compose:compose, checkFigures:checkFigures, checkRoles:checkRoles, factById:factById};
})();
