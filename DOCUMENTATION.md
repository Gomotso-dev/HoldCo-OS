# HoldCo OS - Project Documentation & Summary

## Project Overview
HoldCo OS is a comprehensive management platform for holding companies to manage their subsidiaries, legal entities, compliance, and financial data. This document summarizes the recent updates and the current state of the application's core company management features.

---

## 1. Database Schema (Supabase)

The `companies` table has been updated to support detailed South African legal entity tracking and group role definitions.

### SQL Schema Update
```sql
-- Table: companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS "legalEntityType" TEXT DEFAULT 'Private Company (Pty) Ltd',
ADD COLUMN IF NOT EXISTS "groupRole" TEXT DEFAULT 'Operating Company',
ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT,
ADD COLUMN IF NOT EXISTS "incorporationDate" DATE,
ADD COLUMN IF NOT EXISTS "financialYearEnd" TEXT DEFAULT 'February',
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Casing Convention:
-- owner_id: snake_case (for system/auth consistency)
-- Business Fields: camelCase (to match frontend state)
```

### Field Definitions
| Field | Type | Description |
|-------|------|-------------|
| `name` | Text | Full registered company name |
| `legalEntityType` | Text | Entity type (e.g., Pty Ltd, Ltd, NPC, CC) |
| `groupRole` | Text | Role in structure (e.g., Holding, Subsidiary, SPV) |
| `status` | Text | Current status (Active, Dormant, Pending, Closed) |
| `registrationNumber` | Text | CIPC Registration Number |
| `incorporationDate` | Date | Date of incorporation |
| `financialYearEnd` | Text | Month of financial year end |
| `owner_id` | UUID | Reference to the authenticated user |
| `notes` | Text | Additional company notes |

---

## 2. Key Features Implemented

### A. Enhanced "Add New Company" Form
A comprehensive, mobile-responsive form for onboarding new entities into the register.
- **Validation**: Strict validation for required fields.
- **South African Context**: Pre-populated with SA legal entity types.
- **Real-time Feedback**: Loading states and error handling for database inserts.

### B. Detailed Company Profile
A 360-degree view of each entity, organized into logical tabs:
- **Overview**: Displays core identity and registration data.
- **Legal & Tax**: Tracks tax numbers (VAT, PAYE, UIF).
- **Ownership**: Manages shareholders, directors, and beneficial owners.
- **Documents**: Vault for legal and financial filings.
- **Compliance**: Real-time tracking of upcoming deadlines.

### C. Group Structure Visualization
An interactive tree-view visualization that maps relationships between holding companies and subsidiaries.
- **Dynamic Filtering**: Automatically identifies "Holding Company" roles to build the hierarchy.
- **Ownership Mapping**: Displays ownership percentages and relationship types.

---

## 3. Technical Implementation Details

### Frontend Stack
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (Utility-first design)
- **Animations**: Framer Motion (Smooth transitions and modals)
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend Integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime for activity logs and data sync.

### Type Safety
The project uses TypeScript for end-to-end type safety. The `Company` interface in `src/types.ts` is the source of truth for data structures.

---

## 4. How to Download as PDF
To save this documentation as a PDF:
1. Open the `DOCUMENTATION.md` file in the file explorer.
2. Copy the content into a Markdown editor (like VS Code or Obsidian).
3. Use the **"Export to PDF"** or **"Print to PDF"** feature in your editor or browser.

---
*Documentation generated on April 15, 2026*
