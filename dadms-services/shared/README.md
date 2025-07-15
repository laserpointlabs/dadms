# Shared Types and Utilities for DADMS Services

This package contains shared TypeScript types, utilities, and common code used across all DADMS services.

## Structure

```
shared/
├── src/
│   ├── types/           # TypeScript interfaces and types
│   ├── utils/           # Utility functions
│   ├── constants/       # Shared constants
│   ├── middleware/      # Express middleware
│   └── database/        # Database utilities
├── package.json
└── tsconfig.json
```

## Usage

```typescript
// Import shared types
import { Project, User, ApiResponse } from '@dadms/shared/types';

// Import utilities
import { logger, validateUUID } from '@dadms/shared/utils';

// Import constants
import { API_ROUTES, HTTP_STATUS } from '@dadms/shared/constants';
```

## Installation

This package is automatically linked in the monorepo workspace. Services can import directly:

```json
{
  "dependencies": {
    "@dadms/shared": "workspace:*"
  }
}
```
