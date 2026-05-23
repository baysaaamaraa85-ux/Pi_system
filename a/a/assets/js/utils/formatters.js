export function formatCurrency(value) {
  return `${Number(value).toLocaleString('en-US')}₮`;
}

export function formatExperience(years) {
  return `⏱ Туршлага: ${years} жил`;
}

export function nlToBreak(text = '') {
  return text.split('\n').join('<br>');
}

export function getInitial(text = '') {
  return text.trim().charAt(0).toUpperCase();
}
