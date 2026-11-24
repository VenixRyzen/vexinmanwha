(() => {
  "use strict";

  const ANILIST_URL = "https://graphql.anilist.co";
  const KITSU_URL = "https://kitsu.io/api/edge/manga";
  const JIKAN_URL = "https://api.jikan.moe/v4/manga";

  const STORAGE_KEYS = {
    SHELF: "vexin_shelf_v3",
    BANS: "vexin_bans_v3",
    THEME: "vexin_theme_v3",
    TITLE_PREF: "vexin_title_pref_v3",
    READER_API: "vexin_reader_api_v3"
  };

  // State
  let catalogData = { starters: [], oelCatalog: [], extraGenres: [], collectorNotes: [], banPresets: [] };
  let shelf = loadJSON(STORAGE_KEYS.SHELF, []);
  let bannedTerms = loadJSON(STORAGE_KEYS.BANS, ["boys' love", "boy's love", "bl", "shounen ai", "yaoi", "girls' love", "girl's love", "gl", "shoujo ai", "yuri", "gay", "mlm", "lesbian", "wlw"]);
  let selectedTags = new Set();
  let selectedGenres = new Set();
  let selectedNotes = new Set();
  let currentRecommendations = [];
  let titlePref = localStorage.getItem(STORAGE_KEYS.TITLE_PREF) || "scanlation";

  // Performance caches & controllers
  const apiCache = new Map();
  let searchAbortController = null;
  let searchDebounceTimer = null;

  // Reader state
  let readerState = {
    seriesTitle: "VexinManwha Web Reader",
    chapters: [], // [{ number: 1, title: "Chapter 1", pages: [...] }]
    currentIdx: 0,
    autoScrollTimer: null
  };

  // DOM Elements
  const el = {
    themeSelect: document.getElementById("themeSelect"),
    titlePrefSelect: document.getElementById("titlePrefSelect"),
    openReaderBtn: document.getElementById("openReaderBtn"),
    searchInput: document.getElementById("searchInput"),
    searchSpinner: document.getElementById("searchSpinner"),
    searchDropdown: document.getElementById("searchDropdown"),
    starterChips: document.getElementById("starterChips"),
    shelfGrid: document.getElementById("shelfGrid"),
    shelfCount: document.getElementById("shelfCount"),
    clearShelfBtn: document.getElementById("clearShelfBtn"),
    extractedTags: document.getElementById("extractedTags"),
    tagHint: document.getElementById("tagHint"),
    genreChips: document.getElementById("genreChips"),
    noteChips: document.getElementById("noteChips"),
    banPresetChips: document.getElementById("banPresetChips"),
    customBanInput: document.getElementById("customBanInput"),
    addBanBtn: document.getElementById("addBanBtn"),
    activeBansList: document.getElementById("activeBansList"),
    clearBansBtn: document.getElementById("clearBansBtn"),
    findBtn: document.getElementById("findBtn"),
    statusBanner: document.getElementById("statusBanner"),
    resultsSection: document.getElementById("resultsSection"),
    resultsCount: document.getElementById("resultsCount"),
    sortSelect: document.getElementById("sortSelect"),
    resultsGrid: document.getElementById("resultsGrid"),
    detailModal: document.getElementById("detailModal"),
    closeDetailBtn: document.getElementById("closeDetailBtn"),
    detailBody: document.getElementById("detailBody"),
    readerModal: document.getElementById("readerModal"),
    closeReaderBtn: document.getElementById("closeReaderBtn"),
    readerSeriesTitle: document.getElementById("readerSeriesTitle"),
    readerChapterSelect: document.getElementById("readerChapterSelect"),
    prevChapBtn: document.getElementById("prevChapBtn"),
    nextChapBtn: document.getElementById("nextChapBtn"),
    stripWidthRange: document.getElementById("stripWidthRange"),
    stripWidthVal: document.getElementById("stripWidthVal"),
    autoScrollBtn: document.getElementById("autoScrollBtn"),
    readerContinuityBar: document.getElementById("readerContinuityBar"),
    readerPagesContainer: document.getElementById("readerPagesContainer"),
    readerApiUrlInput: document.getElementById("readerApiUrlInput"),
    saveReaderApiBtn: document.getElementById("saveReaderApiBtn"),
    localCbzInput: document.getElementById("localCbzInput")
  };

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
    } catch { /* ignore quota errors */ }
  }

  // Initialize App
  async function init() {
    applyTheme(localStorage.getItem(STORAGE_KEYS.THEME) || "moonlight");
    el.titlePrefSelect.value = titlePref;
    el.readerApiUrlInput.value = localStorage.getItem(STORAGE_KEYS.READER_API) || "";

    try {
      const res = await fetch("./catalog.json");
      if (res.ok) catalogData = await res.json();
    } catch {
      console.warn("Running without catalog.json fetch (using built-in defaults).");
    }

    renderStarters();
    renderGenreChips();
    renderNoteChips();
    renderBanSection();
    renderShelf();
    bindEvents();
  }

  function applyTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    el.themeSelect.value = themeName;
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
  }

  // Smart Title Resolver (Scanlation / EN vs Official Romaji)
  function resolveTitle(item) {
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

  // Ban Engine
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
        const rx = new RegExp(`\\b${escapeRegExp(clean)}\\b`, "i");
        return rx.test(haystack);
      }
      return haystack.includes(clean);
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Multi-Source Search (OEL Catalog + AniList KR + Kitsu + Jikan/MAL)
  async function searchAllSources(query) {
    const q = query.trim();
    if (!q) return [];
    const cacheKey = `search:${q.toLowerCase()}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController();
    const { signal } = searchAbortController;

    // 1. Instant local OEL catalog match (e.g., TBATE)
    const localMatches = (catalogData.oelCatalog || []).filter((item) => {
      const blob = [item.displayTitle, item.romajiTitle, item.nativeTitle, ...(item.synonyms || [])]
        .join(" ")
        .toLowerCase();
      return blob.includes(q.toLowerCase());
    });

    // 2. Parallel remote queries
    const [anilistRes, kitsuRes, jikanRes] = await Promise.allSettled([
      fetchAniListSearch(q, signal),
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
    return deduped;
  }

  async function fetchAniListSearch(search, signal) {
    const gql = `
      query ($search: String) {
        Page(page: 1, perPage: 12) {
          media(search: $search, type: MANGA, countryOfOrigin: "KR", isAdult: false, sort: POPULARITY_DESC) {
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
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables: { search } }),
      signal
    });
    const json = await res.json();
    const list = json?.data?.Page?.media || [];
    return list.map(normalizeAniList);
  }

  function normalizeAniList(m) {
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

  async function fetchKitsuSearch(query, signal) {
    const res = await fetch(`${KITSU_URL}?filter[text]=${encodeURIComponent(query)}&page[limit]=8`, { signal });
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
    const res = await fetch(`${JIKAN_URL}?q=${encodeURIComponent(query)}&type=manhwa&limit=8&sfw=true`, { signal });
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
        existing.tags = Array.from(new Set([...existing.tags, ...item.tags]));
      }
    }
    return Array.from(seen.values());
  }

  // Recommendation Engine
  async function findRecommendations() {
    showStatus("Analyzing your Taste DNA and querying Korean manhwa libraries...");
    el.resultsSection.classList.add("hidden");

    const shelfIds = new Set(shelf.map((s) => s.id));
    const shelfNormTitles = new Set(shelf.map((s) => resolveTitle(s).toLowerCase().replace(/[^a-z0-9]/g, "")));

    const activeTags = Array.from(selectedTags);
    const activeGenres = Array.from(selectedGenres);

    const gql = `
      query ($genres: [String], $tags: [String], $chaptersGreater: Int, $scoreGreater: Int, $status: MediaStatus) {
        Page(page: 1, perPage: 45) {
          media(
            type: MANGA,
            countryOfOrigin: "KR",
            isAdult: false,
            genre_in: $genres,
            tag_in: $tags,
            chapters_greater: $chaptersGreater,
            averageScore_greater: $scoreGreater,
            status: $status,
            sort: POPULARITY_DESC
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

    const vars = {
      genres: activeGenres.length ? activeGenres : undefined,
      tags: activeTags.length ? activeTags.slice(0, 6) : undefined,
      chaptersGreater: selectedNotes.has("chapters100") ? 99 : undefined,
      scoreGreater: selectedNotes.has("peakArt") ? 79 : undefined,
      status: selectedNotes.has("completed") ? "FINISHED" : undefined
    };

    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gql, variables: vars })
      });
      const json = await res.json();
      let pool = (json?.data?.Page?.media || []).map(normalizeAniList);

      // Include verified OEL catalog items
      pool = deduplicateMedia([...(catalogData.oelCatalog || []), ...pool]);

      // Apply local collector notes & ban filter
      pool = pool.filter((item) => {
        if (shelfIds.has(item.id)) return false;
        const norm = resolveTitle(item).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (shelfNormTitles.has(norm)) return false;
        if (isItemBanned(item)) return false;

        if (selectedNotes.has("chapters100") && (!item.chapters || item.chapters < 100)) return false;
        if (selectedNotes.has("peakArt") && (!item.score || item.score < 80)) return false;
        if (selectedNotes.has("completed") && item.status !== "FINISHED") return false;
        if (selectedNotes.has("fullColor") && !item.tags.some((t) => /full color/i.test(t))) return false;
        if (selectedNotes.has("hiddenGems") && (!item.score || item.score < 78)) return false;

        return true;
      });

      // Score Taste Match
      currentRecommendations = pool.map((item) => {
        const matchedTags = item.tags.filter((t) => selectedTags.has(t));
        const matchedGenres = item.genres.filter((g) => selectedGenres.has(g));
        const base = 62;
        const tagBoost = Math.min(26, matchedTags.length * 7);
        const genreBoost = Math.min(10, matchedGenres.length * 4);
        const scoreBoost = item.score ? Math.round((item.score - 70) * 0.25) : 0;
        const matchPct = Math.min(99, Math.max(60, base + tagBoost + genreBoost + scoreBoost));
        return { ...item, matchPct };
      });

      sortAndRenderRecommendations();
      hideStatus();
      el.resultsSection.classList.remove("hidden");
    } catch (err) {
      showStatus(`Error fetching recommendations: ${err.message}`);
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
    el.resultsGrid.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const item of sorted) {
      const card = document.createElement("article");
      card.className = "manhwa-card";
      const title = resolveTitle(item);
      const chapText = item.chapters ? `${item.chapters} Ch.` : "Ongoing";

      card.innerHTML = `
        <div class="card-cover-wrap">
          <img src="${item.cover}" alt="${title}" loading="lazy" />
          <span class="badge-top-left">${item.matchPct}% Match</span>
          ${item.score ? `<span class="badge-top-right">★ ${item.score}%</span>` : ""}
          <span class="badge-bottom-left">${chapText}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-sub">${item.nativeTitle || item.source}</div>
          <div class="card-tags">
            ${item.genres.slice(0, 2).map((g) => `<span class="mini-tag">${g}</span>`).join("")}
            ${item.tags.slice(0, 2).map((t) => `<span class="mini-tag">${t}</span>`).join("")}
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm read-online-btn">📖 Read</button>
            <button class="btn btn-ghost btn-sm add-shelf-btn">+ Shelf</button>
          </div>
        </div>
      `;

      card.querySelector(".card-title").addEventListener("click", () => openDetailModal(item));
      card.querySelector(".read-online-btn").addEventListener("click", () => openWebReaderForSeries(item));
      card.querySelector(".add-shelf-btn").addEventListener("click", () => addToShelf(item));
      frag.appendChild(card);
    }

    el.resultsGrid.appendChild(frag);
  }

  // Shelf Management & Taste DNA Extraction
  function addToShelf(item) {
    if (shelf.some((s) => s.id === item.id)) return;
    shelf.push(item);
    saveJSON(STORAGE_KEYS.SHELF, shelf);
    renderShelf();
  }

  function removeFromShelf(id) {
    shelf = shelf.filter((s) => s.id !== id);
    saveJSON(STORAGE_KEYS.SHELF, shelf);
    renderShelf();
  }

  function renderShelf() {
    el.shelfCount.textContent = shelf.length;
    el.shelfGrid.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const item of shelf) {
      const div = document.createElement("div");
      div.className = "shelf-card";
      div.innerHTML = `
        <img src="${item.cover}" alt="" />
        <div class="shelf-card-info">
          <div class="shelf-card-title">${resolveTitle(item)}</div>
          <div class="muted small">${item.chapters ? `${item.chapters} Ch.` : "Ongoing"}</div>
        </div>
        <button class="btn btn-ghost btn-sm" title="Remove">✕</button>
      `;
      div.querySelector("button").addEventListener("click", () => removeFromShelf(item.id));
      frag.appendChild(div);
    }
    el.shelfGrid.appendChild(frag);
    extractTasteDNA();
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
      .slice(0, 16)
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
      });
      el.extractedTags.appendChild(chip);
    }
  }

  // UI Chip Renderers
  function renderStarters() {
    el.starterChips.innerHTML = "";
    for (const st of catalogData.starters || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = `+ ${st.title}`;
      btn.addEventListener("click", async () => {
        const found = await searchAllSources(st.title);
        if (found[0]) addToShelf(found[0]);
      });
      el.starterChips.appendChild(btn);
    }
  }

  function renderGenreChips() {
    el.genreChips.innerHTML = "";
    for (const g of catalogData.extraGenres || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = g;
      btn.addEventListener("click", () => {
        if (selectedGenres.has(g)) {
          selectedGenres.delete(g);
          btn.classList.remove("active");
        } else {
          selectedGenres.add(g);
          btn.classList.add("active");
        }
      });
      el.genreChips.appendChild(btn);
    }
  }

  function renderNoteChips() {
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
      });
      el.banPresetChips.appendChild(btn);
    }

    el.activeBansList.innerHTML = "";
    for (const term of bannedTerms) {
      const tag = document.createElement("span");
      tag.className = "chip banned";
      tag.textContent = `${term} ✕`;
      tag.title = "Click to remove ban";
      tag.addEventListener("click", () => {
        bannedTerms = bannedTerms.filter((t) => t !== term);
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        renderBanSection();
      });
      el.activeBansList.appendChild(tag);
    }
  }

  // Detail Modal
  function openDetailModal(item) {
    const title = resolveTitle(item);
    el.detailBody.innerHTML = `
      <div class="detail-grid">
        <img src="${item.cover}" alt="${title}" />
        <div>
          <h2>${title}</h2>
          <p class="muted">${item.nativeTitle || ""} • ${item.source} • ${item.chapters ? `${item.chapters} Chapters` : "Ongoing"}</p>
          <p style="margin: 0.8rem 0;">${item.description || "No synopsis available."}</p>
          <div class="chip-group" style="margin-bottom: 1rem;">
            ${item.genres.map((g) => `<span class="chip active">${g}</span>`).join("")}
            ${item.tags.slice(0, 8).map((t) => `<span class="chip">${t}</span>`).join("")}
          </div>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button id="modalReadBtn" class="btn btn-primary">📖 Open in Web Reader</button>
            <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-ghost">Official / Database Page ↗</a>
          </div>
        </div>
      </div>
    `;
    document.getElementById("modalReadBtn").addEventListener("click", () => {
      el.detailModal.classList.add("hidden");
      openWebReaderForSeries(item);
    });
    el.detailModal.classList.remove("hidden");
  }

  // =========================================================================
  // ONLINE WEBTOON READER + CHAPTER CONTINUITY VERIFIER
  // =========================================================================
  async function openWebReaderForSeries(item) {
    const title = resolveTitle(item);
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
      // Compatible with Suwayomi-Server / custom JSON REST feeds
      const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(seriesTitle)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const chapters = normalizeChapterList(data.chapters || []);
      if (!chapters.length) throw new Error("No chapters returned by endpoint.");
      readerState.chapters = chapters;
      readerState.currentIdx = 0;
      renderReaderChapterSelect();
      renderReaderChapter(0);
    } catch (err) {
      el.readerPagesContainer.innerHTML = `
        <div class="reader-placeholder-card">
          <h3>Could not fetch chapters from configured API</h3>
          <p class="muted" style="margin:0.5rem 0;">Reason: ${err.message}</p>
          <p>Make sure your self-hosted Reader API (such as <strong>Suwayomi-Server</strong> or a custom JSON endpoint) has CORS enabled and returns <code>{ "chapters": [{ "number": 1, "title": "Chapter 1", "pages": ["https://..."] }] }</code>.</p>
        </div>
      `;
    }
  }

  function loadDemoReaderSetup(item) {
    const title = item ? resolveTitle(item) : "VexinManwha Web Reader";
    const total = item?.chapters ? Math.min(item.chapters, 12) : 6;
    // Generate sequential chapter index (1, 2, 3, 4, 5, 6...) with continuity verification
    const chapters = [];
    for (let i = 1; i <= total; i++) {
      chapters.push({
        number: i,
        title: `Chapter ${i}`,
        pages: item?.cover ? [item.cover] : []
      });
    }
    readerState.chapters = chapters;
    readerState.currentIdx = 0;
    renderReaderChapterSelect();
    verifyChapterContinuity(chapters);

    el.readerPagesContainer.innerHTML = `
      <div class="reader-placeholder-card">
        <h3>📖 Online Web Reader — ${title}</h3>
        <p class="muted" style="margin:0.6rem 0;">
          Browsers block cross-origin <code>&lt;iframe&gt;</code> embedding and image hotlinking from external scanlation websites.
          To stream full chapters directly inside VexinManwha without downloading files:
        </p>
        <ol style="margin-left:1.25rem; line-height:1.7;">
          <li>Paste a CORS-enabled <strong>Reader API URL</strong> (e.g., your self-hosted <strong>Suwayomi-Server</strong> or custom JSON chapter feed) in the bar above and click <strong>Connect API</strong>.</li>
          <li>VexinManwha automatically sorts chapters in strict ascending order (<code>Ch. 1 → 2 → 3 → 4 → 5 → 6</code>) and flags any missing chapters in red on the continuity strip above.</li>
          <li>Or click <strong>📁 Open CBZ/ZIP</strong> in the toolbar to read any archive instantly in vertical webtoon mode.</li>
        </ol>
      </div>
    `;
  }

  function normalizeChapterList(rawChapters) {
    return rawChapters
      .map((c, idx) => {
        const match = String(c.number ?? c.title ?? idx + 1).match(/(\d+(\.\d+)?)/);
        const num = match ? parseFloat(match[1]) : idx + 1;
        return {
          number: num,
          title: c.title || `Chapter ${num}`,
          pages: c.pages || []
        };
      })
      .sort((a, b) => a.number - b.number);
  }

  function verifyChapterContinuity(chapters) {
    el.readerContinuityBar.innerHTML = `<span>Continuity Check:</span>`;
    if (!chapters.length) return;

    const nums = new Set(chapters.map((c) => Math.floor(c.number)));
    const maxChap = Math.max(...nums);
    const missing = [];

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
        missing.push(n);
        pill.className = "chap-pill missing";
        pill.textContent = `Missing Ch. ${n}`;
      }
      el.readerContinuityBar.appendChild(pill);
    }

    const summary = document.createElement("span");
    summary.style.marginLeft = "0.5rem";
    summary.textContent = missing.length
      ? `⚠️ ${missing.length} missing chapter(s)`
      : "✅ Complete sequence (no gaps)";
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

  // Optional CBZ/ZIP Archive Loader
  async function handleLocalArchive(file) {
    if (!file || typeof JSZip === "undefined") return;
    el.readerPagesContainer.innerHTML = `<div class="reader-placeholder-card">Extracting <strong>${file.name}</strong>...</div>`;
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

  // Event Listeners
  function bindEvents() {
    el.themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));

    el.titlePrefSelect.addEventListener("change", (e) => {
      titlePref = e.target.value;
      localStorage.setItem(STORAGE_KEYS.TITLE_PREF, titlePref);
      renderShelf();
      if (currentRecommendations.length) sortAndRenderRecommendations();
    });

    el.searchInput.addEventListener("input", (e) => {
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
      }, 320);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrapper")) el.searchDropdown.classList.add("hidden");
    });

    el.clearShelfBtn.addEventListener("click", () => {
      shelf = [];
      selectedTags.clear();
      saveJSON(STORAGE_KEYS.SHELF, shelf);
      renderShelf();
    });

    el.addBanBtn.addEventListener("click", () => {
      const val = el.customBanInput.value.trim().toLowerCase();
      if (val && !bannedTerms.includes(val)) {
        bannedTerms.push(val);
        saveJSON(STORAGE_KEYS.BANS, bannedTerms);
        el.customBanInput.value = "";
        renderBanSection();
      }
    });

    el.clearBansBtn.addEventListener("click", () => {
      bannedTerms = [];
      saveJSON(STORAGE_KEYS.BANS, bannedTerms);
      renderBanSection();
    });

    el.findBtn.addEventListener("click", findRecommendations);
    el.sortSelect.addEventListener("change", sortAndRenderRecommendations);
    el.closeDetailBtn.addEventListener("click", () => el.detailModal.classList.add("hidden"));

    // Web Reader Events
    el.openReaderBtn.addEventListener("click", () => {
      el.readerModal.classList.remove("hidden");
      loadDemoReaderSetup(shelf[0] || null);
    });
    el.closeReaderBtn.addEventListener("click", () => {
      el.readerModal.classList.add("hidden");
      clearInterval(readerState.autoScrollTimer);
    });
    el.saveReaderApiBtn.addEventListener("click", () => {
      const url = el.readerApiUrlInput.value.trim();
      localStorage.setItem(STORAGE_KEYS.READER_API, url);
      if (url) loadChaptersFromApi(url.replace(/\/$/, ""), readerState.seriesTitle);
    });
    el.readerChapterSelect.addEventListener("change", (e) => {
      readerState.currentIdx = Number(e.target.value);
      renderReaderChapter(readerState.currentIdx);
    });
    el.prevChapBtn.addEventListener("click", () => {
      if (readerState.currentIdx > 0) {
        readerState.currentIdx--;
        renderReaderChapter(readerState.currentIdx);
      }
    });
    el.nextChapBtn.addEventListener("click", () => {
      if (readerState.currentIdx < readerState.chapters.length - 1) {
        readerState.currentIdx++;
        renderReaderChapter(readerState.currentIdx);
      }
    });
    el.stripWidthRange.addEventListener("input", (e) => {
      const px = `${e.target.value}px`;
      el.stripWidthVal.textContent = px;
      el.readerPagesContainer.style.setProperty("--strip-width", px);
    });
    el.autoScrollBtn.addEventListener("click", () => {
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
    el.localCbzInput.addEventListener("change", (e) => {
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
      const row = document.createElement("div");
      row.className = "dropdown-item";
      row.innerHTML = `
        <img src="${item.cover}" alt="" />
        <div>
          <div><strong>${resolveTitle(item)}</strong> <span class="mini-tag">${item.source}</span></div>
          <div class="muted small">${item.nativeTitle || ""} • ${item.chapters ? `${item.chapters} Ch.` : "Ongoing"}</div>
        </div>
      `;
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
    el.statusBanner.textContent = msg;
    el.statusBanner.classList.remove("hidden");
  }

  function hideStatus() {
    el.statusBanner.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", init);
})();