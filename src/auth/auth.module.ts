import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { APP_GUARD } from "@nestjs/core"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtStrategy } from "./jwt.strategy"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { RolesGuard } from "./guards/roles.guard"

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule já é global, mas é bom ser explícito se necessário em contextos isolados.
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRATION_TIME"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
