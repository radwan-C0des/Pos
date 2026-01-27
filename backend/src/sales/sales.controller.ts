import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(@Req() req: any, @Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(req.user.id, createSaleDto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.salesService.findAll({ page, limit, startDate, endDate });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }
}
