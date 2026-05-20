export function optimizeCloudinaryUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com/image/upload/')) {
    // Check if it already has parameters to avoid double adding
    if (!url.includes('/q_auto,f_auto/')) {
        return url.replace('res.cloudinary.com/image/upload/', 'res.cloudinary.com/image/upload/q_auto,f_auto/');
    }
  }
  return url;
}
