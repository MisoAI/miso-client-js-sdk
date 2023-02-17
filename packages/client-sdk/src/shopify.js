import MisoClient from '.';
import { ShopifyPlugin } from '@miso.ai/client-sdk-shopify';

MisoClient.plugins.use(ShopifyPlugin);
MisoClient.plugins.use('std:ui');

const miso = window.miso = new MisoClient({ readConfigFromScriptUrl: true });
miso.shopify.auto();
