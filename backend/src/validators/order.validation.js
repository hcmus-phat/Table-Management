import Joi from 'joi';

export const createOrderSchema = Joi.object({
  table_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Mã bàn phải là định dạng UUID hợp lệ',
      'any.required': 'Mã bàn là bắt buộc'
    }),
  
  total_amount: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Tổng tiền phải là số',
      'number.min': 'Tổng tiền không được nhỏ hơn 0',
      'any.required': 'Tổng tiền là bắt buộc'
    }),
  
  ordered_at: Joi.date()
    .iso()
    .optional()
    .default(() => new Date())
});

// Xuất cả dạng đặt tên và default để tránh lỗi "is not a function"
export default {
  createOrderSchema
};