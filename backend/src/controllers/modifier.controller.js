import {
	ModifierGroup,
	ModifierOption,
	MenuItemModifierGroup,
} from "../models/index.js";

import { 
    createModifierGroupSchema,
    updateModifierGroupSchema
} from "../validators/modifier_group.validator.js";

import { validate } from "../middlewares/validator.js";

export const createModifierGroup = [
    validate(createModifierGroupSchema),
    (req, res) => {
        try {
            
        } catch {

        }
    }
]