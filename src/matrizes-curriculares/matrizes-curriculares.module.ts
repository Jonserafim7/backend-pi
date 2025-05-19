import { Module } from "@nestjs/common"
import { MatrizesCurricularesController } from "./matrizes-curriculares.controller"
import { MatrizesCurricularesService } from "./matrizes-curriculares.service"
import { PrismaModule } from "../core/prisma/prisma.module"

/**
 * Módulo para gerenciamento de Matrizes Curriculares
 *
 * Este módulo permite que coordenadores gerenciem as matrizes curriculares
 * dos cursos sob sua responsabilidade, definindo as disciplinas que fazem
 * parte de cada matriz curricular
 */
@Module({
  imports: [PrismaModule],
  controllers: [MatrizesCurricularesController],
  providers: [MatrizesCurricularesService],
  exports: [MatrizesCurricularesService],
})
export class MatrizesCurricularesModule {}
