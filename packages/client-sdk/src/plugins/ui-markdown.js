import { UiMarkdownPlugin } from '@miso.ai/client-sdk-ui-markdown';

const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.register(UiMarkdownPlugin);
});
