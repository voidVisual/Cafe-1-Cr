import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order.module';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { MenuItem } from './menu-item.entity';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'cafe_user',
      password: process.env.DB_PASSWORD || 'cafe_password',
      database: process.env.DB_NAME || 'cafe_db',
      entities: [Order, OrderItem, MenuItem],
      synchronize: true, // For development sync
    }),
    TypeOrmModule.forFeature([MenuItem]),
    OrderModule,
  ],
  controllers: [AppController, MenuController],
  providers: [AppService, MenuService],
})
export class AppModule {}
