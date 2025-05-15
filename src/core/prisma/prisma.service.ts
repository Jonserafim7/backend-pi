import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common"
// import { PrismaClient } from '@prisma/client'; // Será descomentado na Tarefa 1.7

@Injectable()
export class PrismaService /* extends PrismaClient implements OnModuleInit, OnModuleDestroy */ {
  // constructor() {
  //   super(); // Configurações do PrismaClient podem ser passadas aqui, se necessário
  // }

  async onModuleInit() {
    // console.log('PrismaService: Connecting to the database...'); // Log para depuração
    // await this.$connect();
    // console.log('PrismaService: Connected to the database.');
  }

  async onModuleDestroy() {
    // console.log('PrismaService: Disconnecting from the database...');
    // await this.$disconnect();
    // console.log('PrismaService: Disconnected from the database.');
  }

  // A configuração de enableShutdownHooks no main.ts pode ser uma alternativa ao OnModuleDestroy manual.
  // Se enableShutdownHooks for usado, o NestJS chamará this.$disconnect() automaticamente.
}
