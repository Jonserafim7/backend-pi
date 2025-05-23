import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { PrismaModule } from "./core/prisma/prisma.module"
import { APP_GUARD } from "@nestjs/core"
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard"
import { UsuariosModule } from "./usuarios/usuarios.module"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { CursosModule } from "./cursos/cursos.module"
import { ConfiguracoesHorarioModule } from "./configuracoes-horario/configuracoes-horario.module"
import { MatrizesCurricularesModule } from "./matrizes-curriculares/matrizes-curriculares.module"
import { DisciplinasModule } from "./disciplinas/disciplinas.module"
import { SemestresLetivosModule } from "./semestres-letivos/semestres-letivos.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    PrismaModule,
    UsuariosModule,
    CursosModule,
    ConfiguracoesHorarioModule,
    MatrizesCurricularesModule,
    DisciplinasModule,
    SemestresLetivosModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AppService,
  ],
})
export class AppModule {}
