/**
 * @param {URLSearchParams} searchParams
 * @returns {void}
 */
export function replaceState(searchParams) {
  const params = new URLSearchParams(searchParams);
  searchParams.forEach((value, key) => {
    if (!value || value === "null" || !value.trim()) {
      params.delete(key);
    }
  });
  window.history.replaceState(
    null,
    null,
    `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`,
  );
}
