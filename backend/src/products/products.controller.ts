import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req, Logger, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { UploadsService } from '../uploads/uploads.service';

interface FileObject {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
    private logger = new Logger('ProductsController');
    
    constructor(
        private readonly productsService: ProductsService,
        private readonly uploadsService: UploadsService,
    ) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
        this.logger.log(`✅ POST /products - Creating product: ${createProductDto.name}`);
        this.logger.log(`User ID: ${req.user?.id}`);
        return this.productsService.create(createProductDto);
    }

    @Post(':id/image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProductImage(
        @Param('id') id: string,
        @UploadedFile() file: FileObject,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        this.logger.log(`📸 POST /products/:id/image - Uploading image for product ${id}`);
        const imageUrl = await this.uploadsService.uploadFile(file, 'product');
        
        // Update product with image
        const updatedProduct = await this.productsService.update(id, { image_url: imageUrl });
        
        return {
            success: true,
            imageUrl,
            product: updatedProduct,
            message: 'Product image uploaded successfully',
        };
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('order') order?: 'asc' | 'desc',
    ) {
        this.logger.log(`📦 GET /products - Fetching products`);
        return this.productsService.findAll({ page, limit, search, sortBy, order });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        this.logger.log(`🔍 GET /products/:id - Fetching product ${id}`);
        return this.productsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Req() req: any) {
        this.logger.log(`✏️ PUT /products/:id - Updating product ${id}`);
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        this.logger.log(`🗑️ DELETE /products/:id - Deleting product ${id}`);
        return this.productsService.remove(id);
    }
}
