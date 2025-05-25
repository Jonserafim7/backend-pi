import { Module } from "@nestjs/common"
import { AlocacoesHorariosController } from "./alocacoes-horarios.controller"
import { AlocacoesHorariosService } from "./alocacoes-horarios.service"
import { PrismaModule } from "../core/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [AlocacoesHorariosController],
  providers: [AlocacoesHorariosService],
  exports: [AlocacoesHorariosService],
})
export class AlocacoesHorariosModule {}
