import { Controller, Post, Put, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    @Post('logout')
    async logout() {
        // Redis blacklisting would go here
        return { message: 'Logged out' };
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @Put('profile')
    @UseGuards(AuthGuard('jwt'))
    async updateProfile(@Req() req: any, @Body() dto: any) {
        return this.authService.updateProfile(req.user.id, dto);
    }

    @Post('change-password')
    @UseGuards(AuthGuard('jwt'))
    async changePassword(@Req() req: any, @Body() dto: any) {
        return this.authService.changePassword(req.user.id, dto);
    }

    @Put('notifications')
    @UseGuards(AuthGuard('jwt'))
    async updateNotifications(@Req() req: any, @Body() dto: any) {
        return this.authService.updateNotifications(req.user.id, dto);
    }

    @Put('preferences')
    @UseGuards(AuthGuard('jwt'))
    async updatePreferences(@Req() req: any, @Body() dto: any) {
        return this.authService.updatePreferences(req.user.id, dto);
    }
}
