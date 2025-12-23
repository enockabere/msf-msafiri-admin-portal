# Changelog

All notable changes to the MSF Admin Portal will be documented in this file.

## [1.2.0 "Harmony"] - 2024-12-23

### Added
- **Multi-Role Authentication**: Enhanced authentication system to support users with multiple roles
  - Users can have primary roles (SUPER_ADMIN, MT_ADMIN, etc.) and secondary vetting roles
  - Support for VETTING_COMMITTEE and VETTING_APPROVER roles
  - Multi-tenant access with role-based permissions per tenant
- **Tenant Selection**: Added tenant selection interface for users with access to multiple organizations
  - Clean UI for selecting which organization to access
  - Role display for each tenant association
  - Automatic redirection based on user permissions
- **Temporary Password Detection**: Enhanced password management system
  - Automatic detection of temporary passwords from vetting committee invitations
  - Forced password change for users with temporary credentials
  - Dashboard-level protection to prevent bypass attempts
- **Version Management**: Added version tracking and changelog display
  - Version number displayed on login page
  - Structured changelog management
  - Release tracking and documentation

### Fixed
- **Vetting Committee Roles**: Fixed role assignment to preserve existing user roles when adding vetting permissions
- **Login Redirects**: Improved login flow to handle multi-role and multi-tenant scenarios
- **Access Control**: Enhanced role-based access control to check all user roles instead of just primary role
- **Password Change Flow**: Fixed temporary password detection and mandatory password change enforcement

### Technical Improvements
- Enhanced NextAuth configuration for multi-role support
- Improved API integration for role and tenant management
- Better error handling and user feedback
- Optimized authentication flow and session management

## [1.1.0 "Foundation"] - 2024-12-22

### Added
- **Vetting Committee Management**: Complete vetting committee system for event participant selection
- **Certificate Templates**: Dynamic certificate template creation and management
- **Form Builder**: Enhanced registration form builder with duplicate field removal
- **Super Admin Dashboard**: Specialized dashboard for super administrators

### Fixed
- **Database Schema**: Resolved missing columns and migration issues
- **Role Permissions**: Fixed certificate template editing permissions for super admins
- **User Management**: Improved user role assignment and tenant associations

## [1.0.0 "Genesis"] - 2024-12-01

### Added
- Initial release of MSF Admin Portal
- Event management and administration
- User authentication with Microsoft SSO and local credentials
- Tenant management and multi-tenancy support
- Basic dashboard and navigation system