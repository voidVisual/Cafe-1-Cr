import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('api/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu() {
    return this.menuService.getMenu();
  }

  @Post()
  createMenu(@Body() data: any) {
    return this.menuService.createMenu(data);
  }

  @Put(':id')
  updateMenu(@Param('id') id: string, @Body() data: any) {
    return this.menuService.updateMenu(id, data);
  }

  @Delete(':id')
  deleteMenu(@Param('id') id: string) {
    return this.menuService.deleteMenu(id);
  }
}
