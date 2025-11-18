# Company Logos Directory

This directory is for company logos used on the About page.

## Required Logos

To replace the temporary badge logos with actual company logos, download and add the following files:

### 1. Massachusetts General Hospital (MGH)
- **Filename**: `mgh.png` or `mgh.svg`
- **Recommended source**: MGH official website or brand assets
- **Display height**: 24px
- **Background**: Transparent or white preferred
- **Notes**: Simple wordmark or logo/text combination works best

### 2. Juno Therapeutics
- **Filename**: `juno.png` or `juno.svg`
- **Recommended source**: Use original Juno branding (pre-BMS acquisition)
- **Display height**: 24px
- **Background**: Transparent or white preferred
- **Notes**: Original teal/blue Juno logo preferred

### 3. Intellia Therapeutics
- **Filename**: `intellia.png` or `intellia.svg`
- **Recommended source**: Intellia official website
- **Display height**: 24px
- **Background**: Transparent or white preferred
- **Notes**: Purple color scheme matches the theme

### 4. Novartis
- **Filename**: `novartis.png` or `novartis.svg`
- **Recommended source**: Novartis official brand assets
- **Display height**: 24px
- **Background**: Transparent or white preferred
- **Notes**: Red wordmark or full logo

### 5. Generate Biomedicines
- **Filename**: `generate.png` or `generate.svg`
- **Recommended source**: Generate Biomedicines website
- **Display height**: 24px
- **Background**: Transparent or white preferred
- **Notes**: Modern blue branding

## Implementation Instructions

Once you have the logos:

1. **Optimize for web**: Ensure each file is < 50KB
2. **Save to this directory**: `/public/images/logos/`
3. **Update the CompanyLogo component** at `/components/about/CompanyLogo.tsx`:

```tsx
// Example for MGH logo:
<CompanyLogo
  name="Massachusetts General Hospital"
  shortName="MGH"
  color="bg-green-100 text-green-800"
  imagePath="/images/logos/mgh.png"  // Add this line
/>
```

4. **Repeat for all companies** in `/app/about/page.tsx`

## Color Scheme Reference

If logos need background adjustments:

- **MGH**: Green (#10b981, #059669)
- **Juno**: Teal (#14b8a6, #0d9488)
- **Intellia**: Purple (#a855f7, #9333ea)
- **Novartis**: Red (#ef4444, #dc2626)
- **Generate**: Blue (#3b82f6, #2563eb)

## Testing

After adding logos:
1. Run `npm run dev`
2. Visit `/about` page
3. Verify all logos display correctly
4. Check responsive behavior on mobile
5. Ensure no pixelation or distortion
