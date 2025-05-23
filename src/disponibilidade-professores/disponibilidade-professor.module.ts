import { Module } from "@nestjs/common"
import { DisponibilidadeProfessorService } from "./disponibilidade-professor.service"
import { DisponibilidadeProfessorController } from "./disponibilidade-professor.controller"
import { PrismaModule } from "../core/prisma/prisma.module"

/**
 * Módulo para gestão de disponibilidade de professores
 * Exporta o service para uso em outros módulos
 */
@Module({
  imports: [PrismaModule],
  controllers: [DisponibilidadeProfessorController],
  providers: [DisponibilidadeProfessorService],
  exports: [DisponibilidadeProfessorService],
})
export class DisponibilidadeProfessorModule {}
