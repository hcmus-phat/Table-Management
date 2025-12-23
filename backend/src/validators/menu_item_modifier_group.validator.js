import Joi from 'joi';

export const menuItemModifierGroupSchema = Joi.object({
  menu_item_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'menu_item_id phải là UUID hợp lệ',
      'any.required': 'menu_item_id là bắt buộc'
    }),

  group_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'group_id phải là UUID hợp lệ',
      'any.required': 'group_id là bắt buộc'
    })
})
.options({
  abortEarly: false,
  allowUnknown: false
});
