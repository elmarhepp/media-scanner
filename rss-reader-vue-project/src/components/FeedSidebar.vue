<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">📰 Feeds</div>
      <div class="sidebar-stats">
        <span class="sidebar-stat"
          >Sichtbar: {{ sidebarStats?.visible || 0 }}</span
        >
        <span class="sidebar-stat">Aktiv: {{ sidebarStats?.active || 0 }}</span>
      </div>

      <div class="sidebar-tabs" role="tablist" aria-label="Sidebar Navigation">
        <button
          type="button"
          class="sidebar-tab-btn"
          :class="{ active: activeTab === 'filters' }"
          @click="setActiveTab('filters')"
        >
          Filter
        </button>
        <button
          type="button"
          class="sidebar-tab-btn"
          :class="{ active: activeTab === 'feeds' }"
          @click="setActiveTab('feeds')"
        >
          Feeds
          <span class="sidebar-tab-badge">{{ feedTabBadge }}</span>
        </button>
        <button
          type="button"
          class="sidebar-tab-btn"
          :class="{ active: activeTab === 'manage' }"
          @click="setActiveTab('manage')"
        >
          Verwalten
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'filters'" class="sidebar-pane">
      <div class="sidebar-search">
        <input
          type="text"
          :value="feedQuery"
          placeholder="Feeds filtern..."
          @input="$emit('set-feed-query', $event.target.value)"
        />
      </div>

      <div class="sidebar-filters">
        <div class="filter-label">Region</div>
        <div class="toggle-group region-tabs">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedRegion === 'de' }"
            @click="$emit('set-region', 'de')"
          >
            Deutschland ({{ regionCounts?.de || 0 }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedRegion === 'intl' }"
            @click="$emit('set-region', 'intl')"
          >
            International ({{ regionCounts?.intl || 0 }})
          </button>
        </div>

        <div class="filter-label">Thema</div>
        <div class="toggle-group">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedTopic === 'all' }"
            @click="$emit('set-topic', 'all')"
          >
            Alle ({{ topicCounts?.all || 0 }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedTopic === 'politics' }"
            @click="$emit('set-topic', 'politics')"
          >
            Politisch ({{ topicCounts?.politics || 0 }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedTopic === 'general' }"
            @click="$emit('set-topic', 'general')"
          >
            Allgemein ({{ topicCounts?.general || 0 }})
          </button>
        </div>

        <div class="filter-label">Erkannte Kategorien</div>
        <div class="toggle-group">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedArticleCategory === 'all' }"
            @click="$emit('set-article-category', 'all')"
          >
            Alle Artikel ({{ articleCategoryCounts?.all || 0 }})
          </button>
          <button
            v-for="entry in sortedCategories"
            :key="entry.name"
            type="button"
            class="filter-btn"
            :class="{ active: selectedArticleCategory === entry.name }"
            @click="$emit('set-article-category', entry.name)"
          >
            {{ formatCategory(entry.name) }} ({{ entry.count }})
          </button>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="filter-label">Hauefigste Links</div>
        <ul v-if="topSourceLinks.length > 0" class="top-links-list">
          <li
            v-for="item in topSourceLinks"
            :key="item.domain"
            class="top-link-item"
          >
            <a :href="item.url" target="_blank" rel="noopener noreferrer">
              {{ item.domain }}
            </a>
            <span class="top-link-count">{{ item.count }}</span>
          </li>
        </ul>
        <div v-else class="sidebar-empty">
          Noch keine Link-Statistik verfuegbar
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'manage'" class="sidebar-pane">
      <button @click="$emit('open-add-modal')" class="sidebar-action-btn">
        <span>➕</span> Neuer Feed
      </button>
      <button
        @click="$emit('import-recommended')"
        class="secondary sidebar-action-btn"
      >
        <span>📚</span> Vorschlags-Feeds importieren
      </button>
      <div class="sidebar-empty">
        Import fuegt nur noch nicht vorhandene Feed-URLs hinzu.
      </div>
    </div>

    <div v-else class="sidebar-pane">
      <div v-if="feeds.length === 0" class="sidebar-empty">
        Keine Feeds in dieser Gruppe
      </div>
      <ul class="sidebar-feed-list">
        <li
          v-for="feed in feeds"
          :key="feed.id"
          class="sidebar-feed-item"
          :class="{
            disabled: !feed.active,
            dragging: draggedFeedId === feed.id,
            'drag-over': dragOverFeedId === feed.id,
          }"
          draggable="true"
          @dragstart="$emit('start-drag', feed.id, $event)"
          @dragend="$emit('end-drag')"
          @dragover.prevent="$emit('drag-over', feed.id)"
          @dragleave="$emit('drag-leave')"
          @drop.prevent="$emit('drop', feed.id)"
        >
          <span class="drag-handle" title="Ziehen zum Sortieren">☰</span>
          <div
            class="feed-name-clickable"
            @click="$emit('scroll-to-feed', feed.id)"
            :title="feed.name"
          >
            {{ feed.name }}
          </div>
          <div
            class="toggle-switch"
            :class="{ active: feed.active }"
            @click.stop="$emit('toggle-feed', feed.id)"
          ></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const TAB_STORAGE_KEY = "rss-sidebar-active-tab";

const props = defineProps({
  feeds: Array,
  feedQuery: String,
  selectedRegion: String,
  selectedTopic: String,
  selectedArticleCategory: String,
  regionCounts: Object,
  topicCounts: Object,
  articleCategoryCounts: Object,
  topSourceLinks: {
    type: Array,
    default: () => [],
  },
  sidebarStats: Object,
  draggedFeedId: String,
  dragOverFeedId: String,
});

const activeTab = ref(localStorage.getItem(TAB_STORAGE_KEY) || "filters");

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

watch(activeTab, (value) => {
  localStorage.setItem(TAB_STORAGE_KEY, value);
});

const feedTabBadge = computed(
  () =>
    `${props.sidebarStats?.visible || 0}/${props.sidebarStats?.active || 0}`,
);

const sortedCategories = computed(() => {
  const counts = props.articleCategoryCounts || {};
  return Object.entries(counts)
    .filter(([name]) => name !== "all")
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
});

const formatCategory = (name = "") => {
  if (!name) return "";
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

defineEmits([
  "open-add-modal",
  "import-recommended",
  "set-region",
  "set-topic",
  "set-feed-query",
  "set-article-category",
  "toggle-feed",
  "scroll-to-feed",
  "start-drag",
  "end-drag",
  "drag-over",
  "drag-leave",
  "drop",
]);
</script>
