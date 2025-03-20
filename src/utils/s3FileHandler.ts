
/**
 * Utility functions for handling S3 file operations
 */

/**
 * Downloads a file from an S3 path
 * @param filePath The S3 path of the file to download
 * @returns The file content as text
 */
export const downloadS3File = async (filePath: string): Promise<string> => {
  try {
    // Check if it's an S3 path
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    // Make a request to download the file
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_BASE_URL}/kubernetes/s3-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to download S3 file: ${response.status}`);
    }
    
    // Return the file content
    return await response.text();
  } catch (error) {
    console.error('Error downloading S3 file:', error);
    throw error;
  }
};

/**
 * Checks if a path is an S3 path
 * @param path The path to check
 * @returns True if the path is an S3 path
 */
export const isS3Path = (path: string | undefined): boolean => {
  if (!path) return false;
  return path.startsWith('s3://') || path.includes('amazonaws.com');
};

/**
 * Downloads a file from the API when a file_name is provided in chat response
 * @param file_name The file name from the API response
 * @returns The file content
 */
export const downloadFileFromResponse = async (file_name: string | undefined): Promise<string | null> => {
  if (!file_name) return null;
  
  try {
    return await downloadS3File(file_name);
  } catch (error) {
    console.error('Error downloading file from response:', error);
    return null;
  }
};
