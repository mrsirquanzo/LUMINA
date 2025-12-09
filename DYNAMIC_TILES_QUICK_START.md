# Dynamic Tiles - Quick Start Guide

## 🚀 How to Use

### Step 1: Parse a Patent
1. Open SonnySidePanel (right panel)
2. Select "Patent Expert" agent
3. Upload a patent PDF
4. Wait for parsing to complete

### Step 2: Create a Tile
1. After parsing completes, click **"Add to Dashboard"** button
2. In the modal:
   - Review/edit the tile title
   - Select workspace(s) to add tile to
   - Choose tile size (small/medium/large/full-width)
3. Click **"Create Tile"**

### Step 3: View on Dashboard
1. Navigate to Dashboard view
2. Your new tile appears:
   - **Pinned tiles** at the top
   - **Other tiles** below baseline tiles
3. Click tile to expand/collapse
4. Use pin icon to pin/unpin
5. Use trash icon to remove

---

## 🎯 Features

### Tile Management
- **Pin/Unpin**: Keep important tiles at top
- **Remove**: Delete tiles you no longer need
- **Expand/Collapse**: Toggle between summary and detailed views
- **Workspace Selection**: Add tiles to multiple workspaces

### Tile Display
- **Collapsed**: Shows key metrics and summary
- **Expanded**: Shows full analysis with all details
- **Agent-Specific**: Icons and colors match agent type

---

## 📁 File Structure

```
src/lib/tiles/
├── types.ts                    # Type definitions
├── store.ts                    # Zustand state management
└── templates/
    ├── index.tsx              # Template registry
    └── patentTileTemplate.tsx # Patent tile template

src/components/
├── CreateTileModal.tsx        # Tile creation modal
├── DynamicTile.tsx           # Dynamic tile renderer
└── PatentParsingPanel.tsx    # Updated with "Add to Dashboard"
```

---

## 🔧 Technical Stack

- **Zustand**: State management
- **localStorage**: Persistence
- **React**: Component rendering
- **TypeScript**: Type safety

---

## ✅ What's Working

- ✅ Tile creation from patent analysis
- ✅ Workspace integration
- ✅ Tile persistence
- ✅ Pin/unpin functionality
- ✅ Remove tiles
- ✅ Expand/collapse
- ✅ Summary/detailed views
- ✅ Grid positioning
- ✅ Size selection

---

## 🎨 Example Workflow

```
1. User → Patent Agent → Upload US12345678.pdf
2. Parsing → Analysis complete
3. Click "Add to Dashboard"
4. Modal opens:
   - Title: "Patent Analysis: US12345678"
   - Workspace: [Default, Project Alpha] ✓
   - Size: Large ✓
5. Click "Create Tile"
6. Tile appears on dashboard
7. User expands → Sees full analysis
8. User pins → Tile moves to top
```

---

## 🚧 Future Enhancements

- Drag-and-drop reordering
- Tile templates for other agents
- Tile search/filter
- Tile refresh mechanism
- Export individual tiles

---

## 🐛 Troubleshooting

**Tile not appearing?**
- Check if workspace is selected
- Verify tile was created (check localStorage)
- Refresh dashboard

**Template not rendering?**
- Check browser console for errors
- Verify template exists for tile type
- Fallback generic view should appear

**Persistence not working?**
- Check browser localStorage
- Verify Zustand store is saving
- Check for localStorage quota issues

---

## 📝 Notes

- Tiles are stored in `localStorage` under key `lumina-tiles-storage`
- Workspace IDs should match workspace IDs from constants
- Default workspace ID is `'default'`
- Tiles persist across page refreshes

---

**Ready to use!** 🎉
