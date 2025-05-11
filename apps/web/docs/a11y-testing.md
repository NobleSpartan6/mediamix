# Accessibility Testing Guide for Motif

This document outlines specific processes for testing accessibility aspects of the Motif video editor, with particular focus on the PRD requirement of **"all interactive controls ≥ 4.5:1 contrast"**.

## Prerequisites

- [axe DevTools browser extension](https://www.deque.com/axe/devtools/)
- [WAVE Evaluation Tool](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Keyboard testing guide](https://www.w3.org/WAI/test-evaluate/preliminary/#keyboard)

## Critical Accessibility Requirements

1. **Contrast Ratio ≥ 4.5:1 for Interactive Controls** (PRD Hard Requirement)
2. **Keyboard Navigation** for all interactive elements
3. **Screen Reader Announcements** for dynamic content changes
4. **ARIA Attributes** properly implemented

## Contrast Ratio Testing Procedure

### Automated Testing

1. Install the axe DevTools extension for your browser
2. Navigate to the component you want to test
3. Open DevTools and select the axe tab
4. Run the analysis and pay attention to contrast issues
5. Document any failures for remediation

### Manual Testing

For more precise testing, especially with custom elements:

1. Use the color picker in Chrome DevTools to select foreground and background colors
2. Enter these values into the WebAIM Contrast Checker
3. Verify the contrast ratio meets or exceeds 4.5:1
4. Document the results in the project accessibility report

### Sample Contrast Test Chart

| Component | Foreground | Background | Ratio | Pass/Fail |
|-----------|------------|------------|-------|-----------|
| Button (default) | #FFFFFF | #4E8CFF | 2.8:1 | ❌ - Needs darkening |
| Button (improved) | #FFFFFF | #0056D6 | 4.5:1 | ✅ |
| Timeline clip label | #FFFFFF | rgba(30,144,255,.5) | ? | To be tested |
| Timeline marker | #4E8CFF | #101012 | 5.6:1 | ✅ |

## Keyboard Navigation Testing

1. Start from the top of the page and press Tab to navigate through all interactive elements
2. Verify:
   - Tab order follows a logical flow
   - Focus styles are clearly visible
   - All interactive elements can be reached and activated
   - No keyboard traps exist (except in intentional cases like modals)
   - Shortcuts defined in PRD (I/O, C, Space) work correctly

3. Document keyboard navigation findings in the project accessibility report

## Screen Reader Testing

### VoiceOver (macOS)

1. Enable VoiceOver (Cmd + F5)
2. Test main user flows:
   - Importing video
   - Navigating the timeline
   - Using beat detection features
   - Exporting video

3. Verify announcements are clear and meaningful

### NVDA (Windows)

Perform similar tests using NVDA on Windows devices, focusing on the same user flows.

## Timeline Accessibility

The timeline component presents unique accessibility challenges:

1. **Test drag operations** to ensure they can be performed via keyboard
2. **Verify clip selection** is announced to screen readers
3. **Ensure beat markers** are perceivable through multiple means (visual + possibly audio)
4. **Verify tooltips** appear on hover/focus and are readable by screen readers

## Implementing Automated Accessibility Tests

### Setting Up axe-core in Jest

```javascript
// Snippet for a11y.test.jsx - to be implemented
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Documentation Requirements

For each component, document:
1. Contrast ratio measurements
2. Keyboard navigation behavior
3. Screen reader announcements
4. Any accessibility exemptions (with justification)

## CI Integration

Once implemented, accessibility tests will run as part of:
```bash
npm run test:a11y
```

Results will be reported, and PRs with accessibility failures will be blocked from merging.

## Manual Testing Schedule

- **During development**: Basic keyboard and contrast testing
- **Before MVP release**: Comprehensive screen reader testing
- **Quarterly**: Full accessibility audit

## References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessible Rich Internet Applications (ARIA)](https://www.w3.org/TR/wai-aria-1.1/)
- [Accessible Name and Description Computation](https://www.w3.org/TR/accname-1.1/) 