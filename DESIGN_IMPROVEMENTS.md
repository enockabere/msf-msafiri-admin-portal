# EventParticipants.tsx - Design Improvements Plan

## Current Issues
1. **Too cluttered header** - Search, filters, bulk actions, export all cramped together
2. **Poor visual hierarchy** - No clear sections or grouping
3. **Confusing bulk actions** - Mixed with regular filters
4. **Long horizontal table** - Too many columns visible at once
5. **Inconsistent spacing** - Various gaps and padding
6. **Mobile responsiveness** - Layout breaks on smaller screens

## Proposed Improvements

### 1. **Header Section** (Clean & Organized)
```
┌─────────────────────────────────────────────────────────────┐
│  Event Participants                                    [Add] │
│  120 participants • Page 1 of 5                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Action Bar** (Separated into logical groups)
```
┌────────── Search & Filter ──────────┬──── Actions ─────┐
│ [🔍 Search...]  [Status ▼]  [Role ▼] │ [📊] [📤] [⚙️]  │
└─────────────────────────────────────┴──────────────────┘
```

### 3. **Bulk Actions Bar** (Only shows when items selected)
```
┌──────────────────────────────────────────────────────────┐
│ ✓ 5 selected  [Change Status ▼]  [Set Role ▼]  [✕ Clear]│
└──────────────────────────────────────────────────────────┘
```

### 4. **Stats Cards** (Quick Overview)
```
┌──────────┬──────────┬──────────┬──────────┐
│ Selected │ Declined │ Attended │ Waiting  │
│    45    │    12    │    30    │    15    │
└──────────┴──────────┴──────────┴──────────┘
```

### 5. **Table** (Cleaner, Card-based on mobile)
- Sticky header
- Alternating row colors
- Hover effects
- Expandable rows for details
- Responsive cards on mobile

### 6. **Pagination** (Bottom, centered)
```
           ┌─────────────────────┐
           │ ◀  1 2 [3] 4 5  ▶   │
           └─────────────────────┘
```

## Color Scheme
- Primary: Red (#DC2626) - MSF Brand
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Info: Blue (#3B82F6)
- Neutral: Gray shades

## Typography
- Headers: Font-bold, larger sizes
- Body: Font-medium, readable sizes
- Labels: Font-normal, smaller, gray-600

## Spacing System
- XS: 4px (gap-1)
- SM: 8px (gap-2)
- MD: 16px (gap-4)
- LG: 24px (gap-6)
- XL: 32px (gap-8)
