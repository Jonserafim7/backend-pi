import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  INestApplication,
} from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

/**
 * Service that provides a Prisma client instance and handles its lifecycle
 * Connects to the database on module initialization and disconnects on module destruction
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
        { emit: "stdout", level: "error" },
      ],
    })
  }

  /**
   * Connects to the database when the module is initialized
   */
  async onModuleInit() {
    this.logger.log("Connecting to the database...")
    await this.$connect()
    this.logger.log("Connected to the database successfully")
  }

  /**
   * Disconnects from the database when the module is destroyed
   */
  async onModuleDestroy() {
    this.logger.log("Disconnecting from the database...")
    await this.$disconnect()
    this.logger.log("Disconnected from the database successfully")
  }

  /**
   * Enable shutdown hooks to properly close database connections when the application is terminated
   * @param app - The NestJS application instance
   */
  enableShutdownHooks(app: INestApplication) {
    // Using type assertion for $on method as PrismaClient type definitions may not properly expose event methods
    // @ts-expect-error PrismaClient type definitions don't properly expose event methods
    this.$on("beforeExit", () => {
      this.logger.log("PrismaClient beforeExit event triggered")
      void app.close()
    })
  }
}
