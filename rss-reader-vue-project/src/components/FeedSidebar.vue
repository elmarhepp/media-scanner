<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">📰 Feeds</div>
      <button
        @click="$emit('open-add-modal')"
        style="width: 100%; margin-top: 10px"
      >
        <span>➕</span> Neuer Feed
      </button>
      <button
        @click="$emit('import-recommended')"
        class="secondary"
        style="width: 100%; margin-top: 8px"
      >
        <span>📚</span> Vorschlags-Feeds importieren
      </button>

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

        <div class="filter-label">Profil</div>
        <div class="toggle-group">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedProfile === 'all' }"
            @click="$emit('set-profile', 'all')"
          >
            Alle ({{ profileCounts?.all || 0 }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedProfile === 'mainstream' }"
            @click="$emit('set-profile', 'mainstream')"
          >
            Mainstream ({{ profileCounts?.mainstream || 0 }})
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: selectedProfile === 'alternative' }"
            @click="$emit('set-profile', 'alternative')"
          >
            Alternativ ({{ profileCounts?.alternative || 0 }})
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
      </div>
    </div>

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
          <span class="feed-meta">{{
            feed.profile === "alternative" ? "Alternativ" : "Mainstream"
          }}</span>
        </div>
        <div
          class="toggle-switch"
          :class="{ active: feed.active }"
          @click.stop="$emit('toggle-feed', feed.id)"
        ></div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  feeds: Array,
  selectedRegion: String,
  selectedProfile: String,
  selectedTopic: String,
  regionCounts: Object,
  profileCounts: Object,
  topicCounts: Object,
  draggedFeedId: String,
  dragOverFeedId: String,
});

defineEmits([
  "open-add-modal",
  "import-recommended",
  "set-region",
  "set-profile",
  "set-topic",
  "toggle-feed",
  "scroll-to-feed",
  "start-drag",
  "end-drag",
  "drag-over",
  "drag-leave",
  "drop",
]);
</script>
