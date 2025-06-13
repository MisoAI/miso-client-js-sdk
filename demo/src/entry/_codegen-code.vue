<script setup>
import CodegenSnippet from './_codegen-snippet.vue';

defineProps({
  code: {
    type: Object,
    required: true,
    validator: (value) => {
      return Array.isArray(value.items) && 
             value.items.every(item => item && typeof item === 'object' && 'name' in item && 'content' in item);
    }
  }
});
</script>

<template>
  <div class="miso-codegen-code">
    <CodegenSnippet v-for="item in code.items" :key="item.name" :item="item" />
  </div>
</template>

<style scoped>
.miso-codegen-code {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
