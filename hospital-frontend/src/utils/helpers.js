// helper utilities used across components

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function generateHistoricalData() {
  // simple example data, can be replaced later
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return months.map(month => ({
    month,
    used: Math.floor(Math.random() * 100),
    total: 100,
    percentage: Math.floor(Math.random() * 100),
  }));
}
