export const focus = id => document.getElementById(id)?.focus();
export const clear = id => {
  const el = document.getElementById(id)
  if (el) el.value = ""
}
