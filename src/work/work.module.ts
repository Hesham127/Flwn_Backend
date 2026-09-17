import { Module } from '@nestjs/common';
import { WorkRulesService } from './work.rules';
import { TaskController } from './task.controller.js';
import { TaskService } from './task.service.js';
import { InMemoryTaskRepository } from './task.repository.js';
import { OrganizationModule } from '../organization/organization.module.js';

@Module({
	imports: [OrganizationModule],
	controllers: [TaskController],
	providers: [
		WorkRulesService,
		InMemoryTaskRepository,
		{ provide: 'TASK_REPOSITORY', useExisting: InMemoryTaskRepository },
		TaskService,
	],
	exports: [WorkRulesService, TaskService],
})
export class WorkModule {}
