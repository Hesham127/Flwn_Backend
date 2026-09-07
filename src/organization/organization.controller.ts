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

import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationService } from './organization.service.js';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiCreatedResponse({
    description: 'Organization created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid organization data',
  })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiOkResponse({
    description: 'Organizations returned successfully',
  })
  findAll() {
    return this.organizationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiOkResponse({
    description: 'Organization returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
    schema: {
      example: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      },
    },
  })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiOkResponse({
    description: 'Organization updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or empty update data',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
    schema: {
      example: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      },
    },
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'At least one field is required',
      });
    }

    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive organization' })
  @ApiOkResponse({
    description: 'Organization archived successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        archived: true,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
    schema: {
      example: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      },
    },
  })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.organizationService.remove(id);
  }
}