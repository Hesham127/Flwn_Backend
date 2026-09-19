import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspaceService } from './workspace.service.js';

@ApiTags('workspaces')
@Controller('organizations/:organizationId/workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  @ApiCreatedResponse({
    description: 'Workspace created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid workspace data',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  create(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List workspaces by organization',
  })
  @ApiOkResponse({
    description: 'Workspaces returned successfully',
  })
  findByOrganization(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
  ) {
    return this.workspaceService.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace' })
  @ApiOkResponse({
    description: 'Workspace returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  findOne(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workspaceService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiOkResponse({
    description: 'Workspace updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or empty update data',
  })
  update(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'At least one field is required',
      });
    }

    return this.workspaceService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive workspace' })
  @ApiOkResponse({
    description: 'Workspace archived successfully',
  })
  remove(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workspaceService.remove(organizationId, id);
  }
}
