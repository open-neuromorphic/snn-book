/**
 * Container initialization logic for dynsim.
 * Extracted from server.js inline script for testability.
 * The server.js inline script duplicates this logic — keep them in sync.
 */

/**
 * Determines whether a container should be initialized.
 * Returns { shouldInit: true, systemData } or { shouldInit: false, reason }.
 */
export function shouldInitializeContainer(container, systemsData) {
  const id = container.id;
  if (!id) {
    return { shouldInit: false, reason: 'no-id' };
  }
  if (!systemsData) {
    return { shouldInit: false, reason: 'no-systems-data' };
  }
  const systemData = systemsData[id];
  if (!systemData) {
    return { shouldInit: false, reason: 'no-matching-system' };
  }
  if (container.querySelector('.dynsim-container')) {
    return { shouldInit: false, reason: 'already-has-child' };
  }
  if (container.dataset.dynsimInit) {
    return { shouldInit: false, reason: 'already-flagged' };
  }
  return { shouldInit: true, systemData };
}

/**
 * Marks a container as initialized by setting data-dynsim-init attribute.
 */
export function markInitialized(container) {
  container.dataset.dynsimInit = 'true';
}

/**
 * Finds all uninitialized dynsim containers in the document.
 */
export function findUninitializedContainers(root, systemsData) {
  const containers = root.querySelectorAll('.dynsim-python-container');
  const results = [];
  for (const container of containers) {
    const check = shouldInitializeContainer(container, systemsData);
    if (check.shouldInit) {
      results.push({ container, systemData: check.systemData });
    }
  }
  return results;
}
