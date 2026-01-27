import { IsArray, ValidateNested, IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
    @IsUUID()
    product_id: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateSaleDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];

    @IsOptional()
    @IsUUID()
    customer_id?: string;
}
