# TAHFIDZ Design Guidelines

## Design Approach
**System-Based Approach**: Professional dashboard UI with Material Design principles, optimized for data-dense educational management. Clean, minimal aesthetic prioritizing functionality and readability for Islamic education context.

## Core Design Principles
- **Clarity First**: Information hierarchy supports quick scanning of student data, attendance records, and statistics
- **Respectful Simplicity**: Clean, professional design appropriate for Islamic educational institution
- **Data Density**: Maximize information display while maintaining breathability
- **Consistency**: Uniform patterns across all CRUD operations and data tables

---

## Color Palette

### Dark Theme (Primary)
**Background Layers**:
- Primary Background: `0 0% 9%` (near-black)
- Surface/Card: `0 0% 13%` (elevated elements)
- Surface Elevated: `0 0% 16%` (modals, dropdowns)

**Text**:
- Primary Text: `0 0% 95%` (high contrast)
- Secondary Text: `0 0% 70%` (labels, metadata)
- Muted Text: `0 0% 50%` (placeholders, disabled)

**Accents**:
- Primary Action: `142 76% 36%` (Islamic green - for primary CTAs, success states)
- Primary Hover: `142 76% 32%`
- Info/Links: `217 91% 60%` (blue for data links, charts)
- Warning: `38 92% 50%` (amber for alerts)
- Error: `0 84% 60%` (red for validation)

**Borders & Dividers**:
- Border: `0 0% 20%` (subtle separation)
- Border Emphasis: `0 0% 25%` (focused states)

### Light Theme (Secondary)
**Background Layers**:
- Primary Background: `0 0% 98%`
- Surface/Card: `0 0% 100%`
- Surface Elevated: `0 0% 100%` with subtle shadow

**Text**:
- Primary Text: `0 0% 10%`
- Secondary Text: `0 0% 35%`
- Muted Text: `0 0% 55%`

**Accents**: Maintain same hues, adjust lightness for contrast

---

## Typography

**Font Families**:
- Interface: `Inter` (Google Fonts) - all UI text, tables, forms
- Data/Numbers: `JetBrains Mono` - monospaced for numerical data, IDs
- Arabic Text: `Noto Sans Arabic` - for Qur'an-related terms (Surah names, etc.)

**Scale**:
- Display (Dashboard Title): `text-3xl` (30px), `font-bold`
- H1 (Page Titles): `text-2xl` (24px), `font-semibold`
- H2 (Section Headings): `text-xl` (20px), `font-semibold`
- H3 (Card Titles): `text-lg` (18px), `font-medium`
- Body: `text-base` (16px), `font-normal`
- Small (Labels, Metadata): `text-sm` (14px)
- Tiny (Timestamps, IDs): `text-xs` (12px)

---

## Layout System

**Spacing Primitives**: Use Tailwind units `2, 4, 6, 8, 12, 16` exclusively
- Component Padding: `p-6` (cards, sections)
- Stack Gap: `gap-4` (form fields, list items)
- Section Spacing: `space-y-8` (major sections)
- Compact Spacing: `gap-2` (inline elements, tags)

**Grid System**:
- Dashboard Stats: `grid-cols-2 md:grid-cols-4 gap-4`
- Data Tables: Full-width with horizontal scroll on mobile
- Forms: `max-w-2xl` for single-column forms, `grid-cols-2` for compact dual-column

**Container**: `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`

---

## Component Library

### Navigation
**Sidebar** (Desktop):
- Width: `256px` (`w-64`)
- Background: Surface color with border-right
- Active item: Green accent background at 10% opacity
- Icons: 20px, left-aligned with text

**Mobile Nav**:
- Collapsible hamburger menu
- Full-screen overlay with backdrop blur

**Breadcrumbs**: Simple text-based, muted color, separated by `/`

### Dashboard Cards
**Stat Cards**:
- White/dark surface with subtle border
- Large number display (text-3xl, font-bold, JetBrains Mono)
- Label below (text-sm, muted)
- Icon top-right (24px, green tint)
- Hover: Subtle scale (scale-[1.02])

**Chart Cards**:
- Title bar with filter controls (date range, marhalah selector)
- Chart area: 300-400px height
- Legend below chart
- Color palette: Green (primary data), Blue (secondary), Amber (warnings)

### Tables
**Structure**:
- Sticky header with dark background
- Alternating row backgrounds (subtle 2% opacity difference)
- Row hover: 5% opacity highlight
- Compact padding: `py-3 px-4`
- Borders: Bottom borders only (horizontal rules)

**Features**:
- Search input: Top-left, icon-prefixed, `w-64`
- Filters: Dropdown chips, right-aligned
- Pagination: Bottom-right, showing "X-Y of Z entries"
- Action buttons: Icon-only (edit/delete), right column, visible on hover

### Forms
**Input Fields**:
- Background: Darker than surface for dark mode, white for light
- Border: `border border-border`
- Focus: Green accent ring (`ring-2 ring-primary`)
- Label: Above input, `text-sm font-medium`
- Error state: Red border + error message below

**Radio Groups** (Absensi):
- Horizontal layout with `gap-3`
- Default "Hadir" pre-selected with green checkmark
- Clear visual indicators for each status
- Labels in Indonesian

**Submit Buttons**:
- Primary: Green background, white text, `px-6 py-2.5`
- Secondary: Outline style with green border
- Disabled: 50% opacity, cursor-not-allowed

### Modals & Dialogs
- Backdrop: Black at 60% opacity with blur
- Modal: Surface color, `max-w-lg`, centered, `p-6`
- Header: Title + close button (X icon)
- Footer: Right-aligned action buttons with `gap-3`

### Loading States
- Skeleton loaders: Animated pulse, matching component shapes
- Spinner: Green circular spinner for async actions
- Progress bars: Green with gray background

### Alerts & Notifications
- Toast notifications: Top-right corner
- Colors: Green (success), Blue (info), Amber (warning), Red (error)
- Icon + message + close button
- Auto-dismiss after 5 seconds

---

## Page-Specific Layouts

### Dashboard
- 2x2 stat grid at top (4 cards)
- Two-column layout below: Charts (left 2/3) + Tasks list (right 1/3)
- Each chart in separate card with title and filters
- Consistent `gap-6` between all elements

### Data Halaqah
- Filter bar at top: Marhalah dropdown + search
- Full-width data table with 8 columns (as specified)
- "Tambah Halaqah" button top-right (green)
- Pagination bottom-right

### Absensi Halaqah
- Filter trio at top: Marhalah | Waktu | Tanggal (date picker)
- Accordion-style halaqah groups (expandable)
- Each halaqah shows Musammi + list of Santri
- Radio buttons aligned right for each row
- "Submit Absensi" button bottom-right (large, prominent)

---

## Responsive Behavior
- **Desktop (lg+)**: Sidebar visible, multi-column layouts
- **Tablet (md)**: Sidebar collapses to hamburger, 2-column where applicable
- **Mobile (base)**: Single column, horizontal scroll for tables, stacked stats

---

## Accessibility
- Dark mode as default with light mode toggle available
- High contrast ratios (WCAG AA minimum)
- Keyboard navigation for all interactive elements
- Focus indicators (green ring) on all focusable elements
- Arabic text properly aligned (RTL for Arabic segments only, LTR for interface)

---

## Animation Guidelines
**Minimal, Purposeful Only**:
- Hover transitions: `transition-colors duration-200`
- Modal entry: Fade + slight scale (`transition-all duration-300`)
- Loading states: Pulse animation only
- NO scroll animations, parallax, or decorative motion

---

## Images
**No hero images** - This is a utility dashboard application.
**Icons only**: Use Heroicons (outline for navigation, solid for actions) via CDN.
**Profile placeholders**: Use initials in colored circles for users if needed.