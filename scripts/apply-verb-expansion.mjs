/**
 * One-shot merge: expands verbs/examples/exercises/feedback/speed_contexts
 * from curated list. Run: node scripts/apply-verb-expansion.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function tierFor(group, rank, recommended) {
  if (recommended) return "core";
  if (rank <= 15) return "secondary";
  return "extended";
}

/**
 * Master list: `data/source/verbs_curated.csv` (group, rank, verb, meaning_es, recommended, id).
 * Meaning may contain commas; id and recommended are last fields.
 */
function loadCuratedRows() {
  const csvPath = join(root, "data/source/verbs_curated.csv");
  const text = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header || !header.startsWith("group,")) {
    throw new Error(`apply-verb-expansion: unexpected CSV header in ${csvPath}`);
  }
  /** @type {{group:string,rank:number,verb:string,meaning_es:string,rec:boolean,id:string}[]} */
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    if (parts.length < 6) {
      throw new Error(`apply-verb-expansion: bad CSV line (need 6+ fields): ${line}`);
    }
    const id = parts[parts.length - 1].trim();
    const rec = parts[parts.length - 2].trim().toLowerCase() === "yes";
    const group = parts[0].trim();
    const rank = Number(parts[1].trim());
    const verb = parts[2].trim();
    const meaning_es = parts.slice(3, -2).join(",").trim();
    if (!id || !verb || !Number.isFinite(rank)) {
      throw new Error(`apply-verb-expansion: invalid row: ${line}`);
    }
    rows.push({ group, rank, verb, meaning_es, rec, id });
  }
  return rows;
}

const ROWS = loadCuratedRows();

function buildVerb(row) {
  let pattern_behavior;
  let pattern_usages;
  if (row.group === "solo_to") {
    pattern_behavior = "only_infinitive";
    pattern_usages = ["pat_infinitive"];
  } else if (row.group === "solo_ing") {
    pattern_behavior = "only_gerund";
    pattern_usages = ["pat_gerund"];
  } else if (row.group === "both_no_change") {
    pattern_behavior = "both_same";
    pattern_usages = ["pat_both_same"];
  } else {
    pattern_behavior = "both_change";
    pattern_usages = ["pat_gerund", "pat_infinitive"];
  }
  const tag_ids =
    pattern_behavior === "both_change" ? ["tag_meaning_change"] : ["tag_a2"];
  const category_ids =
    pattern_behavior === "only_infinitive" && ["v_hope", "v_expect", "v_wish", "v_seem", "v_appear"].includes(row.id)
      ? ["cat_cognition"]
      : pattern_behavior === "only_gerund" && ["v_imagine", "v_consider", "v_mind"].includes(row.id)
        ? ["cat_cognition"]
        : ["cat_action"];
  return {
    id: row.id,
    base_form: row.verb,
    translation_es: row.meaning_es,
    pattern_behavior,
    pattern_usages,
    category_ids,
    tag_ids,
    learning_tier: tierFor(row.group, row.rank, row.rec),
    source_rank: row.rank,
  };
}

const verbs = ROWS.map(buildVerb).sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(join(root, "data/core/verbs.json"), JSON.stringify(verbs, null, 2) + "\n", "utf8");

/** Templates: verbId -> { pattern_id, pairs: [[prefix,target,suffix,es],[...]] } */
const TEMPLATES = {
  v_need: {
    pat: "pat_infinitive",
    pairs: [
      ["I need ", "to rest", " tonight.", "Necesito descansar esta noche."],
      ["She needs ", "to call", " her mom.", "Ella necesita llamar a su mamá."],
    ],
  },
  v_plan: {
    pat: "pat_infinitive",
    pairs: [
      ["We plan ", "to travel", " in July.", "Planeamos viajar en julio."],
      ["He is planning ", "to study", " abroad.", "Él planea estudiar en el extranjero."],
    ],
  },
  v_choose: {
    pat: "pat_infinitive",
    pairs: [
      ["They chose ", "to wait", ".", "Ellos eligieron esperar."],
      ["I can't choose ", "to stay", " or leave.", "No puedo elegir quedarme o irme."],
    ],
  },
  v_expect: {
    pat: "pat_infinitive",
    pairs: [
      ["We expect ", "to arrive", " at six.", "Esperamos llegar a las seis."],
      ["She expects ", "to pass", " the test.", "Ella espera aprobar el examen."],
    ],
  },
  v_promise: {
    pat: "pat_infinitive",
    pairs: [
      ["I promise ", "to help", " you.", "Prometo ayudarte."],
      ["He promised ", "to call", " later.", "Prometió llamar después."],
    ],
  },
  v_manage: {
    pat: "pat_infinitive",
    pairs: [
      ["She managed ", "to finish", " on time.", "Logró terminar a tiempo."],
      ["We couldn't manage ", "to open", " the door.", "No pudimos abrir la puerta."],
    ],
  },
  v_learn: {
    pat: "pat_infinitive",
    pairs: [
      ["I want ", "to learn", " French.", "Quiero aprender francés."],
      ["She learned ", "to swim", " last year.", "Aprendió a nadar el año pasado."],
    ],
  },
  v_refuse: {
    pat: "pat_infinitive",
    pairs: [
      ["He refused ", "to answer", ".", "Se negó a responder."],
      ["They refused ", "to pay", ".", "Se negaron a pagar."],
    ],
  },
  v_afford: {
    pat: "pat_infinitive",
    pairs: [
      ["We can't afford ", "to buy", " a car now.", "No podemos permitirnos comprar un coche ahora."],
      ["She can afford ", "to take", " a break.", "Puede permitirse tomarse un descanso."],
    ],
  },
  v_seem: {
    pat: "pat_infinitive",
    pairs: [
      ["He seems ", "to know", " the answer.", "Parece saber la respuesta."],
      ["It seems ", "to rain", " soon.", "Parece que va a llover pronto."],
    ],
  },
  v_appear: {
    pat: "pat_infinitive",
    pairs: [
      ["She appeared ", "to enjoy", " the show.", "Parecía disfrutar del show."],
      ["They appeared ", "to agree", ".", "Parecían estar de acuerdo."],
    ],
  },
  v_offer: {
    pat: "pat_infinitive",
    pairs: [
      ["He offered ", "to drive", " us home.", "Se ofreció a llevarnos a casa."],
      ["I offered ", "to help", ".", "Me ofrecí a ayudar."],
    ],
  },
  v_prepare: {
    pat: "pat_infinitive",
    pairs: [
      ["She prepared ", "to leave", ".", "Se preparó para irse."],
      ["We are preparing ", "to move", ".", "Nos estamos preparando para mudarnos."],
    ],
  },
  v_intend: {
    pat: "pat_infinitive",
    pairs: [
      ["I intend ", "to stay", " here.", "Tengo la intención de quedarme aquí."],
      ["They intend ", "to win", ".", "Tienen la intención de ganar."],
    ],
  },
  v_attempt: {
    pat: "pat_infinitive",
    pairs: [
      ["He attempted ", "to fix", " the bike.", "Intentó arreglar la bici."],
      ["She attempted ", "to explain", ".", "Intentó explicar."],
    ],
  },
  v_fail: {
    pat: "pat_infinitive",
    pairs: [
      ["I failed ", "to see", " him.", "No logré verlo."],
      ["They failed ", "to arrive", " on time.", "No lograron llegar a tiempo."],
    ],
  },
  v_deserve: {
    pat: "pat_infinitive",
    pairs: [
      ["You deserve ", "to relax", ".", "Mereces relajarte."],
      ["She deserves ", "to win", ".", "Ella merece ganar."],
    ],
  },
  v_hesitate: {
    pat: "pat_infinitive",
    pairs: [
      ["Don't hesitate ", "to ask", ".", "No dudes en preguntar."],
      ["She hesitated ", "to speak", ".", "Dudó en hablar."],
    ],
  },
  v_wish: {
    pat: "pat_infinitive",
    pairs: [
      ["I wish ", "to apply", " for the job.", "Deseo solicitar el trabajo."],
      ["We wish ", "to thank", " you.", "Deseamos agradecerte."],
    ],
  },
  v_arrange: {
    pat: "pat_infinitive",
    pairs: [
      ["They arranged ", "to meet", " at noon.", "Acordaron verse al mediodía."],
      ["I'll arrange ", "to call", " you.", "Organizaré llamarte."],
    ],
  },
  v_consider: {
    pat: "pat_gerund",
    pairs: [
      ["I'm considering ", "changing", " jobs.", "Estoy considerando cambiar de trabajo."],
      ["She considered ", "moving", " to Spain.", "Consideró mudarse a España."],
    ],
  },
  v_suggest: {
    pat: "pat_gerund",
    pairs: [
      ["I suggest ", "leaving", " early.", "Sugiero salir temprano."],
      ["He suggested ", "taking", " a taxi.", "Sugirió tomar un taxi."],
    ],
  },
  v_keep: {
    pat: "pat_gerund",
    pairs: [
      ["Keep ", "trying", "!", "¡Sigue intentando!"],
      ["She keeps ", "forgetting", " my name.", "Sigue olvidando mi nombre."],
    ],
  },
  v_mind: {
    pat: "pat_gerund",
    pairs: [
      ["Do you mind ", "closing", " the window?", "¿Te importa cerrar la ventana?"],
      ["I don't mind ", "waiting", ".", "No me importa esperar."],
    ],
  },
  v_imagine: {
    pat: "pat_gerund",
    pairs: [
      ["Imagine ", "living", " here!", "¡Imagina vivir aquí!"],
      ["I can't imagine ", "doing", " that.", "No me imagino haciendo eso."],
    ],
  },
  v_recommend: {
    pat: "pat_gerund",
    pairs: [
      ["I recommend ", "reading", " this book.", "Recomiendo leer este libro."],
      ["She recommended ", "seeing", " a doctor.", "Recomendó ver a un médico."],
    ],
  },
  v_admit: {
    pat: "pat_gerund",
    pairs: [
      ["He admitted ", "making", " a mistake.", "Admitió cometer un error."],
      ["She won't admit ", "losing", ".", "No admitirá haber perdido."],
    ],
  },
  v_deny: {
    pat: "pat_gerund",
    pairs: [
      ["He denied ", "taking", " the money.", "Negó haber cogido el dinero."],
      ["They denied ", "knowing", " him.", "Negaron conocerlo."],
    ],
  },
  v_practice: {
    pat: "pat_gerund",
    pairs: [
      ["I practice ", "playing", " piano daily.", "Practico tocar el piano a diario."],
      ["She is practicing ", "speaking", " English.", "Está practicando hablar inglés."],
    ],
  },
  v_postpone: {
    pat: "pat_gerund",
    pairs: [
      ["We postponed ", "having", " the meeting.", "Pospusimos tener la reunión."],
      ["They postponed ", "leaving", ".", "Pospusieron irse."],
    ],
  },
  v_risk: {
    pat: "pat_gerund",
    pairs: [
      ["Don't risk ", "losing", " your job.", "No arriesgues perder tu trabajo."],
      ["He risked ", "missing", " the train.", "Arriesgó perder el tren."],
    ],
  },
  v_mention: {
    pat: "pat_gerund",
    pairs: [
      ["She mentioned ", "seeing", " him yesterday.", "Mencionó haberlo visto ayer."],
      ["Did you mention ", "paying", " online?", "¿Mencionaste pagar en línea?"],
    ],
  },
  v_miss: {
    pat: "pat_gerund",
    pairs: [
      ["I miss ", "seeing", " my friends.", "Extraño ver a mis amigos."],
      ["She missed ", "catching", " the bus.", "Perdió el autobús (no lo alcanzó)."],
    ],
  },
  v_appreciate: {
    pat: "pat_gerund",
    pairs: [
      ["I appreciate ", "having", " your help.", "Aprecio tener tu ayuda."],
      ["We appreciate ", "hearing", " from you.", "Apreciamos saber de ti."],
    ],
  },
  v_resist: {
    pat: "pat_gerund",
    pairs: [
      ["I couldn't resist ", "eating", " the cake.", "No pude resistir comerme el pastel."],
      ["She resisted ", "saying", " anything.", "Se resistió a decir algo."],
    ],
  },
  v_cant_help: {
    pat: "pat_gerund",
    pairs: [
      ["I can't help ", "laughing", ".", "No puedo evitar reírme."],
      ["She can't help ", "worrying", ".", "No puede evitar preocuparse."],
    ],
  },
  v_continue: {
    pat: "pat_both_same",
    pairs: [
      ["We continued ", "working", " after lunch.", "Seguimos trabajando después del almuerzo."],
      ["She continued ", "to study", " at night.", "Siguió estudiando por la noche."],
    ],
  },
  v_like: {
    pat: "pat_both_same",
    pairs: [
      ["I like ", "reading", " novels.", "Me gusta leer novelas."],
      ["I like ", "to read", " in the morning.", "Me gusta leer por la mañana."],
    ],
  },
  v_love: {
    pat: "pat_both_same",
    pairs: [
      ["They love ", "traveling", " in summer.", "Les encanta viajar en verano."],
      ["He loves ", "to cook", " on Sundays.", "Le encanta cocinar los domingos."],
    ],
  },
  v_hate: {
    pat: "pat_both_same",
    pairs: [
      ["I hate ", "waiting", " in lines.", "Odio esperar en filas."],
      ["She hates ", "to be", " late.", "Odia llegar tarde."],
    ],
  },
  v_prefer: {
    pat: "pat_both_same",
    pairs: [
      ["I prefer ", "walking", " to driving.", "Prefiero caminar a conducir."],
      ["We prefer ", "to eat", " early.", "Preferimos comer temprano."],
    ],
  },
  v_cant_bear: {
    pat: "pat_both_same",
    pairs: [
      ["I can't bear ", "watching", " sad films.", "No soporto ver películas tristes."],
      ["She can't bear ", "to hear", " that noise.", "No soporta oír ese ruido."],
    ],
  },
  v_remember_extra: {
    pat: "pat_infinitive",
    pairs: [
      ["Please remember ", "to bring", " your ID.", "Por favor recuerda traer tu identificación."],
    ],
  },
  v_forget_extra: {
    pat: "pat_gerund",
    pairs: [
      ["I'll never forget ", "meeting", " her that day.", "Nunca olvidaré haberla conocido ese día."],
    ],
  },
  v_stop_extra: {
    pat: "pat_gerund",
    pairs: [["Stop ", "talking", " and listen.", "Deja de hablar y escucha."]],
  },
  v_decide_extra: {
    pat: "pat_infinitive",
    pairs: [
      ["We decided ", "to leave", " early.", "Decidimos irnos temprano."],
    ],
  },
  v_enjoy_extra: {
    pat: "pat_gerund",
    pairs: [
      ["They enjoy ", "playing", " board games on Fridays.", "Disfrutan jugar juegos de mesa los viernes."],
    ],
  },
  v_try: {
    pairs: [
      ["Try ", "turning", " it off and on.", "Prueba apagarlo y encenderlo.", "pat_gerund"],
      ["I tried ", "to understand", ".", "Intenté entender.", "pat_infinitive"],
    ],
  },
  v_regret: {
    pairs: [
      ["I regret ", "telling", " him.", "Lamento habérselo dicho.", "pat_gerund"],
      ["We regret ", "to announce", " the delay.", "Lamentamos anunciar el retraso.", "pat_infinitive"],
    ],
  },
  v_mean: {
    pairs: [
      ["I didn't mean ", "to shout", ".", "No quise gritar.", "pat_infinitive"],
      ["Your help means ", "saving", " time.", "Tu ayuda supone ahorrar tiempo.", "pat_gerund"],
    ],
  },
  v_go_on: {
    pairs: [
      ["Go on ", "eating", " if you like.", "Sigue comiendo si quieres.", "pat_gerund"],
      ["After the break, she went on ", "to explain", " the plan.", "Tras el descanso, siguió explicando el plan.", "pat_infinitive"],
    ],
  },
};

/** Map template keys that share a real verb_id */
const TEMPLATE_VERB_ID = {
  v_remember_extra: "v_remember",
  v_forget_extra: "v_forget",
  v_stop_extra: "v_stop",
  v_decide_extra: "v_decide",
  v_enjoy_extra: "v_enjoy",
};

const examplesPath = join(root, "data/content/examples.json");
const exercisesPath = join(root, "data/exercises/exercises.json");
const feedbackPath = join(root, "data/content/feedback.json");
const speedPath = join(root, "data/content/speed_contexts.json");

let examples = JSON.parse(readFileSync(examplesPath, "utf8"));
let exercises = JSON.parse(readFileSync(exercisesPath, "utf8"));
let feedback = JSON.parse(readFileSync(feedbackPath, "utf8"));
let speedContexts = JSON.parse(readFileSync(speedPath, "utf8"));

const PAT_PREP = "pat_prep_gerund";

function nextExId() {
  let max = 0;
  for (const e of examples) {
    const m = /^ex_(\d+)$/.exec(e.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `ex_${String(max + 1).padStart(3, "0")}`;
}

function nextQId() {
  let max = 0;
  for (const q of exercises) {
    const m = /^q_(\d+)$/.exec(q.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `q_${String(max + 1).padStart(3, "0")}`;
}

const fbByPattern = {
  pat_infinitive: "fb_pat_infinitive_generic",
  pat_gerund: "fb_pat_gerund_generic",
  pat_both_same: "fb_both_same",
};

if (!feedback.some((f) => f.id === "fb_pat_infinitive_generic")) {
  feedback.push({
    id: "fb_pat_infinitive_generic",
    title: "Verb + to + verb",
    body: "This verb is usually followed by **to + verb** in this lesson.",
    hint: "Use to + base verb after this verb.",
  });
}
if (!feedback.some((f) => f.id === "fb_pat_gerund_generic")) {
  feedback.push({
    id: "fb_pat_gerund_generic",
    title: "Verb + -ing",
    body: "This verb is usually followed by **-ing** in this lesson.",
    hint: "Use the -ing form after this verb.",
  });
}

const trickyFeedback = [
  {
    id: "fb_try_behavior",
    title: "Try: two different ideas",
    body: "**Try + -ing** can mean *test something*. **Try + to + verb** often means *make an effort*.",
    hint: "Test or effort? -ing vs to + verb.",
  },
  {
    id: "fb_regret_behavior",
    title: "Regret: past vs formal news",
    body: "**Regret + -ing** is about the **past**. **Regret + to + verb** is often formal bad news (**regret to inform**).",
    hint: "Past mistake → -ing. Formal message → to + verb.",
  },
  {
    id: "fb_mean_behavior",
    title: "Mean: intend vs imply",
    body: "**Mean + to + verb** = intend. **Mean + -ing** (or clause) can express what something **involves**.",
    hint: "Intend → to + verb. Involve / imply → often -ing.",
  },
  {
    id: "fb_go_on_behavior",
    title: "Go on: continue vs next topic",
    body: "**Go on + -ing** = continue the same activity. **Go on + to + verb** can mean continue **with a new action**.",
    hint: "Same activity → -ing. Next step → to + verb.",
  },
];
for (const f of trickyFeedback) {
  if (!feedback.some((x) => x.id === f.id)) feedback.push(f);
}

const extraTrickyFb = [
  {
    id: "fb_remember_infinitive",
    title: "Remember + to + verb",
    body: "**Remember + to + verb** means *don't forget to do something later* (a future task).",
    hint: "Reminder for later → remember + to + verb.",
  },
  {
    id: "fb_forget_gerund",
    title: "Forget + -ing (the past)",
    body: "**Forget + -ing** can mean you forgot something that **already happened**.",
    hint: "Past event forgotten → forget + -ing.",
  },
  {
    id: "fb_stop_gerund",
    title: "Stop + -ing",
    body: "**Stop + -ing** means you **quit** an activity (**stop talking** = dejar de hablar).",
    hint: "Quit an activity → stop + -ing.",
  },
];
for (const f of extraTrickyFb) {
  if (!feedback.some((x) => x.id === f.id)) feedback.push(f);
}

for (const [key, spec] of Object.entries(TEMPLATES)) {
  const verbId = TEMPLATE_VERB_ID[key] ?? key;
  for (const row of spec.pairs) {
    let prefix,
      target,
      suffix,
      es,
      pat = spec.pat;
    if (row.length === 4) {
      [prefix, target, suffix, es] = row;
    } else {
      [prefix, target, suffix, es, pat] = row;
    }
    if (!pat) throw new Error(`apply-verb-expansion: missing pattern for template key ${key}`);
    const dup = examples.some(
      (e) =>
        e.verb_id === verbId &&
        e.pattern_id === pat &&
        e.sentence_parts.target === target
    );
    if (dup) continue;
    const id = nextExId();
    const trickyNew = ["v_try", "v_regret", "v_mean", "v_go_on"].includes(verbId);
    examples.push({
      id,
      verb_id: verbId,
      pattern_id: pat,
      sentence_parts: { prefix, target, suffix },
      translation_es: es,
      level: "A2",
      focus: trickyNew || ["v_remember", "v_forget", "v_stop"].includes(verbId) ? "meaning_change" : "pattern",
      is_tricky: trickyNew || ["v_remember", "v_forget", "v_stop"].includes(verbId),
    });
  }
}

function distractorsFor(target, pat) {
  const t = target.toLowerCase();
  if (pat === "pat_infinitive") {
    if (t.startsWith("to "))
      return [target.replace(/^to /i, "").trim() + "ing", target.replace(/^to /, "")];
    return ["to " + target, target + "ing"];
  }
  if (t.endsWith("ing")) {
    const base = target.slice(0, -3);
    return [`to ${base}`, base];
  }
  return [`to ${target}`, `${target}ing`];
}

function feedbackForExercise(verb, pat) {
  if (verb.pattern_behavior === "both_change") {
    const m = {
      v_try: "fb_try_behavior",
      v_regret: "fb_regret_behavior",
      v_mean: "fb_mean_behavior",
      v_go_on: "fb_go_on_behavior",
      v_remember: pat === "pat_gerund" ? "fb_remember_gerund" : "fb_remember_infinitive",
      v_forget: pat === "pat_gerund" ? "fb_forget_gerund" : "fb_forget_infinitive",
      v_stop: pat === "pat_gerund" ? "fb_stop_gerund" : "fb_stop_infinitive",
    };
    return m[verb.id] || "fb_stop_behavior";
  }
  return fbByPattern[pat] || "fb_generic_incorrect";
}

const toAdd = [];
for (const ex of examples) {
  if (!ex.verb_id || ex.pattern_id === PAT_PREP) continue;
  if (exercises.some((q) => q.example_id === ex.id)) continue;
  const verb = verbs.find((v) => v.id === ex.verb_id);
  if (!verb) continue;
  const pat = ex.pattern_id;
  const fb = feedbackForExercise(verb, pat);
  const target = ex.sentence_parts.target;
  const useMc = /^\s*to\s+/i.test(target) || target.length < 14;
  const d = distractorsFor(target, pat);
  toAdd.push({
    id: "",
    type: useMc ? "multiple_choice" : "fill_blank",
    example_id: ex.id,
    distractors: useMc ? d.slice(0, 2) : [],
    correct_answer: target,
    validation: { case_sensitive: false, trim: true },
    feedback_id: fb,
  });
}

for (const q of toAdd) {
  q.id = nextQId();
  exercises.push(q);
}

// verb_pattern_behavior for both_change verbs (Mixed / Tricky)
const bothChangeBehaviorIds = [
  "v_try",
  "v_regret",
  "v_mean",
  "v_go_on",
  "v_remember",
  "v_forget",
];
for (const vid of bothChangeBehaviorIds) {
  if (exercises.some((q) => q.type === "verb_pattern_behavior" && q.verb_id === vid)) continue;
  const feedback_id =
    {
      v_try: "fb_try_behavior",
      v_regret: "fb_regret_behavior",
      v_mean: "fb_mean_behavior",
      v_go_on: "fb_go_on_behavior",
      v_remember: "fb_remember_gerund",
      v_forget: "fb_forget_infinitive",
    }[vid] || "fb_stop_behavior";
  exercises.push({
    id: nextQId(),
    type: "verb_pattern_behavior",
    verb_id: vid,
    distractors: ["only_gerund", "only_infinitive"],
    correct_answer: "both_change",
    validation: { case_sensitive: false, trim: true },
    feedback_id,
  });
}

const speedRows = [
  { id: "sc_try_test", verb_id: "v_try", context_label: "Test this / try it out", expected: "gerund" },
  { id: "sc_try_effort", verb_id: "v_try", context_label: "Make an effort", expected: "infinitive" },
  {
    id: "sc_regret_past",
    verb_id: "v_regret",
    context_label: "Something in the past",
    expected: "gerund",
  },
  {
    id: "sc_regret_formal",
    verb_id: "v_regret",
    context_label: "Formal bad news",
    expected: "infinitive",
  },
  { id: "sc_mean_intend", verb_id: "v_mean", context_label: "Did not intend", expected: "infinitive" },
  { id: "sc_mean_involve", verb_id: "v_mean", context_label: "What it involves", expected: "gerund" },
  { id: "sc_goon_same", verb_id: "v_go_on", context_label: "Continue same activity", expected: "gerund" },
  { id: "sc_goon_next", verb_id: "v_go_on", context_label: "Next thing you do", expected: "infinitive" },
];
for (const r of speedRows) {
  if (!speedContexts.some((s) => s.id === r.id)) speedContexts.push(r);
}

writeFileSync(examplesPath, JSON.stringify(examples, null, 2) + "\n", "utf8");
writeFileSync(exercisesPath, JSON.stringify(exercises, null, 2) + "\n", "utf8");
writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2) + "\n", "utf8");
writeFileSync(speedPath, JSON.stringify(speedContexts, null, 2) + "\n", "utf8");

console.log("Wrote verbs + merged examples/exercises/feedback/speed. Run: node scripts/validate-data.mjs");
