import { Module } from "@nestjs/common"
import { PropostasHorarioService } from "./propostas-horario.service"
import { PropostasHorarioController } from "./propostas-horario.controller"

/**
 * Módulo responsável pelo gerenciamento de propostas de horário
 * Fornece funcionalidades para criar, gerenciar e aprovar propostas de grade horária
 * Inclui workflow de aprovação entre coordenadores e diretores
 */
@Module({
  controllers: [PropostasHorarioController],
  providers: [PropostasHorarioService],
  exports: [PropostasHorarioService], // Exporta o serviço para ser utilizado por outros módulos
})
export class PropostasHorarioModule {}
