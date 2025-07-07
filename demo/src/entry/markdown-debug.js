import { Controller, presetMiso } from '@miso.ai/progressive-markdown';

function createOnDebug(start = performance.now()) {
  return function({ summary, timestamp, elapsed, ref, operation, conflict }) {
    console.log('<progressive-markdown>', `[${formatTimeInSeconds(timestamp - start)}](${formatTimeInMilliseconds(elapsed[0])}, ${formatTimeInMilliseconds(elapsed[1])})`, summary, `${operation}`, ref, conflict);
  };
}

function formatTimeInSeconds(t) {
  return `${Math.floor(t) / 1000}s`;
}

function formatTimeInMilliseconds(t) {
  return `${Math.floor(t * 100) / 100}ms`;
}

const TEXT = `
### **Matrix Flattening Methods Comparison**
| Method               | Use Case                          | Pros                                      | Cons                                      | Source |
|----------------------|-----------------------------------|-------------------------------------------|-------------------------------------------|--------|
| **\`numpy.ndarray.flatten()\`** | General-purpose flattening (returns copy) | *Preserves original array; predictable output* | *Slower (memory copy); not memory-efficient* | *[Python for Data Analysis, 3rd Edition](https://learning.oreilly.com/library/view/-/9781098104023/app01.html)* [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html) |
| **\`numpy.ndarray.ravel()\`**   | Memory-efficient views (no copy)  | *No memory overhead; modifies original if possible* | *May create views (unpredictable with strides)* | *[Python for Data Analysis, 3rd Edition](https://learning.oreilly.com/library/view/-/9781098104023/app01.html)* [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html)[[2]](https://learning.oreilly.com/library/view/-/9781789537864/87e215c8-84c8-4d15-a5f4-b3f1fae408f0.xhtml) |
| **List Comprehension**        | Small matrices (Python lists)     | *Python-native; no dependencies*          | *Slow for large arrays; no vectorization* | *[Python for Data Analysis, 3rd Edition](https://learning.oreilly.com/library/view/-/9781098104023/ch03.html)* [[1]](https://learning.oreilly.com/library/view/-/9781098104023/ch03.html) |
| **\`itertools.chain\`**         | Irregular nested lists            | *Lazy evaluation; memory-efficient*       | *Requires conversion to list for NumPy*   | *[Fluent Python, 2nd Edition](https://learning.oreilly.com/library/view/-/9781492056348/ch17.html)* [[3]](https://learning.oreilly.com/library/view/-/9781492056348/ch17.html)[[4]](https://learning.oreilly.com/library/view/-/9781617296239/kindle_split_011.html) |
| **\`numpy.concatenate()\`**     | Stacked arrays (e.g., CSR matrices) | *Optimized for pre-allocated blocks*      | *Manual axis handling*                    | *[Python Data Science Essentials](https://learning.oreilly.com/library/view/-/9781789537864/87e215c8-84c8-4d15-a5f4-b3f1fae408f0.xhtml)* [[2]](https://learning.oreilly.com/library/view/-/9781789537864/87e215c8-84c8-4d15-a5f4-b3f1fae408f0.xhtml) |

---

### **Key Insights**
1. **NumPy-Specific Optimizations**: 
`;

const answerElement = document.getElementById('answer');

const controller = new Controller(answerElement, {
  presets: [presetMiso],
  speed: 1000,
  onDebug: createOnDebug(),
});

(async () => {
  controller.clear();
  const length = TEXT.length;
  const start = performance.now();
  let intervalId;
  intervalId = setInterval(() => {
    const t = performance.now();
    const len = t - start;
    const finished = len >= length;
    controller.update({ answer: TEXT.slice(0, len), answer_stage: 'answer', finished });
    finished && intervalId && clearInterval(intervalId);
  }, 20);
  //await new Promise(resolve => setTimeout(resolve, 1000));
  //controller.update({ answer: TEXT, answer_stage: 'answer', finished: false });
})();
