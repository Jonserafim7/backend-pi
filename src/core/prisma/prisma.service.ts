import { Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super() // Configurações do PrismaClient podem ser passadas aqui, se necessário (ex: logging)
  }

  async onModuleInit() {
    // console.log('PrismaService: Connecting to the database...');
    await this.$connect()
    // console.log('PrismaService: Connected to the database.');
  }

  // Não é necessário OnModuleDestroy se usarmos enableShutdownHooks no main.ts
}
