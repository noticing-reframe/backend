import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './application/health/health.module';
import { PersonModule } from './application/person/person.module';
import { ChatModule } from './application/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    PersonModule,
    ChatModule,
  ],
})
export class AppModule {}
