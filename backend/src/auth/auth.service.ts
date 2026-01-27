import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
            },
        });

        return {
            message: 'User registered successfully',
            userId: user.id,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email };

        return {
            accessToken: await this.jwtService.signAsync(payload, {
                expiresIn: '1h',
                secret: process.env.JWT_ACCESS_SECRET || 'secret',
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
                expiresIn: '7d',
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            }),
            user: {
                id: user.id,
                email: user.email,
            },
        };
    }

    async refreshToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            });

            const newPayload = { sub: payload.sub, email: payload.email };

            return {
                accessToken: await this.jwtService.signAsync(newPayload, {
                    expiresIn: '1h',
                    secret: process.env.JWT_ACCESS_SECRET || 'secret',
                }),
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone: true,
                company: true,
                address: true,
                profile_image_url: true,
                created_at: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, dto: any) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                full_name: dto.full_name || undefined,
                phone: dto.phone || undefined,
                company: dto.company || undefined,
                address: dto.address || undefined,
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone: true,
                company: true,
                address: true,
            },
        });

        return { message: 'Profile updated successfully', user };
    }

    async changePassword(userId: string, dto: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async updateNotifications(userId: string, dto: any) {
        return { message: 'Notification preferences updated', preferences: dto };
    }

    async updatePreferences(userId: string, dto: any) {
        return { message: 'Preferences updated', preferences: dto };
    }
}
