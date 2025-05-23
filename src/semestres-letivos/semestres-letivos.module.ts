import { Module } from '@nestjs/common';
import { SemestresLetivosController } from './semestres-letivos.controller';
import { SemestresLetivosService } from './semestres-letivos.service';

@Module({
  controllers: [SemestresLetivosController],
  providers: [SemestresLetivosService],
})
export class SemestresLetivosModule {}
