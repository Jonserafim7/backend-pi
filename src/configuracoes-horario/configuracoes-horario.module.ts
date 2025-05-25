import { Module } from "@nestjs/common"
import { ConfiguracoesHorarioController } from "./configuracoes-horario.controller"
import { ConfiguracoesHorarioService } from "./configuracoes-horario.service"
import { PrismaModule } from "../core/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracoesHorarioController],
  providers: [ConfiguracoesHorarioService],
  exports: [ConfiguracoesHorarioService],
})
export class ConfiguracoesHorarioModule {}
