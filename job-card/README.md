# Optimex Job Cards

Job card entry for Optimex Opticals. Photograph a handwritten job card with a phone and the
entry form fills itself: order number, dates, customer, referral (Call / Doctor / Clinic / Lab),
the Re/Le prescription grid (Sph / Cyl / Axis for DV and NV), lens, frame, total, advance and balance.

- Handwriting is read by Claude through the claude.ai artifact runtime (`sample` capability with an image).
- Saved cards live in the artifact's shared database (`db` capability), so a card saved on the phone
  shows up on the shop computer straight away.
- Fields Claude is unsure about are outlined and tagged "check". Balance is worked out from total − advance.
- Cards can be searched and moved through Pending → Ready → Delivered. Pending cards past their due date show as Overdue.

The page is published as a claude.ai artifact. Opened as a plain file outside claude.ai, scanning is
off and cards are saved in that browser only.
