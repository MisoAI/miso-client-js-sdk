export default function rehypeHast() {
  Object.assign(this, { Compiler });
}

function Compiler(tree) {
  return Array.isArray(tree) ? {type: 'root', children: tree} : tree;
};
