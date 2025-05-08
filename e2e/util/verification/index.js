export function equalFacetCounts(facetCounts0, facetCounts1) {
  const facetFields0 = facetCounts0.facet_fields;
  const facetFields1 = facetCounts1.facet_fields;
  if (Object.keys(facetFields0).length !== Object.keys(facetFields1).length) {
    return false;
  }
  for (const field in facetFields0) {
    if (!equalFacetFields(facetFields0[field], facetFields1[field])) {
      return false;
    }
  }
  return true;
}

function equalFacetFields(facetFields0, facetFields1) {
  if (facetFields0.length !== facetFields1.length) {
    return false;
  }
  for (let i = 0; i < facetFields0.length; i++) {
    if (facetFields0[i][0] !== facetFields1[i][0] || facetFields0[i][1] !== facetFields1[i][1]) {
      return false;
    }
  }
  return true;
}
