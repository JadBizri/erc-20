import { Controller, Get } from '@nestjs/common';
import { AppService } from '../core/services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
