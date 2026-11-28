(() => {
  "use strict";

  const ANILIST_URL = "https://graphql.anilist.co";
  const KITSU_URL = "https://kitsu.io/api/edge/manga";
  const JIKAN_URL = "https://api.jikan.moe/v4/manga";

  const STORAGE_KEYS = {
    INIT_FLAG: "vexin_initialized_v41",
    SHELF: "vexin_shelf_v41",
    BANS: "vexin_bans_v41",
    THEME: "vexin_theme_v41",
    TITLE_PREF: "vexin_title_pref_v41",
    READER_API: "vexin_reader_api_v41",
    COVER_MAP: "vexin_cover_map_v41"
  };

  const THEMES = [
    { id: "moonlight", name: "Moonlight", color: "#38bdf8" },
    { id: "crimson", name: "Crimson Red", color: "#f43f5e" },
    { id: "shadow", name: "Shadow Violet", color: "#a855f7" },
    { id: "jade", name: "Jade Murim", color: "#10b981" },
    { id: "daylight", name: "Daylight", color: "#2563eb" }
  ];

  // Built-in default catalog so UI renders 100% immediately even before catalog.json finishes
  const DEFAULT_CATALOG = {
    starters: [
      { id: "al-105398", anilistId: 105398, title: "Solo Leveling", native: "나 혼자만 레벨업", chapters: 200, score: 87 },
      { id: "al-119257", anilistId: 119257, title: "Omniscient Reader", native: "전지적 독자 시점", chapters: 235, score: 88 },
      { id: "oel-tbate", anilistId: 105398, title: "The Beginning After the End", native: "끝이 아닌 시작 (TBATE)", chapters: 205, score: 89 },
      { id: "al-114578", anilistId: 114578, title: "Legend of the Northern Blade", native: "북검전기", chapters: 202, score: 89 },
      { id: "al-128067", anilistId: 128067, title: "SSS-Class Revival Hunter", native: "SSS급 죽어야 사는 헌터", chapters: 125, score: 86 },
      { id: "al-117460", anilistId: 117460, title: "Villains Are Destined to Die", native: "악역의 엔딩은 죽음뿐", chapters: 162, score: 87 },
      { id: "al-85143", anilistId: 85143, title: "Tower of God", native: "신의 탑", chapters: 640, score: 84 },
      { id: "al-106929", anilistId: 106929, title: "Eleceed", native: "일렉시드", chapters: 325, score: 86 },
      { id: "al-120829", anilistId: 120829, title: "Nano Machine", native: "나노마신", chapters: 235, score: 82 },
      { id: "al-131767", anilistId: 131767, title: "Return of the Mount Hua Sect", native: "화산귀환", chapters: 145, score: 88 },
      { id: "al-137133", anilistId: 137133, title: "The Greatest Estate Developer", native: "역대급 영지 설계사", chapters: 170, score: 90 },
      { id: "al-146747", anilistId: 146747, title: "Reaper of the Drifting Moon", native: "표월", chapters: 98, score: 83 },
      { id: "al-139137", anilistId: 139137, title: "Doom Breaker", native: "투신전생기", chapters: 101, score: 85 },
      { id: "al-159507", anilistId: 159507, title: "Pick Me Up, Infinite Gacha", native: "픽 미 업!", chapters: 125, score: 86 },
      { id: "al-126297", anilistId: 126297, title: "Mercenary Enrollment", native: "입학용병", chapters: 215, score: 82 },
      { id: "al-85858", anilistId: 85858, title: "Lookism", native: "외모지상주의", chapters: 530, score: 83 }
    ],
    oelCatalog: [
      {
        id: "oel-tbate",
        source: "Tapas / OEL",
        displayTitle: "The Beginning After the End",
        romajiTitle: "The Beginning After the End (TBATE)",
        nativeTitle: "끝이 아닌 시작",
        synonyms: ["TBATE", "The Beginning After The End", "Beginning After the End"],
        cover: "",
        chapters: 205,
        score: 89,
        status: "RELEASING",
        genres: ["Action", "Adventure", "Fantasy"],
        tags: ["Reincarnation", "Magic", "Overpowered MC", "Swordplay", "School", "Full Color", "Royalty"],
        description: "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. Reborn into a new world filled with magic and monsters as Arthur Leywin, he gets a second chance to live his life and protect those he loves.",
        url: "https://tapas.io/series/tbate-comic"
      },
      {
        id: "oel-unordinary",
        source: "WEBTOON",
        displayTitle: "unOrdinary",
        romajiTitle: "unOrdinary",
        nativeTitle: "언오디너리",
        synonyms: ["Unordinary"],
        cover: "",
        chapters: 345,
        score: 84,
        status: "RELEASING",
        genres: ["Action", "Drama", "Supernatural"],
        tags: ["Superpowers", "School", "Bullying", "Anti-Hero", "Full Color", "Hidden Identity"],
        description: "In a world where everyone possesses superpowers, John is a seemingly powerless cripple attending Wellston Private High School—harboring a dark secret about his true abilities.",
        url: "https://www.webtoons.com/en/super-hero/unordinary/list?title_no=679"
      },
      {
        id: "oel-purple-hyacinth",
        source: "WEBTOON",
        displayTitle: "Purple Hyacinth",
        romajiTitle: "Purple Hyacinth",
        nativeTitle: "퍼플 히아신스",
        synonyms: ["Purple Hyacinth"],
        cover: "",
        chapters: 158,
        score: 91,
        status: "HIATUS",
        genres: ["Mystery", "Action", "Drama", "Thriller"],
        tags: ["Detective", "Assassin", "Crime", "Full Color", "Conspiracy", "Steampunk"],
        description: "A police officer with the ability to detect lies forms a secret alliance with the city's deadliest assassin to dismantle the criminal syndicate ruining their lives.",
        url: "https://www.webtoons.com/en/mystery/purple-hyacinth/list?title_no=1621"
      },
      {
        id: "oel-hand-jumper",
        source: "WEBTOON",
        displayTitle: "Hand Jumper",
        romajiTitle: "Hand Jumper",
        nativeTitle: "핸드 점퍼",
        synonyms: ["Hand Jumper"],
        cover: "",
        chapters: 96,
        score: 88,
        status: "RELEASING",
        genres: ["Action", "Thriller", "Supernatural"],
        tags: ["Time Manipulation", "Anti-Hero", "Superpowers", "Strategy", "Full Color"],
        description: "Sayeon Lee despises Aberrants—until she discovers she is one with the power to rewind time by seconds, forcing her into a ruthless corps of superpowered enforcers.",
        url: "https://www.webtoons.com/en/thriller/hand-jumper/list?title_no=2702"
      }
    ],
    genreCategories: [
      {
        category: "Core Genres",
        items: [
          { label: "Action", type: "genre", value: "Action" },
          { label: "Adventure", type: "genre", value: "Adventure" },
          { label: "Fantasy", type: "genre", value: "Fantasy" },
          { label: "Drama", type: "genre", value: "Drama" },
          { label: "Mystery", type: "genre", value: "Mystery" },
          { label: "Supernatural", type: "genre", value: "Supernatural" },
          { label: "Thriller", type: "genre", value: "Thriller" },
          { label: "Sci-Fi", type: "genre", value: "Sci-Fi" },
          { label: "Comedy", type: "genre", value: "Comedy" },
          { label: "Romance", type: "genre", value: "Romance" },
          { label: "Psychological", type: "genre", value: "Psychological" },
          { label: "Slice of Life", type: "genre", value: "Slice of Life" },
          { label: "Horror", type: "genre", value: "Horror" },
          { label: "Sports", type: "genre", value: "Sports" }
        ]
      },
      {
        category: "Manhwa Worlds & Power Systems",
        items: [
          { label: "Murim / Martial Arts", type: "tag", value: "Martial Arts" },
          { label: "System / Leveling", type: "tag", value: "Video Games" },
          { label: "Regression / Time Travel", type: "tag", value: "Time Manipulation" },
          { label: "Reincarnation / Isekai", type: "tag", value: "Reincarnation" },
          { label: "Tower / Dungeon", type: "tag", value: "Dungeon" },
          { label: "Necromancer", type: "tag", value: "Necromancy" },
          { label: "Magic & Sorcery", type: "tag", value: "Magic" },
          { label: "Swordplay", type: "tag", value: "Swordplay" },
          { label: "Academy / School", type: "tag", value: "School" },
          { label: "Kingdom Building", type: "tag", value: "Politics" },
          { label: "Post-Apocalyptic", type: "tag", value: "Post-Apocalyptic" },
          { label: "Superpowers", type: "tag", value: "Superpowers" }
        ]
      },
      {
        category: "Protagonist & Tone",
        items: [
          { label: "Overpowered MC", type: "tag", value: "Overpowered MC" },
          { label: "Anti-Hero", type: "tag", value: "Anti-Hero" },
          { label: "Revenge", type: "tag", value: "Revenge" },
          { label: "Villainess / Otome", type: "tag", value: "Villainess" },
          { label: "Cultivation", type: "tag", value: "Cultivation" },
          { label: "Survival", type: "tag", value: "Survival" },
          { label: "Crime / Gangster", type: "tag", value: "Crime" },
          { label: "Historical", type: "tag", value: "Historical" },
          { label: "Full Color", type: "tag", value: "Full Color" }
        ]
      }
    ],
    collectorNotes: [
      { id: "chapters100", label: "100+ Chapters" },
      { id: "chapters200", label: "200+ Chapters (Long Epic)" },
      { id: "peakArt", label: "High Rated / Peak Art (80+)" },
      { id: "masterpiece", label: "Masterpiece Tier (86+)" },
      { id: "fullColor", label: "Full Color" },
      { id: "completed", label: "Completed Only" },
      { id: "releasing", label: "Ongoing / Releasing" },
      { id: "hiddenGems", label: "Hidden Gems" }
    ],
    banPresets: [
      { id: "bl", label: "BL / Boys' Love", terms: ["boys' love", "boy's love", "bl", "shounen ai", "yaoi"] },
      { id: "gl", label: "GL / Girls' Love", terms: ["girls' love", "girl's love", "gl", "shoujo ai", "yuri"] },
      { id: "mlm", label: "Gay / MLM", terms: ["gay", "mlm", "male/male", "homosexual"] },
      { id: "wlw", label: "Lesbian / WLW", terms: ["lesbian", "wlw", "female/female"] },
      { id: "harem", label: "Harem", "terms": ["harem", "male harem"] },
      { id: "revharem", label: "Reverse Harem", terms: ["reverse harem", "female harem"] },
      { id: "ecchi", label: "Ecchi / Smut", terms: ["ecchi", "smut", "erotica", "hentai"] },
      { id: "ntr", label: "NTR / Netorare", terms: ["ntr", "netorare", "cheating"] },
      { id: "tragedy", label: "Tragedy", terms: ["tragedy"] },
      { id: "horror", label: "Horror / Gore", terms: ["horror", "gore"] },
      { id: "psych", label: "Psychological", terms: ["psychological"] },
      { id: "romance", label: "Romance", terms: ["romance"] },
      { id: "mecha", label: "Mecha", terms: ["mecha"] },
      { id: "sports", label: "Sports", terms: ["sports"] },
      { id: "sol", label: "Slice of Life", terms: ["slice of life"] }
    ],
    updateLogs: [
      {
        version: "v4.1.0",
        date: "2026-11-28",
        badge: "Hotfix & Brand",
        title: "Non-Blocking Boot, Dynamic Cover Hydration & VexinManwha Crest Logo",
        changes: [
          "Wired all theme switchers, navigation tabs, and dashboard buttons synchronously in <5ms before any network request runs.",
          "Embedded built-in fallback catalog data directly in app.js so all 16 starters, 35 genres, bans, and update logs appear instantaneously.",
          "Added batched AniList ID cover hydration so starter cards load authentic cover art.",
          "Added custom VexinManwha vector emblem (favicon.svg, manifest.json, Apple touch icon, and header crest)."
        ]
      }
    ]
  };

  let catalogData = structuredClone ? structuredClone(DEFAULT_CATALOG) : JSON.parse(JSON.stringify(DEFAULT_CATALOG));
  let coverCache = loadJSON(STORAGE_KEYS.COVER_MAP, {});
  let shelf = loadJSON(STORAGE_KEYS.SHELF, []);
  let bannedTerms = loadJSON(STORAGE_KEYS.BANS, [
    "boys' love", "boy's love", "bl", "shounen ai", "yaoi",
    "girls' love", "girl's love", "gl", "shoujo ai", "yuri",
    "gay", "mlm", "lesbian", "wlw"
  ]);
  let selectedTags = new Set();
  let selectedGenres = new Set();
  let selectedNotes = new Set();
  let currentRecommendations = [];
  let titlePref = localStorage.getItem(STORAGE_KEYS.TITLE_PREF) || "scanlation";

  const apiCache = new Map();
  let searchAbortController = null;
  let searchDebounceTimer = null;

  let readerState = {
    seriesTitle: "VexinManwha Web Reader",
    chapters: [],
    currentIdx: 0,
    autoScrollTimer: null
  };

  const el = {};

  function cacheElements() {
    const ids = [
      "themeSelect", "themeSwatches", "titlePrefSelect", "openReaderBtn",
      "jumpToMatcherBtn", "refreshDashboardBtn", "dashShelfCount", "dashDnaCount",
      "dashBanCount", "dashRecommendedGrid", "dashPeakArtGrid", "dashLongEpicGrid",
      "searchInput", "searchSpinner", "searchDropdown", "starterCardsRow",
      "shelfGrid", "shelfCount", "clearShelfBtn", "extractedTags", "tagHint",
      "categorizedGenresContainer", "noteChips", "banPresetChips", "customBanInput",
      "addBanBtn", "activeBansList", "clearBansBtn", "findBtn", "statusBanner",
      "resultsCount", "sortSelect", "resultsGrid", "settingsReaderApiInput",
      "settingsSaveApiBtn", "exportJsonBtn", "importJsonInput", "reseedStartersBtn",
      "clearCacheBtn", "cacheCountBadge", "updateLogsContainer", "detailModal",
      "closeDetailBtn", "detailBody", "readerModal", "closeReaderBtn",
      "readerSeriesTitle", "readerChapterSelect", "prevChapBtn", "nextChapBtn",
      "stripWidthRange", "stripWidthVal", "autoScrollBtn", "readerContinuityBar",
      "readerPagesContainer", "readerApiUrlInput", "saveReaderApiBtn", "localCbzInput"
    ];
    for (const id of ids) el[id] = document.getElementById(id);
    el.navTabs = document.querySelectorAll(".nav-tab");
    el.views = document.querySelectorAll(".view-section");
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* ignore */ }
  }

  function createFallbackPoster(title, badge = "MANHWA") {
    const cleanTitle = (title || "VexinManwha").slice(0, 34).replace(/[<>&"']/g, "");
    const words = cleanTitle.split(" ");
    const lines = [];
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > 15) {
        lines.push(current.trim());
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    }
    if (current) lines.push(current);
    const textSpans = lines
      .slice(0, 4)
      .map((line, i) => `<tspan x="50%" dy="${i === 0 ? "0" : "24"}">${line}</tspan>`)
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="300" height="450" fill="url(#g)"/>
      <rect x="14" y="14" width="272" height="422" rx="12" fill="none" stroke="#38bdf8" stroke-opacity="0.35" stroke-width="2"/>
      <text x="50%" y="56" fill="#38bdf8" font-family="system-ui,sans-serif" font-size="13" font-weight="700" text-anchor="middle">${badge}</text>
      <text x="50%" y="200" fill="#f8fafc" font-family="system-ui,sans-serif" font-size="20" font-weight="800" text-anchor="middle">${textSpans}</text>
      <text x="50%" y="410" fill="#64748b" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">VEXINMANWHA ARCHIVE</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function applySafeImage(imgEl, url, title, badge) {
    if (!imgEl) return;
    const fallback = createFallbackPoster(title, badge);
    imgEl.src = url || fallback;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = fallback;
    };
  }

  // =========================================================================
  // SYNCHRONOUS FIRST PAINT + IMMEDIATE EVENT WIRING (ZERO BLOCKING)
  // =========================================================================
  function init() {
    cacheElements();
    applyTheme(localStorage.getItem(STORAGE_KEYS.THEME) || "moonlight");

    if (el.titlePrefSelect) el.titlePrefSelect.value = titlePref;
    const savedApi = localStorage.getItem(STORAGE_KEYS.READER_API) || "";
    if (el.readerApiUrlInput) el.readerApiUrlInput.value = savedApi;
    if (el.settingsReaderApiInput) el.settingsReaderApiInput.value = savedApi;

    // 1. Bind all UI events immediately so buttons & themes work instantaneously
    bindEvents();

    // 2. Render all synchronous UI immediately from built-in defaults
    renderThemeSwatches();
    renderCategorizedGenres();
    renderNoteChips();
    renderBanSection();
    renderUpdateLogs();
    renderStarterCards();
    renderShelf();
    updateDashboardStats();

    // 3. Run background data hydration without blocking UI
    hydrateBackgroundData();
  }

  async function hydrateBackgroundData() {
    try {
      const res = await fetch("./catalog.json");
      if (res.ok) {
        const fetchedCatalog = await res.json();
        catalogData = { ...catalogData, ...fetchedCatalog };
        renderCategorizedGenres();
        renderNoteChips();
        renderBanSection();
        renderUpdateLogs();
        renderStarterCards();
      }
    } catch {
      /* built-in catalogData remains active */
    }

    // Batch-fetch real AniList cover images for all starter cards in 1 fast call
    await hydrateStarterCovers();

    // Seed default 4 starter manhwa on first visit
    if (!localStorage.getItem(STORAGE_KEYS.INIT_FLAG) && shelf.length === 0) {
      await seedDefaultStarterShelf();
      localStorage.setItem(STORAGE_KEYS.INIT_FLAG, "1");
    }

    // Load live dashboard shelves
    await loadDashboardFeeds();
  }

  async function hydrateStarterCovers() {
    const ids = Array.from(
      new Set((catalogData.starters || []).map((s) => s.anilistId).filter(Boolean))
    );
    if (!ids.length) return;

    const gql = `
      query ($ids: [Int]) {
        Page(page: 1, perPage: 30) {
          media(id_in: $ids, type: MANGA) {
            id
            title { english romaji native }
            synonyms
            chapters
            averageScore
            status
            genres
            tags { name rank isMediaSpoiler }
            coverImage { large }
            description(asHtml: false)
            siteUrl
          }
        }
      }
    `;
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gql, variables: { ids } })
      });
      const json = await res.json();
      const mediaList = json?.data?.Page?.media || [];
      for (const m of mediaList) {
        if (m.coverImage?.large) {
          coverCache[m.id] = m.coverImage.large;
        }
      }
      saveJSON(STORAGE_KEYS.COVER_MAP, coverCache);
      renderStarterCards();
    } catch {
      /* fallback posters remain active */
    }
  }

  async function seedDefaultStarterShelf() {
    const seedIds = [105398, 119257, 114578];
    const gql = `
      query ($ids: [Int]) {
        Page(page: 1, perPage: 10) {
          media(id_in: $ids, type: MANGA) {
            id
            title { english romaji native }
            synonyms
            chapters
            averageScore
            status
            genres
            tags { name rank isMediaSpoiler }
            coverImage { large }
            description(asHtml: false)
            siteUrl
          }
        }
      }
    `;
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gql, variables: { ids: seedIds } })
      });
      const json = await res.json();
      const fetched = (json?.data?.Page?.media || []).map(normalizeAniListMedia);
      const tbate = (catalogData.oelCatalog || []).find((o) => o.id === "oel-tbate");
      if (tbate) {
        tbate.cover = coverCache[105398] || "";
        fetched.splice(2, 0, tbate);
      }
      for (const item of fetched) {
        if (!shelf.some((s) => s.id === item.id)) shelf.push(item);
      }
      saveJSON(STORAGE_KEYS.SHELF, shelf);
      renderShelf();
      renderStarterCards();
    } catch {
      /* ignore if offline */
    }
  }

  function normalizeAniListMedia(m) {
    return {
      id: `al-${m.id}`,
      source: "AniList KR",
      displayTitle: m.title?.english || m.title?.romaji || "Untitled",
      romajiTitle: m.title?.romaji || m.title?.english || "Untitled",
      nativeTitle: m.title?.native || "",
      synonyms: m.synonyms || [],
      cover: m.coverImage?.large || "",
      chapters: m.chapters || null,
      score: m.averageScore || null,
      status: m.status || "RELEASING",
      genres: m.genres || [],
      tags: (m.tags || []).filter((t) => !t.isMediaSpoiler && t.rank >= 55).map((t) => t.name),
      description: (m.description || "").replace(/<[^>]+>/g, ""),
      url: m.siteUrl || `https://anilist.co/manga/${m.id}`
    };
  }

  function switchView(viewId) {
    el.navTabs.forEach((t) => t.classList.toggle("active", t.dataset.view === viewId));
    el.views.forEach((v) => v.classList.toggle("hidden", v.id !== viewId));
    if (viewId === "matcherView" && !currentRecommendations.length) {
      findRecommendations();
    }
  }

  function applyTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    if (el.themeSelect) el.themeSelect.value = themeName;
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
    renderThemeSwatches();
  }

  function renderThemeSwatches() {
    if (!el.themeSwatches) return;
    const current = localStorage.getItem(STORAGE_KEYS.THEME) || "moonlight";
    el.themeSwatches.innerHTML = "";
    for (const t of THEMES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `swatch-btn ${current === t.id ? "active" : ""}`;
      btn.innerHTML = `<span class="swatch-dot" style="background:${t.color}"></span><span>${t.name}</span>`;
      btn.addEventListener("click", () => applyTheme(t.id));
      el.themeSwatches.appendChild(btn);
    }
  }

  function resolveTitle(item) {
    if (titlePref === "korean" && item.nativeTitle) {
      return `${item.nativeTitle} (${item.displayTitle || item.romajiTitle})`;
    }
    if (titlePref === "official") {
      return item.romajiTitle || item.displayTitle || "Untitled";
    }
    if (item.displayTitle && !isJapaneseRomaji(item.displayTitle)) {
      return item.displayTitle;
    }
    const cleanSyn = (item.synonyms || []).find(
      (s) => /^[A-Za-z0-9\s:'"!?.,\-()&]+$/.test(s) && !isJapaneseRomaji(s)
    );
    return cleanSyn || item.displayTitle || item.romajiTitle || "Untitled";
  }

  function isJapaneseRomaji(str) {
    return /\b(no|wa|ga|wo|ni|de|to|kara|made|dake|ore|boku|watashi|isekai|tensei|maou|yuusha)\b/i.test(str);
  }

  function isItemBanned(item) {
    if (!bannedTerms.length) return false;
    const haystack = [
      item.displayTitle,
      item.romajiTitle,
      ...(item.synonyms || []),
      ...(item.genres || []),
      ...(item.tags || []),
      item.description || ""
    ]
      .join(" ")
      .toLowerCase();

    return bannedTerms.some((term) => {
      const clean = term.trim().toLowerCase();
      if (!clean) return false;
      if (clean.length <= 3) {
        return new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack);
      }
      return haystack.includes(clean);
    });
  }

  async function searchAllSources(query) {
    const q = query.trim();
    if (!q) return [];
    const cacheKey = `search:${q.toLowerCase()}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController();
    const { signal } = searchAbortController;

    const localMatches = (catalogData.oelCatalog || []).filter((item) => {
      const blob = [item.displayTitle, item.romajiTitle, item.nativeTitle, ...(item.synonyms || [])]
        .join(" ")
        .toLowerCase();
      return blob.includes(q.toLowerCase());
    });

    const [anilistRes, kitsuRes, jikanRes] = await Promise.allSettled([
      fetchAniListQuery({ search: q, perPage: 12 }, signal),
      fetchKitsuSearch(q, signal),
      fetchJikanSearch(q, signal)
    ]);

    const combined = [
      ...localMatches,
      ...(anilistRes.status === "fulfilled" ? anilistRes.value : []),
      ...(kitsuRes.status === "fulfilled" ? kitsuRes.value : []),
      ...(jikanRes.status === "fulfilled" ? jikanRes.value : [])
    ];

    const deduped = deduplicateMedia(combined).filter((m) => !isItemBanned(m));
    apiCache.set(cacheKey, deduped);
    updateCacheBadge();
    return deduped;
  }

  async function fetchAniListQuery(variables, signal) {
    const gql = `
      query ($search: String, $genres: [String], $tags: [String], $chaptersGreater: Int, $scoreGreater: Int, $status: MediaStatus, $perPage: Int, $sort: [MediaSort]) {
        Page(page: 1, perPage: $perPage) {
          media(
            search: $search,
            type: MANGA,
            countryOfOrigin: "KR",
            isAdult: false,
            genre_in: $genres,
            tag_in: $tags,
            chapters_greater: $chaptersGreater,
            averageScore_greater: $scoreGreater,
            status: $status,
            sort: $sort
          ) {
            id
            title { english romaji native }
            synonyms
            chapters
            averageScore
            status
            genres
            tags { name rank isMediaSpoiler }
            coverImage { large }
            description(asHtml: false)
            siteUrl
          }
        }
      }
    `;
    const vars = { perPage: 24, sort: ["POPULARITY_DESC"], ...variables };
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables: vars }),
      signal
    });
    const json = await res.json();
    return (json?.data?.Page?.media || []).map(normalizeAniListMedia);
  }

  async function fetchKitsuSearch(query, signal) {
    const res = await fetch(`${KITSU_URL}?filter[text]=${encodeURIComponent(query)}&page[limit]=6`, { signal });
    const json = await res.json();
    return (json?.data || [])
      .filter((d) => ["manhwa", "oel"].includes((d.attributes?.subtype || "").toLowerCase()))
      .map((d) => {
        const a = d.attributes;
        return {
          id: `kt-${d.id}`,
          source: "Kitsu",
          displayTitle: a.titles?.en || a.titles?.en_us || a.canonicalTitle || "Untitled",
          romajiTitle: a.canonicalTitle || "",
          nativeTitle: a.titles?.ko_kr || "",
          synonyms: Object.values(a.titles || {}),
          cover: a.posterImage?.medium || a.posterImage?.small || "",
          chapters: a.chapterCount || null,
          score: a.averageRating ? Math.round(parseFloat(a.averageRating)) : null,
          status: (a.status || "").toUpperCase(),
          genres: ["Action", "Fantasy"],
          tags: ["Full Color"],
          description: a.synopsis || "",
          url: `https://kitsu.io/manga/${a.slug || d.id}`
        };
      });
  }

  async function fetchJikanSearch(query, signal) {
    const res = await fetch(`${JIKAN_URL}?q=${encodeURIComponent(query)}&type=manhwa&limit=6&sfw=true`, { signal });
    const json = await res.json();
    return (json?.data || []).map((m) => ({
      id: `mal-${m.mal_id}`,
      source: "MAL Manhwa",
      displayTitle: m.title_english || m.title || "Untitled",
      romajiTitle: m.title || "",
      nativeTitle: m.title_japanese || "",
      synonyms: (m.titles || []).map((t) => t.title),
      cover: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || "",
      chapters: m.chapters || null,
      score: m.score ? Math.round(m.score * 10) : null,
      status: (m.status || "").toUpperCase(),
      genres: (m.genres || []).map((g) => g.name),
      tags: (m.themes || []).map((t) => t.name),
      description: m.synopsis || "",
      url: m.url
    }));
  }

  function deduplicateMedia(items) {
    const seen = new Map();
    for (const item of items) {
      const norm = resolveTitle(item).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!norm) continue;
      if (!seen.has(norm)) {
        seen.set(norm, item);
      } else {
        const existing = seen.get(norm);
        if (!existing.chapters && item.chapters) existing.chapters = item.chapters;
        if (!existing.cover && item.cover) existing.cover = item.cover;
        existing.tags = Array.from(new Set([...(existing.tags || []), ...(item.tags || [])]));
      }
    }
    return Array.from(seen.values());
  }

  async function loadDashboardFeeds() {
    const topTags = Array.from(selectedTags).slice(0, 5);
    const [tastePool, peakArtPool, longEpicPool] = await Promise.allSettled([
      fetchAniListQuery({ tags: topTags.length ? topTags : undefined, perPage: 16 }),
      fetchAniListQuery({ scoreGreater: 84, sort: ["SCORE_DESC"], perPage: 12 }),
      fetchAniListQuery({ chaptersGreater: 119, sort: ["POPULARITY_DESC"], perPage: 12 })
    ]);

    const shelfIds = new Set(shelf.map((s) => s.id));
    const oelFallback = (catalogData.oelCatalog || []).map((o) => ({
      ...o,
      cover: o.cover || coverCache[105398] || ""
    }));

    const tasteItems = deduplicateMedia([
      ...oelFallback,
      ...(tastePool.status === "fulfilled" ? tastePool.value : [])
    ])
      .filter((m) => !shelfIds.has(m.id) && !isItemBanned(m))
      .slice(0, 10)
      .map(scoreMatch);

    const peakItems = (peakArtPool.status === "fulfilled" && peakArtPool.value.length ? peakArtPool.value : oelFallback)
      .filter((m) => !isItemBanned(m))
      .slice(0, 10)
      .map(scoreMatch);

    const epicItems = (longEpicPool.status === "fulfilled" && longEpicPool.value.length ? longEpicPool.value : oelFallback)
      .filter((m) => !isItemBanned(m))
      .slice(0, 10)
      .map(scoreMatch);

    renderCardGrid(el.dashRecommendedGrid, tasteItems);
    renderCardGrid(el.dashPeakArtGrid, peakItems);
    renderCardGrid(el.dashLongEpicGrid, epicItems);
  }

  function scoreMatch(item) {
    const matchedTags = (item.tags || []).filter((t) => selectedTags.has(t));
    const matchedGenres = (item.genres || []).filter((g) => selectedGenres.has(g));
    const base = 68;
    const boost = Math.min(28, matchedTags.length * 7 + matchedGenres.length * 4);
    const scoreBonus = item.score ? Math.round((item.score - 75) * 0.2) : 0;
    return { ...item, matchPct: Math.min(99, Math.max(65, base + boost + scoreBonus)) };
  }

  async function findRecommendations() {
    showStatus("Searching Korean manhwa libraries with your Taste DNA & genre filters...");
    const shelfIds = new Set(shelf.map((s) => s.id));
    const activeGenres = Array.from(selectedGenres);
    const activeTags = Array.from(selectedTags);

    let chaptersGreater;
    if (selectedNotes.has("chapters200")) chaptersGreater = 199;
    else if (selectedNotes.has("chapters100")) chaptersGreater = 99;

    let scoreGreater;
    if (selectedNotes.has("masterpiece")) scoreGreater = 85;
    else if (selectedNotes.has("peakArt")) scoreGreater = 79;

    let status;
    if (selectedNotes.has("completed")) status = "FINISHED";
    else if (selectedNotes.has("releasing")) status = "RELEASING";

    try {
      const fetched = await fetchAniListQuery({
        genres: activeGenres.length ? activeGenres : undefined,
        tags: activeTags.length ? activeTags.slice(0, 6) : undefined,
        chaptersGreater,
        scoreGreater,
        status,
        perPage: 45
      });

      let pool = deduplicateMedia([...(catalogData.oelCatalog || []), ...fetched]).filter((item) => {
        if (shelfIds.has(item.id)) return false;
        if (isItemBanned(item)) return false;
        if (chaptersGreater && (!item.chapters || item.chapters <= chaptersGreater)) return false;
        if (scoreGreater && (!item.score || item.score <= scoreGreater)) return false;
        if (status && item.status !== status) return false;
        if (selectedNotes.has("fullColor") && !(item.tags || []).some((t) => /full color/i.test(t))) return false;
        return true;
      });

      currentRecommendations = pool.map(scoreMatch);
      sortAndRenderRecommendations();
      hideStatus();
    } catch (err) {
      showStatus(`Search failed: ${err.message}`);
    }
  }

  function sortAndRenderRecommendations() {
    const mode = el.sortSelect.value;
    const sorted = [...currentRecommendations].sort((a, b) => {
      if (mode === "score") return (b.score || 0) - (a.score || 0);
      if (mode === "chapters") return (b.chapters || 0) - (a.chapters || 0);
      return b.matchPct - a.matchPct;
    });
    el.resultsCount.textContent = sorted.length;
    renderCardGrid(el.resultsGrid, sorted);
  }

  function renderCardGrid(container, items) {
    if (!container) return;
    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const item of items) {
      const card = document.createElement("article");
      card.className = "manhwa-card";
      const title = resolveTitle(item);
      const chapText = item.chapters ? `${item.chapters} Ch.` : "Ongoing";
      const inShelf = shelf.some((s) => s.id === item.id);

      card.innerHTML = `
        <div class="card-cover-wrap">
          <img alt="${title}" loading="lazy" />
          <span class="badge-top-left">${item.matchPct || 85}% Match</span>
          ${item.score ? `<span class="badge-top-right">★ ${item.score}%</span>` : ""}
          <span class="badge-bottom-left">${chapText}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-sub">${item.nativeTitle || item.source}</div>
          <div class="card-tags">
            ${(item.genres || []).slice(0, 2).map((g) => `<span class="mini-tag">${g}</span>`).join("")}
            ${(item.tags || []).slice(0, 2).map((t) => `<span class="mini-tag">${t}</span>`).join("")}
          </div>
          <div class="card-actions">
            <button type="button" class="btn btn-primary btn-sm read-online-btn">📖 Read</button>
            <button type="button" class="btn btn-ghost btn-sm add-shelf-btn">${inShelf ? "✓ Saved" : "+ Shelf"}</button>
          </div>
        </div>
      `;

      applySafeImage(card.querySelector("img"), item.cover, title, item.source);
      card.querySelector(".card-title").addEventListener("click", () => openDetailModal(item));
      card.querySelector(".read-online-btn").addEventListener("click", () => openWebReaderForSeries(item));
      card.querySelector(".add-shelf-btn").addEventListener("click", () => {
        if (shelf.some((s) => s.id === item.id)) removeFromShelf(item.id);
        else addToShelf(item);
        renderCardGrid(container, items);
      });
      frag.appendChild(card);
    }

    container.appendChild(frag);
  }

  function renderStarterCards() {
    if (!el.starterCardsRow) return;
    el.starterCardsRow.innerHTML = "";
    for (const st of catalogData.starters || []) {
      const inShelf = shelf.some((s) => s.id === st.id || resolveTitle(s).toLowerCase() === st.title.toLowerCase());
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `starter-mini-card ${inShelf ? "in-shelf" : ""}`;
      btn.innerHTML = `
        <img alt="${st.title}" />
        <div class="starter-mini-info">
          <div class="starter-mini-title">${st.title}</div>
          <div class="muted small">${inShelf ? "✓ In Shelf" : `+ Add • ${st.chapters} Ch.`}</div>
        </div>
      `;
      const coverUrl = st.cover || coverCache[st.anilistId] || "";
      applySafeImage(btn.querySelector("img"), coverUrl, st.title, "STARTER");
      btn.addEventListener("click", async () => {
        if (inShelf) {
          shelf = shelf.filter((s) => s.id !== st.id && resolveTitle(s).toLowerCase() !== st.title.toLowerCase());
          saveJSON(STORAGE_KEYS.SHELF, shelf);
          renderShelf();
          renderStarterCards();
        } else {
          // Add immediately with starter metadata, then enrich in background
          const immediateItem = {
            id: st.id,
            source: "Starter",
            displayTitle: st.title,
            romajiTitle: st.title,
            nativeTitle: st.native || "",
            synonyms: [],
            cover: coverUrl,
            chapters: st.chapters,
            score: st.score,
            genres: ["Action", "Fantasy"],
            tags: ["Full Color", "Overpowered MC"]
          };
          addToShelf(immediateItem);
          const found = await searchAllSources(st.title);
          if (found[0]) {
            shelf = shelf.map((s) => (s.id === st.id ? found[0] : s));
            saveJSON(STORAGE_KEYS.SHELF, shelf);
            renderShelf();
          }
        }
      });
      el.starterCardsRow.appendChild(btn);
    }
  }

  function addToShelf(item) {
    if (shelf.some((s) => s.id === item.id)) return;
    shelf.push(item);
    saveJSON(STORAGE_KEYS.SHELF, shelf);
    renderShelf();
    renderStarterCards();
  }

  function removeFromShelf(id) {
    shelf = shelf.filter((s) => s.id !== id);
    saveJSON(STORAGE_KEYS.SHELF, shelf);
    renderShelf();
    renderStarterCards();
  }

  function renderShelf() {
    if (!el.shelfGrid) return;
    el.shelfCount.textContent = shelf.length;
    el.shelfGrid.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const item of shelf) {
      const title = resolveTitle(item);
      const div = document.createElement("div");
      div.className = "shelf-card";
      div.innerHTML = `
        <img alt="" />
        <div class="shelf-card-info">
          <div class="shelf-card-title">${title}</div>
          <div class="muted small">${item.chapters ? `${item.chapters} Ch.` : "Ongoing"}</div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" title="Remove">✕</button>
      `;
      applySafeImage(div.querySelector("img"), item.cover, title, "SHELF");
      div.querySelector("button").addEventListener("click", () => removeFromShelf(item.id));
      frag.appendChild(div);
    }
    el.shelfGrid.appendChild(frag);
    extractTasteDNA();
    updateDashboardStats();
  }

  function extractTasteDNA() {
    const counts = new Map();
    for (const item of shelf) {
      for (const t of item.tags || []) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    const ranked = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18)
      .map(([tag]) => tag);

    el.extractedTags.innerHTML = "";
    el.tagHint.style.display = ranked.length ? "none" : "inline";

    for (const tag of ranked) {
      if (bannedTerms.includes(tag.toLowerCase())) continue;
      selectedTags.add(tag);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip ${selectedTags.has(tag) ? "active" : ""}`;
      chip.textContent = tag;
      chip.addEventListener("click", () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
          chip.classList.remove("active");
        } else {
          selectedTags.add(tag);
          chip.classList.add("active");
        }
        updateDashboardStats();
      });
      el.extractedTags.appendChild(chip);
    }
    updateDashboardStats();
  }

  function updateDashboardStats() {
    if (el.dashShelfCount) el.dashShelfCount.textContent = shelf.length;
    if (el.dashDnaCount) el.dashDnaCount.textContent = selectedTags.size;
    if (el.dashBanCount) el.dashBanCount.textContent = bannedTerms.length;
  }

  function updateCacheBadge() {
    if (el.cacheCountBadge) el.cacheCountBadge.textContent = apiCache.size;
  }

  function renderCategorizedGenres() {
    if (!el.categorizedGenresContainer) return;
    el.categorizedGenresContainer.innerHTML = "";
    for (const group of catalogData.genreCategories || []) {
      const block = document.createElement("div");
      block.className = "filter-block";
      block.innerHTML = `<div class="filter-title">🎭 ${group.category}</div>`;
      const chipsWrap = document.createElement("div");
      chipsWrap.className = "chip-group";

      for (const item of group.items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.textContent = item.label;
        btn.addEventListener("click", () => {
          const targetSet = item.type === "genre" ? selectedGenres : selectedTags;
          if (targetSet.has(item.value)) {
            targetSet.delete(item.value);
            btn.classList.remove("active");
          } else {
            targetSet.add(item.value);
            btn.classList.add("active");
          }
        });
        chipsWrap.appendChild(btn);
      }

      block.appendChild(chipsWrap);
      el.categorizedGenresContainer.appendChild(block);
    }
  }

  function renderNoteChips() {
    if (!el.noteChips) return;
    el.noteChips.innerHTML = "";
    for (const n of catalogData.collectorNotes || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = n.label;
      btn.addEventListener("click", () => {
        if (selectedNotes.has(n.id)) {
          selectedNotes.delete(n.id);
          btn.classList.remove("active");
        } else {
          selectedNotes.add(n.id);
          btn.classList.add("active");
        }
      });
      el.noteChips.appendChild(btn);
    }
  }

  function renderBanSection() {
    if (!el.banPresetChips) return;
    el.banPresetChips.innerHTML = "";
    for (const preset of catalogData.banPresets || []) {
      const isBanned = preset.terms.some((t) => bannedTerms.includes(t.toLowerCase()));
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chip ${isBanned ? "banned" : ""}`;
      btn.textContent = `${isBanned ? "🚫 " : ""}${preset.label}`;
      btn.addEventListener("click", () => {
        if (isBanned) {
          bannedTerms = bannedTerms.filter((b) => !preset.terms.includes(b));
        } else {
          bannedTerms = Array.from(new Set([...bannedTerms, ...preset.terms]));
        }
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        renderBanSection();
        updateDashboardStats();
      });
      el.banPresetChips.appendChild(btn);
    }

    el.activeBansList.innerHTML = "";
    for (const term of bannedTerms) {
      const tag = document.createElement("span");
      tag.className = "chip banned";
      tag.textContent = `${term} ✕`;
      tag.addEventListener("click", () => {
        bannedTerms = bannedTerms.filter((t) => t !== term);
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        renderBanSection();
        updateDashboardStats();
      });
      el.activeBansList.appendChild(tag);
    }
    updateDashboardStats();
  }

  function renderUpdateLogs() {
    if (!el.updateLogsContainer) return;
    el.updateLogsContainer.innerHTML = "";
    for (const log of catalogData.updateLogs || []) {
      const item = document.createElement("article");
      item.className = "changelog-item";
      item.innerHTML = `
        <div class="changelog-header">
          <span class="badge-top-left" style="position:static;">${log.version}</span>
          <strong>${log.title}</strong>
          <span class="mini-tag">${log.badge}</span>
          <span class="muted small">${log.date}</span>
        </div>
        <ul>
          ${(log.changes || []).map((c) => `<li>${c}</li>`).join("")}
        </ul>
      `;
      el.updateLogsContainer.appendChild(item);
    }
  }

  function openDetailModal(item) {
    const title = resolveTitle(item);
    el.detailBody.innerHTML = `
      <div class="detail-grid">
        <img alt="${title}" />
        <div>
          <h2>${title}</h2>
          <p class="muted">${item.nativeTitle || ""} • ${item.source} • ${item.chapters ? `${item.chapters} Chapters` : "Ongoing"}</p>
          <p style="margin: 0.8rem 0;">${item.description || "No synopsis available."}</p>
          <div class="chip-group" style="margin-bottom: 1rem;">
            ${(item.genres || []).map((g) => `<span class="chip active">${g}</span>`).join("")}
            ${(item.tags || []).slice(0, 8).map((t) => `<span class="chip">${t}</span>`).join("")}
          </div>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button type="button" id="modalReadBtn" class="btn btn-primary">📖 Open in Web Reader</button>
            <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-ghost">Official / Database Page ↗</a>
          </div>
        </div>
      </div>
    `;
    applySafeImage(el.detailBody.querySelector("img"), item.cover, title, item.source);
    document.getElementById("modalReadBtn").addEventListener("click", () => {
      el.detailModal.classList.add("hidden");
      openWebReaderForSeries(item);
    });
    el.detailModal.classList.remove("hidden");
  }

  async function openWebReaderForSeries(item) {
    const title = item ? resolveTitle(item) : "VexinManwha Web Reader";
    readerState.seriesTitle = title;
    el.readerSeriesTitle.textContent = title;
    el.readerModal.classList.remove("hidden");

    const apiBase = (localStorage.getItem(STORAGE_KEYS.READER_API) || "").trim().replace(/\/$/, "");
    if (apiBase) {
      await loadChaptersFromApi(apiBase, title);
    } else {
      loadDemoReaderSetup(item);
    }
  }

  async function loadChaptersFromApi(apiBase, seriesTitle) {
    el.readerPagesContainer.innerHTML = `<div class="reader-placeholder-card">Connecting to Reader API at <code>${apiBase}</code> for <strong>${seriesTitle}</strong>...</div>`;
    try {
      const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(seriesTitle)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const chapters = (data.chapters || [])
        .map((c, idx) => {
          const match = String(c.number ?? c.title ?? idx + 1).match(/(\d+(\.\d+)?)/);
          const num = match ? parseFloat(match[1]) : idx + 1;
          return { number: num, title: c.title || `Chapter ${num}`, pages: c.pages || [] };
        })
        .sort((a, b) => a.number - b.number);

      if (!chapters.length) throw new Error("No chapters returned.");
      readerState.chapters = chapters;
      readerState.currentIdx = 0;
      renderReaderChapterSelect();
      renderReaderChapter(0);
    } catch (err) {
      el.readerPagesContainer.innerHTML = `
        <div class="reader-placeholder-card">
          <h3>Could not fetch chapters from configured API</h3>
          <p class="muted" style="margin:0.5rem 0;">${err.message}</p>
        </div>
      `;
    }
  }

  function loadDemoReaderSetup(item) {
    const title = item ? resolveTitle(item) : "VexinManwha Web Reader";
    const total = item?.chapters ? Math.min(item.chapters, 12) : 6;
    const chapters = [];
    for (let i = 1; i <= total; i++) {
      chapters.push({ number: i, title: `Chapter ${i}`, pages: [] });
    }
    readerState.chapters = chapters;
    readerState.currentIdx = 0;
    renderReaderChapterSelect();
    verifyChapterContinuity(chapters);

    el.readerPagesContainer.innerHTML = `
      <div class="reader-placeholder-card">
        <h3>📖 Online Web Reader — ${title}</h3>
        <p class="muted" style="margin:0.6rem 0;">
          Connect a CORS-enabled <strong>Reader API URL</strong> (such as a self-hosted <strong>Suwayomi-Server</strong> or custom JSON chapter feed) in the bar above to load chapter pages directly inside VexinManwha, or open a <strong>.CBZ / .ZIP</strong> archive.
        </p>
        <p class="muted small">Chapter Continuity Verifier automatically orders chapters (Ch. 1 → 2 → 3 → 4 → 5 → 6) and flags missing gaps in red.</p>
      </div>
    `;
  }

  function verifyChapterContinuity(chapters) {
    el.readerContinuityBar.innerHTML = `<span>Continuity Check:</span>`;
    if (!chapters.length) return;
    const nums = new Set(chapters.map((c) => Math.floor(c.number)));
    const maxChap = Math.max(...nums);
    let missingCount = 0;

    for (let n = 1; n <= maxChap; n++) {
      const pill = document.createElement("span");
      if (nums.has(n)) {
        const idx = chapters.findIndex((c) => Math.floor(c.number) === n);
        pill.className = `chap-pill ${idx === readerState.currentIdx ? "current" : ""}`;
        pill.textContent = `Ch. ${n}`;
        pill.addEventListener("click", () => {
          readerState.currentIdx = idx;
          renderReaderChapter(idx);
        });
      } else {
        missingCount++;
        pill.className = "chap-pill missing";
        pill.textContent = `Missing Ch. ${n}`;
      }
      el.readerContinuityBar.appendChild(pill);
    }

    const summary = document.createElement("span");
    summary.style.marginLeft = "0.5rem";
    summary.textContent = missingCount ? `⚠️ ${missingCount} missing` : "✅ Complete sequence (no gaps)";
    el.readerContinuityBar.appendChild(summary);
  }

  function renderReaderChapterSelect() {
    el.readerChapterSelect.innerHTML = "";
    readerState.chapters.forEach((c, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = c.title;
      el.readerChapterSelect.appendChild(opt);
    });
    el.readerChapterSelect.value = readerState.currentIdx;
  }

  function renderReaderChapter(idx) {
    const chap = readerState.chapters[idx];
    if (!chap) return;
    el.readerChapterSelect.value = idx;
    verifyChapterContinuity(readerState.chapters);
    if (!chap.pages || !chap.pages.length) return;

    el.readerPagesContainer.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const src of chap.pages) {
      const img = document.createElement("img");
      img.className = "reader-page-img";
      img.src = src;
      img.loading = "lazy";
      frag.appendChild(img);
    }
    el.readerPagesContainer.appendChild(frag);
    el.readerPagesContainer.scrollTop = 0;
  }

  async function handleLocalArchive(file) {
    if (!file || typeof JSZip === "undefined") return;
    const zip = await JSZip.loadAsync(file);
    const imgEntries = Object.values(zip.files)
      .filter((f) => !f.dir && /\.(jpe?g|png|webp|gif)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const urls = await Promise.all(
      imgEntries.map(async (entry) => URL.createObjectURL(await entry.async("blob")))
    );
    readerState.seriesTitle = file.name.replace(/\.(cbz|zip)$/i, "");
    el.readerSeriesTitle.textContent = readerState.seriesTitle;
    readerState.chapters = [{ number: 1, title: "Chapter 1 (Archive)", pages: urls }];
    readerState.currentIdx = 0;
    renderReaderChapterSelect();
    renderReaderChapter(0);
  }

  function bindEvents() {
    el.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => switchView(tab.dataset.view));
    });

    el.jumpToMatcherBtn?.addEventListener("click", () => switchView("matcherView"));
    el.refreshDashboardBtn?.addEventListener("click", loadDashboardFeeds);
    el.themeSelect?.addEventListener("change", (e) => applyTheme(e.target.value));

    el.titlePrefSelect?.addEventListener("change", (e) => {
      titlePref = e.target.value;
      localStorage.setItem(STORAGE_KEYS.TITLE_PREF, titlePref);
      renderShelf();
      loadDashboardFeeds();
    });

    el.searchInput?.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      const q = e.target.value.trim();
      if (!q) {
        el.searchDropdown.classList.add("hidden");
        return;
      }
      searchDebounceTimer = setTimeout(async () => {
        el.searchSpinner.classList.remove("hidden");
        const results = await searchAllSources(q);
        el.searchSpinner.classList.add("hidden");
        renderSearchDropdown(results);
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrapper")) el.searchDropdown?.classList.add("hidden");
    });

    el.clearShelfBtn?.addEventListener("click", () => {
      shelf = [];
      selectedTags.clear();
      saveJSON(STORAGE_KEYS.SHELF, shelf);
      renderShelf();
      renderStarterCards();
    });

    el.addBanBtn?.addEventListener("click", () => {
      const val = el.customBanInput.value.trim().toLowerCase();
      if (val && !bannedTerms.includes(val)) {
        bannedTerms.push(val);
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        el.customBanInput.value = "";
        renderBanSection();
      }
    });

    el.clearBansBtn?.addEventListener("click", () => {
      bannedTerms = [];
      saveJSON(STORAGE_KEYS.BANS, bannedTerms);
      renderBanSection();
    });

    el.findBtn?.addEventListener("click", findRecommendations);
    el.sortSelect?.addEventListener("change", sortAndRenderRecommendations);
    el.closeDetailBtn?.addEventListener("click", () => el.detailModal.classList.add("hidden"));

    el.settingsSaveApiBtn?.addEventListener("click", () => {
      const url = el.settingsReaderApiInput.value.trim();
      localStorage.setItem(STORAGE_KEYS.READER_API, url);
      el.readerApiUrlInput.value = url;
      alert("Reader API endpoint saved.");
    });

    el.exportJsonBtn?.addEventListener("click", () => {
      const payload = JSON.stringify({ shelf, bannedTerms, theme: el.themeSelect.value, titlePref }, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "vexinmanwha-backup.json";
      a.click();
    });

    el.importJsonInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (Array.isArray(parsed.shelf)) shelf = parsed.shelf;
        if (Array.isArray(parsed.bannedTerms)) bannedTerms = parsed.bannedTerms;
        saveJSON(STORAGE_KEYS.SHELF, shelf);
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        renderShelf();
        renderStarterCards();
        renderBanSection();
        loadDashboardFeeds();
        alert("Backup imported successfully.");
      } catch {
        alert("Invalid JSON backup file.");
      }
    });

    el.reseedStartersBtn?.addEventListener("click", async () => {
      await seedDefaultStarterShelf();
      loadDashboardFeeds();
    });

    el.clearCacheBtn?.addEventListener("click", () => {
      apiCache.clear();
      updateCacheBadge();
    });

    el.openReaderBtn?.addEventListener("click", () => openWebReaderForSeries(shelf[0] || null));
    el.closeReaderBtn?.addEventListener("click", () => {
      el.readerModal.classList.add("hidden");
      clearInterval(readerState.autoScrollTimer);
    });
    el.saveReaderApiBtn?.addEventListener("click", () => {
      const url = el.readerApiUrlInput.value.trim();
      localStorage.setItem(STORAGE_KEYS.READER_API, url);
      el.settingsReaderApiInput.value = url;
      if (url) loadChaptersFromApi(url.replace(/\/$/, ""), readerState.seriesTitle);
    });
    el.readerChapterSelect?.addEventListener("change", (e) => {
      readerState.currentIdx = Number(e.target.value);
      renderReaderChapter(readerState.currentIdx);
    });
    el.prevChapBtn?.addEventListener("click", () => {
      if (readerState.currentIdx > 0) {
        readerState.currentIdx--;
        renderReaderChapter(readerState.currentIdx);
      }
    });
    el.nextChapBtn?.addEventListener("click", () => {
      if (readerState.currentIdx < readerState.chapters.length - 1) {
        readerState.currentIdx++;
        renderReaderChapter(readerState.currentIdx);
      }
    });
    el.stripWidthRange?.addEventListener("input", (e) => {
      const px = `${e.target.value}px`;
      el.stripWidthVal.textContent = px;
      el.readerPagesContainer.style.setProperty("--strip-width", px);
    });
    el.autoScrollBtn?.addEventListener("click", () => {
      if (readerState.autoScrollTimer) {
        clearInterval(readerState.autoScrollTimer);
        readerState.autoScrollTimer = null;
        el.autoScrollBtn.textContent = "Auto-Scroll: Off";
      } else {
        el.autoScrollBtn.textContent = "Auto-Scroll: On";
        readerState.autoScrollTimer = setInterval(() => {
          el.readerPagesContainer.scrollBy({ top: 3, behavior: "auto" });
        }, 16);
      }
    });
    el.localCbzInput?.addEventListener("change", (e) => {
      if (e.target.files?.[0]) handleLocalArchive(e.target.files[0]);
    });
  }

  function renderSearchDropdown(items) {
    el.searchDropdown.innerHTML = "";
    if (!items.length) {
      el.searchDropdown.innerHTML = `<div class="dropdown-item muted">No matching manhwa found.</div>`;
      el.searchDropdown.classList.remove("hidden");
      return;
    }

    const frag = document.createDocumentFragment();
    for (const item of items) {
      const title = resolveTitle(item);
      const row = document.createElement("div");
      row.className = "dropdown-item";
      row.innerHTML = `
        <img alt="" />
        <div>
          <div><strong>${title}</strong> <span class="mini-tag">${item.source}</span></div>
          <div class="muted small">${item.nativeTitle || ""} • ${item.chapters ? `${item.chapters} Ch.` : "Ongoing"}</div>
        </div>
      `;
      applySafeImage(row.querySelector("img"), item.cover, title, item.source);
      row.addEventListener("click", () => {
        addToShelf(item);
        el.searchDropdown.classList.add("hidden");
        el.searchInput.value = "";
      });
      frag.appendChild(row);
    }
    el.searchDropdown.appendChild(frag);
    el.searchDropdown.classList.remove("hidden");
  }

  function showStatus(msg) {
    if (!el.statusBanner) return;
    el.statusBanner.textContent = msg;
    el.statusBanner.classList.remove("hidden");
  }

  function hideStatus() {
    el.statusBanner?.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", init);
})();