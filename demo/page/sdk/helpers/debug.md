---
---

<script>
(window.misodev || (window.misodev = [])).push(() => {
  window.MisoClient.plugins.use('std:debug', {
    console: {
      background: '#bb334c',
    },
  });
});
(window.misocmd || (window.misocmd = [])).push(() => {
  window.MisoClient.debug('manual', 'my-event-name', 'my-title', 1, 2, 3);
});
</script>
