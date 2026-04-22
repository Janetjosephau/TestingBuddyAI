import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../database/prisma.service';
import { TestJiraConnectionDto } from './dto/test-jira-connection.dto';
import { FetchJiraRequirementsDto } from './dto/fetch-jira-requirements.dto';
import { CreateJiraConfigDto } from './dto/create-jira-config.dto';

@Injectable()
export class JiraService {
  constructor(private readonly prisma: PrismaService) {}

  private createAuthHeader(email: string, apiToken: string): string {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  async testConnection(testJiraConnectionDto: TestJiraConnectionDto) {
    const { instanceUrl, email, apiToken, projectKey } = testJiraConnectionDto;

    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const headers = {
        'Authorization': this.createAuthHeader(email, apiToken),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Test 1: Get server info
      const serverInfoResponse = await axios.get(`${baseUrl}/rest/api/3/serverInfo`, { headers });
      const serverInfo = serverInfoResponse.data;

      // Test 2: Get current user
      const userResponse = await axios.get(`${baseUrl}/rest/api/3/myself`, { headers });
      const currentUser = userResponse.data;

      // Test 3: Get projects
      const projectsResponse = await axios.get(`${baseUrl}/rest/api/3/project?maxResults=5`, { headers });
      const projects = projectsResponse.data;

      // Test 4: Test project access if project key provided
      let projectTest = null;
      if (projectKey) {
        try {
          const projectResponse = await axios.get(`${baseUrl}/rest/api/3/project/${projectKey}`, { headers });
          projectTest = projectResponse.data;
        } catch (error) {
          projectTest = { error: 'Project access failed' };
        }
      }

      return {
        status: 'connected',
        message: 'Jira connection successful',
        serverInfo: {
          title: serverInfo.serverTitle,
          version: serverInfo.version,
        },
        currentUser: {
          name: currentUser.displayName,
          email: currentUser.emailAddress,
        },
        projectsCount: projects.total || projects.length,
        projectTest: projectTest,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Jira connection failed: ${error.response?.data?.message || error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async fetchRequirements(fetchJiraRequirementsDto: FetchJiraRequirementsDto) {
    const { instanceUrl, email, apiToken, projectKey, issueType, status, jql } = fetchJiraRequirementsDto;

    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const headers = {
        'Authorization': this.createAuthHeader(email, apiToken),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Build JQL query
      let jqlQuery = jql;
      if (!jqlQuery) {
        const conditions = [];
        if (projectKey) conditions.push(`project = "${projectKey}"`);
        if (issueType) conditions.push(`issuetype = "${issueType}"`);
        if (status) conditions.push(`status = "${status}"`);
        jqlQuery = conditions.join(' AND ') || `project = "${projectKey}"`;
      }

      // Search for issues
      const searchResponse = await axios.get(
        `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=50&fields=issuetype,summary,description,status,priority,created,updated`,
        { headers }
      );

      const issues = searchResponse.data.issues || [];

      // Transform to our requirement format
      const requirements = issues.map(issue => ({
        issueId: issue.id,
        key: issue.key,
        title: issue.fields.summary,
        description: issue.fields.description || '',
        issueType: issue.fields.issuetype.name,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'Medium',
        created: issue.fields.created,
        updated: issue.fields.updated,
      }));

      return {
        success: true,
        requirements,
        total: requirements.length,
        jql: jqlQuery,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch requirements: ${error.response?.data?.message || error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getProjects(credentials: TestJiraConnectionDto) {
    const { instanceUrl, email, apiToken } = credentials;

    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const headers = {
        'Authorization': this.createAuthHeader(email, apiToken),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await axios.get(`${baseUrl}/rest/api/3/project?maxResults=50`, { headers });
      const projects = response.data;

      return {
        success: true,
        projects: projects.map(project => ({
          key: project.key,
          name: project.name,
          id: project.id,
        })),
        total: projects.length,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch projects: ${error.response?.data?.message || error.message}`,
      };
    }
  }

  // CRUD Operations for Jira Configs

  private encryptApiToken(token: string): string {
    return Buffer.from(token).toString('base64');
  }

  private decryptApiToken(encryptedToken: string): string {
    return Buffer.from(encryptedToken, 'base64').toString();
  }

  private maskApiToken(token: string): string {
    if (token.length <= 8) return '*'.repeat(token.length);
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  }

  async createConfig(createJiraConfigDto: CreateJiraConfigDto) {
    const testResult = await this.testConnection({
      instanceUrl: createJiraConfigDto.instanceUrl,
      email: createJiraConfigDto.email,
      apiToken: createJiraConfigDto.apiToken,
      projectKey: createJiraConfigDto.projectKey,
    });

    if (testResult.status !== 'connected') {
      throw new Error(`Cannot save config: ${testResult.message}`);
    }

    const encryptedToken = this.encryptApiToken(createJiraConfigDto.apiToken);

    const config = await this.prisma.jiraConfig.create({
      data: {
        instanceUrl: createJiraConfigDto.instanceUrl,
        email: createJiraConfigDto.email,
        apiToken: encryptedToken,
        projectKey: createJiraConfigDto.projectKey,
        testStatus: 'connected',
        lastTestedAt: new Date(),
      },
    });

    return { ...config, apiToken: this.maskApiToken(config.apiToken) };
  }

  async getAllConfigs() {
    const configs = await this.prisma.jiraConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return configs.map(config => ({
      ...config,
      apiToken: this.maskApiToken(config.apiToken),
    }));
  }

  async getConfig(id: string) {
    const config = await this.prisma.jiraConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Jira configuration not found');
    return { ...config, apiToken: this.maskApiToken(config.apiToken) };
  }

  async updateConfig(id: string, updateJiraConfigDto: Partial<CreateJiraConfigDto>) {
    const existingConfig = await this.prisma.jiraConfig.findUnique({ where: { id } });
    if (!existingConfig) throw new NotFoundException('Jira configuration not found');

    if (updateJiraConfigDto.apiToken || updateJiraConfigDto.instanceUrl || updateJiraConfigDto.email) {
      const testData = {
        instanceUrl: updateJiraConfigDto.instanceUrl ?? existingConfig.instanceUrl,
        email: updateJiraConfigDto.email ?? existingConfig.email,
        apiToken: updateJiraConfigDto.apiToken ?? this.decryptApiToken(existingConfig.apiToken),
        projectKey: updateJiraConfigDto.projectKey ?? existingConfig.projectKey,
      };

      const testResult = await this.testConnection(testData);
      if (testResult.status !== 'connected') {
        throw new Error(`Cannot update config: ${testResult.message}`);
      }
    }

    const updateData: any = { ...updateJiraConfigDto };
    if (updateJiraConfigDto.apiToken) {
      updateData.apiToken = this.encryptApiToken(updateJiraConfigDto.apiToken);
    }
    
    if (updateJiraConfigDto.apiToken || updateJiraConfigDto.instanceUrl || updateJiraConfigDto.email) {
       updateData.testStatus = 'connected';
       updateData.lastTestedAt = new Date();
    }

    const config = await this.prisma.jiraConfig.update({
      where: { id },
      data: updateData,
    });

    return { ...config, apiToken: this.maskApiToken(config.apiToken) };
  }

  async deleteConfig(id: string) {
    const config = await this.prisma.jiraConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Jira configuration not found');

    await this.prisma.jiraConfig.delete({ where: { id } });
    return { message: 'Jira configuration deleted successfully' };
  }
}