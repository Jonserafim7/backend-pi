import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ValidationPipe } from "@nestjs/common"
import { Request, Response } from "express"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
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
  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customJsStr: `
window.addEventListener('load', function() {
  setTimeout(function() { // Adiciona um pequeno delay para garantir que o 'ui' esteja pronto
    if (!window.ui) {
      console.error("Swagger UI object (ui) not found. Automatic token authorization might not work.");
      return;
    }

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const response = await originalFetch(input, init);
      const requestUrl = (typeof input === 'string') ? input : input.url;

      // Verifica se é a requisição de login (POST para /auth/login)
      // e se a resposta foi bem-sucedida (response.ok)
      if (requestUrl.includes("/auth/login") && response.ok && init && init.method && init.method.toUpperCase() === 'POST') {
        const clonedResponse = response.clone(); // Clona para poder ler o corpo duas vezes
        try {
          const responseBody = await clonedResponse.json();
          if (responseBody && responseBody.accessToken) {
            window.ui.preauthorizeApiKey("bearer", responseBody.accessToken);
            console.log("Bearer token automatically set in Swagger UI from /auth/login response.");
          } else {
            console.log("Login response detected, but accessToken not found in body:", responseBody);
          }
        } catch (e) {
          console.error("Error parsing login response or setting token in Swagger UI:", e);
        }
      }
      return response; // Retorna a resposta original para o fluxo normal do Swagger UI
    };
    console.log("Custom Swagger UI script for automatic token authorization loaded.");
  }, 1000); // Delay de 1 segundo para garantir que 'ui' esteja inicializado
});
`,
  })

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
