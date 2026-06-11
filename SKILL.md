---
name: design-system-online-test
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Online Test

## Mission
Deliver implementation-ready design-system guidance for Online Test that can be applied consistently across dashboard web app interfaces.

## Brand
- Product/brand: Online Test
- URL: https://testbook.com/TS-ssc-cgl/tests/6a19a10f2efbc8aae3b4d27d?attemptNo=1#/lt-test
- Audience: authenticated users and operators
- Product surface: dashboard web app

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=sans-serif`, `font.family.stack=sans-serif`, `font.size.base=12px`, `font.weight.base=500`, `font.lineHeight.base=12px`
- Typography scale: `font.size.xs=10px`, `font.size.sm=11px`, `font.size.md=12px`, `font.size.lg=13px`, `font.size.xl=14px`, `font.size.2xl=16px`, `font.size.3xl=18px`
- Color palette: `color.text.primary=#ffffff`, `color.text.secondary=#333333`, `color.surface.muted=#000000`, `color.text.inverse=#ff0000`, `color.surface.base=#0000ff`, `color.surface.raised=#2e66cc`, `color.surface.strong=#126cbf`
- Spacing scale: `space.1=1px`, `space.2=1.2px`, `space.3=2px`, `space.4=3px`, `space.5=3.6px`, `space.6=4px`, `space.7=6px`, `space.8=7px`
- Radius/shadow/motion tokens: `radius.xs=3px`, `radius.sm=4px`, `radius.md=7px` | `motion.duration.instant=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
