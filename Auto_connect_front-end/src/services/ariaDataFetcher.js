// ══════════════════════════════════════════════════════════════════════════════
// ARIA Data Fetcher — gives ARIA real access to all app data
// Called before each LLM request so ARIA always has current numbers
// ══════════════════════════════════════════════════════════════════════════════

import {
  getAdminStatisticsApi,
  getGlobalAnalyticsApi,
  listKidsApi,
  listScenariosApi,
  listCategoriesApi,
  getDashboardAnalyticsApi,
} from "./domainApi";
import { listUsersApi } from "./usersApi";
import { getStoredUser } from "../utils/helpers";

// ─── Cache to avoid hammering the API (30 seconds TTL) ───────────────────────
const cache = { data: null, ts: 0 };
const TTL = 30_000; // 30s

export async function fetchAriaContext(forceRefresh = false) {
  if (!forceRefresh && cache.data && Date.now() - cache.ts < TTL) {
    return cache.data;
  }

  const user = getStoredUser();
  const role = user?.role || "PUBLIC";
  const ctx  = { role, userId: user?.id, userName: user?.name };

  try {
    if (role === "ADMIN") {
      // Admin gets everything
      const [stats, analytics, kids, users, scenarios, categories] = await Promise.allSettled([
        getAdminStatisticsApi(),
        getGlobalAnalyticsApi(),
        listKidsApi(),
        listUsersApi(),
        listScenariosApi(),
        listCategoriesApi(),
      ]);

      const s = stats.value || {};
      const a = analytics.value || {};
      const k = kids.value || [];
      const u = users.value || [];
      const sc = scenarios.value || [];
      const cat = categories.value || [];

      ctx.stats = {
        totalUsers:       s.totalUserAccounts      ?? s.users       ?? u.length,
        totalKids:        s.totalKids              ?? s.kids        ?? k.length,
        totalPictograms:  s.totalPictograms        ?? s.pictograms  ?? a.totalPictograms,
        totalCategories:  s.totalCategories        ?? s.categories  ?? cat.length,
        totalScenarios:   s.totalScenarios         ?? s.scenarios   ?? sc.length,
        totalSessions:    s.totalSessions          ?? s.sessions    ?? a.totalSessions,
        totalHistory:     s.totalHistory           ?? s.histories   ?? a.totalHistory,
        totalAiChats:     s.totalAiInteractions    ?? null,
      };

      // Per-role user counts
      const byRole = (a.usersByRole || []).reduce((acc, r) => {
        acc[r._id] = r.count; return acc;
      }, {});
      ctx.usersByRole = {
        admin:      byRole.admin      || u.filter((x) => x.role === "ADMIN").length      || 0,
        therapist:  byRole.therapist  || u.filter((x) => x.role === "THERAPIST").length  || 0,
        parent:     byRole.parent     || u.filter((x) => x.role === "PARENT").length     || 0,
        child:      byRole.child      || k.length,
      };

      ctx.recentKids       = k.slice(0, 5).map((k) => ({ name: k.name, age: k.age, level: k.level }));
      ctx.recentUsers      = u.slice(0, 5).map((u) => ({ name: u.name, role: u.role, email: u.email }));
      ctx.recentScenarios  = sc.slice(0, 5).map((s) => ({ title: s.title, level: s.level }));
      ctx.categories       = cat.map((c) => c.label || c.name);

    } else if (role === "THERAPIST") {
      const [dashboard, kids, scenarios] = await Promise.allSettled([
        getDashboardAnalyticsApi(),
        listKidsApi(),
        listScenariosApi(),
      ]);

      const d  = dashboard.value || {};
      const k  = kids.value      || [];
      const sc = scenarios.value || [];

      ctx.stats = {
        trackedKids:    d.trackedKids    ?? k.length,
        totalSessions:  d.sessionsCount  ?? null,
        totalHistory:   d.historyCount   ?? null,
        averageScore:   d.averageScore   ?? null,
      };
      ctx.myKids      = k.slice(0, 8).map((k) => ({ name: k.name, age: k.age, level: k.level }));
      ctx.myScenarios = sc.slice(0, 8).map((s) => ({ title: s.title, level: s.level }));

    } else if (role === "PARENT") {
      const [dashboard, kids] = await Promise.allSettled([
        getDashboardAnalyticsApi(),
        listKidsApi(),
      ]);

      const d = dashboard.value || {};
      const k = kids.value      || [];

      ctx.stats = {
        myKids:         k.length,
        totalSessions:  d.sessionsCount ?? null,
        averageScore:   d.averageScore  ?? null,
      };
      ctx.myKids = k.map((k) => ({
        id:    k.id,
        name:  k.name,
        age:   k.age,
        level: k.level,
        code:  k.childCode,
      }));
    }
  } catch (_) {
    // graceful — ARIA still works without data
  }

  cache.data = ctx;
  cache.ts   = Date.now();
  return ctx;
}

/** Force ARIA to refresh data on next call */
export function invalidateAriaCache() {
  cache.ts = 0;
}
