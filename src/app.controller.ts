import { Controller, Get } from "@nestjs/common"
import { Public } from "./auth"

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return "Hello World!"
  }
}
