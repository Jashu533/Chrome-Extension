# Installation Guide

Follow these steps to install the Productivity Tracker Chrome Extension.

## Quick Start

### Step 1: Build the Extension

```bash
npm install
npm run build
cp public/manifest.json dist/
cp public/*.png dist/
```

### Step 2: Load in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" ON (top right corner)
4. Click "Load unpacked"
5. Select the `dist` folder from this project
6. The extension should now appear in your extensions list

### Step 3: Pin the Extension

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Productivity Tracker" in the list
3. Click the pin icon to pin it to your toolbar

### Step 4: Sign Up

1. Click the extension icon
2. Click "Sign Up" if you're a new user
3. Enter your email and password (minimum 6 characters)
4. Click "Sign Up"

### Step 5: Start Tracking

Once signed in, the extension automatically starts tracking your browsing activity. You can:

- Click the extension icon to see today's quick stats
- Click "View Full Dashboard" for detailed analytics
- Right-click the extension icon → Options for the full dashboard

## Troubleshooting

### Extension not loading?

- Make sure you built the project with `npm run build`
- Verify that `manifest.json` and icon files are in the `dist` folder
- Check Chrome's developer console for errors

### Not tracking websites?

- Make sure you're signed in
- Check that the extension has the necessary permissions
- Try reloading the extension from `chrome://extensions/`

### Authentication issues?

- Verify your Supabase credentials are correctly set in the `.env` file
- Make sure you have an active internet connection
- Check the browser console for error messages

## Features Overview

### Quick Stats (Popup)
- Click the extension icon
- View today's productivity percentage
- See time spent on productive vs unproductive sites
- View top 3 visited sites

### Full Dashboard (Options Page)
- **Overview Tab**: Visual breakdown of weekly productivity
- **Weekly Report Tab**: Detailed analysis with downloadable report
- **Site Classification Tab**: Manage website categories

### Website Categories

The extension comes pre-configured with common websites:

**Productive**: GitHub, Stack Overflow, CodePen, LeetCode, GitLab, Dev.to

**Unproductive**: Facebook, Twitter, Instagram, Reddit, YouTube, TikTok

You can add your own custom categories in the Site Classification settings.

## Updating the Extension

After making changes to the code:

1. Run `npm run build`
2. Copy manifest and icons: `cp public/manifest.json dist/ && cp public/*.png dist/`
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Productivity Tracker card

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Productivity Tracker"
3. Click "Remove"
4. Your data in Supabase will remain unless you delete it manually

## Privacy

- All tracking data is stored in your personal Supabase database
- No data is sent to third parties
- You can export or delete your data at any time through the Supabase dashboard

## Support

For issues or questions, please check the README.md or open an issue on the project repository.
