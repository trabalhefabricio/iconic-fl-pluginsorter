# ICONIC FL Plugin Sorter - Windows Edition

## Quick Start for Windows Users

### Installation

1. **Download the installer**:
   - Go to [Releases](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/releases)
   - Download `ICONIC-FL-Plugin-Sorter-1.0.0-win-x64.exe` (installer)
   - Or download the portable version if you prefer

2. **Run the installer**:
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - Launch ICONIC from Start Menu or Desktop shortcut

3. **First Launch**:
   - Enter your Gemini API Key (optional - get one at [Google AI Studio](https://ai.google.dev/))
   - Click "Open Folder & Initialize"
   - Navigate to your FL Studio plugin database folder:
     - Default location: `C:\Users\[YourName]\Documents\Image-Line\FL Studio\Presets\Plugin database`
   - Click "Select Folder"

### System Requirements

- **OS**: Windows 10 or later (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 200 MB for app + space for plugin database
- **Internet**: Optional (only needed for AI categorization)

### Features

✅ **AI-Powered Organization** - Automatically categorize plugins using Google Gemini AI
✅ **Manual Mode** - Works completely offline without API key
✅ **Smart Duplicate Detection** - Find and remove duplicate plugins
✅ **Drag & Drop** - Intuitive plugin categorization
✅ **Undo Support** - Revert any file operations
✅ **Batch Processing** - Handle thousands of plugins at once
✅ **Multi-Tag Support** - Assign plugins to multiple categories
✅ **Dry Run Mode** - Preview changes before applying

### Usage

1. **Scan Your Plugins**:
   - App automatically scans all `.fst` files in selected folder
   - Shows total count and detects duplicates

2. **AI Categorization** (if API key provided):
   - Click "ANALYZE" button
   - AI processes plugins in batches of 15
   - Can stop anytime with "STOP" button

3. **Manual Categorization**:
   - Drag plugins from grid to categories in sidebar
   - Or use Inspector panel to add/remove tags
   - Right-click for quick actions

4. **Organize Files**:
   - Click "ORGANIZE FILES" to apply changes
   - Plugins moved to category folders
   - Duplicates deleted (if enabled)
   - Creates undo manifest automatically

5. **Undo if Needed**:
   - Click "Revert Changes" to undo last operation
   - All files restored to original locations

### Keyboard Shortcuts

- `Ctrl + A` - Select all visible plugins
- `Ctrl + O` - Open folder dialog
- `Delete` - Mark selected as duplicates
- `Escape` - Clear selection / Close dialogs
- `F12` - Open developer tools (for debugging)

### Settings

Available in Inspector panel:
- **Auto-Execute**: Automatically organize after AI analysis
- **Deduplicate**: Delete duplicate files during organization
- **Multi-Tag**: Copy plugins to multiple category folders
- **Dry Run**: Preview operations without making changes

### Troubleshooting

#### App won't start
- Make sure you have Windows 10 or later
- Try running as Administrator
- Check Windows Defender isn't blocking it

#### Can't access plugin folder
- Close FL Studio before running ICONIC
- Make sure the folder path is correct
- Try running ICONIC as Administrator

#### AI categorization not working
- Check API key starts with "AIzaSy"
- Verify internet connection
- Try Manual Mode if issues persist

#### Plugins not appearing
- Verify folder contains `.fst` files
- Check folder permissions
- Try rescanning with Ctrl+R

### Default FL Studio Plugin Database Location

```
C:\Users\[YourUsername]\Documents\Image-Line\FL Studio\Presets\Plugin database
```

Replace `[YourUsername]` with your Windows username.

### Building from Source (Developers)

```bash
# Clone repository
git clone https://github.com/trabalhefabricio/iconic-fl-pluginsorter.git
cd iconic-fl-pluginsorter

# Install dependencies
npm install

# Build Windows app
npm run build:electron:win

# Output in release/ folder
```

### Automatic Builds

Every commit to the `main` branch automatically builds the Windows version via GitHub Actions. Download the latest build from the [Releases](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/releases) page.

### Support

- **Issues**: [GitHub Issues](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/discussions)

### License

See LICENSE file in repository.

---

**Made with ❤️ for FL Studio producers on Windows**
