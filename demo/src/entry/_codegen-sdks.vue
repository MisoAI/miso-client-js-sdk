<script setup>
import { computed } from 'vue';

const props = defineProps({
  sdks: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select']);

const selectedSdk = computed(() => props.sdks.find(sdk => sdk.selected));

const handleSelection = (sdk) => {
  emit('select', sdk);
};
</script>

<style scoped>
.miso-codegen-sdks__description {
  margin: 0.5rem 0 0;
  font-size: 0.9em;
  color: #666;
}
</style>

<template>
  <div class="miso-codegen-sdks">
    <h3>SDK Setup</h3>
    <div class="btn-group btn-group-sm" role="group">
      <button
        v-for="sdk in sdks"
        :key="sdk.slug"
        type="button"
        class="btn"
        :class="sdk.selected ? 'btn-primary' : 'btn-outline-secondary'"
        @click="handleSelection(sdk.slug)"
      >
        {{ sdk.name }}
      </button>
    </div>
    <p v-if="selectedSdk?.description" class="miso-codegen-sdks__description">
      {{ selectedSdk.description }}
    </p>
  </div>
</template>
