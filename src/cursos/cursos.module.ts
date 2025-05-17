import { Module } from "@nestjs/common"
import { CursosService } from "./cursos.service"
import { CursosController } from "./cursos.controller"

/**
 * Módulo responsável pelo gerenciamento de cursos
 * Fornece funcionalidades para criar, listar, atualizar e remover cursos
 * O acesso à maioria das rotas é restrito ao Diretor Acadêmico
 */
@Module({
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService], // Exporta o serviço para ser utilizado por outros módulos
})
export class CursosModule {}
