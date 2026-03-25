// ==========================================================================
// File    : schemas.ts
// Project : MarkWrite
// Layer   : Validation
// Purpose : Zod schemas for document API request validation.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { z } from 'zod';

// --------------------------------------------------------------------------
// [SECTION] Document Schemas
// --------------------------------------------------------------------------

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .optional()
    .default('Untitled'),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or less')
    .optional(),
  isPublic: z.boolean().optional(),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// --------------------------------------------------------------------------
// [SECTION] Type Exports
// --------------------------------------------------------------------------

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
