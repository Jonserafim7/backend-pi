import { Module } from "@nestjs/common"
import { PrismaModule } from "../core/prisma/prisma.module"
import { UsuariosController } from "./usuarios.controller"
import { UsuariosService } from "./usuarios.service"

@Module({
  imports: [PrismaModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
