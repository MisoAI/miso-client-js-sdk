<script setup>
const props = defineProps({
  features: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select']);

const handleFeatureSelection = (key, value) => {
  emit('select', key, value);
};
</script>

<template>
  <div v-if="features" class="miso-codegen-features">
    <div v-for="feature in features" :key="feature.slug" class="miso-codegen-feature">
      <h5>{{ feature.name }}</h5>
      <p v-if="feature.description" class="miso-codegen-feature__description">{{ feature.description }}</p>
      <div class="btn-group btn-group-sm" role="group">
        <button
          v-for="option in feature.options"
          :key="option.name"
          type="button"
          class="btn"
          :class="option.selected ? 'btn-primary' : 'btn-outline-secondary'"
          @click="handleFeatureSelection(feature.slug, option.value)"
        >
          {{ option.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.miso-codegen-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.miso-codegen-feature h5 {
  margin-bottom: 0.5rem;
}
.miso-codegen-feature__description {
  font-size: 0.85em;
}
</style>
