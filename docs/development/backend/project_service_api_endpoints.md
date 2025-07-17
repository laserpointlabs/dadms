# Project Service – API Endpoint Specification

This document details the API endpoints for the Project Service in DADMS 2.0, including endpoint paths, HTTP methods, descriptions, and example request/response schemas.

---

## Endpoints Summary

| Method | Path                              | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/projects`                       | List all projects (with filters)   | Query: filters, pagination    | Array of Project             | Yes   |
| GET    | `/projects/{id}`                  | Get project by ID                  | Path: id                      | Project                      | Yes   |
| POST   | `/projects`                       | Create a new project               | ProjectCreate (JSON)          | Project                      | Yes   |
| PUT    | `/projects/{id}`                  | Update project by ID               | ProjectUpdate (JSON)          | Project                      | Yes   |
| DELETE | `/projects/{id}`                  | Delete project by ID               | Path: id                      | Success/Error                | Yes   |
| GET    | `/projects/{id}/users`            | List users assigned to a project   | Path: id                      | Array of User                | Yes   |
| POST   | `/projects/{id}/users`            | Assign user(s) to a project        | UserAssignment (JSON)         | Success/Error                | Yes   |
| DELETE | `/projects/{id}/users/{userId}`   | Remove user from project           | Path: id, userId              | Success/Error                | Yes   |
| GET    | `/project/health`    | Service health/readiness check              | None                          | HealthStatus (JSON)          | No    |

---

## Example Schemas

### Project Entity (Response)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "decision_context": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "owner_id": "string",
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  ]
}
```

### ProjectCreate (Request)
```json
{
  "name": "string",
  "description": "string",
  "decision_context": "string",
  "owner_id": "string"
}
```

### ProjectUpdate (Request)
```json
{
  "name": "string",
  "description": "string",
  "decision_context": "string"
}
```

### UserAssignment (Request)
```json
{
  "user_ids": ["string", "string"]
}
```

### HealthStatus (Response)
```json
{
  "status": "ok",
  "uptime": 123456,
  "version": "1.0.0"
}
```

---

## Notes
- **Authentication:** All endpoints require authentication (e.g., JWT or session-based; to be specified in implementation).
- **Pagination/Filtering:** List endpoints should support pagination and filtering via query parameters.
- **Error Handling:** Error responses should follow a standard error schema, e.g.:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string (optional)"
  }
}
```

- **Timestamps:** All timestamps are in ISO8601 format.

---

**This document serves as the reference for Project Service API design and implementation.** 