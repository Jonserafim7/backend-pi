import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from "class-validator"

/**
 * @decorator IsDateAfter
 * @description Validador customizado para verificar se uma data é posterior a outra data especificada.
 * A validação só ocorre se ambas as datas (a propriedade atual e a propriedade relacionada) existirem.
 *
 * @param {string} property - O nome da propriedade que contém a data que deve ser anterior.
 * @param {ValidationOptions} validationOptions - Opções de validação padrão do class-validator.
 */
export function IsDateAfter<T extends object>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (object: T, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateAfterConstraint,
    })
  }
}

@ValidatorConstraint({ name: "isDateAfter", async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  /**
   * @method validate
   * @description Realiza a validação.
   * @param {Date | string | null | undefined} value - O valor da propriedade atual (espera-se que seja dataFim).
   * @param {ValidationArguments} args - Argumentos de validação, incluindo o objeto e o nome da propriedade relacionada.
   * @returns {boolean} Verdadeiro se a validação passar, falso caso contrário.
   */
  validate(
    value: Date | string | null | undefined,
    args: ValidationArguments,
  ): boolean {
    const [relatedPropertyName] = args.constraints as [string]
    const relatedValue = (args.object as Record<string, any>)[
      relatedPropertyName
    ] as Date | string | null | undefined

    // Só valida se ambas as datas existirem e forem válidas
    if (!value || !relatedValue) {
      return true // Não falha a validação se uma das datas não estiver presente (outros validadores como @IsOptional cuidam disso)
    }

    const dateValue = value instanceof Date ? value : new Date(value)
    const relatedDateValue =
      relatedValue instanceof Date ? relatedValue : new Date(relatedValue)

    if (isNaN(dateValue.getTime()) || isNaN(relatedDateValue.getTime())) {
      return false // Falha se alguma das strings de data não for uma data válida
    }

    return dateValue > relatedDateValue
  }

  /**
   * @method defaultMessage
   * @description Retorna a mensagem de erro padrão.
   * @param {ValidationArguments} args - Argumentos de validação.
   * @returns {string} A mensagem de erro.
   */
  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string]
    return `${args.property} deve ser posterior a ${relatedPropertyName}.`
  }
}
