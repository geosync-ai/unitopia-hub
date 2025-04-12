# SCPNG Intranet - Division-Based Access Control

This document provides instructions for setting up and using the division-based access control system in the SCPNG Intranet application.

## Overview

The SCPNG Intranet application implements a role-based access control system that restricts user access based on:
1. The division(s) a user belongs to
2. The role(s) they have within each division

## Database Setup

To set up the database tables and initial data, follow these steps:

1. Run the database setup script to create the necessary tables:
   ```bash
   psql -U your_username -d your_database -f db/setup_division_tables.sql
   ```

2. Import all staff members data:
   ```bash
   psql -U your_username -d your_database -f db/seed_all_staff.sql
   ```

3. Assign users to their respective divisions with appropriate roles:
   ```bash
   psql -U your_username -d your_database -f db/assign_users_to_divisions.sql
   ```

## Database Schema

The system uses three main tables:

1. **divisions** - Contains information about each division
2. **staff_members** - Contains details about each staff member
3. **division_memberships** - Links staff members to divisions with specific roles

## Role Hierarchy

Roles are arranged in a hierarchy (from highest to lowest authority):
1. **admin** - Can access and modify everything
2. **director** - Can access all division content and manage division settings
3. **manager** - Can access most division content and manage certain aspects
4. **officer** - Has standard access to division content
5. **staff** - Has basic access to division content

## Components Used

The division-based access control system uses the following key components:

1. **DivisionProtectedRoute** - A higher-order component that wraps routes requiring division-based access control
2. **DivisionSelector** - A component that allows users to switch between their authorized divisions
3. **useAuth** - A custom hook that provides user authentication and division membership information

## Protected Routes

In `src/App.tsx`, routes that require division-based access are wrapped with `DivisionProtectedRoute`. For example:

```jsx
<Route
  path="/contacts"
  element={
    <DivisionProtectedRoute>
      <Contacts />
    </DivisionProtectedRoute>
  }
/>
```

## Checking Access Programmatically

You can check if a user has access based on their division and role:

```jsx
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const { userHasRole, currentDivisionId } = useAuth();
  
  // Check if user is at least a manager in the current division
  const canEditContent = userHasRole(["admin", "director", "manager"], currentDivisionId);
  
  // Check if user is a director in the executive division
  const canApprovePolicy = userHasRole(["admin", "director"], "executive-division");
  
  return (
    <div>
      {canEditContent && <button>Edit Content</button>}
      {canApprovePolicy && <button>Approve Policy</button>}
    </div>
  );
}
```

## Documentation

For more detailed information about the division-based access control system, refer to:
- [Division-Based Access Control Documentation](docs/division-based-access.md)

## Troubleshooting

If users experience access issues:
1. Verify their email address is correctly entered in the `staff_members` table
2. Check that they have appropriate entries in the `division_memberships` table
3. Review the role assigned to ensure it matches their job requirements
