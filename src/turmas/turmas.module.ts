import { Module } from "@nestjs/common"
import { TurmasService } from "./turmas.service"
import { TurmasController } from "./turmas.controller"
import { PrismaModule } from "../core/prisma/prisma.module" // Assuming PrismaModule is central
// import { AuthModule } from '../auth/auth.module'; // If guards from AuthModule are used globally or complex auth needed

@Module({
  imports: [
    PrismaModule,
    // AuthModule, // If JWT/Roles guards are not global and need to be imported
  ],
  controllers: [TurmasController],
  providers: [TurmasService],
  exports: [TurmasService], // Export TurmasService so it can be injected into other modules
})
export class TurmasModule {}
