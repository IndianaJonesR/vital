# Cedar-OS Integration Setup Guide

## Overview
This project integrates Cedar-OS with OpenAI to provide AI-powered clinical assistance for patient management, following the official [Cedar-OS documentation](https://docs.cedarcopilot.com/getting-started/hackathon-starter#cedar-os-hackathon-starter).

## Setup Instructions

### 1. Install Cedar-OS Dependencies

According to the Cedar-OS documentation, you need to install the framework:

```bash
# Install Cedar-OS and Mastra
npm install cedar-os mastra

# Or if using the CLI (recommended by docs)
npx cedar-os-cli plant-seed
```

### 2. Environment Variables

Create a `.env.local` file with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (for Cedar-OS integration)
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Cedar-OS Configuration

The project is configured with:
- **CedarCopilot Provider** in `app/layout.tsx` with OpenAI backend
- **Agentic State** for patient data management
- **Agentic Actions** for finding patient matches
- **Spells** for right-click context menus

## Features Implemented

### 1. Right-Click Context Menu
- **Right-click any research update** to open Cedar-OS context menu
- **Select "Find Matches"** to trigger AI-powered patient matching
- **Uses Cedar-OS spells** for gesture-based interactions

### 2. AI-Powered Patient Matching
- **API Route**: `/api/cedar/find-matches`
- **Functionality**: 
  - Uses OpenAI GPT-4 to analyze research updates
  - Extracts patient criteria (conditions, medications, lab values)
  - Finds matching patients in Supabase database
  - **Fixes the asthma issue**: Only matches patients with exact condition matches

### 3. Patient Highlighting
- **Visual feedback**: Matching patients glow on the dashboard
- **Real-time updates**: Uses Cedar-OS agentic state
- **Accurate matching**: Fixed to only show patients with actual matching conditions

## How to Use

### 1. Right-Click Research Updates
1. **Right-click** on any research update card
2. **Confirm "Find Matches"** in the dialog to trigger AI-powered patient matching
3. **Watch AI processing** analyze the update and find matching patients
4. **See patient highlighting** on the dashboard

### 2. Patient Actions (Future)
- Schedule Follow-Up Visit
- Flag Patient for Review
- Generate Patient Explainers

## Technical Architecture

Following Cedar-OS documentation:
- **Frontend**: Next.js with Cedar-OS React framework
- **Backend**: Next.js API routes + Mastra (AI framework)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 API
- **UI**: Cedar-OS spells for right-click interactions

## Cedar-OS Components Used

- **CedarCopilot**: Main provider component
- **useAgenticState**: For patient state management
- **useAgenticActions**: For AI-powered actions
- **useSpell**: For right-click context menus

## API Endpoints

- `POST /api/cedar/find-matches` - Find patients matching research updates

## Demo Flow

1. **Right-click Research Update** → Opens Cedar-OS context menu
2. **Select "Find Matches"** → Triggers AI analysis
3. **Watch AI Processing** → Analyzes update with GPT-4
4. **See Patient Highlighting** → Only patients with matching conditions glow
5. **View Results** → Accurate patient matching based on actual data

## Key Improvements

✅ **Fixed Asthma Issue**: Now only matches patients who actually have asthma
✅ **Accurate Matching**: Uses exact condition matching instead of fuzzy logic
✅ **Right-Click Interface**: Uses Cedar-OS spells instead of buttons
✅ **Proper Cedar-OS Integration**: Follows official documentation
✅ **AI-Powered Analysis**: Uses GPT-4 for intelligent criteria extraction

## Next Steps

1. **Install Cedar-OS**: Run `npm install cedar-os mastra`
2. **Add OpenAI API Key**: Set `OPENAI_API_KEY` in `.env.local`
3. **Test Right-Click**: Right-click research updates to see Cedar-OS in action
4. **Customize Spells**: Add more Cedar-OS spells for different actions

## Troubleshooting

- **"Cannot find module 'cedar-os'"**: Run `npm install cedar-os mastra`
- **No right-click menu**: Ensure Cedar-OS is properly installed
- **Inaccurate matching**: Check OpenAI API key and network connection

## References

- [Cedar-OS Documentation](https://docs.cedarcopilot.com/getting-started/hackathon-starter#cedar-os-hackathon-starter)
- [Cedar-OS Spells Guide](https://docs.cedarcopilot.com/spells/creating-custom-spells)
- [Mastra Integration](https://docs.cedarcopilot.com/agent-backend-connection/custom)