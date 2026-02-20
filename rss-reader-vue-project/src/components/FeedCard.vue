<template>
  <div class="feed-card-wrapper">
    <div class="feed-card" :id="`feed-${feed.id}`">
      <div class="feed-header">
        <div>
          <div class="feed-title">{{ feed.name }}</div>
          <div v-if="feed.fallbackUrl" class="feed-url-info">Mit Fallback-URL</div>
        </div>
        <div class="feed-actions">
          <button class="edit" @click="$emit('edit', feed.id)">✎</button>
          <button class="danger" @click="$emit('remove', feed.id)">✕</button>
        </div>
      </div>
      <div class="feed-content">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade Artikel...
        </div>
        <div v-else-if="error" class="error">
          <strong>Fehler beim Laden</strong><br>
          {{ error }}<br>
          <small style="margin-top: 8px; display: block;">
            Überprüfe die Feed-URLs oder versuche es später erneut.
          </small>
        </div>
        <div v-else-if="articles && articles.length > 0">
          <div
            v-for="(article, index) in articles"
            :key="index"
            class="article"
          >
            <div class="article-title">
              <a :href="article.link" target="_blank" rel="noopener noreferrer">
                {{ article.title }}
              </a>
            </div>
            <div v-if="article.pubDate" class="article-meta">
              {{ formatDate(article.pubDate) }}
            </div>
            <div v-if="article.description" class="article-description">
              {{ article.description }}
            </div>
          </div>
        </div>
        <div v-else class="loading">Keine Artikel gefunden</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  feed: Object,
  articles: Array,
  loading: Boolean,
  error: String,
  formatDate: Function
})

defineEmits(['edit', 'remove'])
</script>
