/* Lexiphon engine: sentence maths, the archetypes' word lists, and the rules that apply them. No page access.
   Loaded after lexicon.js (LEX_EXTRA, LEX_PATCH) and before brand.js and studio.js. */
(function(){
"use strict";
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
/* ---------- the lexicons: every archetype chooses its own words for the same slot ---------- */
/* Each row is one slot of ordinary copy. "src" are the words it reads; each archetype then offers its own word for that slot,
   or none. Verbs are written as a base form and inflected by rule ("equip:equipped:equipping" marks an irregular),
   nouns as a singular. A "!" as the word means: drop the word. Guards keep a swap to the sense it was written for. */
var LEX = [
  /* verbs */
  {p:"v", src:["use"], skip:["to"], alt:{Sage:"apply", Ruler:"deploy", Hero:"wield", "Regular Guy/Gal":"lean on"}},
  {p:"v", src:["help"], g:"hw", alt:{Caregiver:"support", Sage:"assist", Hero:"back"}},
  {p:"v", src:["make:makes:made:making"], g:"np", alt:{Creator:"build:builds:built:building", Magician:"conjure"}},
  {p:"v", src:["get:gets:got:getting"], g:"np", alt:{Ruler:"secure", "Regular Guy/Gal":"grab:grabs:grabbed:grabbing", Jester:"snag:snags:snagged:snagging", Outlaw:"seize"}},
  {p:"v", src:["show:shows:showed:showing"], g:"np", alt:{Sage:"demonstrate", Magician:"reveal", Lover:"unveil", Creator:"present"}},
  {p:"v", src:["change"], alt:{Sage:"revise", "Regular Guy/Gal":"switch", Creator:"reshape"}},
  {p:"v", src:["improve"], alt:{Sage:"refine", Hero:"strengthen", Creator:"rework", Ruler:"upgrade", "Regular Guy/Gal":"polish"}},
  {p:"v", src:["check"], alt:{Sage:"verify:verifies:verified:verifying", Ruler:"audit", "Regular Guy/Gal":"look over", Hero:"test"}},
  {p:"v", src:["choose:chooses:chose:choosing"], alt:{Ruler:"select", Explorer:"pick", Jester:"cherry-pick"}},
  {p:"v", src:["deliver"], alt:{Creator:"produce", Caregiver:"provide", Hero:"land", "Regular Guy/Gal":"hand over", Jester:"serve up"}},
  {p:"v", src:["keep:keeps:kept:keeping"], g:"np", alt:{Sage:"retain", Ruler:"hold:holds:held:holding", "Regular Guy/Gal":"hang on to:hangs on to:hung on to:hanging on to", Caregiver:"safeguard"}},
  {p:"v", src:["start"], skip:["with"], alt:{Explorer:"launch", Hero:"kick off", Jester:"fire up", Ruler:"commence", Magician:"spark"}},
  {p:"v", src:["find:finds:found:finding"], g:"np", skip:["out","that"], alt:{Sage:"identify:identifies:identified:identifying", Explorer:"discover", Outlaw:"dig up:digs up:dug up:digging up", "Regular Guy/Gal":"track down", Magician:"uncover"}},
  {p:"v", src:["need"], skip:["to"], alt:{Ruler:"require"}},
  {p:"v", src:["want"], skip:["to"], alt:{Lover:"desire", Explorer:"seek:seeks:sought:seeking"}},
  {p:"v", src:["build:builds:built:building"], alt:{Sage:"develop", Ruler:"establish", Magician:"conjure", Lover:"cultivate", Outlaw:"hammer out"}},
  {p:"v", src:["create"], alt:{Creator:"shape", Magician:"conjure", Sage:"devise", Ruler:"establish", "Regular Guy/Gal":"put together:puts together:put together:putting together"}},
  {p:"v", src:["explain"], alt:{Creator:"lay out:lays out:laid out:laying out", Sage:"clarify:clarifies:clarified:clarifying", Caregiver:"talk through", "Regular Guy/Gal":"spell out:spells out:spelled out:spelling out", Ruler:"set out:sets out:set out:setting out"}},
  {p:"v", src:["explore"], alt:{Explorer:"scout", Sage:"examine"}},
  {p:"v", src:["learn"], skip:["from","to","that"], alt:{Sage:"study:studies:studied:studying", Explorer:"discover", "Regular Guy/Gal":"pick up:picks up:picked up:picking up"}},
  {p:"v", src:["understand:understands:understood:understanding"], alt:{Sage:"comprehend", Magician:"perceive", "Regular Guy/Gal":"get:gets:got:getting", Caregiver:"see:sees:saw:seeing"}},
  {p:"v", src:["fix"], alt:{Sage:"resolve", "Regular Guy/Gal":"sort out", Ruler:"remedy:remedies:remedied:remedying", Caregiver:"mend"}},
  {p:"v", src:["protect"], alt:{Caregiver:"shelter", Hero:"defend", Ruler:"safeguard"}},
  {p:"v", src:["love"], skip:["to"], alt:{Lover:"adore", Caregiver:"cherish"}},
  {p:"v", src:["enjoy"], alt:{Lover:"savour", Innocent:"delight in", Jester:"lap up:laps up:lapped up:lapping up"}},
  {p:"v", src:["write:writes:wrote:writing"], alt:{Creator:"compose", Sage:"document", Lover:"pen:pens:penned:penning"}},
  {p:"v", src:["reduce"], alt:{"Regular Guy/Gal":"cut:cuts:cut:cutting", Sage:"lower"}},
  {p:"v", src:["increase"], alt:{Hero:"boost", "Regular Guy/Gal":"bump up:bumps up:bumped up:bumping up", Sage:"raise"}},
  {p:"v", src:["give:gives:gave:giving"], skip:["up","in","back","away"], g:"np", alt:{Ruler:"grant", Caregiver:"offer"}},
  {p:"v", src:["see:sees:saw:seeing"], skip:["also","below","above"], g:"np", alt:{Sage:"observe", Explorer:"spot:spots:spotted:spotting"}},
  {p:"v", src:["travel"], alt:{Explorer:"roam"}},
  {p:"v", src:["run:runs:ran:running"], g:"np", alt:{Ruler:"operate"}},
  {p:"v", src:["transform"], g:"np", alt:{Sage:"convert", Creator:"reshape", Magician:"transmute", Ruler:"overhaul", Hero:"remake:remakes:remade:remaking"}},
  {p:"v", src:["solve"], g:"np", alt:{Sage:"resolve", Magician:"unravel", Hero:"crack", "Regular Guy/Gal":"sort out"}},
  {p:"v", src:["stop"], g:"np", alt:{Outlaw:"kill", Hero:"halt", Ruler:"cease"}},
  {p:"v", src:["ignore"], g:"np", alt:{Sage:"disregard"}},
  {p:"v", src:["replace"], g:"np", alt:{Sage:"supersede", Ruler:"substitute", "Regular Guy/Gal":"swap:swaps:swapped:swapping"}},
  /* adjectives */
  {p:"a", src:["good"], skip:["morning","luck","evening","afternoon","night"], alt:{Innocent:"fine", Sage:"sound", Hero:"strong", Ruler:"sterling", "Regular Guy/Gal":"decent", Lover:"lovely", Jester:"ace"}},
  {p:"a", src:["great"], alt:{Jester:"brilliant", Lover:"wonderful", Hero:"outstanding", Innocent:"splendid"}},
  {p:"a", src:["big"], alt:{Ruler:"major", Jester:"huge", Sage:"substantial"}},
  {p:"a", src:["small"], alt:{Sage:"modest", "Regular Guy/Gal":"little", Innocent:"tiny", Jester:"teeny", Ruler:"minor"}},
  {p:"a", src:["new"], alt:{Innocent:"fresh", Jester:"brand-new"}},
  {p:"a", src:["simple"], alt:{Sage:"straightforward", Innocent:"plain", "Regular Guy/Gal":"no-nonsense", Ruler:"uncluttered", Outlaw:"stripped-back"}},
  {p:"a", src:["difficult"], alt:{Sage:"demanding", Hero:"gruelling", "Regular Guy/Gal":"tough", Explorer:"testing"}},
  {p:"a", src:["quick"], alt:{Explorer:"swift", Hero:"rapid", Ruler:"prompt", Jester:"zippy", "Regular Guy/Gal":"speedy"}},
  {p:"a", src:["important"], alt:{Ruler:"key", Sage:"central"}},
  {p:"a", src:["strong"], alt:{Hero:"powerful", Ruler:"firm"}},
  {p:"a", src:["beautiful"], alt:{Lover:"exquisite", Creator:"striking", Innocent:"lovely", Jester:"gorgeous"}},
  {p:"a", src:["happy"], alt:{Innocent:"glad", Jester:"chuffed", Caregiver:"content", Lover:"delighted", "Regular Guy/Gal":"pleased"}},
  {p:"a", src:["interesting"], alt:{Explorer:"intriguing", Magician:"curious"}},
  {p:"a", src:["different"], skip:["from","to","than"], alt:{Sage:"distinct", Jester:"offbeat"}},
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
  {p:"a", src:["surprising"], alt:{Magician:"uncanny"}},
  /* nouns */
  {p:"n", src:["problem"], alt:{Sage:"difficulty", Hero:"challenge", "Regular Guy/Gal":"snag", Jester:"hiccup", Magician:"puzzle"}},
  {p:"n", src:["idea"], alt:{Creator:"concept", Jester:"brainwave"}},
  {p:"n", src:["goal"], alt:{Ruler:"objective", Hero:"target", "Regular Guy/Gal":"aim"}},
  {p:"n", src:["team"], alt:{"Regular Guy/Gal":"crew", Hero:"squad", Jester:"gang"}},
  {p:"n", src:["customer","client"], alt:{"Regular Guy/Gal":"folk:folks", Ruler:"client", Lover:"guest", Jester:"punter"}},
  {p:"n", src:["company"], alt:{Ruler:"enterprise", "Regular Guy/Gal":"outfit", Hero:"firm", Sage:"organisation"}},
  {p:"n", src:["project"], alt:{Ruler:"programme"}},
  {p:"n", src:["result"], alt:{Ruler:"outcome"}},
  {p:"n", src:["story:stories"], alt:{Creator:"narrative", Jester:"yarn", Lover:"tale", Explorer:"saga"}},
  {p:"n", src:["friend"], alt:{"Regular Guy/Gal":"mate", Caregiver:"companion", Jester:"pal"}},
  {p:"n", src:["expert"], alt:{Sage:"specialist", Ruler:"authority:authorities"}},
  {p:"n", src:["approach:approaches"], alt:{Sage:"method", "Regular Guy/Gal":"way", Creator:"technique"}},
  {p:"n", src:["risk"], alt:{Explorer:"hazard", Sage:"exposure"}},
  {p:"n", src:["plan"], g:"nn", alt:{Creator:"blueprint", Ruler:"strategy:strategies", Explorer:"route"}},
  {p:"n", src:["tool"], alt:{"Regular Guy/Gal":"kit", Creator:"instrument", Sage:"instrument", Jester:"gizmo"}},
  {p:"n", src:["success:successes"], alt:{Hero:"victory:victories"}},
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
function registerPass(text, sel, mix, force){
  var V = activeVoices(sel, mix), bias = force != null ? force : V.reduce(function(a, v){ return a + (PLAIN[v.name] ? v.w : 0) - (FORMAL[v.name] ? v.w : 0); }, 0);
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
function transform(src, voice, T, bias){
  var sel = voice == null ? [] : [voice], m = {}; if(voice != null) m[voice] = 10;
  var v = voiceSwap(src, sel, m), g = registerPass(v.text, sel, m, bias), r = reshape(g.text, T);
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
window.LEXI_ENGINE = {WORD:WORD, FUNC:FUNC, ARCH:ARCH, CUES:CUES, NAMEIX:NAMEIX, LEX:LEX, LEXLIST:LEXLIST, MORE:MORE, SCREEN:SCREEN, CHOICE:CHOICE,
  esc:esc, escHtml:escHtml, splitSentences:splitSentences, wordsIn:wordsIn, stats:stats, voiceSwap:voiceSwap, registerPass:registerPass, reshape:reshape,
  transform:transform, diffMarks:diffMarks, tokens:tokens, inflV:inflV, inflN:inflN};
})();
