
/**
 * Utility functions for handling S3 URIs and objects
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
 * Extracts filename from S3 key or path
 * @param key S3 object key or path
 * @returns filename portion
 */
export const getFilenameFromKey = (key: string): string => {
  if (!key) return '';
  
  const parts = key.split('/');
  return parts[parts.length - 1] || '';
};

/**
 * Normalizes an S3 URI or path for use with our backend API
 * @param uriOrPath S3 URI (s3://bucket/key) or path (/path/to/file)
 * @param defaultBucket Default bucket name to use if path doesn't include bucket
 * @returns Normalized path to use with API
 */
export const normalizeS3Path = (uriOrPath: string, defaultBucket: string = 'k8s-debugger-bucket'): string => {
  // If it's already an S3 URI, parse it
  if (uriOrPath.startsWith('s3://')) {
    const parsed = parseS3Uri(uriOrPath);
    if (!parsed) {
      throw new Error('Invalid S3 URI format');
    }
    
    // Only allow access to the specified bucket for security
    if (parsed.bucket !== defaultBucket) {
      throw new Error(`Access to bucket '${parsed.bucket}' is not allowed. Only '${defaultBucket}' is accessible.`);
    }
    
    return parsed.key;
  }
  
  // If it's a regular path, just clean it up
  return uriOrPath.startsWith('/') ? uriOrPath.substring(1) : uriOrPath;
};
