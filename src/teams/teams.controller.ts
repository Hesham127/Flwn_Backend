import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { TeamQueryDto } from './dto/team-query.dto.js';
import { AddTeamMemberDto } from './dto/add-team-member.dto.js';

@ApiTags('teams')
@Controller('organizations/:organizationId/workspaces/:workspaceId/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a team in a workspace' })
  @ApiCreatedResponse({ description: 'Team created' })
  @ApiNotFoundResponse({
    description: 'Organization or Workspace not found',
  })
  @ApiBadRequestResponse({ description: 'Invalid team data' })
  create(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe())
    workspaceId: string,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(organizationId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List teams in a workspace' })
  @ApiOkResponse({ description: 'Teams retrieved' })
  @ApiNotFoundResponse({
    description: 'Organization or Workspace not found',
  })
  findAll(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe())
    workspaceId: string,
    @Query() query: TeamQueryDto,
  ) {
    return this.teamsService.findAll(organizationId, workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiOkResponse({ description: 'Team found' })
  @ApiNotFoundResponse({
    description: 'Team not found',
    schema: {
      example: {
        code: 'TEAM_NOT_FOUND',
        message: 'Team not found',
      },
    },
  })
  findOne(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe())
    workspaceId: string,
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.teamsService.findOne(organizationId, workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a team' })
  @ApiOkResponse({ description: 'Team updated' })
  @ApiBadRequestResponse({
    description: 'Invalid or empty update data',
  })
  @ApiNotFoundResponse({ description: 'Team not found' })
  update(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe())
    workspaceId: string,
    @Param('id', new ParseUUIDPipe())
    id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'At least one field is required',
      });
    }

    return this.teamsService.update(organizationId, workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team permanently' })
  @ApiNoContentResponse({ description: 'Team deleted' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  remove(
    @Param('organizationId', new ParseUUIDPipe())
    organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe())
    workspaceId: string,
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.teamsService.remove(organizationId, workspaceId, id);
  }
  @Get(':teamId/members')
  @ApiOperation({ summary: 'List all members in a team' })
  @ApiOkResponse({ description: 'Team members retrieved' })
  @ApiNotFoundResponse({
    description: 'Organization, Workspace, or Team not found',
  })
  findMembers(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
  ) {
    return this.teamsService.findMembers(organizationId, workspaceId, teamId);
  }

  @Post(':teamId/members')
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiCreatedResponse({ description: 'Member added to team' })
  @ApiNotFoundResponse({
    description: 'Organization, Workspace, Team, or Member not found',
  })
  @ApiConflictResponse({ description: 'Member already in team' })
  addMember(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(
      organizationId,
      workspaceId,
      teamId,
      dto.memberId,
    );
  }

  @Delete(':teamId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a team' })
  @ApiNoContentResponse({ description: 'Member removed from team' })
  @ApiNotFoundResponse({
    description:
      'Organization, Workspace, Team, Member, or relationship not found',
  })
  removeMember(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.teamsService.removeMember(
      organizationId,
      workspaceId,
      teamId,
      memberId,
    );
  }

  @Get(':teamId/members/member/:memberId/teams')
  @ApiOperation({ summary: 'List all teams a member belongs to' })
  @ApiOkResponse({ description: 'Member teams retrieved' })
  @ApiNotFoundResponse({ description: 'Organization or Member not found' })
  findMemberTeams(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.teamsService.findMemberTeams(organizationId, memberId);
  }
}
