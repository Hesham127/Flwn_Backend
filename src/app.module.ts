import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrganizationModule } from './organization/organization.module.js';
import { WorkModule } from './work/work.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';

@Module({
  imports: [OrganizationModule, WorkModule, IntegrationsModule, MeetingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
