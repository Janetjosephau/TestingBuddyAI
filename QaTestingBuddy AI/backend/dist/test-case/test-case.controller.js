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
exports.TestCaseController = void 0;
const common_1 = require("@nestjs/common");
const test_case_service_1 = require("./test-case.service");
const create_test_case_dto_1 = require("./dto/create-test-case.dto");
const update_test_case_dto_1 = require("./dto/update-test-case.dto");
const generate_test_cases_dto_1 = require("./dto/generate-test-cases.dto");
let TestCaseController = class TestCaseController {
    constructor(testCaseService) {
        this.testCaseService = testCaseService;
    }
    async generateTestCases(generateTestCasesDto) {
        return this.testCaseService.generateTestCases(generateTestCasesDto);
    }
    async createTestCase(createTestCaseDto) {
        return this.testCaseService.createTestCase(createTestCaseDto);
    }
    async getAllTestCases() {
        return this.testCaseService.getAllTestCases();
    }
    async getTestCase(id) {
        return this.testCaseService.getTestCase(id);
    }
    async updateTestCase(id, updateTestCaseDto) {
        return this.testCaseService.updateTestCase(id, updateTestCaseDto);
    }
    async deleteTestCase(id) {
        return this.testCaseService.deleteTestCase(id);
    }
};
exports.TestCaseController = TestCaseController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_test_cases_dto_1.GenerateTestCasesDto]),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "generateTestCases", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_test_case_dto_1.CreateTestCaseDto]),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "createTestCase", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "getAllTestCases", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "getTestCase", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_test_case_dto_1.UpdateTestCaseDto]),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "updateTestCase", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestCaseController.prototype, "deleteTestCase", null);
exports.TestCaseController = TestCaseController = __decorate([
    (0, common_1.Controller)('test-cases'),
    __metadata("design:paramtypes", [test_case_service_1.TestCaseService])
], TestCaseController);
//# sourceMappingURL=test-case.controller.js.map