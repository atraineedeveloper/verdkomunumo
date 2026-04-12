import { z } from 'zod'
import { POST_MAX_LENGTH, COMMENT_MAX_LENGTH, MESSAGE_MAX_LENGTH } from './constants'

export const registerSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guión bajo'),
  display_name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres')
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido')
})

export const postSchema = z.object({
  content: z
    .string()
    .min(1, 'El post no puede estar vacío')
    .max(POST_MAX_LENGTH, `Máximo ${POST_MAX_LENGTH} caracteres`),
  category_id: z.string().uuid('Categoría requerida')
})

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(COMMENT_MAX_LENGTH, `Máximo ${COMMENT_MAX_LENGTH} caracteres`),
  parent_id: z.string().uuid().optional()
})

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(MESSAGE_MAX_LENGTH, `Máximo ${MESSAGE_MAX_LENGTH} caracteres`)
})

export const profileEditSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guión bajo'),
  display_name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  website: z.string().url('URL no válida').optional().or(z.literal('')),
  esperanto_level: z.enum(['komencanto', 'progresanto', 'flua'])
})

export const appSuggestionSchema = z.object({
  title: z.string().min(4, 'Mínimo 4 caracteres').max(80, 'Máximo 80 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
  context: z.string().max(500, 'Máximo 500 caracteres').optional()
})

export const contentReportSchema = z.object({
  post_id: z.string().uuid().optional(),
  comment_id: z.string().uuid().optional(),
  reason: z.enum(['spam', 'harassment', 'hate', 'nudity', 'violence', 'misinformation', 'other']),
  details: z.string().max(500, 'Máximo 500 caracteres').optional()
}).superRefine((value, ctx) => {
  const targets = Number(Boolean(value.post_id)) + Number(Boolean(value.comment_id))
  if (targets !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes reportar exactamente una publicación o un comentario.'
    })
  }
})

export const categoryAdminSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(40, 'Máximo 40 caracteres'),
  slug: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guion'),
  description: z.string().min(4, 'Mínimo 4 caracteres').max(140, 'Máximo 140 caracteres'),
  icon: z.string().max(32, 'Máximo 32 caracteres').optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Color hexadecimal no válido'),
  sort_order: z.coerce.number().int('Debe ser entero').min(0, 'Mínimo 0').max(999, 'Máximo 999')
})
