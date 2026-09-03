export function nlToBreak(text = '') {
  return text.split('\n').join('<br>');
}

export function getInitial(text = '') {
  return text.trim().charAt(0).toUpperCase();
}
