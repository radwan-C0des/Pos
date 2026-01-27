import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UploadsService } from '../uploads/uploads.service';

@Module({
    controllers: [ProductsController],
    providers: [ProductsService, UploadsService],
    exports: [ProductsService],
})
export class ProductsModule { }
