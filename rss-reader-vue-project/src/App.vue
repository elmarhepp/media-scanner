<template>
  <div class="app-wrapper">
    <FeedSidebar
      :class="{ 'mobile-open': mobileMenuOpen }"
      :feeds="filteredFeeds"
      :selectedRegion="selectedRegion"
      :selectedProfile="selectedProfile"
      :selectedTopic="selectedTopic"
      :regionCounts="regionCounts"
      :profileCounts="profileCounts"
      :topicCounts="topicCounts"
      :draggedFeedId="draggedFeedId"
      :dragOverFeedId="dragOverFeedId"
      @open-add-modal="showAddModal = true"
      @import-recommended="handleImportRecommended"
      @set-region="selectedRegion = $event"
      @set-profile="selectedProfile = $event"
      @set-topic="selectedTopic = $event"
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
            <p>Ändere Region, Profil oder Themen-Filter in der Sidebar.</p>
          </div>
          <div v-else-if="filteredActiveFeeds.length === 0" class="empty-state">
            <div class="empty-state-icon">👁️</div>
            <h2>Alle gefilterten Feeds sind ausgeblendet</h2>
            <p>Aktiviere Feeds in der Sidebar, um sie anzuzeigen.</p>
          </div>
          <template v-else>
            <FeedCard
              v-for="feed in filteredActiveFeeds"
              :key="feed.id"
              :feed="feed"
              :articles="feedArticles[feed.id]"
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

// Navigation / Grouping
const selectedRegion = ref("de");
const selectedProfile = ref("all");
const selectedTopic = ref("all");

const filteredFeeds = computed(() =>
  feeds.value.filter((feed) => {
    if (!feed) return false;
    const regionMatch = feed.region === selectedRegion.value;
    const profileMatch =
      selectedProfile.value === "all" || feed.profile === selectedProfile.value;
    const topicMatch =
      selectedTopic.value === "all" ||
      (Array.isArray(feed.topics) && feed.topics.includes(selectedTopic.value));
    return regionMatch && profileMatch && topicMatch;
  }),
);

const filteredActiveFeeds = computed(() =>
  filteredFeeds.value.filter((feed) => feed.active),
);

const regionCounts = computed(() => ({
  de: feeds.value.filter((feed) => feed?.region === "de").length,
  intl: feeds.value.filter((feed) => feed?.region === "intl").length,
}));

const profileCounts = computed(() => {
  const inRegion = feeds.value.filter(
    (feed) => feed?.region === selectedRegion.value,
  );
  return {
    all: inRegion.length,
    mainstream: inRegion.filter((feed) => feed?.profile === "mainstream")
      .length,
    alternative: inRegion.filter((feed) => feed?.profile === "alternative")
      .length,
  };
});

const topicCounts = computed(() => {
  const base = feeds.value.filter((feed) => {
    if (feed?.region !== selectedRegion.value) return false;
    if (
      selectedProfile.value !== "all" &&
      feed?.profile !== selectedProfile.value
    ) {
      return false;
    }
    return true;
  });

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
  const createdFeeds = importRecommendedFeeds();
  if (createdFeeds.length === 0) {
    alert("Alle Vorschlags-Feeds sind bereits vorhanden.");
    return;
  }

  isRefreshing.value = true;
  try {
    await Promise.all(createdFeeds.map((feed) => loadFeedContent(feed)));
  } finally {
    isRefreshing.value = false;
  }

  alert(`${createdFeeds.length} Vorschlags-Feeds wurden hinzugefuegt.`);
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
