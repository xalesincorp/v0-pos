import imageCompression from 'browser-image-compression';

interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebP?: boolean;
  quality?: number;
}

interface CompressedImageResult {
  file: File;
  url: string;
  size: number;
  type: string;
}

class ImageService {
  /**
   * Compress an image file
   */
  async compressImage(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<CompressedImageResult> {
    try {
      // Set default options
      const compressionOptions = {
        maxSizeMB: options.maxSizeMB || 1,
        maxWidthOrHeight: options.maxWidthOrHeight || 1920,
        useWebP: options.useWebP !== undefined ? options.useWebP : true,
        quality: options.quality || 0.8,
      };

      // Compress the image
      const compressedFile = await imageCompression(file, compressionOptions);

      // Create a URL for the compressed image
      const imageUrl = URL.createObjectURL(compressedFile);

      return {
        file: compressedFile,
        url: imageUrl,
        size: compressedFile.size,
        type: compressedFile.type,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(
    file: File,
    quality: number = 0.8
  ): Promise<CompressedImageResult> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to WebP
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image to WebP'));
                return;
              }
              
              // Create new file with WebP type
              const webPFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              
              resolve({
                file: webPFile,
                url: URL.createObjectURL(webPFile),
                size: webPFile.size,
                type: 'image/webp',
              });
            },
            'image/webp',
            quality
          );
          
          // Clean up the object URL
          URL.revokeObjectURL(img.src);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Resize image to specific dimensions
   */
  async resizeImage(
    file: File,
    width: number,
    height: number,
    maintainAspectRatio: boolean = true
  ): Promise<CompressedImageResult> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
          let newWidth = width;
          let newHeight = height;
          
          // Calculate dimensions maintaining aspect ratio if requested
          if (maintainAspectRatio) {
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) {
              newWidth = height * aspectRatio;
            } else {
              newHeight = width / aspectRatio;
            }
          }
          
          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Draw image on canvas with new dimensions
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convert back to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to resize image'));
                return;
              }
              
              // Create new file
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              
              resolve({
                file: resizedFile,
                url: URL.createObjectURL(resizedFile),
                size: resizedFile.size,
                type: resizedFile.type,
              });
            },
            file.type,
            0.8 // default quality
          );
          
          // Clean up the object URL
          URL.revokeObjectURL(img.src);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File is not an image' };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Image size exceeds 10MB limit' };
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return { 
        isValid: false, 
        error: `Invalid image format. Valid formats: ${validExtensions.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
        
        // Clean up the object URL
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = (error) => {
        reject(error);
      };
    });
  }

  /**
   * Optimize image for web display
   */
  async optimizeForWeb(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<CompressedImageResult> {
    // First validate the image
    const validation = this.validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);
    
    // If image is too large, resize it first
    if (dimensions.width > 2000 || dimensions.height > 2000) {
      const resizeFactor = Math.min(2000 / dimensions.width, 2000 / dimensions.height);
      const newWidth = Math.floor(dimensions.width * resizeFactor);
      const newHeight = Math.floor(dimensions.height * resizeFactor);
      
      const resized = await this.resizeImage(file, newWidth, newHeight, true);
      file = resized.file;
    }

    // Then compress the image
    return this.compressImage(file, {
      ...options,
      maxSizeMB: options.maxSizeMB || 0.5, // Default to smaller size for web
      useWebP: options.useWebP !== undefined ? options.useWebP : true,
    });
  }
}

export const imageService = new ImageService();