import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../database/prisma.service';
import { CreateRallyConfigDto } from './dto/create-rally-config.dto';
import { TestRallyConnectionDto } from './dto/test-rally-connection.dto';
import { UploadToRallyDto } from './dto/upload-to-rally.dto';
import { RALLY_FETCH_FIELDS, RALLY_FIELD_MAP, RALLY_API } from './rally.constants';

@Injectable()
export class RallyService {
  constructor(private readonly prisma: PrismaService) {}

  async testConnection(dto: TestRallyConnectionDto) {
    const { instanceUrl, apiKey } = dto;
    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const response = await axios.get(`${baseUrl}${RALLY_API.subscription}`, {
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

  async uploadTestCases(dto: UploadToRallyDto) {
    const { rallyConfigId, testCases, storyKey } = dto;
    
    const config = rallyConfigId 
      ? await this.prisma.rallyConfig.findUnique({ where: { id: rallyConfigId } })
      : await this.prisma.rallyConfig.findFirst();
    
    if (!config) throw new NotFoundException('Rally configuration not found');

    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = {
      'zsessionid': config.apiKey,
      'Accept': 'application/json',
    };

    const uploadedCount = [];
    const errors = [];

    // 1. Fetch the Story Reference to link the test cases
    let storyRef = null;
    let projectRef = null;

    if (storyKey) {
      try {
        const storyUrl = `${baseUrl}${RALLY_API.userStory}?query=(${RALLY_FIELD_MAP.key} = "${storyKey}")&fetch=Project`;
        const storyRes = await axios.get(storyUrl, { headers });
        const story = storyRes.data?.QueryResult?.Results?.[0];
        if (story) {
          storyRef = story._ref;
          projectRef = story.Project?._ref;
        } else {
          errors.push(`Warning: Story ${storyKey} not found in Rally. Test cases will be created but not linked to this story.`);
        }
      } catch (err: any) {
        errors.push(`Failed to fetch story ${storyKey}: ${err.message}`);
      }
    }

    for (const tc of testCases) {
      try {
        // 2. Format the description from steps
        const description = `
          <b>Preconditions:</b><br/>${tc.preconditions?.join('<br/>') || 'None'}<br/><br/>
          <b>Steps:</b><br/>
          ${tc.steps?.map((s: any, i: number) => `${i+1}. ${s.action} -> Expected: ${s.expectedResult}`).join('<br/>') || 'No steps provided'}
        `;

        // 3. Prepare payload with Linking
        const payload: any = {
          "TestCase": {
            "Name": tc.title || "AI Generated Test Case",
            "Description": `
              ${tc.testFolder ? `<b>Test Folder:</b> ${tc.testFolder}<br/><br/>` : ''}
              ${description}
            `.trim(),
            "Priority": tc.priority || "Medium",
            "Method": tc.method === 'Automate' ? 'Automated' : (tc.method || 'Manual'),
            "Type": tc.type || 'Functional',
            "Automate": tc.method === 'Automate' ? 'Automated' : 'None'
          }
        };

        // Link to project and story if available
        if (storyRef) payload.TestCase.WorkProduct = storyRef;
        if (projectRef) payload.TestCase.Project = projectRef;

        const createUrl = `${baseUrl}${RALLY_API.testCaseCreate}`;
        const response = await axios.post(createUrl, payload, { headers });

        if (response.data?.CreateResult?.Errors?.length > 0) {
          errors.push(`Error for ${tc.title}: ${response.data.CreateResult.Errors[0]}`);
        } else {
          uploadedCount.push(tc.title);
        }
      } catch (err: any) {
        errors.push(`Failed to upload ${tc.title}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      uploadedCount: uploadedCount.length,
      total: testCases.length,
      message: errors.length === 0 
        ? `Successfully uploaded ${uploadedCount.length} test cases to Rally!` 
        : `Uploaded ${uploadedCount.length} cases but encountered ${errors.length} errors.`,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async fetchRequirements(data: { query: string, rallyConfigId?: string }) {
    const { query, rallyConfigId } = data;
    const config = rallyConfigId 
      ? await this.prisma.rallyConfig.findUnique({ where: { id: rallyConfigId } })
      : await this.prisma.rallyConfig.findFirst();
      
    if (!config) throw new NotFoundException('Rally configuration not found');

    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = {
      'zsessionid': config.apiKey,
      'Accept': 'application/json',
    };
    
    // Example query: (FormattedID = "US31488")
    const apiQuery = query.includes('=') ? query : `(${RALLY_FIELD_MAP.key} = "${query}")`;
    const url = `${baseUrl}${RALLY_API.userStory}?query=${encodeURIComponent(apiQuery)}&fetch=${RALLY_FETCH_FIELDS}`;
    
    try {
      const response = await axios.get(url, { headers });
      const results = response.data?.QueryResult?.Results || [];
      
      const formatted = results.map(story => ({
        key:           story[RALLY_FIELD_MAP.key],
        title:         story[RALLY_FIELD_MAP.title] || story[RALLY_FIELD_MAP.titleFallback],
        description:   story[RALLY_FIELD_MAP.description] || '',
        notes:         story[RALLY_FIELD_MAP.notes] || '',
        requirements:  story[RALLY_FIELD_MAP.requirements] || '',
        issueType:     RALLY_FIELD_MAP.issueType,
        status:        story[RALLY_FIELD_MAP.status] || RALLY_FIELD_MAP.statusDefault,
        priority:      story[RALLY_FIELD_MAP.priority]?.Name || RALLY_FIELD_MAP.priorityDefault
      }));
      
      return { success: true, requirements: formatted };
    } catch (error: any) {
      const errMsg = error.response?.data?.errors?.[0] || error.response?.statusText || error.message;
      return { success: false, message: `Rally Fetch Failed: ${errMsg}` };
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
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete this configuration because it is currently used by your saved Test Plans/Cases.');
      }
      throw new NotFoundException('Rally configuration not found');
    }
  }

  private maskKey(key: string): string {
    if (!key || key.length <= 8) return '********';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  }
}
