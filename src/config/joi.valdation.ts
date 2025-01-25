import * as Joi from 'joi';

export const JoinValidatorSchema = Joi.object({
    MONGODB: Joi.required(),
    PORT: Joi.number().default(3005)

})