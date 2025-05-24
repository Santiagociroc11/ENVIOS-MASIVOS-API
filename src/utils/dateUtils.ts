export function formatDistanceToNow(timestamp: number): string {
  const now = Date.now() / 1000; // Convert to seconds
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}