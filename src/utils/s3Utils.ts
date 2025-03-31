/**
 * Utility functions for handling file URIs and paths
 */

/**
 * Parses an S3 URI and extracts its components
 * @param uri S3 URI in format s3://bucket-name/path/to/object
 * @returns Object containing bucket and key, or null if invalid URI
 */
export const parseS3Uri = (uri: string): { bucket: string; key: string } | null => {
  if (!uri || typeof uri !== 'string') {
    return null;
  }

  // Check if it's an S3 URI
  if (!uri.startsWith('s3://')) {
    return null;
  }

  // Remove the s3:// prefix
  const path = uri.substring(5);

  // Split by first slash to separate bucket and key
  const firstSlashIndex = path.indexOf('/');
  
  if (firstSlashIndex === -1) {
    // Only bucket name provided, no key
    return { bucket: path, key: '' };
  }

  const bucket = path.substring(0, firstSlashIndex);
  let key = path.substring(firstSlashIndex + 1);
  
  return { bucket, key };
};

/**
 * Creates a standardized S3 URI from bucket and key
 * @param bucket S3 bucket name
 * @param key Object key/path
 * @returns Formatted S3 URI
 */
export const formatS3Uri = (bucket: string, key: string): string => {
  return `s3://${bucket}/${key}`;
};

/**
 * Checks if a URI is valid S3 format
 * @param uri URI to check
 * @returns boolean indicating if valid
 */
export const isValidS3Uri = (uri: string): boolean => {
  return parseS3Uri(uri) !== null;
};

/**
 * Extracts filename from file key or path
 * @param key File path or key
 * @returns filename portion
 */
export const getFilenameFromKey = (key: string): string => {
  if (!key) return '';
  
  const parts = key.split('/');
  return parts[parts.length - 1] || '';
};

/**
 * Normalizes a path for consistent handling
 * @param path Path or URI to normalize
 * @returns Normalized path
 */
export const normalizePath = (path: string): string => {
  // If it's an S3 URI, extract just the path part
  if (isValidS3Uri(path)) {
    const parsedUri = parseS3Uri(path);
    if (parsedUri) {
      path = parsedUri.key;
    }
  }
  
  // If it starts with a slash, remove it
  return path.startsWith('/') ? path.substring(1) : path;
};
