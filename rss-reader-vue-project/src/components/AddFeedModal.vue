<template>
  <div class="modal" :class="{ active: show }" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>RSS Feed hinzufügen</h2>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="feedName">Feed Name</label>
          <input
            type="text"
            id="feedName"
            v-model="formData.name"
            placeholder="z.B. Tagesschau"
            required
          />
        </div>
        <div class="form-group">
          <label for="feedUrl">Feed URL (primär)</label>
          <input
            type="url"
            id="feedUrl"
            v-model="formData.url"
            placeholder="https://example.com/rss"
            required
          />
        </div>
        <div class="form-group">
          <label for="feedFallbackUrl">Fallback URL (optional)</label>
          <input
            type="url"
            id="feedFallbackUrl"
            v-model="formData.fallbackUrl"
            placeholder="https://example.com/rss-alternate"
          />
        </div>
        <div class="form-group">
          <label for="feedRegion">Region</label>
          <select id="feedRegion" v-model="formData.region">
            <option value="de">Deutschland</option>
            <option value="intl">International</option>
          </select>
        </div>
        <div class="form-group">
          <label for="feedProfile">Profil</label>
          <select id="feedProfile" v-model="formData.profile">
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
          <button type="submit">Hinzufügen</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "add"]);

const formData = ref({
  name: "",
  url: "",
  fallbackUrl: "",
  region: "de",
  profile: "mainstream",
  topics: ["general"],
});

const handleSubmit = () => {
  if (formData.value.topics.length === 0) {
    formData.value.topics = ["general"];
  }
  emit("add", { ...formData.value });
  formData.value = {
    name: "",
    url: "",
    fallbackUrl: "",
    region: "de",
    profile: "mainstream",
    topics: ["general"],
  };
};

watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      formData.value = {
        name: "",
        url: "",
        fallbackUrl: "",
        region: "de",
        profile: "mainstream",
        topics: ["general"],
      };
    }
  },
);
</script>
