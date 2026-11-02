---
name: demo-data-quality
description: Prepare a small coherent resolved seed for the actual product and its acceptance, journey and visual states. Use in requirements and seed review; preserve relevant supplied records and keep original inputs unchanged.
---

# Demo data quality

The output is the existing `requirements/seed.json`, explained in the requirements document. It is not a second dataset, a new feature list or a reason to expand the domain model. An anonymous calculator or static page may correctly use `{}`.

## Select useful state

Read the current brief, optional input seed and primary journey. Preserve every relevant supplied ID/value. If sample data belongs to an unrelated domain, retain the original input, document the mismatch and resolve only data needed by this product.

Choose a few records that make requested behavior demonstrable:
- The principal screen has meaningful content, and acceptance preconditions can be reached.
- Requested statuses/categories have enough variety to distinguish them without filling every hypothetical state.
- Relevant lists include a realistic longer label or Unicode name so layout is exercised, with relationships that still match the actual domain.
- Empty/error behavior is reached through supported UI or isolated test setup; do not corrupt the normal reset seed to manufacture failures.

Do not use global record counts or ordering as an implicit test contract. Stable IDs and recognizable data identify the intended record.

## Check coherence

- IDs are unique and references resolve. Related names, dates, statuses and totals agree with the reviewed rules.
- Derived values reproduce the brief's examples; add no arbitrary fee, currency or metric.
- Use the persisted run date only for date-dependent products. Keep supplemental dates consistent with their intended current/future state and relevant conflict rules. Preserve original supplied dates.
- Use the requested language and locale for names, labels and formats. Do not add personal fields or identifiers absent from the domain model.
- Use supported media URLs/assets only when the product benefits from them; plan intentional fallbacks. Missing photos do not justify invented ratings or verification claims.

Record which supplied records were preserved, which minimal records were added and the purpose of important demo states. The reviewer checks that explanation and the complete seed. After approval the builder consumes it unchanged; QA can create temporary state through the specified reset/setup mechanisms without rewriting the reviewed fixtures.
