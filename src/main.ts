import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ValidationPipe } from "@nestjs/common"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Configuração do ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Lança erro se propriedades não definidas forem enviadas
      transform: true, // Transforma o payload para o tipo do DTO
      transformOptions: {
        enableImplicitConversion: true, // Permite conversão implícita de tipos (ex: string para número em query params)
      },
    }),
  )

  const config = new DocumentBuilder()
    .setTitle("API Horários Acadêmicos")
    .setDescription(
      "Documentação da API para o Sistema de Elaboração de Horário e Atribuição de Disciplinas",
    )
    .setVersion("1.0")
    .addTag("auth", "Operações de Autenticação")
    .addTag("usuarios", "Gerenciamento de Usuários")
    .addTag("cursos", "Gerenciamento de Cursos")
    // .addBearerAuth() // Descomentar quando JWT estiver configurado
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api-docs", app, document)

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
