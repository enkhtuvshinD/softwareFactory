# Polish pass

## Images inspected
All six: visual-evidence/{desktop,mobile}-{catalog,booking,requests}.png.

## Findings
- Catalog (desktop and mobile): the BMW card shows a broken or not-yet-loaded image. The native alt text "Image unavailable" sits at the top-left and overlaps the "Available" badge, and the media box is shorter than on the other cards. This is the only material defect.
- Booking and requests screens: hierarchy, price breakdown, the primary "Request booking" action, status badges, filter pills and mobile nav wrap are legible and show no overflow. No edits were needed.

## Fix
- src/styles/app.css: the card media box now clips overflow. The image and fallback are centered, muted, and sized to fill the 16:10 box. The fallback no longer applies its own aspect ratio, so card heights stay consistent. This is a CSS-only change.

## Checks run
- `npm run build` passed.
- I did not run unit or Playwright checks, and did not regenerate screenshots.

## Limitations
- I have not read any after-change image, so the fix is unverified visually. The runner regenerates evidence.
- If the BMW image URL is genuinely broken, the seed data or server owns that. I could not tell from the screenshot whether it was a failed load or a capture taken mid-load.
- No final visual approval is claimed.
