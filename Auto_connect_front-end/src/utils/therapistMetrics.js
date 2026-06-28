import { normalizeLevelLabel } from "./levels";

export const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return String(value.id || value._id || value.$oid || "");
  return "";
};

export const normalizeNameKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return "";
  return (
    person.name ||
    person.fullName ||
    `${person.firstName || ""} ${person.lastName || ""}`.trim()
  );
};

const getPersonEmail = (person) => {
  if (!person || typeof person === "string") return "";
  return person.email || "";
};

export const getKidParentRefs = (kid) => {
  const assignedParents = Array.isArray(kid?.assignedParents) ? kid.assignedParents : [];
  const ids = [...assignedParents, kid?.parentId].map(getEntityId).filter(Boolean);
  const names = [
    ...assignedParents.map(getPersonName),
    kid?.parentName,
  ]
    .map(normalizeNameKey)
    .filter(Boolean);
  const emails = [
    ...assignedParents.map(getPersonEmail),
    kid?.parentEmail,
  ]
    .map(normalizeNameKey)
    .filter(Boolean);

  return {
    ids: [...new Set(ids)],
    names: [...new Set(names)],
    emails: [...new Set(emails)],
  };
};

const toFiniteNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const firstMeaningfulNumber = (...values) => {
  const numbers = values.map(toFiniteNumber).filter((value) => value !== null && value > 0);
  return numbers[0] ?? null;
};

export const resolveKidScore = (kid, progress, history = [], sessions = []) => {
  const latestEvolution = Array.isArray(progress?.scoreEvolution)
    ? [...progress.scoreEvolution].sort((left, right) => {
        const leftDate = new Date(left?.createdAt || 0).getTime();
        const rightDate = new Date(right?.createdAt || 0).getTime();
        return rightDate - leftDate;
      })[0]
    : null;

  const latestSessionScore = sessions.find(
    (item) => typeof item.score === "number" && Number.isFinite(item.score),
  )?.score;
  const latestHistoryScore =
    progress?.recentHistory?.find((item) => typeof item.score === "number" && Number.isFinite(item.score))?.score ??
    history.find((item) => typeof item.score === "number" && Number.isFinite(item.score))?.score;

  const rawScore = firstMeaningfulNumber(
    latestEvolution?.value,
    latestEvolution?.score,
    progress?.currentScore,
    progress?.latestScore,
    progress?.averageScore,
    progress?.score,
    progress?.scoreEvolution?.[0]?.value,
    progress?.scoreEvolution?.[0]?.score,
    progress?.scoreEvolution?.at?.(-1)?.value,
    progress?.scoreEvolution?.at?.(-1)?.score,
    latestSessionScore,
    latestHistoryScore,
    kid?.currentScore,
    kid?.progressScore,
    kid?.score,
  );

  return rawScore === null ? null : Math.round(rawScore);
};

export const resolveKidScenarioCount = (kid, progress) => {
  const candidates = [
    progress?.completedScenariosCount,
    progress?.assignedScenarioCount,
    progress?.assignedScenarios?.length,
    progress?.scenarioCount,
    progress?.scenariosCount,
    progress?.topScenarios?.reduce((sum, item) => sum + (item.count || 0), 0),
    kid?.assignedScenarioCount,
    kid?.assignedScenarios?.length,
    kid?.scenarioCount,
    kid?.scenarios?.length,
  ]
    .map(Number)
    .filter((value) => Number.isFinite(value));

  return candidates.length ? Math.max(0, ...candidates) : 0;
};

export const resolveKidSessionsCount = (progress, sessions = []) => {
  const candidates = [
    progress?.activityCount,
    progress?.totalSessions,
    progress?.historyCount,
    progress?.topScenarios?.reduce((sum, item) => sum + (item.count || 0), 0),
    sessions.length,
  ]
    .map(Number)
    .filter((value) => Number.isFinite(value));

  return candidates.length ? Math.max(0, ...candidates) : 0;
};

export const buildKidMetrics = (kid, progress = null, history = [], sessions = []) => {
  const score = resolveKidScore(kid, progress, history, sessions);
  const totalSessions = resolveKidSessionsCount(progress, sessions);
  const assignedScenarioCount = resolveKidScenarioCount(kid, progress);
  const level = normalizeLevelLabel(progress?.currentLevel || kid?.level || kid?.currentLevel || kid?.communicationLevel);

  return {
    ...kid,
    level,
    currentLevel: level,
    currentScore: score,
    progressPercent: typeof score === "number" ? score : null,
    score,
    totalSessions,
    sessionsCount: totalSessions,
    assignedScenarioCount,
    scenarioCount: assignedScenarioCount,
    averageSessionDuration: progress?.averageSessionDuration ?? 0,
    frequentWords: (progress?.topPictograms || []).slice(0, 5).map((item) => item.name).filter(Boolean),
    recentPhrases: (progress?.recentHistory || [])
      .slice(0, 3)
      .map((item) => item.correctedText || item.generatedText)
      .filter(Boolean),
  };
};

export const groupKidsByParent = (kids) =>
  kids.reduce((acc, kid) => {
    const parentRefs = getKidParentRefs(kid);
    const keys = [
      ...parentRefs.ids.map((id) => `id:${id}`),
      ...parentRefs.emails.map((email) => `email:${email}`),
      ...parentRefs.names.map((name) => `name:${name}`),
    ];

    keys.forEach((key) => {
      acc[key] = [...(acc[key] || []), kid];
    });

    return acc;
  }, {});

export const getParentLookupKeys = (parent) => {
  const id = getEntityId(parent);
  const name = normalizeNameKey(getPersonName(parent));
  const email = normalizeNameKey(getPersonEmail(parent));
  return [
    id ? `id:${id}` : "",
    email ? `email:${email}` : "",
    name ? `name:${name}` : "",
  ].filter(Boolean);
};

export const getParentChildren = (parent, allChildren = []) => {
  const groupedChildren = groupKidsByParent(allChildren);
  const uniqueChildren = new Map();

  getParentLookupKeys(parent).forEach((key) => {
    (groupedChildren[key] || []).forEach((child) => {
      uniqueChildren.set(getEntityId(child) || child.name, child);
    });
  });

  return [...uniqueChildren.values()];
};

export const getChildrenForParent = getParentChildren;

export const getParentChildrenCount = (parent, allChildren = []) =>
  getParentChildren(parent, allChildren).length;

export const getChildScore = (child, progress = null, history = []) =>
  resolveKidScore(child, progress, history);

export const getChildSessionsCount = (child, progress = null, sessions = []) =>
  resolveKidSessionsCount(progress, sessions) || Number(child?.sessionsCount || child?.totalSessions || 0);
