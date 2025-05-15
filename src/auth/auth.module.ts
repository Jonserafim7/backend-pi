import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule já é global, mas é bom ser explícito se necessário em contextos isolados.
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRATION_TIME"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [], // A JwtStrategy e AuthService serão adicionados aqui mais tarde (Tarefa 1.8)
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
