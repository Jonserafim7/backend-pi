import { Global, Module } from "@nestjs/common"
import { PrismaService } from "./prisma.service"

@Global() // Torna o PrismaService disponível globalmente sem precisar importar PrismaModule em todos os módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
