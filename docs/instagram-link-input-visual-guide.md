# Instagram Link Input Feature - Visual Guide

## Feature Overview

This document provides a visual guide to the new Instagram link input feature in the Amplifikasi Tugas Khusus Insight page.

## UI States

### State 1: Display Mode (Link Exists)
```
┌────────────────────────────────────────────────────────────────────┐
│ Link Instagram                                                     │
├────────────────────────────────────────────────────────────────────┤
│ https://instagram.com/p/ABC123xyz/              [🖊️ Edit]         │
└────────────────────────────────────────────────────────────────────┘
```

**Description:**
- Shows the existing Instagram link as a clickable hyperlink (in indigo blue)
- Edit button (pencil icon) on the right
- Link opens in a new tab when clicked
- Long URLs are truncated to 40 characters with "..." suffix

---

### State 2: Display Mode (No Link)
```
┌────────────────────────────────────────────────────────────────────┐
│ Link Instagram                                                     │
├────────────────────────────────────────────────────────────────────┤
│ Belum ada link                                  [🖊️ Edit]         │
└────────────────────────────────────────────────────────────────────┘
```

**Description:**
- Shows "Belum ada link" in gray italic text
- Edit button available to add a new link
- Invites the user to add a link

---

### State 3: Edit Mode (Active Input)
```
┌────────────────────────────────────────────────────────────────────┐
│ Link Instagram                                                     │
├────────────────────────────────────────────────────────────────────┤
│ [https://instagram.com/p/ABC123xyz/____]  [✓ Save]  [✖ Cancel]   │
└────────────────────────────────────────────────────────────────────┘
```

**Description:**
- Input field with the current link (or empty if no link exists)
- Placeholder: "https://instagram.com/p/..."
- Save button (green checkmark icon)
- Cancel button (red X icon)
- Input field has focus ring (indigo border) when active

---

### State 4: Saving (Loading)
```
┌────────────────────────────────────────────────────────────────────┐
│ Link Instagram                                                     │
├────────────────────────────────────────────────────────────────────┤
│ [https://instagram.com/p/ABC123xyz/____]  [⏳ Save]  [✖ Cancel]   │
└────────────────────────────────────────────────────────────────────┘
```

**Description:**
- Input field is disabled (grayed out)
- Save and Cancel buttons are disabled
- Loading indicator shows submission in progress

---

## Complete Table View

```
┌───┬──────────┬─────────────┬──────────────┬──────────┬────────┬────────────┬──────────────────────────────────────┐
│No │ Client   │ Nama        │ Username IG  │ Divisi   │ Status │ Jumlah Link│ Link Instagram                       │
├───┼──────────┼─────────────┼──────────────┼──────────┼────────┼────────────┼──────────────────────────────────────┤
│ 1 │ Polres A │ John Doe    │ @johndoe     │ BAG      │ ✓ Sudah│     3      │ instagram.com/p/ABC1...  [🖊️ Edit]  │
│   │          │             │              │ SUMDA    │        │            │                                      │
├───┼──────────┼─────────────┼──────────────┼──────────┼────────┼────────────┼──────────────────────────────────────┤
│ 2 │ Polres A │ Jane Smith  │ @janesmith   │ SAT      │ ✗ Belum│     0      │ Belum ada link       [🖊️ Edit]      │
│   │          │             │              │ RESKRIM  │        │            │                                      │
├───┼──────────┼─────────────┼──────────────┼──────────┼────────┼────────────┼──────────────────────────────────────┤
│ 3 │ Polres B │ Bob Johnson │ @bobjohnson  │ SI &     │ ✓ Sudah│     2      │ [input: ig.com/p/...]  [✓]  [✖]    │
│   │          │             │              │ SPKT     │        │            │ ← Currently editing                 │
└───┴──────────┴─────────────┴──────────────┴──────────┴────────┴────────────┴──────────────────────────────────────┘
```

---

## User Interactions

### Adding a New Link

1. **Initial State**: Row shows "Belum ada link" with Edit button
2. **Click Edit**: Input field appears with empty value
3. **Paste URL**: User pastes Instagram link: `https://www.instagram.com/p/CXyz123ABC/`
4. **Click Save**: System validates, extracts shortcode, submits to backend
5. **Success**: Toast notification appears, input closes, link displays as clickable

### Editing an Existing Link

1. **Initial State**: Row shows existing link with Edit button
2. **Click Edit**: Input field appears with current link pre-filled
3. **Modify URL**: User changes the link to a different Instagram post
4. **Click Save**: System validates and updates
5. **Success**: Updated link displays

### Canceling Edit

1. **During Edit**: Input field is open
2. **Click Cancel**: Input closes without saving
3. **Result**: Original link (or "Belum ada link") is restored

### Error Handling

**Invalid URL Format:**
```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Format link Instagram tidak valid. Pastikan link berasal │
│    dari instagram.com                                        │
└──────────────────────────────────────────────────────────────┘
```

**Empty Input:**
```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Link Instagram tidak boleh kosong.                       │
└──────────────────────────────────────────────────────────────┘
```

**Success:**
```
┌──────────────────────────────────────────────────────────────┐
│ ✓ Link Instagram berhasil disimpan.                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

- **Links**: Indigo-600 (#4F46E5)
- **Edit Button**: Indigo-600 hover to Indigo-800
- **Save Button**: Green-600 (#16A34A) hover to Green-800
- **Cancel Button**: Red-600 (#DC2626) hover to Red-800
- **Input Border**: Indigo-300 with Indigo-400 focus ring
- **Empty State**: Gray-400 (#9CA3AF) italic
- **Success Row**: Green-50 background (#F0FDF4)
- **Incomplete Row**: Red-50 background (#FEF2F2)

---

## Responsive Behavior

### Desktop (> 768px)
- Full table layout with all columns visible
- Edit/Save/Cancel buttons shown as icons with tooltips
- Input field takes full width of cell

### Tablet (480px - 768px)
- Table scrollable horizontally
- All columns remain visible
- Smaller icon sizes

### Mobile (< 480px)
- Table scrollable horizontally
- Text sizes adjusted for readability
- Touch-friendly button sizes (minimum 44x44px)

---

## Accessibility Features

1. **Keyboard Navigation**
   - Tab to navigate between Edit buttons
   - Enter to activate Edit button
   - Tab within edit mode to move between input/save/cancel
   - Enter to save, Escape to cancel

2. **Screen Readers**
   - Edit button: "Edit Instagram link"
   - Save button: "Save Instagram link"
   - Cancel button: "Cancel editing"
   - Input field: "Instagram link input field"

3. **Focus Indicators**
   - All interactive elements have visible focus rings
   - High contrast focus states (indigo ring)

4. **ARIA Labels**
   - Buttons have descriptive labels
   - Input has placeholder and label association

---

## Performance Considerations

- **Single Edit Mode**: Only one row can be in edit mode at a time
- **Instant Feedback**: Link updates immediately in UI after successful save
- **Optimistic UI**: Shows updated link without page refresh
- **Error Recovery**: Reverts to original state on error

---

## Security Features

1. **URL Validation**: Only allows Instagram domains
   - ✅ `instagram.com`
   - ✅ `*.instagram.com`
   - ✅ `instagr.am`
   - ✅ `ig.me`
   - ❌ `evil-instagram.com`
   - ❌ `instagram.com.evil.com`

2. **XSS Protection**: All output is escaped by React

3. **CSRF Protection**: Uses authentication token

4. **Input Sanitization**: Trims whitespace, validates format

---

## Technical Specifications

**Component**: `RekapAmplifikasi.jsx`
**Location**: `/cicero-dashboard/components/`
**State Management**: React useState hooks
**API Endpoint**: `/api/link-reports-khusus` (POST)
**Authentication**: Token-based (from `useAuth()` hook)
**Validation**: Client-side + backend validation

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Required Features:**
- ES6+ JavaScript
- CSS Grid
- Flexbox
- URL API
- Async/Await

---

This visual guide helps understand the complete user experience of the Instagram link input feature.
