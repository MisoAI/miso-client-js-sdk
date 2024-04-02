import { DemoPlugin } from '../plugin';

const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use(DemoPlugin);
});
