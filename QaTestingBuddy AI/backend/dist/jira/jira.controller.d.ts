import { JiraService } from './jira.service';
import { TestJiraConnectionDto } from './dto/test-jira-connection.dto';
import { FetchJiraRequirementsDto } from './dto/fetch-jira-requirements.dto';
import { CreateJiraConfigDto } from './dto/create-jira-config.dto';
export declare class JiraController {
    private readonly jiraService;
    constructor(jiraService: JiraService);
    testConnection(testJiraConnectionDto: TestJiraConnectionDto): Promise<{
        status: string;
        message: string;
        serverInfo: {
            title: any;
            version: any;
        };
        currentUser: {
            name: any;
            email: any;
        };
        projectsCount: any;
        projectTest: any;
        timestamp: string;
    } | {
        status: string;
        message: string;
        timestamp: string;
        serverInfo?: undefined;
        currentUser?: undefined;
        projectsCount?: undefined;
        projectTest?: undefined;
    }>;
    fetchRequirements(fetchJiraRequirementsDto: FetchJiraRequirementsDto): Promise<{
        success: boolean;
        requirements: any;
        total: any;
        jql: string;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        timestamp: string;
        requirements?: undefined;
        total?: undefined;
        jql?: undefined;
    }>;
    getProjects(credentials: TestJiraConnectionDto): Promise<{
        success: boolean;
        projects: any;
        total: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        projects?: undefined;
        total?: undefined;
    }>;
    createConfig(createJiraConfigDto: CreateJiraConfigDto): Promise<any>;
    getAllConfigs(): Promise<any>;
    getConfig(id: string): Promise<any>;
    updateConfig(id: string, updateJiraConfigDto: Partial<CreateJiraConfigDto>): Promise<any>;
    deleteConfig(id: string): Promise<{
        message: string;
    }>;
}
