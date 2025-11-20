# Investment Memo Tool - Layout Options

## Option 1: Beta Badge (RECOMMENDED)
Keep in "Available Now" section with clear beta indication and disclaimer.

### Changes:
```typescript
{
  id: 'investment-memo',
  title: 'Investment Memo Generator',
  description: 'Generate comprehensive 15-25 page institutional-grade investment memos with executive summary, market analysis, financial modeling, risk assessment, and IC-ready recommendations.',
  icon: FiFileText,
  color: 'blue',
  status: 'beta', // Changed from 'available'
  betaNotice: 'Currently in beta testing. Features are functional but undergoing refinement.',
  // ... rest of config
}
```

### Visual:
- Badge: "🧪 Beta - Launching Soon" (blue/yellow)
- Blue info banner above "How to Use" section
- All features remain visible

---

## Option 2: "Launching Soon" Section
Create dedicated section for tools in active development.

### Structure:
1. "Available Now" (empty for now)
2. "Launching Soon" (Investment Memo - featured)
3. "Coming Soon" (other tools)

### Visual:
- Larger card with gradient background
- "⭐ Launching Soon - Beta Available" badge
- Countdown or timeline indicator
- Try Beta button (less prominent than main CTA)

---

## Option 3: "Early Access" Treatment
Keep in "Available Now" with prominent early access messaging.

### Changes:
```typescript
status: 'early-access',
accessNotice: 'Early access available now. Join beta testing to help shape the final release.',
```

### Visual:
- Badge: "⚡ Early Access"
- Purple/gold gradient banner
- "Join Beta" CTA alongside "Try It Now"
- Emphasis on user feedback opportunity

---

## Option 4: Featured in "Coming Soon"
Move to "Coming Soon" but give special treatment as next to launch.

### Changes:
```typescript
status: 'launching-soon',
launchDate: 'Q1 2026',
betaAvailable: true,
```

### Visual:
- Full-width featured card above other coming soon tools
- "🚀 Launching Q1 2026 - Beta Access Available"
- Larger, more detailed than other coming soon tools
- "Request Beta Access" button

---

## Recommendation: Option 1 (Beta Badge)

**Why:**
- Honest and transparent
- Encourages usage while setting proper expectations
- Easy to update when ready for full launch
- Maintains professional credibility
- Users know what they're getting

**Implementation:**
- Simple status change
- Add beta badge component
- Include disclaimer text
- No major restructuring needed
