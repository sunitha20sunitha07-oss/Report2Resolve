/**
 * Image processing utility for Report2Resolve
 * 
 * Compresses and resizes citizen and officer photo evidence before storing
 * in browser localStorage to prevent quota exhaustion while preserving
 * visual clarity.
 */

/**
 * Compress an image file to a lightweight JPEG data URL.
 * 
 * @param {File|Blob} file 
 * @param {number} [maxWidth=800] 
 * @param {number} [maxHeight=800] 
 * @param {number} [quality=0.7] 
 * @returns {Promise<string>} Base64 Data URL
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  if (!file) {
    throw new Error('No image file provided.');
  }

  // Basic check for image mime type
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read the selected image file.'));
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Invalid image data.'));
        return;
      }

      // If in non-browser environment or canvas unsupported, return raw dataUrl
      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();

      img.onerror = () => {
        // Fallback to raw dataUrl if image decode fails
        resolve(dataUrl);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale proportionally if image exceeds max bounds
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Draw and re-encode as optimized JPEG
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('[ImageUtils] Canvas compression failed, using original:', err);
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g., "45 KB")
 * @param {number} bytes 
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
