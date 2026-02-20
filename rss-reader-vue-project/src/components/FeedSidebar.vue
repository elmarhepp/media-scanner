<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">📰 Feeds</div>
      <button @click="$emit('open-add-modal')" style="width: 100%; margin-top: 10px;">
        <span>➕</span> Neuer Feed
      </button>
    </div>
    <ul class="sidebar-feed-list">
      <li
        v-for="(feed, index) in feeds"
        :key="feed.id"
        class="sidebar-feed-item"
        :class="{
          disabled: !feed.active,
          dragging: draggedIndex === index,
          'drag-over': dragOverIndex === index
        }"
        draggable="true"
        @dragstart="$emit('start-drag', index, $event)"
        @dragend="$emit('end-drag')"
        @dragover.prevent="$emit('drag-over', index)"
        @dragleave="$emit('drag-leave')"
        @drop.prevent="$emit('drop', index)"
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
</template>

<script setup>
defineProps({
  feeds: Array,
  draggedIndex: Number,
  dragOverIndex: Number
})

defineEmits([
  'open-add-modal',
  'toggle-feed',
  'scroll-to-feed',
  'start-drag',
  'end-drag',
  'drag-over',
  'drag-leave',
  'drop'
])
</script>
