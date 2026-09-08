import { Module } from '@nestjs/common';
import { WorkRulesService } from './work.rules';

@Module({
	providers: [WorkRulesService],
	exports: [WorkRulesService],
})
export class WorkModule {}
