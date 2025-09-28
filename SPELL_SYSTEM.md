# Cedar-OS Spell System Integration

## Overview

This project now includes a context-aware AI spell system that integrates with the Cedar-OS framework. The spell system provides magical, gesture-based interactions for AI-powered medication suggestions.

## Features

### 🪄 Unified Context Menu
- **Activation**: Shift+Click anywhere on the canvas
- **Two Tabs**: Canvas Actions and AI Spells
- **Context-Aware**: Analyzes highlighted patients and current research updates
- **AI-Powered**: Provides evidence-based medication alternatives
- **Visual Feedback**: Animated connection lines between spell and response boxes

### 🎯 Key Components

#### 1. UnifiedContextMenu Component
- Located: `components/cedar-unified-context-menu.tsx`
- Combines canvas actions and AI spells in one interface
- Activates on Shift+Click with tabbed navigation
- Auto-populates queries based on patient context

#### 2. AIResponseBox Component
- Located: `components/cedar-ai-response-box.tsx`
- Draggable response boxes with medication alternatives
- Expandable/collapsible interface
- Copy functionality for medication names and full analysis

#### 3. ConnectionLine Component
- Located: `components/cedar-connection-line.tsx`
- Animated SVG connections between spell UI and response boxes
- Gradient effects with arrow markers
- Staggered animations for multiple connections

#### 4. Medication Suggestions API
- Located: `app/api/cedar/medication-suggestions/route.ts`
- Dedicated endpoint for medication analysis
- Uses GPT-4o-mini for medical reasoning
- Returns structured alternatives with coverage data

## How to Use

### Basic Workflow
1. **Match Patients**: Click "Match Patients" on a research article
2. **Activate Menu**: Shift+Click anywhere on the canvas
3. **Choose Tab**: Switch between "Canvas Actions" and "AI Spells"
4. **Query AI**: In the AI Spells tab, enter your medication question or use the auto-populated query
5. **View Results**: AI response appears as a draggable box with connecting line
6. **Interact**: Expand/collapse, copy information, or access external research

### Example Queries
- "Suggest alternatives to metformin for diabetes patients"
- "What are the best options for hypertension management?"
- "Find medications with better insurance coverage"

## Technical Implementation

### Cedar-OS Integration
```typescript
const { isActive, activate, deactivate, toggle } = useSpell({
  id: 'medication-spell',
  activationConditions: {
    events: [Hotkey.SHIFT],
    mode: ActivationMode.TOGGLE,
  },
  onActivate: (event) => {
    // Handle spell activation
  }
})
```

### Context Passing
The spell receives context about:
- Highlighted patient data (conditions, medications, lab values)
- Current research update information
- Patient risk scores and priority levels

### AI Processing
1. Patient data is structured and sent to the AI
2. Research context is included for relevance
3. AI returns structured alternatives with:
   - Medication names
   - Evidence-based reasoning
   - Insurance coverage percentages
   - Effectiveness comparisons
   - Side effect profiles

## Customization

### Adding New Spells
1. Create a new spell component using `useSpell`
2. Add activation conditions (hotkeys, gestures)
3. Implement your AI processing logic
4. Create corresponding response display components

### Modifying AI Behavior
- Update system prompts in the API endpoints
- Adjust temperature and token limits
- Add new context sources (clinical guidelines, formularies)

### Styling
- All components use Tailwind CSS classes
- Consistent with existing design system
- Responsive and accessible design patterns

## Future Enhancements

### Planned Features
- [ ] Voice activation for spells
- [ ] Multi-modal interactions (text + voice)
- [ ] Integration with clinical decision support systems
- [ ] Real-time insurance formulary checking
- [ ] Patient preference learning

### Potential Spells
- **Diagnosis Spell**: AI-powered differential diagnosis
- **Treatment Spell**: Comprehensive treatment planning
- **Monitoring Spell**: Lab value trend analysis
- **Communication Spell**: Patient communication assistance

## Dependencies

### Required Packages
- `cedar-os`: Core spell system and AI integration
- `react-draggable`: Draggable patient cards and response boxes
- `lucide-react`: Icon system
- `@/components/ui/*`: UI component library

### Environment Variables
- `OPENAI_API_KEY`: Required for AI spell processing
- `NEXT_PUBLIC_OPENAI_API_KEY`: Alternative API key location

## Troubleshooting

### Common Issues
1. **Spell not activating**: Check that patients are highlighted first
2. **AI responses not appearing**: Verify OpenAI API key configuration
3. **Connection lines not showing**: Ensure SVG rendering is enabled

### Debug Mode
Enable console logging by setting `NODE_ENV=development` to see:
- Spell activation events
- AI request/response data
- Connection line calculations

## Contributing

When adding new spells:
1. Follow the existing component structure
2. Include proper TypeScript types
3. Add comprehensive error handling
4. Test with various patient data scenarios
5. Update this documentation

---

*Built with Cedar-OS and powered by AI magic ✨*
