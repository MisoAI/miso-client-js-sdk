<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.name && value.type && value.content !== undefined;
    }
  }
});

const codeElement = ref(null);
const showCopied = ref(false);
let resetButtonTimeout;

const copyToClipboard = async () => {
  if (!props.item.content) {
    return;
  }
  try {
    await navigator.clipboard.writeText(props.item.content);
    showCopied.value = true;
    
    if (resetButtonTimeout) {
      clearTimeout(resetButtonTimeout);
      resetButtonTimeout = undefined;
    }
    resetButtonTimeout = setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

function highlight() {
  if (window.Prism && codeElement.value) {
    window.Prism.highlightElement(codeElement.value);
  }
}

// when content is updated, call highlight
watch(() => props.item.content, () => {
  setTimeout(highlight);
});

onMounted(() => {
  highlight();
});

onBeforeUnmount(() => {
  if (resetButtonTimeout) {
    clearTimeout(resetButtonTimeout);
  }
});
</script>

<template>
  <div class="miso-codegen-snippet" :data-lang="item.type">
    <div class="miso-codegen-snippet___header">
      <div class="miso-codegen-snippet___header-title">{{ item.name }}</div>
    </div>
    <div class="miso-codegen-snippet___body">
      <pre><code ref="codeElement" :class="item.type ? `language-${item.type}` : ''">{{ item.content }}</code></pre>
      <button 
        class="btn btn-sm btn-outline-secondary copy-button" 
        @click="copyToClipboard"
        :disabled="!item.content" 
        :title="showCopied ? 'Copied!' : 'Copy to clipboard'"
      >
        <i class="bi" :class="showCopied ? 'bi-check' : 'bi-clipboard'"></i>
        {{ showCopied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.miso-codegen-snippet {
  position: relative;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  overflow: hidden;
}
.miso-codegen-snippet___header {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
.miso-codegen-snippet___body {
  position: relative;
}
.miso-codegen-snippet___body pre {
  margin: 0;
  border-radius: 0;
  border: none;
  background-color: #fff;
  font-size: 0.85em;
}
.miso-codegen-snippet___body .copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.miso-codegen-snippet___body:hover .copy-button {
  opacity: 1;
}
.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
