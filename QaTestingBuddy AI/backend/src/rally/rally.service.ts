import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../database/prisma.service';
import { CreateRallyConfigDto } from './dto/create-rally-config.dto';
import { TestRallyConnectionDto } from './dto/test-rally-connection.dto';

@Injectable()
export class RallyService {
  constructor(private readonly prisma: PrismaService) {}

  async testConnection(dto: TestRallyConnectionDto) {
    const { instanceUrl, apiKey } = dto;
    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const response = await axios.get(`${baseUrl}/slm/webservice/v2.0/subscription`, {
        headers: {
          'zsessionid': apiKey,
          'Accept': 'application/json',
        },
      });

      const subscriptionData = response.data?.Subscription;
      return {
        success: true,
        status: 'connected',
        message: `Successfully connected to Rally! Subscription: ${subscriptionData?.Name || 'Active'}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.errors?.[0] || error.message;
      return {
        success: false,
        status: 'failed',
        message: `Rally Connection Failed: ${errMsg}. Please check your API Key and URL.`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createConfig(dto: CreateRallyConfigDto) {
    try {
      const config = await this.prisma.rallyConfig.create({
        data: {
          instanceUrl: dto.instanceUrl,
          apiKey: dto.apiKey,
          workspaceName: dto.workspaceName,
          projectName: dto.projectName,
          testStatus: 'untested',
        },
      });
      return { ...config, message: 'Rally Configuration saved successfully!' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to save Rally configuration: ${error.message}`);
    }
  }

  async getAllConfigs() {
    const configs = await this.prisma.rallyConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return configs.map(c => ({ ...c, apiKey: this.maskKey(c.apiKey) }));
  }

  async deleteConfig(id: string) {
    try {
      await this.prisma.rallyConfig.delete({ where: { id } });
      return { message: 'Rally configuration deleted successfully' };
    } catch {
      throw new NotFoundException('Rally configuration not found');
    }
  }

  private maskKey(key: string): string {
    if (!key || key.length <= 8) return '********';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  }
}
