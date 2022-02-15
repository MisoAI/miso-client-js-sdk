const CALATOG = [
  {"product_id":"5ead826f-e3f0-4625-9ba4-73f19150bd7c","title":"Personal Thingamajig","description":"Praesent accumsan venenatis leo eget tempor","original_price":"39","sale_price":"35.95","categories":[["Beauty","Personal"]]},
  {"product_id":"57af7416-fbe4-4cea-b799-723056047f92","title":"Game Whatchamacallit","description":"Cras pharetra iaculis urna porttitor vestibulum","original_price":"160.99","sale_price":"112.99","categories":[["Entertainment","Game"]]},
  {"product_id":"b148efc7-aac4-4819-a6c1-657ef4f789ea","title":"Game Instrument","description":"In accumsan urna nunc, non mattis enim blandit ut","original_price":"195","sale_price":"175.99","categories":[["Entertainment","Game"]]},
  {"product_id":"3b5aecda-15ca-4e4b-9f27-a780aa62470e","title":"Fitness Paraphernalia","description":"Proin dignissim orci urna, eget congue ipsum pharetra sed","original_price":"166","sale_price":"132.95","categories":[["Activity","Fitness"]]},
  {"product_id":"e813ab6e-2280-48d4-8314-bd8f1f425303","title":"Bedding Gadget","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit","original_price":"177.95","sale_price":"141.95","categories":[["Home","Bedding"]]},
  {"product_id":"72a38580-52c6-4e09-baf0-75ef3c6b3e9d","title":"Personal Whatchamacallit","description":"Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.","original_price":"175","sale_price":"105.99","categories":[["Beauty","Personal"]]},
  {"product_id":"4e619a43-19dc-47ff-92d0-60f37f39e702","title":"Computer Gadget","description":"Mauris justo ligula, gravida eget posuere eget, ultrices ut augue","original_price":"62","sale_price":"37","categories":[["Electronics","Computer"]]},
  {"product_id":"6f599091-dc65-4cdc-a7b3-4ff2712d9e76","title":"Gardening Kit","description":"Quisque et tortor in justo venenatis facilisis a ac quam","original_price":"72.99","sale_price":"64.95","categories":[["Home","Gardening"]]},
  {"product_id":"9f6e6ccc-98d5-4b21-a96d-d714bd5a27c2","title":"Vitamin Component","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit","original_price":"24","sale_price":"16.95","categories":[["Health","Vitamin"]]},
  {"product_id":"b50d0d35-66b6-4cd6-8fbe-abcb9e4e269c","title":"Computer Gear","description":"Quisque odio ante, faucibus id sem a, vehicula elementum magna","original_price":"121.95","sale_price":"108","categories":[["Electronics","Computer"]]},
];

function imgurl(product) {
  return `https://picsum.photos/id/${parseInt(product.product_id.substring(0, 2), 16)}/200`;
}

export default function hydrate(store) {
  store.catalog.addm(CALATOG.map(product => Object.assign(product, {cover_image: imgurl(product)})));
  return store;
}
