<template>
  <div class="modal" :class="{ active: show }" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>RSS Feed bearbeiten</h2>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="editFeedName">Feed Name</label>
          <input
            type="text"
            id="editFeedName"
            v-model="formData.name"
            placeholder="z.B. Tagesschau"
            required
          />
        </div>
        <div class="form-group">
          <label for="editFeedUrl">Feed URL (primär)</label>
          <input
            type="url"
            id="editFeedUrl"
            v-model="formData.url"
            placeholder="https://example.com/rss"
            required
          />
        </div>
        <div class="form-group">
          <label for="editFeedFallbackUrl">Fallback URL (optional)</label>
          <input
            type="url"
            id="editFeedFallbackUrl"
            v-model="formData.fallbackUrl"
            placeholder="https://example.com/rss-alternate"
          />
        </div>
        <div class="form-group">
          <label for="editFeedRegion">Region</label>
          <select id="editFeedRegion" v-model="formData.region">
            <option value="de">Deutschland</option>
            <option value="intl">International</option>
          </select>
        </div>
        <div class="form-group">
          <label for="editFeedProfile">Profil</label>
          <select id="editFeedProfile" v-model="formData.profile">
            <option value="mainstream">Mainstream</option>
            <option value="alternative">Alternativ</option>
          </select>
        </div>
        <div class="form-group">
          <label>Themen</label>
          <div class="checkbox-row">
            <label class="checkbox-label">
              <input
                type="checkbox"
                value="politics"
                v-model="formData.topics"
              />
              Politisch
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                value="general"
                v-model="formData.topics"
              />
              Allgemein
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="secondary">
            Abbrechen
          </button>
          <button type="submit">Speichern</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  feed: Object,
});

const emit = defineEmits(["close", "update"]);

const formData = ref({
  id: null,
  name: "",
  url: "",
  fallbackUrl: "",
  region: "de",
  profile: "mainstream",
  topics: ["general"],
});

const handleSubmit = () => {
  if (
    !Array.isArray(formData.value.topics) ||
    formData.value.topics.length === 0
  ) {
    formData.value.topics = ["general"];
  }
  emit("update", { ...formData.value });
};

watch(
  () => props.feed,
  (newFeed) => {
    if (newFeed) {
      formData.value = {
        ...newFeed,
        region: newFeed.region || "de",
        profile: newFeed.profile || "mainstream",
        topics:
          Array.isArray(newFeed.topics) && newFeed.topics.length > 0
            ? [...newFeed.topics]
            : ["general"],
      };
    }
  },
  { immediate: true },
);
</script>
