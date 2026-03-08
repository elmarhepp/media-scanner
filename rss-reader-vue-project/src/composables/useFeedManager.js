import { ref, computed } from "vue";

const STORAGE_KEY = "rss-feeds-vue";
const CORS_PROXIES = [
  "https://api.codetabs.com/v1/proxy/?quest=",
  "https://api.allorigins.win/raw?url=",
];
const RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json?rss_url=";
const RECOMMENDED_FEEDS = [
  {
    name: "Tagesschau",
    url: "https://www.tagesschau.de/xml/rss2",
    region: "de",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "Deutschlandfunk Nachrichten",
    url: "https://www.deutschlandfunk.de/nachrichten-100.rss",
    region: "de",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "ZEIT ONLINE",
    url: "https://newsfeed.zeit.de/index",
    region: "de",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "FAZ Politik",
    url: "https://www.faz.net/rss/aktuell/politik/",
    region: "de",
    profile: "mainstream",
    topics: ["politics"],
  },
  {
    name: "Sueddeutsche Politik",
    url: "https://rss.sueddeutsche.de/rss/Politik",
    region: "de",
    profile: "mainstream",
    topics: ["politics"],
  },
  {
    name: "Der Spiegel Politik",
    url: "https://www.spiegel.de/politik/index.rss",
    region: "de",
    profile: "mainstream",
    topics: ["politics"],
  },
  {
    name: "NachDenkSeiten",
    url: "https://www.nachdenkseiten.de/?feed=rss2",
    region: "de",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "Telepolis",
    url: "https://www.telepolis.de/rss.xml",
    region: "de",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "Cicero",
    url: "https://www.cicero.de/rss",
    region: "de",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "nd aktuell",
    url: "https://www.nd-aktuell.de/rss",
    region: "de",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "Reuters World",
    url: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best",
    region: "intl",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "BBC World",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    region: "intl",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "The Guardian World",
    url: "https://www.theguardian.com/world/rss",
    region: "intl",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "NYT World",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    region: "intl",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "Politico Europe",
    url: "https://www.politico.eu/feed/",
    region: "intl",
    profile: "mainstream",
    topics: ["politics"],
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    region: "intl",
    profile: "mainstream",
    topics: ["general", "politics"],
  },
  {
    name: "The Intercept",
    url: "https://theintercept.com/feed/",
    region: "intl",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "Jacobin",
    url: "https://jacobin.com/feed",
    region: "intl",
    profile: "alternative",
    topics: ["politics"],
  },
  {
    name: "Reason",
    url: "https://reason.com/feed/",
    region: "intl",
    profile: "alternative",
    topics: ["politics", "general"],
  },
  {
    name: "UnHerd",
    url: "https://unherd.com/feed/",
    region: "intl",
    profile: "alternative",
    topics: ["politics", "general"],
  },
];

export function useFeedManager() {
  const feeds = ref([]);
  const feedArticles = ref({});
  const feedLoading = ref({});
  const feedErrors = ref({});
  const allArticles = ref([]);

  const activeFeeds = computed(() => feeds.value.filter((f) => f && f.active));
  const activeFeedCount = computed(() => activeFeeds.value.length);

  const inferRegionFromUrl = (url = "") => {
    const lower = url.toLowerCase();
    if (
      lower.includes(".de") ||
      lower.includes("tagesschau") ||
      lower.includes("spiegel") ||
      lower.includes("zeit")
    ) {
      return "de";
    }
    return "intl";
  };

  const normalizeTopics = (topics) => {
    if (!Array.isArray(topics) || topics.length === 0) {
      return ["general"];
    }

    const allowed = topics.filter(
      (topic) => topic === "politics" || topic === "general",
    );
    return allowed.length > 0 ? allowed : ["general"];
  };

  const normalizeFeedMetadata = (feed) => {
    if (!feed) return feed;

    return {
      ...feed,
      region:
        feed.region === "de" || feed.region === "intl"
          ? feed.region
          : inferRegionFromUrl(feed.url),
      profile: feed.profile === "alternative" ? "alternative" : "mainstream",
      topics: normalizeTopics(feed.topics),
    };
  };

  const normalizeUrl = (url = "") =>
    url.trim().toLowerCase().replace(/\/$/, "");

  const generateFeedId = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const rebuildAllArticles = () => {
    const merged = [];

    feeds.value.forEach((feed) => {
      if (!feed || !feed.id) return;

      const articles = feedArticles.value[feed.id] || [];
      articles.forEach((article) => {
        merged.push({
          ...article,
          feedId: feed.id,
          feedName: feed.name,
        });
      });
    });

    allArticles.value = merged;
  };

  // Storage
  const loadFeeds = () => {
    const stored = localStorage.getItem(STORAGE_KEY);

    try {
      feeds.value = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(feeds.value)) {
        feeds.value = [];
      }
      feeds.value = feeds.value.map((feed) => normalizeFeedMetadata(feed));
    } catch (error) {
      console.error(
        "Gespeicherte Feed-Daten sind ungültig, Storage wird zurückgesetzt.",
        error,
      );
      feeds.value = [];
      localStorage.removeItem(STORAGE_KEY);
    }

    feedArticles.value = {};
    feedLoading.value = {};
    feedErrors.value = {};

    // Initialize tracking objects
    feeds.value.forEach((feed) => {
      if (feed && feed.id) {
        feedArticles.value[feed.id] = [];
        feedLoading.value[feed.id] = false;
        feedErrors.value[feed.id] = null;
      }
    });

    rebuildAllArticles();
  };

  const saveFeeds = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds.value));
  };

  // Feed Management
  const addFeed = (
    name,
    url,
    fallbackUrl = "",
    region = "de",
    profile = "mainstream",
    topics = ["general"],
  ) => {
    const feed = normalizeFeedMetadata({
      id: generateFeedId(),
      name,
      url,
      fallbackUrl,
      region,
      profile,
      topics,
      active: true,
      addedAt: new Date().toISOString(),
    });
    feeds.value.push(feed);
    feedArticles.value[feed.id] = [];
    feedLoading.value[feed.id] = false;
    feedErrors.value[feed.id] = null;
    saveFeeds();
    return feed;
  };

  const importRecommendedFeeds = () => {
    const existing = new Set(
      feeds.value.map((feed) => normalizeUrl(feed?.url || "")),
    );
    const created = [];

    RECOMMENDED_FEEDS.forEach((candidate) => {
      const normalizedCandidateUrl = normalizeUrl(candidate.url);
      if (!normalizedCandidateUrl || existing.has(normalizedCandidateUrl)) {
        return;
      }

      const feed = normalizeFeedMetadata({
        id: generateFeedId(),
        name: candidate.name,
        url: candidate.url,
        fallbackUrl: candidate.fallbackUrl || "",
        region: candidate.region,
        profile: candidate.profile,
        topics: candidate.topics,
        active: true,
        addedAt: new Date().toISOString(),
      });

      feeds.value.push(feed);
      feedArticles.value[feed.id] = [];
      feedLoading.value[feed.id] = false;
      feedErrors.value[feed.id] = null;
      existing.add(normalizedCandidateUrl);
      created.push(feed);
    });

    if (created.length > 0) {
      saveFeeds();
    }

    return created;
  };

  const updateFeed = (
    id,
    name,
    url,
    fallbackUrl = "",
    region = "de",
    profile = "mainstream",
    topics = ["general"],
  ) => {
    const feedIndex = feeds.value.findIndex((f) => f.id === id);
    if (feedIndex !== -1) {
      feeds.value[feedIndex] = normalizeFeedMetadata({
        ...feeds.value[feedIndex],
        name,
        url,
        fallbackUrl,
        region,
        profile,
        topics,
      });
      saveFeeds();
      rebuildAllArticles();
      return feeds.value[feedIndex];
    }
    return null;
  };

  const removeFeed = (id) => {
    feeds.value = feeds.value.filter((f) => f.id !== id);
    delete feedArticles.value[id];
    delete feedLoading.value[id];
    delete feedErrors.value[id];
    saveFeeds();
    rebuildAllArticles();
  };

  const toggleFeedActive = (id) => {
    const feed = feeds.value.find((f) => f && f.id === id);
    if (feed) {
      feed.active = !feed.active;
      saveFeeds();
    }
  };

  const reorderFeeds = (fromIndex, toIndex) => {
    const [movedFeed] = feeds.value.splice(fromIndex, 1);
    feeds.value.splice(toIndex, 0, movedFeed);
    saveFeeds();
  };

  const getFeed = (id) => feeds.value.find((f) => f.id === id);

  // Feed Loading
  const loadFeedContent = async (feed) => {
    feedLoading.value[feed.id] = true;
    delete feedErrors.value[feed.id];

    try {
      const articles = await fetchFeedWithFallback(feed);
      feedArticles.value[feed.id] = articles;
      rebuildAllArticles();
    } catch (error) {
      console.error(`Feed ${feed.name} konnte nicht geladen werden:`, error);
      feedErrors.value[feed.id] = error.message;
    } finally {
      feedLoading.value[feed.id] = false;
    }
  };

  const fetchFeedWithFallback = async (feed) => {
    let lastError = null;

    // Try primary URL
    try {
      console.log(`Lade Feed von primärer URL: ${feed.url}`);
      return await fetchFeed(feed.url);
    } catch (error) {
      console.warn(`Primäre URL fehlgeschlagen: ${error.message}`);
      lastError = error;
    }

    // Try fallback URL
    if (feed.fallbackUrl && feed.fallbackUrl.trim()) {
      try {
        console.log(`Versuche Fallback URL: ${feed.fallbackUrl}`);
        const result = await fetchFeed(feed.fallbackUrl);
        console.log("✓ Fallback URL erfolgreich");
        return result;
      } catch (error) {
        console.warn(`Fallback URL fehlgeschlagen: ${error.message}`);
        lastError = error;
      }
    }

    throw lastError || new Error("Beide Feed-URLs fehlgeschlagen");
  };

  const fetchFeed = async (url) => {
    let lastError = null;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      try {
        console.log(`Versuche Proxy ${i + 1}/${CORS_PROXIES.length}`);

        const response = await fetch(proxy + encodeURIComponent(url), {
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        if (!text.trim().startsWith("<")) {
          throw new Error("Keine gültige XML-Antwort");
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        const parserError = xml.querySelector("parsererror");
        if (parserError) {
          throw new Error("XML-Format ungültig");
        }

        const isRSS = xml.querySelector("rss, rdf\\:RDF");
        const isAtom = xml.querySelector("feed");

        console.log(`✓ Proxy ${i + 1} erfolgreich!`);

        if (isRSS) {
          return parseRSS(xml);
        } else if (isAtom) {
          return parseAtom(xml);
        } else {
          throw new Error("Feed-Format nicht erkannt");
        }
      } catch (error) {
        console.warn(`✗ Proxy ${i + 1} fehlgeschlagen:`, error.message);
        lastError = error;
      }
    }

    // Final fallback: rss2json (returns JSON, can bypass strict XML proxy limits)
    try {
      console.log("Versuche JSON-Fallback über rss2json");
      const response = await fetch(
        RSS2JSON_ENDPOINT + encodeURIComponent(url),
        {
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const payload = await response.json();
      if (
        !payload ||
        payload.status !== "ok" ||
        !Array.isArray(payload.items)
      ) {
        throw new Error("Ungültige JSON-Antwort vom Fallback");
      }

      return parseRss2Json(payload.items);
    } catch (error) {
      console.warn("✗ rss2json fehlgeschlagen:", error.message);
      lastError = error;
    }

    throw new Error(
      `Alle Feed-Quellen fehlgeschlagen. Letzter Fehler: ${lastError?.message || "Unbekannt"}`,
    );
  };

  const parseRss2Json = (items) => {
    const articles = [];
    items.slice(0, 10).forEach((item) => {
      articles.push({
        title: (item?.title || "Kein Titel").trim(),
        link: item?.link || "#",
        description: cleanDescription(item?.description || item?.content || ""),
        pubDate: item?.pubDate || "",
      });
    });

    return articles;
  };

  const parseRSS = (xml) => {
    let items = xml.querySelectorAll("item");
    if (items.length === 0) {
      items = xml.querySelectorAll("channel > item");
    }
    if (items.length === 0) {
      items = xml.querySelectorAll("rdf\\:RDF > item, item");
    }

    console.log(`RSS: ${items.length} Artikel gefunden`);

    const articles = [];
    items.forEach((item, index) => {
      if (index < 10) {
        const link =
          item.querySelector("link")?.textContent?.trim() ||
          item.querySelector("guid")?.textContent?.trim() ||
          "#";

        articles.push({
          title:
            item.querySelector("title")?.textContent?.trim() || "Kein Titel",
          link,
          description: cleanDescription(
            item.querySelector("description")?.textContent ||
              item.querySelector("content\\:encoded")?.textContent ||
              "",
          ),
          pubDate:
            item.querySelector("pubDate")?.textContent ||
            item.querySelector("dc\\:date")?.textContent ||
            "",
        });
      }
    });

    return articles;
  };

  const parseAtom = (xml) => {
    const entries = xml.querySelectorAll("entry");
    console.log(`Atom: ${entries.length} Artikel gefunden`);

    const articles = [];
    entries.forEach((entry, index) => {
      if (index < 10) {
        const link = entry.querySelector("link");
        const linkHref =
          link?.getAttribute("href") || link?.textContent?.trim() || "#";

        articles.push({
          title:
            entry.querySelector("title")?.textContent?.trim() || "Kein Titel",
          link: linkHref,
          description: cleanDescription(
            entry.querySelector("summary")?.textContent ||
              entry.querySelector("content")?.textContent ||
              "",
          ),
          pubDate:
            entry.querySelector("published")?.textContent ||
            entry.querySelector("updated")?.textContent ||
            "",
        });
      }
    });

    return articles;
  };

  const cleanDescription = (desc) => {
    const temp = document.createElement("div");
    temp.innerHTML = desc;
    const text = temp.textContent || temp.innerText || "";
    return text.length > 200 ? text.substring(0, 200) + "..." : text;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `vor ${diffMins} Min.`;
      } else if (diffHours < 24) {
        return `vor ${diffHours} Std.`;
      } else if (diffDays < 7) {
        return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
      } else {
        return date.toLocaleDateString("de-DE");
      }
    } catch (e) {
      return "";
    }
  };

  const refreshAllFeeds = async () => {
    const activeOnlyFeeds = feeds.value.filter((feed) => feed && feed.active);
    const promises = activeOnlyFeeds.map((feed) => loadFeedContent(feed));
    await Promise.all(promises);
    rebuildAllArticles();
  };

  return {
    feeds,
    feedArticles,
    feedLoading,
    feedErrors,
    allArticles,
    activeFeeds,
    activeFeedCount,
    loadFeeds,
    saveFeeds,
    addFeed,
    updateFeed,
    removeFeed,
    toggleFeedActive,
    reorderFeeds,
    getFeed,
    importRecommendedFeeds,
    loadFeedContent,
    formatDate,
    refreshAllFeeds,
  };
}
