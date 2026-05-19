/**
 * Formats bytes to human-readable string.
 * 1234 -> "1.21 KB"
 */
export function formatBytes(bytes: bigint | number): string {
  const n = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (n === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  const value = n / Math.pow(1024, i);

  return `${value.toFixed(value < 10 && i > 0 ? 2 : 1)} ${units[i]}`;
}

/**
 * Formats Unix timestamp (seconds) to readable date.
 */
export function formatDate(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Shortens an Ethereum address: 0x1234567890abcdef -> 0x1234...cdef
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Detects file type icon based on MIME or extension.
 */
export function getFileIcon(fileType: string): string {
  const lower = fileType.toLowerCase();
  if (lower.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)) return '🖼️';
  if (lower.includes('video') || /\.(mp4|mov|avi|mkv)$/i.test(lower)) return '🎬';
  if (lower.includes('audio') || /\.(mp3|wav|flac)$/i.test(lower)) return '🎵';
  if (lower.includes('pdf') || /\.pdf$/i.test(lower)) return '📄';
  if (/\.(zip|rar|7z|tar|gz)$/i.test(lower)) return '📦';
  if (/\.(doc|docx)$/i.test(lower)) return '📝';
  if (/\.(xls|xlsx|csv)$/i.test(lower)) return '📊';
  if (/\.(txt|md)$/i.test(lower)) return '📃';
  if (/\.(js|ts|py|java|cpp|html|css|json)$/i.test(lower)) return '💻';
  return '📁';
}