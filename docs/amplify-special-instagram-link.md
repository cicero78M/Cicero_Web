# Instagram Link Column for Special Task Amplification

## Overview

This document describes the addition of an Instagram link column to the special task amplification page (`/amplify/khusus`) in the RekapAmplifikasi table.

## Changes Made

### Frontend Changes

**File: `cicero-dashboard/components/RekapAmplifikasi.jsx`**

1. **Added Instagram Link Column Header**
   - New column "Link Instagram" added to the table header
   - Positioned after "Jumlah Link" column

2. **Instagram Link Display Cell**
   - Displays Instagram links if available in the user data
   - Supports multiple field name variations:
     - `instagram_link` (snake_case)
     - `instagramLink` (camelCase)
     - `link_instagram` (alternative format)
   
3. **Link Formatting**
   - Links longer than 40 characters are truncated with "..." suffix
   - Full links are shown for shorter URLs
   - All links are clickable and open in a new tab (`target="_blank"`)
   - Uses `rel="noopener noreferrer"` for security

4. **Empty State**
   - Shows "Belum ada link" (No link yet) message in gray italic text when no Instagram link is available

### Backend Integration

The component expects Instagram link data to be included in the `/api/amplify/rekap-khusus` endpoint response.

**Expected Data Structure:**

```json
{
  "data": [
    {
      "user_id": "123456",
      "nama": "John Doe",
      "username": "johndoe",
      "divisi": "BAG SUMDA",
      "client_id": "client_01",
      "jumlah_link": 3,
      "instagram_link": "https://www.instagram.com/p/ABC123xyz/"
    }
  ]
}
```

**Alternative Field Names Supported:**
- `instagram_link` - Primary field name (snake_case)
- `instagramLink` - Alternative field name (camelCase)
- `link_instagram` - Alternative field name

## Backend Requirements

For the Instagram link column to display data, the Cicero_V2 backend needs to:

1. **Include Instagram Links in Rekap Response**
   - Modify `/api/amplify/rekap-khusus` endpoint to include Instagram link data
   - Return the most recent or primary Instagram link for each user
   - Use one of the supported field names (`instagram_link`, `instagramLink`, or `link_instagram`)

2. **Data Source**
   - Instagram links can be retrieved from the link reports table
   - Each user may have multiple Instagram links submitted for different posts
   - Backend should determine which link to display (e.g., most recent, most active period)

3. **Query Considerations**
   - Links should be filtered by the same periode/tanggal parameters as the main rekap query
   - Links should respect the same role/scope/regional_id access controls

## Example Backend Implementation

### Option 1: Include Links in Main Query

```sql
-- Pseudocode example
SELECT 
  u.user_id,
  u.nama,
  u.username,
  u.divisi,
  COUNT(l.id) as jumlah_link,
  (SELECT instagram_link 
   FROM link_reports_khusus 
   WHERE user_id = u.user_id 
     AND created_at BETWEEN start_date AND end_date
   ORDER BY created_at DESC 
   LIMIT 1) as instagram_link
FROM users u
LEFT JOIN link_reports_khusus l ON u.user_id = l.user_id
WHERE l.created_at BETWEEN start_date AND end_date
GROUP BY u.user_id
```

### Option 2: Separate Endpoint

Alternative approach: Create a new endpoint to fetch Instagram links in bulk:

```
GET /api/amplify/rekap-khusus-links?client_id=xxx&periode=harian&tanggal=2024-01-01
```

Then fetch this data separately on the frontend and merge with the existing rekap data.

## UI/UX Features

### Visual Design
- Instagram links are displayed in indigo color (`text-indigo-600`)
- Links have hover effect with darker color (`hover:text-indigo-800`)
- Links have underline on hover for better affordance
- Text uses small font size (`text-xs`) for compact display
- Long URLs are truncated to prevent table overflow

### Accessibility
- Links use proper `<a>` tags for semantic HTML
- External links include `target="_blank"` for new tab behavior
- Security attributes `rel="noopener noreferrer"` prevent potential vulnerabilities
- Empty state uses italic styling to differentiate from active links

### Responsive Behavior
- Table uses `overflow-x-auto` for horizontal scrolling on small screens
- Links have `break-all` class to wrap within narrow columns
- Truncation ensures links don't break table layout

## Usage

### For Administrators
1. Navigate to `/amplify/khusus` (Special Task Amplification page)
2. Switch to "Rekap Detail" tab
3. View the Instagram link column for each user
4. Click any link to verify the Instagram post

### For Developers
The component automatically displays Instagram links if they exist in the data:

```jsx
// No changes needed in parent components
<RekapAmplifikasi users={chartData} />
```

The component will check for Instagram links in the user data and display them if available.

## Testing Checklist

- [ ] Verify Instagram link column appears in the table
- [ ] Test with users who have Instagram links
- [ ] Test with users who don't have Instagram links
- [ ] Test link truncation for very long URLs
- [ ] Test clicking links opens correct Instagram posts
- [ ] Test responsive behavior on mobile devices
- [ ] Verify security attributes on external links
- [ ] Test table search with Instagram links
- [ ] Test pagination with Instagram link data

## Future Enhancements

1. **Multiple Links Display**
   - Show count of multiple links
   - Add dropdown or modal to view all links for a user

2. **Link Validation**
   - Add visual indicator for valid/broken links
   - Check if Instagram posts are still accessible

3. **Inline Editing**
   - Allow administrators to add/edit Instagram links directly in the table
   - Add form validation for Instagram URL format

4. **Link Analytics**
   - Show engagement metrics from linked Instagram posts
   - Display post date and performance stats

5. **Export Functionality**
   - Include Instagram links in exported reports
   - Add Instagram link column to CSV/Excel exports

## Related Files

- `/cicero-dashboard/components/RekapAmplifikasi.jsx` - Main table component
- `/cicero-dashboard/app/amplify/AmplifyKhususInsightView.jsx` - Parent component
- `/cicero-dashboard/utils/api.ts` - API utilities (getRekapAmplifyKhusus)
- `/backend/src/services/tasksEndpoints.js` - Backend endpoint handler (Cicero_V2)

## References

- [Amplify Special Tasks Documentation](./amplify-special-tasks.md)
- [Tasks API Documentation](./tasks_api.md)
- [Cicero_V2 Backend Repository](../README.md#cicero_v2-backend)
