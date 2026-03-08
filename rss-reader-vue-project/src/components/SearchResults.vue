<template>
  <div class="feeds-grid">
    <div class="search-results-container">
      <div class="search-results-header">
        <div class="search-results-title">
          🔍 Suchergebnisse für "{{ searchTerm }}"
        </div>
        <div class="search-results-count">
          {{ searchResults.length }}
          {{ searchResults.length === 1 ? "Artikel" : "Artikel" }} gefunden
        </div>
      </div>
      <div v-if="searchResults.length === 0" class="loading">
        Keine Artikel gefunden
      </div>
      <div v-else class="search-results-list">
        <div
          v-for="article in searchResults"
          :key="`${article.feedId}-${article.title}`"
          class="search-result-item"
        >
          <div class="search-result-feed">{{ article.feedName }}</div>
          <div class="article-title">
            <a :href="article.link" target="_blank" rel="noopener noreferrer">
              <template
                v-for="(part, idx) in highlightSearchTerm(article.title)"
                :key="idx"
              >
                <span v-if="part.match" class="search-highlight">{{
                  part.text
                }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </a>
          </div>
          <div v-if="article.pubDate" class="article-meta">
            {{ formatDate(article.pubDate) }}
          </div>
          <div v-if="article.description" class="article-description">
            <template
              v-for="(part, idx) in highlightSearchTerm(article.description)"
              :key="idx"
            >
              <span v-if="part.match" class="search-highlight">{{
                part.text
              }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  searchTerm: String,
  searchResults: Array,
  formatDate: Function,
});

const highlightSearchTerm = (text) => {
  const safeText = text || "";
  const term = (props.searchTerm || "").trim();

  if (!term) {
    return [{ text: safeText, match: false }];
  }

  const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
  return safeText
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === term.toLowerCase(),
    }));
};

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
</script>
