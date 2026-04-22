"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const prisma_service_1 = require("../database/prisma.service");
let JiraService = class JiraService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createAuthHeader(email, apiToken) {
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        return `Basic ${auth}`;
    }
    async testConnection(testJiraConnectionDto) {
        const { instanceUrl, email, apiToken, projectKey } = testJiraConnectionDto;
        try {
            const baseUrl = instanceUrl.replace(/\/$/, '');
            const headers = {
                'Authorization': this.createAuthHeader(email, apiToken),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            const serverInfoResponse = await axios_1.default.get(`${baseUrl}/rest/api/3/serverInfo`, { headers });
            const serverInfo = serverInfoResponse.data;
            const userResponse = await axios_1.default.get(`${baseUrl}/rest/api/3/myself`, { headers });
            const currentUser = userResponse.data;
            const projectsResponse = await axios_1.default.get(`${baseUrl}/rest/api/3/project?maxResults=5`, { headers });
            const projects = projectsResponse.data;
            let projectTest = null;
            if (projectKey) {
                try {
                    const projectResponse = await axios_1.default.get(`${baseUrl}/rest/api/3/project/${projectKey}`, { headers });
                    projectTest = projectResponse.data;
                }
                catch (error) {
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
        }
        catch (error) {
            return {
                status: 'failed',
                message: `Jira connection failed: ${error.response?.data?.message || error.message}`,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async fetchRequirements(fetchJiraRequirementsDto) {
        const { instanceUrl, email, apiToken, projectKey, issueType, status, jql } = fetchJiraRequirementsDto;
        try {
            const baseUrl = instanceUrl.replace(/\/$/, '');
            const headers = {
                'Authorization': this.createAuthHeader(email, apiToken),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            let jqlQuery = jql;
            if (!jqlQuery) {
                const conditions = [];
                if (projectKey)
                    conditions.push(`project = "${projectKey}"`);
                if (issueType)
                    conditions.push(`issuetype = "${issueType}"`);
                if (status)
                    conditions.push(`status = "${status}"`);
                jqlQuery = conditions.join(' AND ') || `project = "${projectKey}"`;
            }
            const searchResponse = await axios_1.default.get(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=50&fields=issuetype,summary,description,status,priority,created,updated`, { headers });
            const issues = searchResponse.data.issues || [];
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
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to fetch requirements: ${error.response?.data?.message || error.message}`,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async getProjects(credentials) {
        const { instanceUrl, email, apiToken } = credentials;
        try {
            const baseUrl = instanceUrl.replace(/\/$/, '');
            const headers = {
                'Authorization': this.createAuthHeader(email, apiToken),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            const response = await axios_1.default.get(`${baseUrl}/rest/api/3/project?maxResults=50`, { headers });
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
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to fetch projects: ${error.response?.data?.message || error.message}`,
            };
        }
    }
    encryptApiToken(token) {
        return Buffer.from(token).toString('base64');
    }
    decryptApiToken(encryptedToken) {
        return Buffer.from(encryptedToken, 'base64').toString();
    }
    maskApiToken(token) {
        if (token.length <= 8)
            return '*'.repeat(token.length);
        return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
    }
    async createConfig(createJiraConfigDto) {
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
    async getConfig(id) {
        const config = await this.prisma.jiraConfig.findUnique({ where: { id } });
        if (!config)
            throw new common_1.NotFoundException('Jira configuration not found');
        return { ...config, apiToken: this.maskApiToken(config.apiToken) };
    }
    async updateConfig(id, updateJiraConfigDto) {
        const existingConfig = await this.prisma.jiraConfig.findUnique({ where: { id } });
        if (!existingConfig)
            throw new common_1.NotFoundException('Jira configuration not found');
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
        const updateData = { ...updateJiraConfigDto };
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
    async deleteConfig(id) {
        const config = await this.prisma.jiraConfig.findUnique({ where: { id } });
        if (!config)
            throw new common_1.NotFoundException('Jira configuration not found');
        await this.prisma.jiraConfig.delete({ where: { id } });
        return { message: 'Jira configuration deleted successfully' };
    }
};
exports.JiraService = JiraService;
exports.JiraService = JiraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JiraService);
//# sourceMappingURL=jira.service.js.map