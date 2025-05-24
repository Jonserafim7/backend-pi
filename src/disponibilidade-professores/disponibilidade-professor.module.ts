import { Module } from "@nestjs/common"
import { DisponibilidadeProfessorService } from "./disponibilidade-professor.service"
import { DisponibilidadeProfessorController } from "./disponibilidade-professor.controller"
import { PrismaModule } from "../core/prisma/prisma.module"
import { ConfiguracoesHorarioModule } from "../configuracoes-horario/configuracoes-horario.module"

/**
 * Módulo para gestão de disponibilidade de professores
 * Exporta o service para uso em outros módulos
 * Integra com ConfiguracoesHorarioModule para validar slots válidos
 */
@Module({
  imports: [PrismaModule, ConfiguracoesHorarioModule],
  controllers: [DisponibilidadeProfessorController],
  providers: [DisponibilidadeProfessorService],
  exports: [DisponibilidadeProfessorService],
})
export class DisponibilidadeProfessorModule {}
