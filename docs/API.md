# API Reference

> **Version:** 1.0  
> **Base URL:** `https://markwrite.app/api` (production) | `http://localhost:5173/api` (development)  
> **Authentication:** Session-based (cookie)

This document provides a complete reference for MarkWrite's REST API endpoints.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Documents API](#documents-api)
4. [Sharing API](#sharing-api)
5. [Versions API](#versions-api)
6. [User API](#user-api)
7. [Error Handling](#error-handling)

---

## Overview

### Base URL

| Environment | URL                         |
| ----------- | --------------------------- |
| Production  | `https://markwrite.app/api` |
| Development | `http://localhost:5173/api` |

### Authentication

All API requests (except public document access) require authentication via session cookie. The session is established through GitHub OAuth login.

### Request Format

- **Content-Type:** `application/json`
- **Accept:** `application/json`

### Response Format

All responses return JSON with consistent structure:

**Success Response:**

```json
{
  "data": { ... },
  "pagination": { ... }  // For list endpoints
}
```

**Error Response:**

```json
{
  "message": "Error description",
  "errors": { ... }  // Validation errors (optional)
}
```

---

## Authentication

### GitHub OAuth Flow

Authentication is handled through GitHub OAuth. The flow is initiated by navigating to the login endpoint.

#### Initiate Login

```
GET /auth/github
```

Redirects the user to GitHub for authentication.

**Response:** `302 Redirect` to GitHub OAuth

---

#### OAuth Callback

```
GET /auth/github/callback
```

Handles the GitHub OAuth callback. Creates or updates the user account and establishes a session.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Authorization code from GitHub |
| `state` | string | CSRF protection state |

**Response:** `302 Redirect` to `/documents`

---

#### Logout

```
POST /auth/logout
```

Terminates the current session.

**Response:**

```json
{
  "success": true
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Successfully logged out |
| `302` | Redirect to home page |

---

## Documents API

### List Documents

```
GET /api/documents
```

Returns a paginated list of documents owned by the authenticated user.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Items per page (max: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Project Proposal",
      "ownerId": "user_123",
      "isPublic": false,
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-04T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized - not logged in |

---

### Create Document

```
POST /api/documents
```

Creates a new document owned by the authenticated user.

**Request Body:**

```json
{
  "title": "New Document"
}
```

| Field   | Type   | Required | Constraints      |
| ------- | ------ | -------- | ---------------- |
| `title` | string | Yes      | 1-255 characters |

**Response:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "New Document",
  "ownerId": "user_123",
  "isPublic": false,
  "createdAt": "2026-04-04T16:00:00.000Z",
  "updatedAt": "2026-04-04T16:00:00.000Z"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `201` | Document created |
| `400` | Validation error |
| `401` | Unauthorized |

---

### Get Document

```
GET /api/documents/{id}
```

Returns a single document by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Project Proposal",
  "ownerId": "user_123",
  "isPublic": false,
  "yjsState": "AQL...", // Base64 encoded Yjs state
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-04-04T15:30:00.000Z",
  "permission": "owner" // "owner" | "edit" | "view"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `404` | Document not found or no access |

---

### Update Document

```
PATCH /api/documents/{id}
```

Updates document metadata.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Request Body:**

```json
{
  "title": "Updated Title",
  "isPublic": true
}
```

| Field      | Type    | Required | Constraints      |
| ---------- | ------- | -------- | ---------------- |
| `title`    | string  | No       | 1-255 characters |
| `isPublic` | boolean | No       | Owner only       |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "ownerId": "user_123",
  "isPublic": true,
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-04-04T16:30:00.000Z"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Validation error |
| `401` | Unauthorized |
| `403` | Forbidden (no edit permission) |
| `404` | Document not found |

---

### Delete Document

```
DELETE /api/documents/{id}
```

Deletes a document. Only the owner can delete.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:** `204 No Content`

**Response Codes:**
| Code | Description |
|------|-------------|
| `204` | Successfully deleted |
| `401` | Unauthorized |
| `403` | Forbidden (not owner) |
| `404` | Document not found |

---

### Get Document State

```
GET /api/documents/{id}/state
```

Returns the Yjs state for a document. Used for initial document load.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "state": "AQL...", // Base64 encoded Yjs state (null if empty)
  "updatedAt": "2026-04-04T15:30:00.000Z"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `403` | Access denied |
| `404` | Document not found |

---

### Update Document State

```
PUT /api/documents/{id}/state
```

Updates the Yjs state for a document. Used by the sync server.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Request Body:**

```json
{
  "state": "AQL..." // Base64 encoded Yjs state
}
```

**Response:**

```json
{
  "success": true,
  "updatedAt": "2026-04-04T16:30:00.000Z"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid state format |
| `401` | Unauthorized |
| `403` | No edit permission |
| `404` | Document not found |

---

## Sharing API

### Generate Share Token

```
POST /api/documents/{id}/share
```

Generates a new share token for the document. Only the owner can generate tokens.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "shareToken": "abc123xyz789..." // 32-character nanoid
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | Not the document owner |
| `404` | Document not found |

---

### Revoke Share Token

```
DELETE /api/documents/{id}/share
```

Revokes the share token, disabling link-based access.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "success": true
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | Not the document owner |
| `404` | Document not found |

---

### List Collaborators

```
GET /api/documents/{id}/collaborators
```

Returns all collaborators for a document. Only the owner can view.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "collaborators": [
    {
      "userId": "user_456",
      "permission": "edit"
    },
    {
      "userId": "user_789",
      "permission": "view"
    }
  ]
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | Not the document owner |
| `404` | Document not found |

---

### Add Collaborator

```
POST /api/documents/{id}/collaborators
```

Adds a user as a collaborator. The user must have logged into MarkWrite at least once.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Request Body:**

```json
{
  "username": "github_username",
  "permission": "edit"
}
```

| Field        | Type   | Required | Values               |
| ------------ | ------ | -------- | -------------------- |
| `username`   | string | Yes      | GitHub username      |
| `permission` | string | Yes      | `"view"` or `"edit"` |

**Response:**

```json
{
  "success": true
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid request or cannot add owner |
| `401` | Unauthorized |
| `403` | Not the document owner |
| `404` | Document or user not found |

---

### Remove Collaborator

```
DELETE /api/documents/{id}/collaborators
```

Removes a collaborator from the document.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Request Body:**

```json
{
  "userId": "user_456"
}
```

**Response:**

```json
{
  "success": true
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Missing userId |
| `401` | Unauthorized |
| `403` | Not the document owner |
| `404` | Document not found |

---

### Create Gist

```
POST /api/documents/{id}/gist
```

Creates or updates a GitHub Gist from the document content.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "success": true,
  "gistId": "abc123...",
  "gistUrl": "https://gist.github.com/user/abc123...",
  "rawUrl": "https://gist.githubusercontent.com/..."
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized or missing GitHub token |
| `403` | Not the document owner |
| `404` | Document not found |
| `500` | GitHub API error |

---

### Unlink Gist

```
DELETE /api/documents/{id}/gist
```

Removes the Gist association from the document (does not delete the Gist from GitHub).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "success": true
}
```

---

## Versions API

### List Versions

```
GET /api/documents/{id}/versions
```

Returns all version snapshots for a document.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "versions": [
    {
      "id": "version_123",
      "label": "Before major refactor",
      "createdAt": "2026-04-04T14:00:00.000Z",
      "author": {
        "id": "user_123",
        "username": "johndoe",
        "avatarUrl": "https://avatars.githubusercontent.com/..."
      }
    },
    {
      "id": "version_122",
      "label": null,
      "createdAt": "2026-04-04T12:00:00.000Z",
      "author": null // Auto-saved version
    }
  ]
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | Access denied |
| `404` | Document not found |

---

### Create Version

```
POST /api/documents/{id}/versions
```

Creates a manual version snapshot.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Request Body:**

```json
{
  "label": "Version name (optional)",
  "yjsSnapshot": "AQL..." // Base64 encoded Yjs snapshot
}
```

| Field         | Type   | Required | Description                |
| ------------- | ------ | -------- | -------------------------- |
| `label`       | string | No       | User-defined version label |
| `yjsSnapshot` | string | Yes      | Base64 encoded Yjs state   |

**Response:** `201 Created`

```json
{
  "id": "version_124"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `201` | Version created |
| `400` | Missing yjsSnapshot |
| `401` | Unauthorized |
| `403` | No edit permission |
| `404` | Document not found |

---

### Get Version

```
GET /api/documents/{id}/versions/{versionId}
```

Returns a specific version snapshot.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |
| `versionId` | string | Version UUID |

**Response:**

```json
{
  "id": "version_123",
  "label": "Before major refactor",
  "yjsSnapshot": "AQL...",
  "createdAt": "2026-04-04T14:00:00.000Z",
  "author": {
    "id": "user_123",
    "username": "johndoe",
    "avatarUrl": "https://avatars.githubusercontent.com/..."
  }
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | Access denied |
| `404` | Document or version not found |

---

### Restore Version

```
POST /api/documents/{id}/versions/{versionId}/restore
```

Restores a document to a previous version by creating a new version from the snapshot.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |
| `versionId` | string | Version UUID to restore |

**Response:**

```json
{
  "success": true,
  "newVersionId": "version_125"
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |
| `403` | No edit permission |
| `404` | Document or version not found |

---

## User API

### Get User Settings

```
GET /api/user/settings
```

Returns the current user's settings and profile.

**Response:**

```json
{
  "settings": {
    "theme": "system",
    "fontSize": 14,
    "fontFamily": "mono",
    "tabSize": 2,
    "lineWrapping": true,
    "autoSaveInterval": 30,
    "spellCheck": false,
    "showLineNumbers": true
  },
  "profile": {
    "id": "user_123",
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "https://avatars.githubusercontent.com/...",
    "createdAt": "2026-03-01T00:00:00.000Z"
  },
  "stats": {
    "ownedDocuments": 12,
    "collaborations": 5
  }
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Unauthorized |

---

### Update User Settings

```
PATCH /api/user/settings
```

Updates user settings. Only include fields to update.

**Request Body:**

```json
{
  "theme": "dark",
  "fontSize": 16
}
```

| Field              | Type    | Values/Range                                  |
| ------------------ | ------- | --------------------------------------------- |
| `theme`            | string  | `"light"`, `"dark"`, `"system"`               |
| `fontSize`         | integer | 12-24                                         |
| `fontFamily`       | string  | `"mono"`, `"jetbrains"`, `"fira"`, `"source"` |
| `tabSize`          | integer | 2 or 4                                        |
| `lineWrapping`     | boolean |                                               |
| `autoSaveInterval` | integer | 10-300 (seconds)                              |
| `spellCheck`       | boolean |                                               |
| `showLineNumbers`  | boolean |                                               |

**Response:**

```json
{
  "settings": {
    "theme": "dark",
    "fontSize": 16,
    ...
  }
}
```

**Response Codes:**
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid settings value |
| `401` | Unauthorized |

---

## Error Handling

### Error Response Format

All errors return a JSON response with a `message` field:

```json
{
  "message": "Human-readable error description"
}
```

For validation errors, an `errors` object is included:

```json
{
  "message": "Validation failed",
  "errors": {
    "title": ["Title is required", "Title must be less than 255 characters"]
  }
}
```

### HTTP Status Codes

| Code  | Meaning               | When Used                           |
| ----- | --------------------- | ----------------------------------- |
| `200` | OK                    | Successful GET, PATCH, DELETE       |
| `201` | Created               | Successful POST (resource created)  |
| `204` | No Content            | Successful DELETE (no body)         |
| `400` | Bad Request           | Validation error, malformed JSON    |
| `401` | Unauthorized          | Not logged in                       |
| `403` | Forbidden             | Logged in but no permission         |
| `404` | Not Found             | Resource doesn't exist or no access |
| `500` | Internal Server Error | Unexpected server error             |

### Common Error Messages

| Message                   | Cause                                      |
| ------------------------- | ------------------------------------------ |
| `"Unauthorized"`          | Session cookie missing or expired          |
| `"Document not found"`    | Invalid document ID or no access           |
| `"Forbidden"`             | Authenticated but insufficient permissions |
| `"Only the owner can..."` | Action restricted to document owner        |
| `"Validation failed"`     | Request body failed schema validation      |
| `"Invalid JSON body"`     | Request body is not valid JSON             |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Endpoint Category | Limit               |
| ----------------- | ------------------- |
| Authentication    | 10 requests/minute  |
| Document CRUD     | 60 requests/minute  |
| Document State    | 120 requests/minute |
| User Settings     | 30 requests/minute  |

When rate limited, the API returns:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

---

## WebSocket API

The sync server uses WebSocket for real-time collaboration. See the [Architecture documentation](ARCHITECTURE.md) for details on the Yjs protocol.

**Connection URL:**

```
wss://sync.markwrite.app/{documentId}
```

**Authentication:**

- Session cookie is validated on connection
- Token-based access supported for shared links
