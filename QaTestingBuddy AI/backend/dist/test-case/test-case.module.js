"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCaseModule = void 0;
const common_1 = require("@nestjs/common");
const test_case_controller_1 = require("./test-case.controller");
const test_case_service_1 = require("./test-case.service");
const llm_module_1 = require("../llm/llm.module");
const database_module_1 = require("../database/database.module");
let TestCaseModule = class TestCaseModule {
};
exports.TestCaseModule = TestCaseModule;
exports.TestCaseModule = TestCaseModule = __decorate([
    (0, common_1.Module)({
        imports: [llm_module_1.LlmModule, database_module_1.DatabaseModule],
        controllers: [test_case_controller_1.TestCaseController],
        providers: [test_case_service_1.TestCaseService],
        exports: [test_case_service_1.TestCaseService],
    })
], TestCaseModule);
//# sourceMappingURL=test-case.module.js.map