import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FactOrder } from './fact-order.entity';
import { DimItem } from './dim-item.entity';
import { DimTime } from './dim-time.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'cafe_user',
      password: process.env.DB_PASSWORD || 'cafe_password',
      database: process.env.DB_NAME || 'cafe_db',
      entities: [FactOrder, DimItem, DimTime],
      synchronize: true, // For dev
    }),
    TypeOrmModule.forFeature([FactOrder, DimItem, DimTime]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
