---
name: ux-writing
description: Write consistent task-focused interface labels, feedback and recovery text in the product's language. Use during UI design and bounded polish while preserving exact acceptance and UI-contract wording.
---

# UX writing

Write for the person completing the current product's task. The brief's language, supplied wording and locale rules win. Keep identifiers, API details and internal implementation terminology out of UI copy unless the user needs them to decide what to do.

## Design stage

Choose a small vocabulary in the existing UI spec, then reuse it across navigation, headings, actions and feedback.

- **Action:** name the result, such as “Save changes” or “Send request.” Use a specific verb when the action's consequence matters.
- **In progress:** say what is happening while preserving the form's state. A pending request is not a completed outcome.
- **Success:** confirm the actual result using the same action vocabulary. Explain the next step only when another step exists.
- **Validation:** identify the field or constraint and how to correct it. Keep entered values and focus behavior useful.
- **Failure:** describe the recoverable problem and a real retry/correction path. Do not expose stack traces, secrets or implementation details.
- **Empty state:** explain what this empty collection means and offer an existing useful next action when there is one. A read-only page does not require an invented CTA.

Use explicit units and distinguish totals from per-unit values when relevant. Describe required and optional fields consistently. Do not invent popularity, guarantees, users, clients or trust claims to make the demo look complete.

Freeze exact labels, accessible names and formatted examples in the binding UI contract so the builder and independent QA use the same words. Preserve supplied acceptance text literally.

## Polish stage

Review the rendered copy for ambiguity, truncation, inconsistent terms and missing recovery guidance. Change only text not already fixed by acceptance or the reviewed UI contract. Report a needed contract-bound wording change as a limitation for the owning stage; do not rename tested buttons to make them sound nicer.

An instruction to “submit” should never claim payment, sending, publishing or approval that the application did not actually perform. Apply this skill within existing screens and states; do not add workflows merely to demonstrate copywriting.
