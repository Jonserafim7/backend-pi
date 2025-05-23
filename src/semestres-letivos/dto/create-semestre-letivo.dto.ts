import { ApiProperty } from '@nestjs/swagger';

export class CreateSemestreLetivoDto {
  @ApiProperty({ example: 2025 })
  ano!: number;

  @ApiProperty({ example: 1, description: 'Semestre (1 ou 2)' })
  semestre!: number;

  @ApiProperty({ example: '2025-02-01' })
  dataInicio?: string;

  @ApiProperty({ example: '2025-06-30' })
  dataFim?: string;
}
