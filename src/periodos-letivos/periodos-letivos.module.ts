import { Module } from "@nestjs/common"
import { PeriodosLetivosService } from "./periodos-letivos.service"
import { PeriodosLetivosController } from "./periodos-letivos.controller"
// Importante: Verifique o caminho correto para o PrismaModule ou o módulo que provê o PrismaService.
// Se o PrismaService vem de um módulo em 'src/core/prisma/', o import seria algo como:
import { PrismaModule } from "../core/prisma/prisma.module"

/**
 * @module PeriodosLetivosModule
 * @description Módulo para gerenciar os períodos letivos, encapsulando o controller e o service.
 */
@Module({
  imports: [
    PrismaModule, // Garante que o PrismaService esteja disponível para injeção no PeriodosLetivosService
  ],
  controllers: [PeriodosLetivosController],
  providers: [PeriodosLetivosService],
})
export class PeriodosLetivosModule {}
