---
name: mn-locale
description: Mongolian locale rules for UI copy, ₮/MNT money, dates, phone numbers, names, addresses, Cyrillic fonts and demo data. Use when the brief is written in Mongolian, targets users in Mongolia, or mentions MNT/₮. Skip otherwise.
---

# Mongolian locale

Apply only what the reviewed brief needs. Formats or wording stated in the brief always win over these defaults.

## Language

- When the brief is Mongolian, write UI copy in Mongolian Cyrillic. Keep code identifiers, routes, testids, API fields and JSON keys in English.
- Keep supplied labels and examples character for character; acceptance tests match visible text literally.
- Short, polite labels: Хадгалах, Цуцлах, Устгах, Засах, Нэмэх, Хайх, Шүүх, Буцах, Дэлгэрэнгүй, Нэвтрэх, Гарах.
- Common statuses: Хүлээгдэж буй, Баталгаажсан, Цуцлагдсан, Дууссан, Идэвхтэй.
- Feedback as full short sentences: "Мэдээлэл олдсонгүй.", "Алдаа гарлаа. Дахин оролдоно уу.", "Амжилттай хадгаллаа."
- Set `<html lang="mn">` when the UI is Mongolian.

## Money (MNT)

- Whole tögrög; no decimals unless the brief shows them.
- Display `125,000₮`: comma thousands separator, ₮ suffix, no space.
- Implement one formatter in `shared/`, e.g. `` `${new Intl.NumberFormat('en-US').format(amount)}₮` ``. Do not rely on `mn-MN` currency formatting: its output differs between ICU builds.
- Money inputs accept digits only; strip separators before parsing.

## Dates and time

- Timezone `Asia/Ulaanbaatar` (UTC+8, no DST). Compute day boundaries in that zone.
- Display dates as `2026.11.03`, time as 24-hour `14:00`. Weeks start on Monday.
- Store and send ISO 8601. Format with explicit functions in `shared/`, not `toLocaleDateString('mn-MN')`, whose output varies by engine.

## People and places

- Phone: 8 digits, optional `+976` prefix. Validate `^(\+976)?\d{8}$` unless the brief is stricter. Display `9911 2233`.
- Names: овог (patronymic) and нэр (given name) as separate fields when names are captured. Display short form `Б. Болд`.
- Address order: Аймаг/Хот → Сум/Дүүрэг → Баг/Хороо → street, building, door. Ulaanbaatar districts: Баянгол, Баянзүрх, Сонгинохайрхан, Сүхбаатар, Чингэлтэй, Хан-Уул, Налайх, Багануур, Багахангай.
- Регистрийн дугаар (national ID) only if requested: two Cyrillic letters + 8 digits, e.g. `УБ99112233`.

## Fonts and layout

- System stack with Cyrillic coverage: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`. No web fonts.
- Mongolian words are longer than English: let buttons and badges wrap, avoid fixed widths, check 360px.

## Demo data

- Realistic names (Бат-Эрдэнэ, Сарангэрэл, Тэмүүлэн, Номин, Энхжин), Ulaanbaatar places (Сүхбаатарын талбай, Зайсан, Чингис хаан олон улсын нисэх буудал) and plausible ₮ amounts.

## Tests

- Formatted values must use plain spaces, never NBSP (U+00A0); Playwright text matching treats them differently.
- Assert exact Cyrillic strings from the ui-spec, including ₮.
