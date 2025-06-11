<script setup>
import { reactive, onMounted, onUnmounted } from 'vue';
import { toVueUpdateHandler } from './_codegen-model.js';
import { deepClone } from './_codegen-utils.js';
import CodegenSnippet from './_codegen-snippet.vue';
import CodegenPresets from './_codegen-presets.vue';
import CodegenFeatures from './_codegen-features.vue';

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});

const state = reactive(deepClone(props.model.state));

let unsubscribe;
onMounted(() => {
  unsubscribe = props.model.subscribe(toVueUpdateHandler(state));
});
onUnmounted(() => {
  unsubscribe && unsubscribe();
  unsubscribe = undefined;
});

const handlePresetSelection = (preset) => {
  props.model.preset = preset;
};

const handleFeatureSelection = (key, value) => {
  props.model.set(key, value);
};
</script>

<template>
  <div class="miso-codegen">
    <div class="miso-codegen__options">
      <CodegenPresets
        :presets="state.presets"
        @select="handlePresetSelection"
      />
      <hr>
      <CodegenFeatures
        :features="state.features"
        @select="handleFeatureSelection"
      />
    </div>
    <div class="miso-codegen__code">
      <div v-for="item in state.code.items" :key="item.name" class="codegen-snippet-wrapper">
        <CodegenSnippet :item="item" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.miso-codegen {
  display: grid;
  grid-template-columns: 1fr 2fr;
}
.miso-codegen__options,
.miso-codegen__code {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.miso-codegen__code {
  gap: 1rem;
}
</style>
