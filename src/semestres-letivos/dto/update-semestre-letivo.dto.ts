import { PartialType } from '@nestjs/swagger';
import { CreateSemestreLetivoDto } from './create-semestre-letivo.dto';

export class UpdateSemestreLetivoDto extends PartialType(CreateSemestreLetivoDto) {}
