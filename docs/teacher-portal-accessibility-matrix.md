# Teacher Portal accessibility acceptance matrix

| Criterion | Implementation evidence | Verification |
| --- | --- | --- |
| Keyboard bypass | Skip link targets the `main` landmark. | Keyboard check required during UAT. |
| Structure | Teacher shell supplies `aside`, labelled navigation, `header`, and `main`. | Blade render / screen-reader check. |
| Navigation state | Active destination uses `aria-current="page"`. | Feature and manual route checks. |
| Focus | Teacher controls have a high-visibility, non-color-only focus outline. | Keyboard check at 100% and 200% zoom. |
| Mobile navigation | Menu is a labelled button, has `aria-expanded`, Escape close, and a backdrop. | 390 px / 320 px browser check. |
| Status feedback | Session feedback has `role="status"` and `aria-live="polite"`. | Submit a teacher form. |
| Form labels | Existing native form controls retain labels; the dashboard period controls have explicit associations. | Form-by-form UAT. |
| Motion | Teacher navigation and existing reveal behavior respect reduced-motion preferences. | OS/browser reduced-motion check. |
| Data tables | Semantic tables are preserved and can scroll horizontally where comparison requires it. | Narrow viewport check. |
| Print reports | PDF/print header identifies Catbalogan I SPED Center and School ID 193540. | Print preview / generated PDF. |

Automated checks validate rendering and application behavior. Final WCAG 2.2 AA conformance still requires manual assistive-technology and content review.
