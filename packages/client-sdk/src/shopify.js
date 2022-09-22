import MisoClient from '.';
import { ShopifyPlugin } from '@miso.ai/client-sdk-shopify';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.use(ShopifyPlugin);
MisoClient.plugins.use(UiPlugin);

const miso = window.miso = new MisoClient({ readConfigFromScriptUrl: true });
miso.shopify.auto();
