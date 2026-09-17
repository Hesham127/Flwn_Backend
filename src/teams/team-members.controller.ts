import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TeamMembersService } from './team-members.service.js';
import { AddTeamMemberDto } from './dto/add-team-member.dto.js';

@ApiTags('team-members')
@Controller('organizations/:organizationId/workspaces/:workspaceId/teams/:teamId/members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List all members in a team' })
  @ApiOkResponse({ description: 'Team members retrieved' })
  @ApiNotFoundResponse({ description: 'Organization, Workspace, or Team not found' })
  findAll(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
  ) {
    return this.teamMembersService.findAll(organizationId, workspaceId, teamId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiCreatedResponse({ description: 'Member added to team' })
  @ApiNotFoundResponse({ description: 'Organization, Workspace, Team, or Member not found' })
  @ApiConflictResponse({ description: 'Member already in team' })
  add(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamMembersService.add(organizationId, workspaceId, teamId, dto.memberId);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a team' })
  @ApiNoContentResponse({ description: 'Member removed from team' })
  @ApiNotFoundResponse({ description: 'Organization, Workspace, Team, Member, or relationship not found' })
  remove(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.teamMembersService.remove(organizationId, workspaceId, teamId, memberId);
  }

  @Get('/member/:memberId/teams')
  @ApiOperation({ summary: 'List all teams a member belongs to' })
  @ApiOkResponse({ description: 'Member teams retrieved' })
  @ApiNotFoundResponse({ description: 'Organization or Member not found' })
  findMemberTeams(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.teamMembersService.findMemberTeams(organizationId, memberId);
  }
}