import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, GIF, and WebP images are allowed.',
      );
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File must be under 5 MB');
    }

    if (!this.configured) {
      const placeholder = `https://placehold.co/600x400?text=${encodeURIComponent(file.originalname)}`;
      console.warn(
        '[uploads] Cloudinary not configured — returning placeholder URL',
      );
      return { url: placeholder, placeholder: true };
    }

    try {
      const result = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: 'image', folder: 'ethio-project-manager' },
              (err, res) => {
                if (err || !res) {
                  reject(err ?? new Error('No response from Cloudinary'));
                } else {
                  resolve(res as { secure_url: string });
                }
              },
            )
            .end(file.buffer);
        },
      );

      return { url: result.secure_url, placeholder: false };
    } catch (error) {
      console.error('[uploads] Cloudinary error:', error);
      throw new ServiceUnavailableException(
        'Image upload failed. Please try again.',
      );
    }
  }
}
