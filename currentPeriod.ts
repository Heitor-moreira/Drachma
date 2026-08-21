const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const getCurrentMonthRange = (currentDate = new Date()) => ({
  start: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 12)),
  end: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 12)),
});
