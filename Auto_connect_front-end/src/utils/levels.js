const levelAliases = {
  "niveau 1": "Debutant",
  "niveau 2": "Intermediaire",
  "niveau 3": "Avance",
};

export const normalizeLevelLabel = (level) => {
  const rawLevel = String(level || "").trim();
  if (!rawLevel) return "Debutant";

  return levelAliases[rawLevel.toLowerCase()] || rawLevel;
};
