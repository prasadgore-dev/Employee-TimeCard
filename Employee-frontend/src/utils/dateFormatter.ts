/**
 * Formats a date to dd-mm-yyyy format
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string in dd-mm-yyyy format
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Formats a date to dd-mm-yyyy HH:mm format
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string in dd-mm-yyyy HH:mm format
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Formats time only in HH:mm format
 * @param date - Date object, string, or timestamp
 * @returns Formatted time string in HH:mm format
 */
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};
