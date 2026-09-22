import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from '../../../src/app.controller.js';
import { AppService } from '../../../src/app.service.js';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(() => {
    appService = { getHello: vi.fn().mockReturnValue('Hello World!') };
    appController = new AppController(appService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appService.getHello).toHaveBeenCalledExactlyOnceWith();
    });
  });
});
