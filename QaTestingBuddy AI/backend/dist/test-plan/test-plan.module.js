"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPlanModule = void 0;
const common_1 = require("@nestjs/common");
const test_plan_controller_1 = require("./test-plan.controller");
const test_plan_service_1 = require("./test-plan.service");
const database_module_1 = require("../database/database.module");
const llm_module_1 = require("../llm/llm.module");
let TestPlanModule = class TestPlanModule {
};
exports.TestPlanModule = TestPlanModule;
exports.TestPlanModule = TestPlanModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, llm_module_1.LlmModule],
        controllers: [test_plan_controller_1.TestPlanController],
        providers: [test_plan_service_1.TestPlanService],
        exports: [test_plan_service_1.TestPlanService],
    })
], TestPlanModule);
//# sourceMappingURL=test-plan.module.js.map