import { Injectable, BadRequestException } from '@nestjs/common';

interface FileObject {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadsService {
  async uploadFile(file: FileObject, type: 'product' | 'profile'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Convert buffer to base64
      const base64Image = file.buffer.toString('base64');
      
      // Return data URI format: data:image/jpeg;base64,/9j/4AAQ...
      return `data:${file.mimetype};base64,${base64Image}`;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    // No need to delete files since we're storing in database
    // This method is kept for backward compatibility
    return;
  }
}
