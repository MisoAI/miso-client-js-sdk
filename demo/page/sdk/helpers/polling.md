---
dependency: 'commons'
---

<section style="padding: 1rem;">
  <button id="update" type="button" class="btn btn-primary">Update</button>
</section>

<script>
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const { ValueBuffer } = window.commons;
const buffer = new ValueBuffer();
(async () => {
  for await (const value of buffer) {
    console.log(`Received: ${value}`);
    await delay(1000);
    console.log(`Processed: ${value}`);
  }
  console.log('Done');
})();
let i = 0;
document.querySelector('#update').addEventListener('click', async () => {
  console.log(`Updated: ${i}`);
  buffer.update(i++);
});
</script>
