import { z } from 'zod';

export const createHierarchySchema = z.object({
  name: z.string({ required_error: 'الاسم مطلوب' }).min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  code: z.string({ required_error: 'الرمز مطلوب' }).min(2, 'الرمز يجب أن يكون حرفين على الأقل'),
  type: z.enum(['MINISTRY', 'GOVERNORATE', 'DEPARTMENT', 'SECTION', 'UNIT', 'PROVINCE', 'DISTRICT', 'POLICE_STATION'], {
    required_error: 'نوع الكيان الإداري مطلوب'
  }),
  parentId: z.string().uuid('معرف الكيان الأب غير صالح').nullable().optional()
});

export const updateHierarchySchema = z.object({
  id: z.string({ required_error: 'المعرف الفريد مطلوب' }).uuid('معرف غير صالح'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
  code: z.string().min(2, 'الرمز يجب أن يكون حرفين على الأقل').optional(),
});
