// Currency Formatter in Indian Rupees (₹)
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2
  });
}

// Date Formatter in DD-MM-YYYY format
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
}

// Date & Time Formatter in DD-MM-YYYY, hh:mm A
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return dateStr;
  }
}

// Status badge styling helper
export function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'verified':
    case 'completed':
    case 'paid':
    case 'active':
      return {
        label: s === 'verified' ? 'Verified' : (s === 'paid' ? 'Paid' : 'Completed'),
        className: 'badge-success'
      };
    case 'pending':
    case 'unverified':
      return {
        label: 'Pending',
        className: 'badge-warning'
      };
    case 'partially_paid':
      return {
        label: 'Partial',
        className: 'badge-info'
      };
    case 'rejected':
    case 'cancelled':
      return {
        label: 'Rejected',
        className: 'badge-danger'
      };
    case 'overdue':
      return {
        label: 'Overdue',
        className: 'badge-danger'
      };
    default:
      return {
        label: status || 'Unknown',
        className: 'badge-neutral'
      };
  }
}
