<script setup>
const props = defineProps({
  presets: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select']);

const handleSelection = (preset) => {
  emit('select', preset);
};
</script>

<template>
  <div>
    <h3>Preset</h3>
    <div class="btn-group btn-group-sm" role="group">
      <button
        v-for="preset in presets"
        :key="preset.slug"
        type="button"
        class="btn"
        :class="preset.selected ? 'btn-primary' : 'btn-outline-secondary'"
        @click="handleSelection(preset.slug)"
      >
        {{ preset.name }}
      </button>
    </div>
  </div>
</template>
