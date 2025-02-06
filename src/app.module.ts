import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './core/services/app.service';
import { ConfigModule } from '@nestjs/config';
import { TransfersService } from './external/ethers/transfers.service';
import { DatabaseService } from './external/db/database.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TransfersService, DatabaseService],
})
export class AppModule {}
