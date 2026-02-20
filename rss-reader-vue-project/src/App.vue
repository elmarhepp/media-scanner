<template>
  <div class="app-wrapper">
    <FeedSidebar
      :feeds="feeds"
      :draggedIndex="draggedIndex"
      :dragOverIndex="dragOverIndex"
      @open-add-modal="showAddModal = true"
      @toggle-feed="toggleFeedActive"
      @scroll-to-feed="scrollToFeed"
      @start-drag="startDrag"
      @end-drag="endDrag"
      @drag-over="dragOverIndex = $event"
      @drag-leave="dragOverIndex = null"
      @drop="dropFeed"
    />

    <div class="main-content">
      <div class="container">
        <header>
          <div style="display: flex; align-items: center; gap: 15px;">
            <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
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
              >
              <button v-if="isSearchActive" @click="clearSearch" class="secondary">
                <span>✕</span> Zurücksetzen
              </button>
            </div>
            <button @click="handleRefreshAll" class="secondary" :disabled="isRefreshing">
              <span>🔄</span> {{ isRefreshing ? 'Aktualisiert...' : 'Aktualisieren' }}
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
          <div v-else-if="activeFeedCount === 0" class="empty-state">
            <div class="empty-state-icon">👁️</div>
            <h2>Alle Feeds sind ausgeblendet</h2>
            <p>Aktiviere Feeds in der Sidebar, um sie anzuzeigen.</p>
          </div>
          <template v-else>
            <FeedCard
              v-for="feed in activeFeeds"
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
import { ref, onMounted } from 'vue'
import { useFeedManager } from './composables/useFeedManager'
import FeedSidebar from './components/FeedSidebar.vue'
import FeedCard from './components/FeedCard.vue'
import SearchResults from './components/SearchResults.vue'
import AddFeedModal from './components/AddFeedModal.vue'
import EditFeedModal from './components/EditFeedModal.vue'

const {
  feeds,
  feedArticles,
  feedLoading,
  feedErrors,
  allArticles,
  activeFeeds,
  activeFeedCount,
  loadFeeds,
  addFeed,
  updateFeed,
  removeFeed,
  toggleFeedActive,
  reorderFeeds,
  getFeed,
  loadFeedContent,
  formatDate,
  refreshAllFeeds
} = useFeedManager()

// UI State
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingFeed = ref({})
const mobileMenuOpen = ref(false)
const draggedIndex = ref(null)
const dragOverIndex = ref(null)
const isRefreshing = ref(false)

// Search
const searchTerm = ref('')
const isSearchActive = ref(false)
const searchResults = ref([])

// Feed Management
const handleAddFeed = async ({ name, url, fallbackUrl }) => {
  const feed = addFeed(name, url, fallbackUrl)
  showAddModal.value = false
  await loadFeedContent(feed)
}

const handleUpdateFeed = async ({ id, name, url, fallbackUrl }) => {
  const feed = updateFeed(id, name, url, fallbackUrl)
  showEditModal.value = false
  if (feed) {
    await loadFeedContent(feed)
  }
}

const handleRemoveFeed = (feedId) => {
  if (confirm('Möchtest du diesen Feed wirklich löschen?')) {
    removeFeed(feedId)
  }
}

const openEditModal = (feedId) => {
  const feed = getFeed(feedId)
  if (feed) {
    editingFeed.value = { ...feed }
    showEditModal.value = true
  }
}

const scrollToFeed = (feedId) => {
  const feed = getFeed(feedId)
  if (feed && !feed.active) {
    toggleFeedActive(feedId)
    setTimeout(() => {
      const element = document.getElementById(`feed-${feedId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  } else {
    const element = document.getElementById(`feed-${feedId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const handleRefreshAll = async () => {
  isRefreshing.value = true
  await refreshAllFeeds()
  if (isSearchActive.value) {
    performSearch()
  }
  isRefreshing.value = false
}

// Drag & Drop
const startDrag = (index, event) => {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const endDrag = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

const dropFeed = (index) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    reorderFeeds(draggedIndex.value, index)
  }
  dragOverIndex.value = null
}

// Search
const handleSearchInput = () => {
  if (searchTerm.value.trim().length === 0 && isSearchActive.value) {
    clearSearch()
  }
}

const performSearch = () => {
  if (searchTerm.value.trim().length < 2) {
    alert('Bitte mindestens 2 Zeichen eingeben')
    return
  }

  const searchLower = searchTerm.value.toLowerCase()
  searchResults.value = allArticles.value.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(searchLower)
    const descMatch = article.description.toLowerCase().includes(searchLower)
    return titleMatch || descMatch
  })

  isSearchActive.value = true
}

const clearSearch = () => {
  searchTerm.value = ''
  isSearchActive.value = false
  searchResults.value = []
}

// Lifecycle
onMounted(() => {
  loadFeeds()
  feeds.value.forEach(feed => {
    if (feed && feed.id && feed.active) {
      loadFeedContent(feed)
    }
  })
})
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
}
</style>
