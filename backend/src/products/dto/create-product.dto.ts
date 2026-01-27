import { IsString, IsNotEmpty, IsNumber, Min, IsInt, IsOptional } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    sku: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsInt()
    @Min(0)
    stock_quantity: number;

    @IsString()
    @IsOptional()
    image_url?: string;
}
