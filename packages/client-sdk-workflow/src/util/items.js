/**
 * Helpers to work with keyed, ordered lists of records — the thread list's
 * groups, the conversation's messages — changed item by item rather than
 * rewritten as a whole.
 */

const REMOVED = Symbol('removed');

/**
 * Merge item changes into a keyed, ordered list of records.
 *
 * - `remove`: the keys of the records to take out.
 * - `upsert`: records to put in, matched against the listed ones by key: a
 *   listed record is replaced by the merge of the two (`merge`, the new
 *   record by default) — or taken out, if the new record no longer belongs
 *   to the list (`belongs`); a record not listed yet joins the list if it
 *   belongs to it and falls within what the list has loaded (`within`, given
 *   the listed records — e.g. a paged list takes in only a record sorting
 *   above its last loaded one, so the paging offsets stay in line with the
 *   server's; `() => false` makes the merge update-only).
 * - `rekey`: listed keys to match under another key (`{ [oldKey]: newKey }`),
 *   for a record whose key changes — e.g. a placeholder settling into a real
 *   record.
 *
 * The result is ordered by `compare` if given; otherwise the listed records
 * keep their order, and the records joining go to the end, or to the start
 * (`position: 'start'`), in the order given. Record identity is the change
 * signal: records not changed keep their identity, and the list itself is
 * returned as is if nothing changed at all.
 *
 * @param {Object[]} items - The listed records.
 * @param {Object} changes - `{ upsert, remove, rekey }`.
 * @param {Object} options - `{ keyOf, compare, position, merge, belongs, within }`.
 * @returns {Object[]}
 */
export function mergeItems(items = [], { upsert = [], remove = [], rekey = {} } = {}, {
  keyOf,
  compare,
  position = 'end',
  merge = (_, item) => item,
  belongs = () => true,
  within = () => true,
} = {}) {
  const removed = new Set(remove);
  const result = [];
  const joined = [];
  // key -> positions in result: a key may be listed more than once
  const index = new Map();
  let changed = false;

  for (const item of items) {
    const key = keyOf(item);
    if (removed.has(key)) {
      changed = true;
      continue;
    }
    indexItem(index, Object.prototype.hasOwnProperty.call(rekey, key) ? rekey[key] : key, result.length);
    result.push(item);
  }

  for (const item of upsert) {
    const key = keyOf(item);
    const positions = index.get(key);
    if (positions) {
      const keep = belongs(item);
      for (const i of positions) {
        const existing = result[i];
        const next = keep ? merge(existing, item) : REMOVED;
        if (next !== existing) {
          result[i] = next;
          changed = true;
        }
      }
      keep || index.delete(key);
    } else if (belongs(item) && within(item, listedOf(result, joined, position))) {
      joined.push(item);
      changed = true;
    }
  }

  if (!changed) {
    return items;
  }
  const listed = listedOf(result, joined, position);
  return compare ? listed.sort(compare) : listed;
}

function indexItem(index, key, i) {
  const positions = index.get(key);
  positions ? positions.push(i) : index.set(key, [i]);
}

function listedOf(result, joined, position) {
  const listed = result.filter(item => item !== REMOVED);
  return position === 'start' ? [...joined, ...listed] : [...listed, ...joined];
}
