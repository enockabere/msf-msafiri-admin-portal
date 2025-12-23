# Changelog

All notable changes to the MSF Admin Portal will be documented in this file.

## [1.3.0] - 2024-12-23

### Added
- **Vetting-Only User Interface**: Specialized interface for users with only vetting roles
  - Clean layout with topbar, footer, and no sidebar for focused experience
  - MSafiri logo display in navbar when sidebar is hidden
  - Tenant-specific branding in footer instead of generic MSF
  - Automatic layout detection based on user roles
- **Enhanced Role Management**: Improved role display and permission handling
  - Fixed role display to handle both uppercase and lowercase role names
  - Hidden profile settings for vetting-only users
  - Removed debug information from user dropdown menu
  - Proper role-based access control for different user types
- **Event Filtering for Vetting Users**: Restricted event access for vetting-only users
  - Vetting committee and approver users only see events they are assigned to review
  - Dedicated API endpoint for fetching user-assigned vetting events
  - Improved event access control based on user roles
- **Form Builder Improvements**: Enhanced registration form management
  - Automatic duplicate field removal on form load
  - Automatic missing field restoration without manual intervention
  - Fixed question numbering consistency in form preview
  - Removed manual maintenance buttons for seamless experience

### Fixed
- **Navbar Layout**: Improved spacing and logo positioning when sidebar is hidden
- **Footer Branding**: Dynamic tenant name display instead of static MSF abbreviation
- **Form Question Numbering**: Fixed inconsistent and duplicate question numbers in registration forms
- **Role Display**: Resolved "Unknown Role" display issue for vetting users
- **UI Consistency**: Better visual balance and professional appearance across all layouts

### Technical Improvements
- Enhanced layout system with conditional rendering based on user roles
- Improved form field normalization and sequential numbering
- Better error handling and automatic issue resolution in form builder
- Optimized user experience with reduced manual maintenance requirements

## [1.2.0] - 2024-12-23

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

## [1.1.0] - 2024-12-22

### Added
- **Vetting Committee Management**: Complete vetting committee system for event participant selection
- **Certificate Templates**: Dynamic certificate template creation and management
- **Form Builder**: Enhanced registration form builder with duplicate field removal
- **Super Admin Dashboard**: Specialized dashboard for super administrators

### Fixed
- **Database Schema**: Resolved missing columns and migration issues
- **Role Permissions**: Fixed certificate template editing permissions for super admins
- **User Management**: Improved user role assignment and tenant associations

## [1.0.0] - 2024-12-01

### Added
- Initial release of MSF Admin Portal
- Event management and administration
- User authentication with Microsoft SSO and local credentials
- Tenant management and multi-tenancy support
- Basic dashboard and navigation system