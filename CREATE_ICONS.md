# 🎨 How to Create App Icons

## Quick Method (Using Online Tool):

### 1. Go to: https://www.appicon.co/
### 2. Upload a 1024x1024 image with:
   - Dark blue background (#0a0e27)
   - Cyan/purple gradient orb in center
   - "RAGS" text below

### 3. Download all sizes

## Or Use This SVG Code:

Save as `icon-source.svg` and convert to PNG:

```svg
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="orbGradient">
      <stop offset="0%" style="stop-color:#00d9ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7000ff;stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" fill="#0a0e27" rx="180"/>
  
  <!-- Orb -->
  <circle cx="512" cy="450" r="200" fill="url(#orbGradient)" opacity="0.9"/>
  <circle cx="512" cy="450" r="180" fill="url(#orbGradient)" opacity="0.6"/>
  <circle cx="512" cy="450" r="160" fill="url(#orbGradient)" opacity="0.3"/>
  
  <!-- Text -->
  <text x="512" y="720" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#00d9ff" text-anchor="middle">RAGS</text>
</svg>
```

## Required Sizes:

### Mobile (iOS):
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 120x120 (iPhone)
- 76x76 (iPad)

### Mobile (Android):
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 48x48 (mdpi)

### Desktop (Tauri):
- 512x512 (icon.png)
- 256x256 (icon.png)
- 128x128 (icon.png)
- 32x32 (icon.png)
- icon.icns (Mac)
- icon.ico (Windows)

## Temporary Solution (For Testing):

I'll create simple placeholder icons now so you can test the app!
