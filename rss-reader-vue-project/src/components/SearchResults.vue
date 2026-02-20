<template>
  <div class="feeds-grid">
    <div class="search-results-container">
      <div class="search-results-header">
        <div class="search-results-title">🔍 Suchergebnisse für "{{ searchTerm }}"</div>
        <div class="search-results-count">
          {{ searchResults.length }} {{ searchResults.length === 1 ? 'Artikel' : 'Artikel' }} gefunden
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
            <a :href="article.link" target="_blank" rel="noopener noreferrer" v-html="highlightSearchTerm(article.title)"></a>
          </div>
          <div v-if="article.pubDate" class="article-meta">
            {{ formatDate(article.pubDate) }}
          </div>
          <div v-if="article.description" class="article-description" v-html="highlightSearchTerm(article.description)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  searchTerm: String,
  searchResults: Array,
  formatDate: Function
})

const highlightSearchTerm = (text) => {
  if (!props.searchTerm) return text
  const regex = new RegExp(`(${escapeRegex(props.searchTerm)})`, 'gi')
  return text.replace(regex, '<span class="search-highlight">$1</span>')
}

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>
