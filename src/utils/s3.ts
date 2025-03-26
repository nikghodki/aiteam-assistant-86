
/**
 * Utility functions for S3 operations
 */

/**
 * Fetches a file from S3 given its path
 * @param filePath The S3 path to the file
 * @returns The file content as a string
 */
export async function fetchFileFromS3(filePath: string): Promise<string> {
  // If the path is a full URL (like an S3 URL), use it directly
  if (filePath.startsWith('http')) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching file from S3:', error);
      throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // If it's just a path, we'll need to construct the full S3 URL
  // The S3 bucket URL should be configured in your environment
  const s3BucketUrl = import.meta.env.VITE_S3_BUCKET_URL || 'https://your-bucket.s3.amazonaws.com';
  
  try {
    const url = `${s3BucketUrl}/${filePath.startsWith('/') ? filePath.substring(1) : filePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching file from S3:', error);
    throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
