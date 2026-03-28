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
  email: z.string().email('Email no válido'),
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
  display_name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  website: z.string().url('URL no válida').optional().or(z.literal('')),
  location: z.string().max(100, 'Máximo 100 caracteres').optional(),
  esperanto_level: z.enum(['komencanto', 'progresanto', 'flua'])
})

export const categorySuggestionSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(200, 'Máximo 200 caracteres'),
  reason: z.string().max(500, 'Máximo 500 caracteres').optional()
})
