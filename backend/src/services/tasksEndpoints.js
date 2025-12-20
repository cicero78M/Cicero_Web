const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const RESPONSE_SCHEMA_VERSION = "2024-10-01";

const AUTH_HEADER_CANDIDATES = [
  "authorization",
  "x-reposter-token",
  "x-cicero-reposter-token",
  "x-cicero-token",
];

function getHeaderValue(headers, name) {
  if (!headers) return "";
  const raw = headers[name];
  if (Array.isArray(raw)) return raw[0] || "";
  return raw || "";
}

function extractBearerToken(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

function resolveAuthToken(req) {
  if (!req) return "";
  if (req.auth?.token) return String(req.auth.token);
  if (req.user?.token) return String(req.user.token);

  const headers = req.headers || {};
  for (const headerName of AUTH_HEADER_CANDIDATES) {
    const rawValue = getHeaderValue(headers, headerName);
    const token = extractBearerToken(rawValue);
    if (token) return token;
  }
  return "";
}

function parseQuery(req) {
  if (req?.query) return req.query;
  if (!req?.url) return {};
  const queryStart = req.url.indexOf("?");
  if (queryStart === -1) return {};
  const search = req.url.slice(queryStart + 1);
  const params = new URLSearchParams(search);
  return Object.fromEntries(params.entries());
}

function normalizeTaskFilters(query = {}) {
  const startDate =
    query.start_date ||
    query.startDate ||
    query.tanggal_mulai ||
    query.tanggalMulai ||
    "";
  const endDate =
    query.end_date ||
    query.endDate ||
    query.tanggal_selesai ||
    query.tanggalSelesai ||
    "";
  const limit = Number.parseInt(query.limit, 10);
  const offset = Number.parseInt(query.offset, 10);

  return {
    periode: query.periode || "",
    status: query.status || "",
    client_id: query.client_id || query.clientId || "",
    user_id: query.user_id || query.userId || query.nrp || "",
    start_date: startDate || "",
    end_date: endDate || "",
    limit: Number.isFinite(limit) ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
  };
}

function buildTaskResponse({ taskType, filters, tasks }) {
  return {
    success: true,
    data: {
      tasks,
      pagination: {
        total: tasks.length,
        limit: filters.limit,
        offset: filters.offset,
      },
      filters: {
        ...filters,
        task_type: taskType,
      },
    },
    meta: {
      schema_version: RESPONSE_SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
    },
  };
}

function buildReportLinksResponse({ postId, userId, links }) {
  return {
    success: true,
    data: {
      post_id: postId,
      user_id: userId,
      links,
    },
  };
}

function sendJson(res, status, payload) {
  if (!res) return;
  res.statusCode = status;
  if (typeof res.status === "function") {
    res.status(status);
  }
  if (typeof res.json === "function") {
    res.json(payload);
    return;
  }
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json");
  }
  if (typeof res.end === "function") {
    res.end(JSON.stringify(payload));
  }
}

function createTasksHandler(taskType, { taskProvider } = {}) {
  return async function tasksHandler(req, res) {
    const token = resolveAuthToken(req);
    if (!token) {
      sendJson(res, 401, {
        success: false,
        message:
          "Token tidak ditemukan. Sertakan Authorization atau X-Reposter-Token.",
      });
      return;
    }

    const filters = normalizeTaskFilters(parseQuery(req));
    let tasks = [];

    if (typeof taskProvider === "function") {
      try {
        const result = await taskProvider({ taskType, filters, token, req });
        tasks = Array.isArray(result) ? result : [];
      } catch (error) {
        sendJson(res, 500, {
          success: false,
          message: "Gagal memuat daftar tugas.",
        });
        return;
      }
    }

    sendJson(res, 200, buildTaskResponse({ taskType, filters, tasks }));
  };
}

function normalizeReportLinksValue(value) {
  if (!value) return "";
  return String(value).trim();
}

function normalizeReportLinksPayload(result) {
  if (!result) return {};
  const entry = Array.isArray(result) ? result[0] : result;
  if (!entry) return {};
  if (entry.links && typeof entry.links === "object") {
    return entry.links;
  }
  const links = {
    instagram: normalizeReportLinksValue(entry.instagram_link),
    facebook: normalizeReportLinksValue(entry.facebook_link),
    twitter: normalizeReportLinksValue(entry.twitter_link),
    tiktok: normalizeReportLinksValue(entry.tiktok_link),
    youtube: normalizeReportLinksValue(entry.youtube_link),
  };
  return Object.fromEntries(
    Object.entries(links).filter(([, url]) => url),
  );
}

function createReportLinksHandler({ reportLinksProvider } = {}) {
  return async function reportLinksHandler(req, res) {
    const token = resolveAuthToken(req);
    if (!token) {
      sendJson(res, 401, {
        success: false,
        message:
          "Token tidak ditemukan. Sertakan Authorization atau X-Reposter-Token.",
      });
      return;
    }

    const query = parseQuery(req);
    const postId = query.post_id || query.postId || "";
    const userId = query.user_id || query.userId || "";
    const platform = query.platform || "";

    if (!postId || !userId) {
      sendJson(res, 400, {
        success: false,
        message: "post_id dan user_id wajib diisi.",
      });
      return;
    }

    let links = {};

    if (typeof reportLinksProvider === "function") {
      try {
        const result = await reportLinksProvider({
          postId,
          userId,
          platform,
          token,
          req,
        });
        links = normalizeReportLinksPayload(result);
      } catch (error) {
        sendJson(res, 500, {
          success: false,
          message: "Gagal memuat tautan laporan.",
        });
        return;
      }
    }

    sendJson(res, 200, buildReportLinksResponse({ postId, userId, links }));
  };
}

function registerTaskEndpoints(app, options = {}) {
  if (!app || typeof app.get !== "function") {
    throw new Error(
      "registerTaskEndpoints membutuhkan app dengan metode get(path, handler).",
    );
  }
  const {
    basePath = "/api/tasks",
    reportLinksPath = "/api/reposter/report-links",
    taskProvider,
    reportLinksProvider,
  } = options;
  const officialHandler = createTasksHandler("official", { taskProvider });
  const specialHandler = createTasksHandler("special", { taskProvider });
  const reportLinksHandler = createReportLinksHandler({ reportLinksProvider });

  app.get(`${basePath}/official`, officialHandler);
  app.get(`${basePath}/special`, specialHandler);
  app.get(reportLinksPath, reportLinksHandler);
}

module.exports = {
  registerTaskEndpoints,
  createTasksHandler,
  createReportLinksHandler,
  normalizeTaskFilters,
  resolveAuthToken,
  RESPONSE_SCHEMA_VERSION,
};
