import { Module } from "@nestjs/common"
import { DisciplinasOfertadasService } from "./disciplinas-ofertadas.service"
import { DisciplinasOfertadasController } from "./disciplinas-ofertadas.controller"
import { PrismaModule } from "../core/prisma/prisma.module" // Assuming you have a PrismaModule
import { TurmasModule } from "../turmas/turmas.module" // Import TurmasModule

@Module({
  imports: [
    PrismaModule,
    TurmasModule, // Add TurmasModule here
  ],
  controllers: [DisciplinasOfertadasController],
  providers: [DisciplinasOfertadasService],
  exports: [DisciplinasOfertadasService], // Export service if it will be used by other modules
})
export class DisciplinasOfertadasModule {}
