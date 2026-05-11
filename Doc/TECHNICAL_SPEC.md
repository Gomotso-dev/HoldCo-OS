# HoldCo OS - Technical Specification

## 1. Core Interfaces (`src/types.ts`)
```typescript
export interface Company {
  id: string;
  name: string;
  tradingName?: string;
  legalEntityType: CompanyLegalType;
  groupRole: CompanyGroupRole;
  registrationNumber: string;
  incorporationDate: string;
  taxNumber?: string;
  vatNumber?: string;
  payeNumber?: string;
  uifNumber?: string;
  industry?: string;
  financialYearEnd: string;
  status: CompanyStatus;
  notes?: string;
  owner_id: string;
  createdAt: string;
  updatedAt: string;
}
```

## 2. Page Components
### Companies Page (`src/pages/Companies.tsx`)
- Handles the listing of all companies.
- Contains the "Add New Company" modal.
- Implements search and filtering logic.

### Company Profile (`src/pages/CompanyProfile.tsx`)
- Detailed view with tabbed navigation.
- Implements the "Edit Details" modal.
- Manages sub-entities like Shareholders and Directors.

### Structure Page (`src/pages/Structure.tsx`)
- Visualizes the group hierarchy.
- Maps parent-child relationships using `company_relationships` table.

## 3. API & Database Layer
- **Client**: `src/lib/supabase.ts`
- **Activity Logging**: `src/lib/activity.ts`
- **Auth Scoping**: All queries use `.eq('owner_id', user.id)` to ensure data privacy.

---
*Technical Specification generated on April 15, 2026*
