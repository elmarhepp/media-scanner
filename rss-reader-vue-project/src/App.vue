<template>
  <div class="app-wrapper">
    <FeedSidebar
      :class="{ 'mobile-open': mobileMenuOpen }"
      :feeds="filteredFeeds"
      :feedQuery="feedQuery"
      :selectedRegion="selectedRegion"
      :selectedTopic="selectedTopic"
      :selectedArticleCategory="selectedArticleCategory"
      :regionCounts="regionCounts"
      :topicCounts="topicCounts"
      :articleCategoryCounts="articleCategoryCounts"
      :topSourceLinks="topSourceLinks"
      :sidebarStats="sidebarStats"
      :isImporting="isImportingFeeds"
      :importMessage="importMessage"
      :draggedFeedId="draggedFeedId"
      :dragOverFeedId="dragOverFeedId"
      @open-add-modal="showAddModal = true"
      @import-recommended="handleImportRecommended"
      @set-region="selectedRegion = $event"
      @set-topic="selectedTopic = $event"
      @set-feed-query="feedQuery = $event"
      @set-article-category="selectedArticleCategory = $event"
      @toggle-feed="toggleFeedActive"
      @scroll-to-feed="scrollToFeed"
      @start-drag="startDrag"
      @end-drag="endDrag"
      @drag-over="dragOverFeedId = $event"
      @drag-leave="dragOverFeedId = null"
      @drop="dropFeed"
    />

    <div class="main-content">
      <div class="container">
        <header>
          <div style="display: flex; align-items: center; gap: 15px">
            <button
              class="mobile-menu-btn"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              ☰
            </button>
            <h1>RSS Feed Reader</h1>
          </div>
          <div class="header-actions">
            <div class="search-container">
              <input
                type="text"
                v-model="searchTerm"
                class="search-input"
                placeholder="Artikel durchsuchen..."
                @keyup.enter="performSearch"
                @input="handleSearchInput"
              />
              <button
                v-if="isSearchActive"
                @click="clearSearch"
                class="secondary"
              >
                <span>✕</span> Zurücksetzen
              </button>
            </div>
            <button
              @click="handleRefreshAll"
              class="secondary"
              :disabled="isRefreshing"
            >
              <span>🔄</span>
              {{ isRefreshing ? "Aktualisiert..." : "Aktualisieren" }}
            </button>
          </div>
        </header>

        <SearchResults
          v-if="isSearchActive"
          :searchTerm="searchTerm"
          :searchResults="searchResults"
          :formatDate="formatDate"
        />

        <div v-else class="feeds-grid">
          <div v-if="feeds.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h2>Keine Feeds vorhanden</h2>
            <p>Füge deinen ersten RSS-Feed hinzu, um loszulegen!</p>
          </div>
          <div v-else-if="filteredFeeds.length === 0" class="empty-state">
            <div class="empty-state-icon">🧭</div>
            <h2>Keine Feeds in dieser Gruppe</h2>
            <p>Ändere Region, Themen- oder Kategorie-Filter in der Sidebar.</p>
          </div>
          <div v-else-if="filteredActiveFeeds.length === 0" class="empty-state">
            <div class="empty-state-icon">👁️</div>
            <h2>Alle gefilterten Feeds sind ausgeblendet</h2>
            <p>Aktiviere Feeds in der Sidebar, um sie anzuzeigen.</p>
          </div>
          <div v-else-if="visibleActiveFeeds.length === 0" class="empty-state">
            <div class="empty-state-icon">🏷️</div>
            <h2>Keine Artikel in dieser Kategorie gefunden</h2>
            <p>Waehle eine andere Kategorie oder setze den Filter zurueck.</p>
          </div>
          <template v-else>
            <FeedCard
              v-for="feed in visibleActiveFeeds"
              :key="feed.id"
              :feed="feed"
              :articles="displayedArticlesByFeed[feed.id]"
              :loading="feedLoading[feed.id]"
              :error="feedErrors[feed.id]"
              :formatDate="formatDate"
              @edit="openEditModal"
              @remove="handleRemoveFeed"
            />
          </template>
        </div>
      </div>
    </div>

    <AddFeedModal
      :show="showAddModal"
      @close="showAddModal = false"
      @add="handleAddFeed"
    />

    <EditFeedModal
      :show="showEditModal"
      :feed="editingFeed"
      @close="showEditModal = false"
      @update="handleUpdateFeed"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useFeedManager } from "./composables/useFeedManager";
import FeedSidebar from "./components/FeedSidebar.vue";
import FeedCard from "./components/FeedCard.vue";
import SearchResults from "./components/SearchResults.vue";
import AddFeedModal from "./components/AddFeedModal.vue";
import EditFeedModal from "./components/EditFeedModal.vue";

const {
  feeds,
  feedArticles,
  feedLoading,
  feedErrors,
  allArticles,
  loadFeeds,
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
} = useFeedManager();

// UI State
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingFeed = ref({});
const mobileMenuOpen = ref(false);
const draggedFeedId = ref(null);
const dragOverFeedId = ref(null);
const isRefreshing = ref(false);
const isImportingFeeds = ref(false);
const importMessage = ref("");

// Navigation / Grouping
const selectedRegion = ref("de");
const selectedTopic = ref("all");
const selectedArticleCategory = ref("all");
const feedQuery = ref("");

const scopedFeeds = computed(() =>
  feeds.value.filter((feed) => {
    if (!feed) return false;
    const regionMatch = feed.region === selectedRegion.value;
    const topicMatch =
      selectedTopic.value === "all" ||
      (Array.isArray(feed.topics) && feed.topics.includes(selectedTopic.value));
    return regionMatch && topicMatch;
  }),
);

const filteredFeeds = computed(() => {
  const query = feedQuery.value.trim().toLowerCase();
  if (!query) {
    return scopedFeeds.value;
  }

  return scopedFeeds.value.filter((feed) => {
    const name = feed?.name?.toLowerCase() || "";
    const url = feed?.url?.toLowerCase() || "";
    return name.includes(query) || url.includes(query);
  });
});

const filteredActiveFeeds = computed(() =>
  filteredFeeds.value.filter((feed) => feed.active),
);

const visibleActiveFeeds = computed(() => {
  if (selectedArticleCategory.value === "all") {
    return filteredActiveFeeds.value;
  }

  return filteredActiveFeeds.value.filter((feed) => {
    if (feedLoading.value[feed.id] || feedErrors.value[feed.id]) {
      return true;
    }

    const visibleArticles = displayedArticlesByFeed.value[feed.id] || [];
    return visibleArticles.length > 0;
  });
});

const sidebarStats = computed(() => ({
  visible: filteredFeeds.value.length,
  active: filteredActiveFeeds.value.length,
}));

const allowedFeedIds = computed(
  () => new Set(filteredFeeds.value.map((feed) => feed.id)),
);

const scopedArticles = computed(() =>
  allArticles.value.filter((article) =>
    allowedFeedIds.value.has(article.feedId),
  ),
);

const articleCategoryCounts = computed(() => {
  const counts = { all: scopedArticles.value.length };

  scopedArticles.value.forEach((article) => {
    const categories = Array.isArray(article?.categories)
      ? article.categories
      : [];

    categories.forEach((category) => {
      if (!category) return;
      counts[category] = (counts[category] || 0) + 1;
    });
  });

  return counts;
});

const visibleArticlesForTopLinks = computed(() =>
  filteredActiveFeeds.value.flatMap(
    (feed) => displayedArticlesByFeed.value[feed.id] || [],
  ),
);

const topSourceLinks = computed(() => {
  const sourceMap = new Map();

  visibleArticlesForTopLinks.value.forEach((article) => {
    if (!article?.link) return;
    try {
      const parsed = new URL(article.link);
      const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
      if (!domain) return;

      const existing = sourceMap.get(domain) || {
        domain,
        url: `${parsed.protocol}//${parsed.hostname}`,
        count: 0,
      };
      existing.count += 1;
      sourceMap.set(domain, existing);
    } catch {
      // Ignore malformed URLs.
    }
  });

  return Array.from(sourceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
});

const categoryRanking = computed(() => {
  const entries = Object.entries(articleCategoryCounts.value)
    .filter(([key]) => key !== "all")
    .sort(([, countA], [, countB]) => countB - countA);

  const ranking = {};
  entries.forEach(([category], index) => {
    ranking[category] = entries.length - index;
  });
  return ranking;
});

const toTimestamp = (pubDate = "") => {
  const ts = new Date(pubDate).getTime();
  return Number.isFinite(ts) ? ts : 0;
};

const displayedArticlesByFeed = computed(() => {
  const byFeedId = {};
  const selected = selectedArticleCategory.value;

  filteredActiveFeeds.value.forEach((feed) => {
    const items = [...(feedArticles.value[feed.id] || [])];
    const categoryFiltered =
      selected === "all"
        ? items
        : items.filter((article) =>
            Array.isArray(article?.categories)
              ? article.categories.includes(selected)
              : false,
          );

    categoryFiltered.sort((a, b) => {
      if (selected !== "all") {
        return toTimestamp(b.pubDate) - toTimestamp(a.pubDate);
      }

      const scoreA = Math.max(
        0,
        ...(Array.isArray(a?.categories)
          ? a.categories.map((cat) => categoryRanking.value[cat] || 0)
          : [0]),
      );
      const scoreB = Math.max(
        0,
        ...(Array.isArray(b?.categories)
          ? b.categories.map((cat) => categoryRanking.value[cat] || 0)
          : [0]),
      );

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return toTimestamp(b.pubDate) - toTimestamp(a.pubDate);
    });

    byFeedId[feed.id] = categoryFiltered;
  });

  return byFeedId;
});

const regionCounts = computed(() => ({
  de: feeds.value.filter((feed) => feed?.region === "de").length,
  intl: feeds.value.filter((feed) => feed?.region === "intl").length,
}));

const topicCounts = computed(() => {
  const base = feeds.value.filter(
    (feed) => feed?.region === selectedRegion.value,
  );

  return {
    all: base.length,
    politics: base.filter((feed) => feed?.topics?.includes("politics")).length,
    general: base.filter((feed) => feed?.topics?.includes("general")).length,
  };
});

// Search
const searchTerm = ref("");
const isSearchActive = ref(false);
const searchResults = ref([]);

// Feed Management
const handleAddFeed = async ({
  name,
  url,
  fallbackUrl,
  region,
  profile,
  topics,
}) => {
  const feed = addFeed(name, url, fallbackUrl, region, profile, topics);
  showAddModal.value = false;
  await loadFeedContent(feed);
};

const handleUpdateFeed = async ({
  id,
  name,
  url,
  fallbackUrl,
  region,
  profile,
  topics,
}) => {
  const feed = updateFeed(id, name, url, fallbackUrl, region, profile, topics);
  showEditModal.value = false;
  if (feed) {
    await loadFeedContent(feed);
  }
};

const handleRemoveFeed = (feedId) => {
  if (confirm("Möchtest du diesen Feed wirklich löschen?")) {
    removeFeed(feedId);
  }
};

const openEditModal = (feedId) => {
  const feed = getFeed(feedId);
  if (feed) {
    editingFeed.value = { ...feed };
    showEditModal.value = true;
  }
};

const scrollToFeed = (feedId) => {
  mobileMenuOpen.value = false;
  const feed = getFeed(feedId);
  if (feed && !feed.active) {
    toggleFeedActive(feedId);
    setTimeout(() => {
      const element = document.getElementById(`feed-${feedId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  } else {
    const element = document.getElementById(`feed-${feedId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
};

const handleRefreshAll = async () => {
  isRefreshing.value = true;
  await refreshAllFeeds();
  if (isSearchActive.value) {
    performSearch();
  }
  isRefreshing.value = false;
};

const handleImportRecommended = async () => {
  importMessage.value = "";
  const createdFeeds = importRecommendedFeeds();
  if (createdFeeds.length === 0) {
    importMessage.value = "Alle Vorschlags-Feeds sind bereits vorhanden.";
    return;
  }

  isImportingFeeds.value = true;
  try {
    await Promise.all(createdFeeds.map((feed) => loadFeedContent(feed)));
    importMessage.value = `${createdFeeds.length} Vorschlags-Feeds wurden hinzugefuegt.`;
  } catch (error) {
    console.error(
      "Vorschlags-Feeds konnten nicht komplett importiert werden",
      error,
    );
    importMessage.value =
      "Import gestartet, aber nicht alle Feeds konnten geladen werden.";
  } finally {
    isImportingFeeds.value = false;
  }
};

// Drag & Drop
const startDrag = (feedId, event) => {
  draggedFeedId.value = feedId;
  event.dataTransfer.effectAllowed = "move";
};

const endDrag = () => {
  draggedFeedId.value = null;
  dragOverFeedId.value = null;
};

const dropFeed = (targetFeedId) => {
  if (!draggedFeedId.value || draggedFeedId.value === targetFeedId) {
    dragOverFeedId.value = null;
    return;
  }

  const fromIndex = feeds.value.findIndex(
    (feed) => feed.id === draggedFeedId.value,
  );
  const toIndex = feeds.value.findIndex((feed) => feed.id === targetFeedId);

  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    reorderFeeds(fromIndex, toIndex);
  }

  dragOverFeedId.value = null;
};

// Search
const handleSearchInput = () => {
  if (searchTerm.value.trim().length === 0 && isSearchActive.value) {
    clearSearch();
  }
};

const performSearch = () => {
  if (searchTerm.value.trim().length < 2) {
    alert("Bitte mindestens 2 Zeichen eingeben");
    return;
  }

  const searchLower = searchTerm.value.toLowerCase();
  const allowedFeedIds = new Set(filteredFeeds.value.map((feed) => feed.id));
  searchResults.value = allArticles.value.filter((article) => {
    if (!allowedFeedIds.has(article.feedId)) {
      return false;
    }
    if (
      selectedArticleCategory.value !== "all" &&
      !(
        Array.isArray(article.categories) &&
        article.categories.includes(selectedArticleCategory.value)
      )
    ) {
      return false;
    }
    const titleMatch = article.title.toLowerCase().includes(searchLower);
    const descMatch = article.description.toLowerCase().includes(searchLower);
    return titleMatch || descMatch;
  });

  isSearchActive.value = true;
};

const clearSearch = () => {
  searchTerm.value = "";
  isSearchActive.value = false;
  searchResults.value = [];
};

// Lifecycle
onMounted(() => {
  loadFeeds();
  feeds.value.forEach((feed) => {
    if (feed && feed.id && feed.active) {
      loadFeedContent(feed);
    }
  });
});
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
}
</style>
