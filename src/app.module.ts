import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { PrismaModule } from "./core/prisma/prisma.module"
import { APP_GUARD } from "@nestjs/core"
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard"
import { UsuariosModule } from "./usuarios/usuarios.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    PrismaModule,
    UsuariosModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
