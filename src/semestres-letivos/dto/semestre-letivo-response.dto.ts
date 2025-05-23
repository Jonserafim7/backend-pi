import { ApiProperty } from '@nestjs/swagger';

export class SemestreLetivoResponseDto {
  @ApiProperty({ example: 'clw9k8z8d0000v8l2g7q1h2b3', description: 'ID do semestre letivo' })
  id!: string;

  @ApiProperty({ example: 2025 })
  ano!: number;

  @ApiProperty({ example: 1, description: 'Semestre (1 ou 2)' })
  semestre!: number;

  @ApiProperty({ example: '2025-02-01' })
  dataInicio?: string;

  @ApiProperty({ example: '2025-06-30' })
  dataFim?: string;
}
