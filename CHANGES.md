# HealTrack Changes Tracker

This document tracks UI/UX improvements and bug fixes as they are implemented.

## Changes Implemented

- **1.1 Sign In Page**: Updated email input placeholder to `user@example.com`
- **1.2 Sign Up Page**: Fixed alignment of country code and phone number fields. Standardized all form inputs to a uniform 44px (`h-11`) height. Resolved horizontal overflow by applying `min-w-0` and maximized visible digits by optimizing field padding and widths.
- **2.1 Super Admin Sidebar**: Increased left padding to `20px` (`pl-5`) on all menu items for proper indentation. Added a transparent border to inactive items to prevent text jitter when the active right-border is applied. Forced left-alignment to override default Button centering.
- **2.1.1 Super Admin Layout**: Fixed an issue where the entire page (including the sidebar) would scroll if content was too long. Replaced `min-h-screen` with `h-screen overflow-hidden` on the root layout to ensure the Sidebar and Top Header remain permanently fixed on screen while only the right main content area scrolls.
- **2.2 Clinic Admin Sidebar**: Forced left-alignment (`!justify-start`) on all navigation links and the logout button to override the default centering of the Button component, ensuring a predictable F-pattern reading flow.
- **2.3 Clinic Dashboard Scrolling**: Added independent scrolling to the Analytics Dashboard. The Right "Filter Dashboard" panel now utilizes `sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto`, ensuring filters remain accessible on screen while the main KPI cards and charts scroll independently.
- **3.1 Doctor Sidebar layout and scroll behavior**: Fixed double scrollbars in Doctor Workstation. Replaced `min-h-screen` with `h-screen overflow-hidden` on the main layout. Left-aligned menu items and unified height to prevent sidebar and layout height mismatch.
- **3.2 Doctor Workstation Navigation**: Replaced full page reloads with SPA state changes. Used standard state tab switcher to toggle views of Queue list, History records, and Analytics without losing doctor workstation state.
- **3.3 Dynamic User Initials**: Display actual patient/doctor initials instead of static 'HP' or 'JD' on their workspace avatars based on their auth profile context.
- **4.1 Reception Desk Layout and Scrolling**: Restructured reception portal root layout to `h-screen overflow-hidden` to avoid double scrollbars and lock layout header in place. Enforced overflow-y scroll container on individual tab contents.
- **4.2 Patient Search Input**: Replaced standard React input with our `SearchBar` component to standardize UI borders, rounded corners, and padding.
- **4.3 Assign Doctor Dropdown Alignment**: Replaced browser-native select elements with `CustomDropdown` component to ensure consistent input heights, border styles, and modern appearance.
- **5.1 Medicine Portal Sidebar Alignment**: Replaced centered layout with left-aligned list items (`!justify-start`) and uniform heights.
- **5.2 Medicine Portal State Management**: Replaced full page navigation with local state tab switching to preserve page context and cache active queries.
- **6.1 Patient Layout and Navbar**: Applied custom drop shadow and standardized branding logo display to the patient portal header.
- **6.2 Dashboard Scrolling and Padding**: Enforced independent scroll containers for patient navigation and dashboards to avoid window-level scrolling.
- **6.3 Payment Modal Alignment**: Redesigned checkout Modal with consistent input padding, centered icons, and uniform heights.
- **7.1 Button Component Default Centering**: Discovered default behavior of Button component having `justify-center`. Overrode this utilizing `!justify-start` class where left-alignment is required in sidebars and tables.
- **7.2 Select Dropdown UX**: Standardized Select input dropdown styling across all roles using the new `CustomDropdown` component to provide a uniform roundness, color palette, and behavior.
- **8.1 Prescription PDF**: Integrated `jspdf` and `jspdf-autotable` to generate professional PDF prescriptions from the Patient Appointment History view. The generated PDF features a structured layout with bold clinic headers, patient demographics, clinical notes, and a clean tabular format for prescribed medications.
- **8.2 PDF Download Bug Fix**: Resolved an issue where the download button would silently fail on click by explicitly importing `jsPDF` from the ES module and directly passing the PDF document instance to `autoTable`, bypassing Vite's prototype-patching limitations.
- **9.1 Refund Logic Update**: Removed the "Request Refund" button from past appointments where the consultation status is marked as 'Completed'. Patients can now only request refunds for active, scheduled, or cancelled appointments that haven't been completed yet. Backend API layer also strictly rejects refund operations on completed consultations.

**Status**: All UI/UX improvements, layout scroll fixes, functional features, and backend logic changes have been fully implemented and committed.
