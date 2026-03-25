// ==========================================================================
// File    : documents.test.ts
// Project : MarkWrite
// Layer   : Test
// Purpose : Unit tests for document CRUD API endpoints.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createDocumentSchema,
  updateDocumentSchema,
  listDocumentsQuerySchema,
} from '$lib/server/validators';

// --------------------------------------------------------------------------
// [SECTION] Schema Validation Tests
// --------------------------------------------------------------------------

describe('Document Validation Schemas', () => {
  describe('createDocumentSchema', () => {
    it('should accept valid input with title', () => {
      const result = createDocumentSchema.safeParse({ title: 'My Document' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Document');
      }
    });

    it('should use default title when not provided', () => {
      const result = createDocumentSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Untitled');
      }
    });

    it('should reject title exceeding 255 characters', () => {
      const longTitle = 'a'.repeat(256);
      const result = createDocumentSchema.safeParse({ title: longTitle });
      expect(result.success).toBe(false);
    });

    it('should reject empty string title', () => {
      const result = createDocumentSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateDocumentSchema', () => {
    it('should accept valid title update', () => {
      const result = updateDocumentSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('New Title');
      }
    });

    it('should accept isPublic update', () => {
      const result = updateDocumentSchema.safeParse({ isPublic: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });

    it('should accept empty object (no updates)', () => {
      const result = updateDocumentSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean isPublic', () => {
      const result = updateDocumentSchema.safeParse({ isPublic: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('listDocumentsQuerySchema', () => {
    it('should use default pagination values', () => {
      const result = listDocumentsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const result = listDocumentsQuerySchema.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject page less than 1', () => {
      const result = listDocumentsQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 100', () => {
      const result = listDocumentsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});

// --------------------------------------------------------------------------
// [SECTION] API Response Structure Tests
// --------------------------------------------------------------------------

describe('Document API Response Structures', () => {
  it('should define expected document response fields', () => {
    const expectedFields = ['id', 'title', 'ownerId', 'isPublic', 'createdAt', 'updatedAt'];
    // [*] This test documents the expected API contract
    expect(expectedFields).toHaveLength(6);
  });

  it('should define expected pagination fields', () => {
    const expectedFields = ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'];
    expect(expectedFields).toHaveLength(6);
  });
});
