import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TaskService } from './task.service.js';
import type { CreateTaskInput, UpdateTaskInput } from './task.types.js';

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  @Post()
  create(@Body() input: CreateTaskInput) { return this.tasks.create(input); }

  @Get()
  list(@Query() query: { workItemId?: string; sprintId?: string; projectId?: string; assigneeId?: string }) {
    return this.tasks.findMany(query);
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.tasks.findById(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateTaskInput) { return this.tasks.update(id, input); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.tasks.delete(id); }
}