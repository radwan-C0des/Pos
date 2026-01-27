import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadsService } from './uploads.service';
import { PrismaService } from '../prisma/prisma.service';

interface FileObject {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private prisma: PrismaService,
  ) {}

  @Post('product')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: FileObject) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const imageUrl = await this.uploadsService.uploadFile(file, 'product');
    return {
      success: true,
      imageUrl,
      message: 'Product image uploaded successfully',
    };
  }

  @Post('profile')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: FileObject,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const imageUrl = await this.uploadsService.uploadFile(file, 'profile');

    // Get old image URL for deletion
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user?.profile_image_url) {
      await this.uploadsService.deleteFile(user.profile_image_url);
    }

    // Update user profile image
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { profile_image_url: imageUrl },
    });

    return {
      success: true,
      imageUrl,
      message: 'Profile image uploaded successfully',
    };
  }
}
