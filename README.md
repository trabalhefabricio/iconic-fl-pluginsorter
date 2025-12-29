# ICONIC - FL Studio Plugin Sorter AI

<div align="center">

![ICONIC Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

**An intelligent, AI-powered tool to organize, categorize, and manage your FL Studio plugin database**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/trabalhefabricio/iconic-fl-pluginsorter)
[![Build Status](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/actions/workflows/build.yml/badge.svg)](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/actions/workflows/build.yml)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4?logo=google)](https://ai.google.dev/)

</div>

## 🎯 Overview

ICONIC is a powerful desktop and web application designed to help music producers organize their FL Studio plugin databases. Using Google's Gemini AI, it intelligently categorizes your plugins, detects duplicates, and provides a clean, intuitive interface for managing thousands of plugins efficiently.

> 📖 **[Read the complete Feature Analysis & Design Rationale](./FEATURES.md)** to understand the thought process behind each feature and see detailed ratings.
> 
> 💡 **[View Improvement Recommendations](./IMPROVEMENTS.md)** for future enhancements and feature ideas.

### ✨ Key Features

#### 🤖 AI-Powered Organization
- **Smart Categorization**: Automatically categorizes plugins using Gemini AI
- **Multi-Tag Support**: Assign multiple categories to plugins for flexible organization
- **Learning System**: Remembers your manual categorizations and applies them automatically
- **Batch Processing**: Process hundreds of plugins simultaneously with intelligent retry logic

#### 🔍 Advanced Duplicate Detection
- **Content-Based Hashing**: Identifies true duplicates by comparing file content
- **Fuzzy Name Matching**: Finds duplicates even with different naming conventions
- **Smart Rename**: Automatically cleans up plugin names and removes duplicate suffixes
- **Best Version Selection**: Keeps the newest version with the cleanest name

#### 📁 Powerful File Operations
- **Category-Based Organization**: Automatically moves plugins into category folders
- **Flatten Database**: Consolidate all plugins to root directory
- **Undo Support**: Revert any file operations with one click
- **Asset Management**: Handles associated files (.nfo, .png) automatically
- **Leftover Cleanup**: Moves orphaned files to dedicated folder

#### 🎨 Intuitive Interface
- **Grid & List Views**: Switch between visual grid and detailed list view
- **Multi-Select**: Select and operate on multiple plugins at once
- **Drag & Drop**: Drag plugins directly onto categories in sidebar
- **Real-time Search**: Instantly filter plugins by name
- **Status Filters**: View uncategorized, duplicates, analyzed, or all plugins
- **Zoom Controls**: Adjust grid size to your preference


## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Gemini API Key** (optional, for AI features)
  - Get your free API key at [Google AI Studio](https://ai.google.dev/)

### Installation

#### Option 1: Desktop Application (Recommended)

1. **Download the installer** for your platform:
   - Windows: `ICONIC-Setup.exe`
   - macOS: `ICONIC.dmg`
   - Linux: `ICONIC.AppImage` or `.deb`

2. **Install and run** the application

3. **Enter your Gemini API Key** (optional)

4. **Select your FL Studio plugin database folder**
   - Default location: `C:\Users\[YourName]\Documents\Image-Line\FL Studio\Presets\Plugin database`

#### Option 2: Web Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/trabalhefabricio/iconic-fl-pluginsorter.git
   cd iconic-fl-pluginsorter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment** (optional):
   Create a `.env.local` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Initial Setup

1. **Launch Application**: Open ICONIC desktop app or web version
2. **Enter API Key**: Paste your Gemini API key (or use Manual Mode)
3. **Select Folder**: Choose your FL Studio plugin database directory
4. **Wait for Scan**: Application will scan all plugins and generate hashes

### Basic Workflow

1. **Analyze Plugins**:
   - Click "ANALYZE" to start AI categorization
   - AI will process plugins in batches of 15
   - Progress shown in real-time
   - Can be stopped anytime by clicking "STOP"

2. **Review & Adjust**:
   - Browse categorized plugins in grid or list view
   - Manually adjust categories by:
     - Dragging plugins to categories in sidebar
     - Using Inspector panel to add/remove tags
     - Right-clicking for context menu options
   
3. **Organize Files**:
   - Click "ORGANIZE FILES" to execute file operations
   - Plugins moved to category folders
   - Duplicates deleted (if enabled)
   - Leftover files moved to `_Unused_Assets`
   - Undo manifest created automatically

4. **Undo if Needed**:
   - Click "Revert Changes" to undo last operation
   - All files restored to original locations
   - Folders cleaned up automatically

### Keyboard Shortcuts
- `Ctrl/Cmd + A` - Select all visible plugins
- `Ctrl/Cmd + O` - Open folder (desktop app)
- `Delete/Backspace` - Mark selected as duplicates
- `Escape` - Clear selection / Close dialogs

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Desktop**: Electron 39
- **AI Service**: Google Gemini 2.5 Flash
- **UI Components**: Lucide React icons
- **Styling**: Tailwind CSS (via CDN)

### Project Structure

```
iconic-fl-pluginsorter/
├── components/          # React UI components
├── services/           # Business logic services
├── electron.cjs        # Electron main process
├── preload.cjs         # Electron preload script
├── App.tsx            # Main application component
├── types.ts           # TypeScript type definitions
└── vite.config.ts     # Build configuration
```


## ⚙️ Configuration

### Application Settings

Available in the Inspector panel:

- **Auto-Execute**: Automatically organize after analysis completes
- **Deduplicate**: Delete duplicate files during organization
- **Multi-Tag**: Copy plugins to multiple category folders
- **Dry Run**: Simulate operations without making changes

### Category Profiles

Three preset profiles available:

1. **Standard (FL)**: General-purpose categories (Synth, Bass, Drums, FX, etc.)
2. **Electronic / EDM**: Genre-specific categories (Leads, Pads, Plucks, Bass)
3. **Cinematic / Orchestral**: Film scoring categories (Strings, Brass, Woodwinds)

## 🔒 Security & Privacy

- **Local Processing**: All file operations happen locally on your machine
- **No Data Upload**: Plugin files never leave your computer
- **API Key Security**: Stored locally, never transmitted except to Gemini API
- **Sandbox Security**: Electron app runs with context isolation enabled
- **Input Sanitization**: All user inputs validated and sanitized
- **Error Boundaries**: Graceful error handling prevents crashes

## 🐛 Troubleshooting

### Common Issues

#### "Cannot access folder" / Permission denied
- **Solution**: Make sure FL Studio is closed
- **Reason**: FL Studio locks plugin database files while running

#### AI categorization not working
- **Check**: API key starts with "AIzaSy"
- **Check**: Internet connection is active
- **Solution**: Try Manual Mode if issues persist

#### Plugins not appearing after scan
- **Check**: Folder contains `.fst` files
- **Solution**: Verify folder path is correct

### Debug Mode

Enable detailed logging:
1. Open Developer Tools (F12 in browser, Cmd+Option+I in desktop app)
2. Check Console tab for detailed operation logs
3. Look for red error messages or warnings

## 🛠️ Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/trabalhefabricio/iconic-fl-pluginsorter.git
cd iconic-fl-pluginsorter

# Install dependencies
npm install

# Run development server (web)
npm run dev

# Run development with Electron
npm run dev:electron

# Build for production (web)
npm run build

# Build desktop apps
npm run build:electron        # All platforms
npm run build:electron:win    # Windows only
npm run build:electron:mac    # macOS only
npm run build:electron:linux  # Linux only
```

### Project Scripts

- `npm run dev` - Start Vite dev server
- `npm run dev:electron` - Start with Electron in development mode
- `npm run build` - Build web application
- `npm run build:electron` - Build desktop applications
- `npm run preview` - Preview production build

## 📋 Known Limitations

1. **Browser Support**: File System Access API requires Chrome/Edge 86+
2. **File Size**: Very large databases (10,000+ plugins) may be slow
3. **API Limits**: Gemini API has rate limits on free tier
4. **FL Studio Specific**: Designed for FL Studio's plugin format (.fst)
5. **No Undo After Restart**: Undo manifest cleared on app restart

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## ⭐ Feature Ratings & Design Philosophy

ICONIC has been thoughtfully designed with each feature serving a specific purpose in the plugin organization workflow. 

**Overall Rating: 9.2/10**

### Highlights
- **AI-Powered Categorization (10/10)**: Exceptional - saves hours of work with intelligent understanding of VST ecosystem
- **Learning System (9.5/10)**: Brilliant - gets smarter with use, remembers your preferences
- **Duplicate Detection (9/10)**: Smart content-based hashing with fuzzy matching
- **Undo System (8.5/10)**: Provides safety but limited to last operation
- **Drag & Drop UI (9.5/10)**: Intuitive and natural interaction pattern

### Design Principles
1. **Balance Automation with Control**: AI handles grunt work, humans make final decisions
2. **Safety First**: Undo, dry-run, and local-first architecture protect your data
3. **Workflow Optimization**: Keyboard shortcuts, multi-select, and quick actions reduce friction
4. **Privacy Focused**: All file operations happen locally, no cloud storage

📖 **[Read the complete 24-feature analysis with detailed rationale](./FEATURES.md)**

## 💡 Future Improvements

We've identified 35+ potential enhancements to make ICONIC even better! Check out our comprehensive improvement roadmap covering:

- **Design**: Category color coding, theme variants, enhanced visual hierarchy
- **UI/UX**: Plugin preview modal, advanced search, keyboard shortcuts, bulk operations
- **Features**: Multi-level undo, smart duplicate resolution, export/import, usage tracking
- **Performance**: Virtual scrolling, web workers, progressive loading
- **Creative**: Animated transitions, achievement system, AI recommendations

📋 **[View the complete improvement plan with priorities and implementation guides](./IMPROVEMENTS.md)**

Contributions implementing any of these improvements are highly welcome!

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent categorization
- **Image-Line** for FL Studio
- **React Team** for the amazing framework
- **Electron Team** for desktop capabilities
- **Lucide Icons** for beautiful UI icons

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trabalhefabricio/iconic-fl-pluginsorter/discussions)

## 🌟 Show Your Support

If you find ICONIC useful, please:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share with fellow producers

---

<div align="center">

**Made with ❤️ for music producers worldwide**

</div>
