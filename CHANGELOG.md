# Changelog

All notable changes to the MSF Admin Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2024-12-19

### Fixed
- **TypeScript Errors**: Fixed TypeScript compilation errors related to non-existent `avatar_url` property on User type
  - Removed `avatar_url` references from `components/app-sidebar.tsx`
  - Removed `avatar_url` references from `components/layout/dashboard-layout.tsx`
  - Fixed `refetch` vs `refetchUser` property naming inconsistency in dashboard layout
  - Fixed `allRoles` vs `all_roles` property naming inconsistency in user role checking
- **User Interface**: Simplified avatar display to use initials fallback consistently since API doesn't provide avatar URLs
- **Code Quality**: Improved type safety by aligning component code with actual API response structure

### Technical Details
- Updated User type references to match actual API schema
- Removed unused avatar upload functionality that was referencing non-existent API endpoints
- Standardized property naming conventions across components

## [1.3.0] - Previous Release
- QR code functionality for badges
- Badge view button in participant details modal
- POA template preview with images and QR code placeholder
- LOI section in participant details modal
- Vetting committee page improvements
- Event card interaction fixes
- Participant controls modernization
- Enhanced participant status management