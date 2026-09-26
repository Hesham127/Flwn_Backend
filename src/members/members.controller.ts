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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MembersService } from './members.service.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';
import { MemberQueryDto } from './dto/member-query.dto.js';

@ApiTags('members')
@Controller('organizations/:organizationId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Add a member to the organization' })
  @ApiCreatedResponse({ description: 'Member created successfully' })
  @ApiConflictResponse({
    description: 'Member already exists in this organization',
  })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  @ApiBadRequestResponse({ description: 'Invalid member data' })
  create(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List members in the organization' })
  @ApiOkResponse({ description: 'Members returned successfully' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  findAll(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Query() query: MemberQueryDto,
  ) {
    return this.membersService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by ID' })
  @ApiOkResponse({ description: 'Member returned successfully' })
  @ApiNotFoundResponse({
    description: 'Member not found',
    schema: {
      example: {
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found',
      },
    },
  })
  findOne(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.membersService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a member' })
  @ApiOkResponse({ description: 'Member updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or empty update data' })
  @ApiNotFoundResponse({ description: 'Member not found' })
 update(
  @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
  @Param('id', new ParseUUIDPipe()) id: string,
  @Body() dto: UpdateMemberDto,
) {
  if (Object.values(dto).every((value) => value === undefined)) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'At least one field is required',
    });
  }

  return this.membersService.update(organizationId, id, dto);
}

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove (deactivate) a member' })
  @ApiOkResponse({
    description: 'Member deactivated successfully',
    schema: {
      example: {
        id: 'uuid',
        status: 'INACTIVE',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Member not found' })
  remove(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.membersService.remove(organizationId, id);
  }
}