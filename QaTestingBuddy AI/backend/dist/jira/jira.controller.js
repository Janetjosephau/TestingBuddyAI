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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraController = void 0;
const common_1 = require("@nestjs/common");
const jira_service_1 = require("./jira.service");
const test_jira_connection_dto_1 = require("./dto/test-jira-connection.dto");
const fetch_jira_requirements_dto_1 = require("./dto/fetch-jira-requirements.dto");
const create_jira_config_dto_1 = require("./dto/create-jira-config.dto");
let JiraController = class JiraController {
    constructor(jiraService) {
        this.jiraService = jiraService;
    }
    async testConnection(testJiraConnectionDto) {
        return this.jiraService.testConnection(testJiraConnectionDto);
    }
    async fetchRequirements(fetchJiraRequirementsDto) {
        return this.jiraService.fetchRequirements(fetchJiraRequirementsDto);
    }
    async getProjects(credentials) {
        return this.jiraService.getProjects(credentials);
    }
    async createConfig(createJiraConfigDto) {
        return this.jiraService.createConfig(createJiraConfigDto);
    }
    async getAllConfigs() {
        return this.jiraService.getAllConfigs();
    }
    async getConfig(id) {
        return this.jiraService.getConfig(id);
    }
    async updateConfig(id, updateJiraConfigDto) {
        return this.jiraService.updateConfig(id, updateJiraConfigDto);
    }
    async deleteConfig(id) {
        return this.jiraService.deleteConfig(id);
    }
};
exports.JiraController = JiraController;
__decorate([
    (0, common_1.Post)('test-connection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_jira_connection_dto_1.TestJiraConnectionDto]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('requirements'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fetch_jira_requirements_dto_1.FetchJiraRequirementsDto]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "fetchRequirements", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_jira_connection_dto_1.TestJiraConnectionDto]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Post)('configs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_jira_config_dto_1.CreateJiraConfigDto]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "createConfig", null);
__decorate([
    (0, common_1.Get)('configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getAllConfigs", null);
__decorate([
    (0, common_1.Get)('configs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('configs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Delete)('configs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "deleteConfig", null);
exports.JiraController = JiraController = __decorate([
    (0, common_1.Controller)('jira'),
    __metadata("design:paramtypes", [jira_service_1.JiraService])
], JiraController);
//# sourceMappingURL=jira.controller.js.map