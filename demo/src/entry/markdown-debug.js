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
| Method | Use Case | Performance | Memory | Libraries | Code Example |
|--------|----------|-------------|--------|-----------|--------------|
| **NumPy ravel()** | Views for read-only ops | O(1) | Minimal (view) | NumPy | \`matrix.ravel()\` [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html) |
| **NumPy flatten()** | Safe copies | O(n) | High (copy) | NumPy | \`matrix.flatten()\` [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html) |
| **List Comprehension** | Small matrices | O(n) | Medium | Built-in | \`[x for row in matrix for x in row]\` [[1]](https://learning.oreilly.com/library/view/-/9781098104023/ch03.html) |
| **itertools.chain** | Large sparse data | O(n) | Low | Standard Library | \`list(itertools.chain(*matrix))\` [[2]](https://learning.oreilly.com/library/view/-/9781492056348/ch17.html)[[3]](https://learning.oreilly.com/library/view/-/9781803232577/Text/Chapter_04.xhtml) |
| **np.concatenate()** | Stacked arrays | O(n) | Medium | NumPy | \`np.concatenate(matrix)\` [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html) |

Key insights from numerical computing experts:

> *"The flatten method behaves like ravel except it always returns a copy of the data"* - Wes McKinney in *[Python for Data Analysis, 3rd Edition](https://learning.oreilly.com/library/view/-/9781098104023/app01.html)*. This distinction is crucial for memory management in large matrices [[1]](https://learning.oreilly.com/library/view/-/9781098104023/app01.html).

For numerical work, NumPy's optimized methods dominate. As Burkhard Meier demonstrates in *[Python GUI Programming Cookbook](https://learning.oreilly.com/library/view/-/9781785283758/ch05s09.html)*:
\`\`\`python
import numpy as np
matrix = np.array([[1,2], [3,4]])
flattened_view = matrix.ravel()  # No memory copy
flattened_copy = matrix.flatten()  # New memory allocation
\`\`\`

### Special Cases

1. **CSR/CSC Formats** (SciPy sparse matrices):
\`\`\`python
matrix.tocsr().data  # Returns flat nonzero elements
\`\`\`

2. **Memory-Mapped Arrays**:
\`\`\`python
np.memmap('large_array.dat').ravel()  # Handles out-of-core
\`\`\`

Would you like to explore [benchmark results for different matrix sizes](?q=What%20are%20the%20performance%20benchmarks%20for%20flattening%2010K%20x%2010K%20matrices%3F "What are the performance benchmarks for flattening 10K x 10K matrices?") or techniques for [flattening while preserving array metadata](?q=How%20to%20maintain%20dimensional%20information%20when%20flattening%20NumPy%20arrays%3F "How to maintain dimensional information when flattening NumPy arrays?")? 

### Pro Tips
- Use \`order='F'\` parameter for Fortran-style (column-major) flattening
- For GPU arrays (CuPy), prefer \`ravel()\` over flatten() to avoid host-device transfers
- Pandas DataFrames: \`df.values.ravel()\` is faster than \`df.to_numpy().flatten()\`
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
    const len = Math.floor((t - start) / 100);
    const finished = len >= length;
    controller.update({ answer: TEXT.slice(0, len), answer_stage: 'answer', finished });
    finished && intervalId && clearInterval(intervalId);
  }, 1000);
})();
