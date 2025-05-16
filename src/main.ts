import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ValidationPipe } from "@nestjs/common"
import { Request, Response } from "express"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors({
    origin: [
      "http://localhost:5173", // Vite default port
      "http://127.0.0.1:5173",
      // Add production URLs here when deploying
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Accept, Authorization",
  })

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
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  // Setup Swagger UI at /api-docs
  SwaggerModule.setup("api-docs", app, document)
  // Expose the raw Swagger JSON at /api-docs-json for Orval to consume
  app.use("/api-docs-json", (req: Request, res: Response) => {
    res.json(document)
  })

  // Habilitar shutdown hooks para o PrismaService (e outros módulos que implementam OnModuleDestroy)
  app.enableShutdownHooks()

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap().catch((error) => {
  console.error("Failed to start the application:", error)
  process.exit(1)
})
