function compactObject(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function dedupeFromParts(parts) {
  return parts.filter(Boolean).map(part => String(part).trim().toLowerCase()).join(':');
}

module.exports = { compactObject, dedupeFromParts };
