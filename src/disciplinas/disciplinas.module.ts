import { Module } from "@nestjs/common"
import { DisciplinasController } from "./disciplinas.controller"
import { DisciplinasService } from "./disciplinas.service"
import { PrismaModule } from "../core/prisma/prisma.module"

/**
 * Módulo responsável por gerenciar as disciplinas do sistema
 * Provê funcionalidades para criar, listar, atualizar e excluir disciplinas
 */
@Module({
  imports: [PrismaModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasService],
  exports: [DisciplinasService],
})
export class DisciplinasModule {}
