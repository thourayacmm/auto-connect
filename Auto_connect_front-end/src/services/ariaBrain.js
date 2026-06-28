// ══════════════════════════════════════════════════════════════════════════════
// ARIA Brain v4 — Full data access + JSON mode + local routing
// ══════════════════════════════════════════════════════════════════════════════

const GROQ_BASE = "https://api.groq.com/openai/v1";

// ─── Route registry ───────────────────────────────────────────────────────────
export const ROUTES = {
  "/admin":                       { label: "Tableau de bord Admin",       role: "ADMIN" },
  "/admin/users":                 { label: "Gestion des utilisateurs",    role: "ADMIN" },
  "/admin/permissions":           { label: "Permissions & rôles",         role: "ADMIN" },
  "/admin/pictograms":            { label: "Base de pictogrammes",        role: "ADMIN" },
  "/admin/access-requests":       { label: "Demandes d'accès (Admin)",    role: "ADMIN" },
  "/therapist":                   { label: "Tableau de bord Thérapeute",  role: "THERAPIST" },
  "/therapist/patients":          { label: "Gestion des patients",        role: "THERAPIST" },
  "/therapist/followed-children": { label: "Enfants suivis",              role: "THERAPIST" },
  "/therapist/scenarios":         { label: "Gestion des scénarios",       role: "THERAPIST" },
  "/therapist/levels":            { label: "Niveaux d'entraînement",      role: "THERAPIST" },
  "/therapist/pictograms":        { label: "Pictogrammes",                role: "THERAPIST" },
  "/therapist/reports":           { label: "Rapports IA",                 role: "THERAPIST" },
  "/therapist/access-requests":   { label: "Demandes d'accès",            role: "THERAPIST" },
  "/parent":                      { label: "Tableau de bord Parent",      role: "PARENT" },
  "/parent/child-session":        { label: "Session enfant",              role: "PARENT" },
  "/parent/progress":             { label: "Progression de l'enfant",     role: "PARENT" },
  "/parent/history":              { label: "Historique des activités",    role: "PARENT" },
  "/parent/settings":             { label: "Paramètres de suivi",         role: "PARENT" },
  "/parent/ai-chat":              { label: "Assistant IA",                role: "PARENT" },
  "/child":                       { label: "Accueil Enfant",              role: "CHILD" },
  "/child/board":                 { label: "Tableau de communication",    role: "CHILD" },
  "/child/search":                { label: "Recherche de pictogrammes",   role: "CHILD" },
  "/child/listen":                { label: "Écouter mes phrases",         role: "CHILD" },
  "/child/scenarios":             { label: "Scénarios d'entraînement",    role: "CHILD" },
  "/":                            { label: "Page d'accueil",              role: "PUBLIC" },
};

// ─── Local keyword router ─────────────────────────────────────────────────────
const KEYWORD_ROUTES = [
  { kw: ["tableau de bord admin","dashboard admin","espace admin"],             path: "/admin" },
  { kw: ["utilisateurs","gestion utilisateurs","users","thérapeutes"],          path: "/admin/users" },
  { kw: ["permissions","roles","rôles","droits","access control"],              path: "/admin/permissions" },
  { kw: ["base pictogrammes","pictogram database"],                             path: "/admin/pictograms" },
  { kw: ["demandes accès admin","access requests admin"],                       path: "/admin/access-requests" },
  { kw: ["tableau de bord thérapeute","dashboard thérapeute"],                  path: "/therapist" },
  { kw: ["patients","mes patients","gestion patients"],                         path: "/therapist/patients" },
  { kw: ["enfants suivis","followed children"],                                 path: "/therapist/followed-children" },
  { kw: ["gestion scénarios","scenarios thérapeute"],                           path: "/therapist/scenarios" },
  { kw: ["niveaux","levels","niveaux entraînement"],                            path: "/therapist/levels" },
  { kw: ["pictogrammes thérapeute"],                                            path: "/therapist/pictograms" },
  { kw: ["rapports","reports","rapports ia"],                                   path: "/therapist/reports" },
  { kw: ["tableau de bord parent","dashboard parent","espace parent"],          path: "/parent" },
  { kw: ["session enfant","child session","ouvrir session"],                    path: "/parent/child-session" },
  { kw: ["progression","progrès enfant"],                                       path: "/parent/progress" },
  { kw: ["historique","history","activités historique"],                        path: "/parent/history" },
  { kw: ["paramètres","settings","configuration suivi"],                        path: "/parent/settings" },
  { kw: ["assistant ia","ai chat","chatbot","assistant parent"],                path: "/parent/ai-chat" },
  { kw: ["accueil enfant","espace enfant"],                                     path: "/child" },
  { kw: ["tableau communication","communication board","communiquer"],          path: "/child/board" },
  { kw: ["rechercher pictogrammes","search pictograms","chercher pictogramme"], path: "/child/search" },
  { kw: ["écouter","listen","mes phrases"],                                     path: "/child/listen" },
  { kw: ["scénarios entraînement","training scenarios","s'entraîner"],          path: "/child/scenarios" },
  { kw: ["retour accueil","page accueil","home"],                               path: "/" },
];

const NAV_VERBS    = /^(va|aller|ouvre|montre|affiche|navigue|go|open|show|amène|emmène|accède|visite|voir|consulte|acceder)/i;
const ADD_CHILD    = /(ajoute|ajouter|créer|créé|create|add|nouveau|nouvelle).{0,15}(enfant|kid|child|profil)/i;
const WITH_NAME    = /(?:nom(?:mé|me)?|s'appelle|prenom|prénom|named?)\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿA-ZÀ-Ÿ\s\-']{1,30}?)(?:,|\s+\d|\s+age|\s+âge|\s+an|$)/i;
const WITH_AGE     = /(\d{1,2})\s*(?:ans?|year)/i;

export function resolveRoute(text) {
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const { kw, path } of KEYWORD_ROUTES) {
    if (kw.some((k) => norm.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) return path;
  }
  return null;
}

export function detectLocalIntent(text) {
  const route = resolveRoute(text);

  // Navigation with explicit verb
  if (route && NAV_VERBS.test(text.trim())) {
    return { type: "navigate", route };
  }

  // Add child locally if name+age are extractable
  if (ADD_CHILD.test(text)) {
    const nameMatch = WITH_NAME.exec(text);
    const ageMatch  = WITH_AGE.exec(text);
    const name = nameMatch ? nameMatch[1].trim() : null;
    const age  = ageMatch  ? parseInt(ageMatch[1], 10) : null;
    return name
      ? { type: "create_kid", payload: { name, age: age || 6, level: "Debutant" } }
      : { type: "create_kid_needs_llm" };
  }

  // Soft navigation (route found, no verb — let LLM confirm)
  if (route) return { type: "maybe_navigate", route };

  return null;
}

// ─── Build rich system prompt with real data ──────────────────────────────────
function buildSystemPrompt({ currentPath, userRole, userName, currentPageLabel }, appData) {
  const routeList = Object.entries(ROUTES)
    .filter(([, v]) => v.role === userRole || v.role === "PUBLIC")
    .map(([p, v]) => `  • ${v.label} → ${p}`)
    .join("\n");

  // Format real data block
  let dataBlock = "";
  if (appData) {
    const s = appData.stats || {};
    if (userRole === "ADMIN") {
      dataBlock = `
━━ DONNÉES RÉELLES DE LA PLATEFORME (live) ━━
• Utilisateurs totaux : ${s.totalUsers ?? "?"}
  - Admins : ${appData.usersByRole?.admin ?? "?"}
  - Thérapeutes : ${appData.usersByRole?.therapist ?? "?"}
  - Parents : ${appData.usersByRole?.parent ?? "?"}
  - Enfants (kids) : ${appData.usersByRole?.child ?? s.totalKids ?? "?"}
• Pictogrammes : ${s.totalPictograms ?? "?"}
• Catégories : ${s.totalCategories ?? "?"}
• Scénarios : ${s.totalScenarios ?? "?"}
• Sessions totales : ${s.totalSessions ?? "?"}
• Historique phrases : ${s.totalHistory ?? "?"}
• Interactions IA : ${s.totalAiChats ?? "?"}
${appData.recentUsers?.length ? `• Derniers utilisateurs : ${appData.recentUsers.map((u) => `${u.name} (${u.role})`).join(", ")}` : ""}
${appData.recentKids?.length ? `• Derniers enfants : ${appData.recentKids.map((k) => `${k.name} ${k.age}ans`).join(", ")}` : ""}
${appData.categories?.length ? `• Catégories : ${appData.categories.join(", ")}` : ""}`;
    } else if (userRole === "THERAPIST") {
      dataBlock = `
━━ MES DONNÉES (live) ━━
• Enfants suivis : ${s.trackedKids ?? "?"}
• Sessions : ${s.totalSessions ?? "?"}
• Score moyen : ${s.averageScore ?? "?"}
${appData.myKids?.length ? `• Mes enfants : ${appData.myKids.map((k) => `${k.name} (${k.age}ans, ${k.level})`).join(", ")}` : ""}
${appData.myScenarios?.length ? `• Scénarios : ${appData.myScenarios.map((s) => s.title).join(", ")}` : ""}`;
    } else if (userRole === "PARENT") {
      dataBlock = `
━━ MES DONNÉES (live) ━━
• Mes enfants : ${s.myKids ?? "?"}
• Sessions : ${s.totalSessions ?? "?"}
• Score moyen : ${s.averageScore ?? "?"}
${appData.myKids?.length ? `• Enfants : ${appData.myKids.map((k) => `${k.name} (${k.age}ans, code: ${k.code || "?"})`).join(", ")}` : ""}`;
    }
  }

  return `Tu es ARIA — assistante IA intelligente d'Auto Connect, plateforme CAA pour enfants autistes.

━━ IDENTITÉ ━━
ARIA: chaleureuse, précise, directe. Réponds toujours en JSON valide (une ligne).
Langue: français par défaut. Voix: réponses courtes (<2 phrases). Écrit: plus détaillé.

━━ CONTEXTE ━━
Utilisateur: ${userName || "utilisateur"} | Rôle: ${userRole} | Page: ${currentPageLabel || currentPath}
${dataBlock}

━━ FORMAT DE RÉPONSE OBLIGATOIRE ━━
TOUJOURS un JSON valide sur une ligne, JAMAIS de texte brut:
• Navigation : {"type":"navigate","route":"/chemin","reply":"message"}
• Réponse : {"type":"answer","reply":"ta réponse avec les vraies données"}
• Créer enfant : {"type":"create_kid","name":"Prénom","age":7,"level":"Debutant","reply":"message"}
• Créer utilisateur : {"type":"create_user","role":"THERAPIST","name":"Nom","email":"email@app","password":"demo123","specialty":"Orthophonie","reply":"message"}

━━ RÈGLES ━━
• UTILISE les données réelles ci-dessus pour répondre aux questions chiffrées
• Si on te demande "combien d'utilisateurs" → donne le vrai chiffre depuis les données
• Pour naviguer → type navigate avec la route exacte
• Tu PEUX créer des utilisateurs, des enfants — donne toujours une confirmation avec les détails

━━ PAGES ━━
${routeList}`;
}

// ─── Main Groq call ───────────────────────────────────────────────────────────
export async function callGroqLLM(userMessage, groqKey, context, history = [], appData = null) {
  const systemPrompt = buildSystemPrompt(context, appData);
  const recentHistory = history.slice(-4).map((m) => ({
    role: m.sender === "aria" ? "assistant" : "user",
    content: m.text,
  }));

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.35,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Groq ${res.status}`);
  }

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() || "{}";

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (_) { return { text: raw.replace(/[{}"]/g, ""), route: null, action: null }; }

  const reply = parsed.reply || parsed.message || "Je n'ai pas compris.";

  if (parsed.type === "navigate" && parsed.route) {
    return { text: reply, route: parsed.route, action: null };
  }
  if (parsed.type === "create_kid" && parsed.name) {
    return { text: reply, route: null, action: { type: "create_kid", payload: { name: parsed.name, age: parsed.age || 6, level: parsed.level || "Debutant" } } };
  }
  if (parsed.type === "create_user" && parsed.name) {
    return { text: reply, route: null, action: { type: "create_user", payload: { name: parsed.name, role: parsed.role, email: parsed.email, password: parsed.password || "demo123", specialty: parsed.specialty } } };
  }
  return { text: reply, route: null, action: null };
}

// ─── Whisper STT ─────────────────────────────────────────────────────────────
export async function transcribeAudio(audioBlob, groqKey, language = "fr") {
  const form = new FormData();
  form.append("file", new Blob([audioBlob], { type: "audio/webm" }), "rec.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", language);
  form.append("response_format", "json");
  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST", headers: { Authorization: `Bearer ${groqKey}` }, body: form,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Whisper ${res.status}`); }
  return ((await res.json()).text || "").trim();
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
export function speakText(text, { lang = "fr-FR", onStart, onEnd } = {}) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.93; u.pitch = 1.08;
  const pick = () => {
    const v = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("fr") && v.localService)
      || window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("fr"));
    if (v) u.voice = v;
  };
  window.speechSynthesis.getVoices().length ? pick() : (window.speechSynthesis.onvoiceschanged = pick);
  u.onstart = () => onStart?.(); u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeech() { window.speechSynthesis?.cancel(); }
