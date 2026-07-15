import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuItem, MenuItemSchema } from './menu-item.schema';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { OrdersGateway } from './orders.gateway';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_db',
    ),
    MongooseModule.forFeature([{ name: MenuItem.name, schema: MenuItemSchema }]),
  ],
  controllers: [AppController, MenuController, OrdersController],
  providers: [AppService, MenuService, OrdersGateway],
})
export class AppModule {}
