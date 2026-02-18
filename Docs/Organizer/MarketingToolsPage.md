# MarketingToolsPage.tsx — Specification

> **Route:** `/organizer/marketing`  
> **Sub-routes:** `/organizer/marketing/promos` | `/organizer/marketing/email` | `/organizer/marketing/social`  
> **Role Access:** Organizer (own events), Admin, Super Admin  
> **Purpose:** Comprehensive marketing suite covering promotional codes, AI-powered social media content generation, email campaigns, and visual flyer/banner creation.

---

## 1. Overview

The Marketing Tools Page provides the Organizer with four integrated marketing capabilities in a tabbed layout: promo code management, AI social media content generation (GPT-4 via Cloud Function), email campaign management, and a flyer/banner generator. All tools are scoped to the organizer's own events and attendee lists.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                           │
│ "Marketing Tools"                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ TAB BAR                                                              │
│ [ 🏷️ Promo Codes ]  [ 🤖 Social Media AI ]  [ 📧 Email Campaigns ]  │
│ [ 🎨 Flyer Generator ]                                               │
├──────────────────────────────────────────────────────────────────────┤
│ TAB CONTENT AREA (changes based on active tab)                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tab A — Promo Codes

### 3.1 Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [ + Create Promo Code ]  [ 🔍 Search codes ]  [ Filter ▼ ] │
├─────────────────────────────────────────────────────────────┤
│ PROMO CODES TABLE                                           │
│ [Code] [Discount] [Uses] [Applied To] [Valid Until] [Status]│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Promo Codes Table

| Column       | Content                                           | Sortable |
|--------------|---------------------------------------------------|----------|
| Code         | `EARLYBIRD` (monospace font, copyable)            | No       |
| Discount     | "20% off" or "₹50 flat"                           | Yes      |
| Uses         | Progress bar: `45 / 100`                          | Yes      |
| Applied To   | All Tiers / Specific tier name(s)                 | No       |
| Valid Until  | Date + "Expires in X days" (amber if <3 days)     | Yes      |
| Status       | Active (green) / Expired (grey) / Paused (amber)  | Yes      |
| Actions      | Edit ✏️ / Disable ⏸ / Delete 🗑 (if 0 uses)       | No       |

**Filter options:**
- Status: All / Active / Expired / Paused
- Event: All Events / Specific event dropdown
- Discount Type: All / Percentage / Flat Amount

### 3.3 Create Promo Code Modal

**Fields:**
```
Code:          [EARLYBIRD          ] [🎲 Auto-Generate]
Discount Type: ( ) Percentage  (•) Flat Amount
Discount Value:[50               ] ₹ (or %)
Applies To:    [All Tiers ▼      ]  ← populates from events/{id}/tiers
Event:         [TechConf 2026 ▼  ]
Max Uses:      [100              ]  [ ] Unlimited
Min Order (₹): [500              ]  (optional)
Valid From:    [Mar 1, 2026 10:00 AM]
Valid Until:   [Mar 15, 2026 11:59 PM]

Live Preview:
  "EARLYBIRD: ₹50 off orders above ₹500
   Valid: Mar 1 – Mar 15, 2026 | 100 uses remaining"

[ Cancel ]  [ Save Promo Code ]
```

**Auto-Generate Code:** Generates 8-character alphanumeric string (e.g., `X7K2M9PQ`). Checks uniqueness against `promo_codes` collection.

**Validation:**
- Code: 4–20 characters, alphanumeric + hyphen only, must be unique
- Discount Value: >0; if percentage, max 100
- Valid Until must be > Valid From
- Max Uses: integer ≥1 (or unlimited toggle)

**On Save:**
```typescript
promoService.createPromoCode({
  code: 'EARLYBIRD',
  discountType: 'flat',
  discountValue: 50,
  eventId: selectedEventId,
  tierId: null,  // null = all tiers
  maxUses: 100,
  minOrderValue: 500,
  validFrom: Timestamp,
  validUntil: Timestamp,
  status: 'active',
  createdBy: organizerUid
})
```

### 3.4 Edit Promo Code Modal

Same fields as Create. Restrictions when editing active code with >0 uses:
- Cannot reduce `maxUses` below current `usedCount`
- Cannot change `code` string (must delete and recreate)
- Cannot change `discountType` (can change value)

### 3.5 Promo Performance Metrics (on row expand)

```
EARLYBIRD  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
  Uses: 45 / 100  |  Revenue Impact: −₹2,250 discount
  Bookings via this code: 45  |  Avg order: ₹450
  Conversion lift: +18% vs non-promo bookings
```

---

## 4. Tab B — Social Media AI Generator

### 4.1 Layout
```
┌──────────────────────┬─────────────────────────────────────┐
│ INPUT FORM           │ GENERATED CONTENT PREVIEW           │
│ (40% width)          │ (60% width)                         │
│                      │                                     │
│ Event selector       │ [Platform icon]                     │
│ Platform             │                                     │
│ Tone                 │ Generated post text                 │
│ Include Hashtags     │ (editable inline textarea)          │
│ Include Emojis       │                                     │
│ Custom message       │ Char count: 280 / 2200              │
│                      │                                     │
│ [ Generate ]         │ [Copy] [Regenerate] [Download Image]│
└──────────────────────┴─────────────────────────────────────┘
```

### 4.2 Input Form Fields

| Field            | Type                   | Options / Validation                               |
|------------------|------------------------|----------------------------------------------------|
| Event Selector   | Dropdown               | Organizer's published events; prefills event data  |
| Platform         | Radio group            | Twitter (280 chars) / Instagram (2200) / LinkedIn (3000) / Facebook (63,206) |
| Tone             | Dropdown               | Professional / Casual / Exciting / Informative / Urgent |
| Include Hashtags | Toggle (default: ON)   |                                                    |
| Include Emojis   | Toggle (default: ON)   |                                                    |
| Custom Message   | Textarea (optional)    | Max 200 chars; AI incorporates this                |
| Language         | Dropdown               | English, Hindi, + 8 others (default: event language)|

### 4.3 Generation Flow

```typescript
// Called on "Generate" click
const response = await marketingService.generateSocialPost({
  eventId: selectedEventId,
  platform: 'instagram',
  tone: 'exciting',
  includeHashtags: true,
  includeEmojis: true,
  customMessage: 'Mention the free lunch on Day 1',
  language: 'en'
});

// Cloud Function constructs prompt + calls OpenAI
// Returns: { generatedText, characterCount, hashtags[] }
```

**Cloud Function: `generateSocialPost`**
```
Input:  { eventId, platform, tone, includeHashtags, includeEmojis, customMessage, language }
Process:
  1. Fetch event data from Firestore (title, description, date, venue, ticketLink)
  2. Determine character limit based on platform
  3. Build system prompt:
     "You are a professional event marketing copywriter."
  4. Build user prompt:
     "Generate a {tone} {platform} post for this event:
      Title: {title}
      Date: {date}
      Venue: {venue}
      Description: {shortDescription}
      Ticket Link: {link}
      Special note: {customMessage}
      Requirements:
      - Keep under {charLimit} characters
      - {includeHashtags ? 'Add 5-8 relevant hashtags' : 'No hashtags'}
      - {includeEmojis ? 'Use appropriate emojis' : 'No emojis'}
      - Language: {language}"
  5. Call OpenAI GPT-4 API (temperature: 0.7)
  6. Return generated text
Output: { generatedText, characterCount }
```

**Loading State:** Animated typing indicator in preview panel while generation runs (avg ~3s).

### 4.4 Generated Content Preview Actions

| Button             | Action                                                              |
|--------------------|---------------------------------------------------------------------|
| Copy to Clipboard  | Copies full post text; "✅ Copied!" toast                          |
| Regenerate         | Calls Cloud Function again (increments a `generationCount` counter)|
| Edit Inline        | Makes preview textarea editable; "Save Edits" button appears       |
| Download as Image  | Overlays post text on event cover image → PNG download             |
| Schedule Post      | [Future feature] Shows "Coming Soon" tooltip                       |

**Download as Image:**
- Client-side: `html2canvas` captures a styled div (event cover + post text overlay)
- Outputs at 1080×1350px (Instagram portrait format)
- Filename: `{eventSlug}-{platform}-post.png`

### 4.5 Generation History

Collapsible section at bottom: last 5 generated posts for this session, with "Use this" restore button.

---

## 5. Tab C — Email Campaigns

### 5.1 Campaign Dashboard

```
┌────────────────────────────────────────────────────────────┐
│ [ + Create Campaign ]                   [ Filter by event ]│
├────────────────────────────────────────────────────────────┤
│ CAMPAIGNS TABLE                                            │
│ [Name] [Event] [Recipients] [Sent Date] [Open%] [Click%]  │
└────────────────────────────────────────────────────────────┘
```

**Campaigns Table:**

| Column          | Content                                  |
|-----------------|------------------------------------------|
| Campaign Name   | User-defined name + template badge       |
| Event           | Event name it was sent for               |
| Recipients      | Count                                    |
| Sent Date       | Timestamp (or "Scheduled: Mar 15")       |
| Open Rate       | % with color (green >40%, amber 20-40%)  |
| Click Rate      | %                                        |
| Status          | Sent / Scheduled / Draft                 |
| Actions         | View Details / Duplicate / Delete (draft)|

### 5.2 Create Campaign Wizard (5 Steps)

**Step 1: Select Event**
- Dropdown of organizer's events
- Shows: event name, date, total registered attendees count

**Step 2: Choose Recipients**
```
( ) All Attendees of this Event  (250 recipients)
( ) Confirmed Bookings Only      (240 recipients)
( ) Checked-In Attendees         (180 recipients)
( ) Not Yet Checked In           (60 recipients)
( ) Specific Ticket Tier:        [VIP ▼]  (50 recipients)
( ) Custom Segment               → opens filter builder
```

**Step 3: Choose Template**
```
Thumbnails of templates:
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Reminder │ │Thank You │ │ Update   │ │  Custom  │
│ template │ │ template │ │ template │ │  HTML    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Step 4: Customize Content**
```
Subject:   [Your ticket for {eventTitle} — See you tomorrow! ]
          Character count: 52

Body (rich text editor):
[B] [I] [U] [Link] [Image] [H1] [H2] [Bullet] [Ordered]

Template Preview with variable tokens:
  Dear {{attendee.firstName}},
  
  Your ticket for {{event.title}} is confirmed.
  📅 {{event.date}} | 📍 {{event.venue}}
  
  [View Your Ticket]  ← CTA button
  
  See you there!
  {{organizer.name}}

Preview Toggle: [Desktop] [Mobile]
Send Test Email: [your@email.com ] [ Send Test ]
```

**Available Template Variables:**
```
{{attendee.firstName}}, {{attendee.fullName}}, {{attendee.email}}
{{event.title}}, {{event.date}}, {{event.venue}}, {{event.ticketLink}}
{{ticket.id}}, {{ticket.tier}}, {{ticket.qrCodeUrl}}
{{organizer.name}}, {{organizer.email}}
```

**Step 5: Schedule & Send**
```
Send:  (•) Send Now
       ( ) Schedule for: [Mar 14, 2026  6:00 PM ▼]

[ Preview Email ] [ Back ]  [ Send Campaign ]
```

**On Send:**
- Calls `createEmailCampaign` Cloud Function
- Cloud Function writes campaign to `email_campaigns/{id}`
- Background worker (Cloud Task) queues individual emails via SendGrid/Nodemailer
- Rate-limited to 100 emails/minute (to avoid spam flags)

### 5.3 Campaign Detail View

Opens on "View Details" click:

```
Campaign: "Event Reminder — TechConf 2026"
Sent: Mar 14, 2026 6:00 PM | Recipients: 250

Analytics:
  Delivered: 248 (99.2%) | Bounced: 2
  Opened: 112 (45.2%) | Not Opened: 136
  Clicked: 30 (12%) | Unsubscribed: 1

Click Map: [Link text → 30 clicks (100%)] (only 1 link in this campaign)

[ Resend to Non-Openers ]  [ Export Report ]
```

"Resend to Non-Openers" creates a new campaign scoped to attendees whose email was delivered but not opened (tracked via email pixel tracking or SendGrid open events webhook).

---

## 6. Tab D — Flyer & Banner Generator

### 6.1 Layout

```
┌──────────────────────┬─────────────────────────────────────┐
│ GENERATOR FORM       │ LIVE PREVIEW                        │
│                      │                                     │
│ Select Event         │ [Flyer/Banner preview renders here] │
│ Choose Template      │                                     │
│ Color Scheme         │ Responsive at actual dimensions     │
│ Font                 │                                     │
│                      │ Format: Instagram / Print / etc.    │
│ [ Download ]         │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

### 6.2 Template Gallery

6 visual templates (thumbnail grid):
1. **Modern Minimalist** — white background, large type
2. **Bold & Colorful** — gradient background, vibrant
3. **Corporate Professional** — dark navy, structured
4. **Music Festival Vibes** — neon on dark, playful
5. **Tech Conference** — geometric, blue/grey
6. **Food & Drink Event** — warm tones, organic shapes

### 6.3 Generator Form Fields

| Field              | Type              | Description                                 |
|--------------------|-------------------|---------------------------------------------|
| Event Selector     | Dropdown          | Auto-fills: title, date, venue, cover image |
| Template           | Thumbnail grid    | Visual selection                            |
| Primary Color      | Color picker      | Replaces template accent color              |
| Secondary Color    | Color picker      | Replaces secondary elements                 |
| Font Family        | Dropdown          | 6 options (Poppins, Montserrat, Roboto, etc.)|
| Output Format      | Radio             | Instagram Post (1080×1080) / Story (1080×1920) / Print A4 / Twitter Banner (1500×500) |
| Show QR Code       | Toggle            | Embeds event booking QR on flyer            |

### 6.4 Rendering

Client-side rendering using `html2canvas` or `@napi-rs/canvas` (via Cloud Function for high-fidelity output):
- All template elements are React/CSS components
- Live preview updates as fields change
- Final download triggers Cloud Function for server-side rendering (consistent fonts, higher quality)

**Cloud Function: `generateFlyer`**
```
Input:  { eventId, templateId, primaryColor, fontFamily, format }
Process:
  1. Fetch event data (title, date, venue, coverImage URL)
  2. Render Puppeteer HTML template with event data
  3. Capture screenshot at target dimensions
  4. Upload to Firebase Storage: /marketing/flyers/{uid}/{eventId}.png
  5. Return signed URL (24hr TTL)
Output: { downloadUrl, dimensions }
```

---

## 7. Firebase Services

### Firestore Collections

**`promo_codes/{code}`**
```json
{
  "code": "EARLYBIRD",
  "discountType": "flat",
  "discountValue": 50,
  "eventId": "event_id",
  "tierId": null,
  "maxUses": 100,
  "usedCount": 45,
  "minOrderValue": 500,
  "validFrom": "timestamp",
  "validUntil": "timestamp",
  "status": "active",
  "createdBy": "organizer_uid",
  "createdAt": "timestamp"
}
```

**`email_campaigns/{id}`**
```json
{
  "id": "auto-generated",
  "name": "Event Reminder",
  "eventId": "event_id",
  "organizerUid": "organizer_uid",
  "recipientType": "all",
  "recipientCount": 250,
  "subject": "See you tomorrow!",
  "templateId": "reminder",
  "htmlBody": "<html>...</html>",
  "status": "sent",
  "scheduledAt": null,
  "sentAt": "timestamp",
  "stats": {
    "delivered": 248,
    "bounced": 2,
    "opened": 112,
    "clicked": 30,
    "unsubscribed": 1
  }
}
```

### Cloud Functions Called

| Function              | Input                              | Output                          |
|-----------------------|------------------------------------|---------------------------------|
| `createPromoCode`     | `PromoCodeData`                    | `{ code, id }`                  |
| `updatePromoCode`     | `{ code, updates }`               | `{ success }`                   |
| `disablePromoCode`    | `{ code }`                         | `{ status: 'paused' }`          |
| `deletePromoCode`     | `{ code }`                         | `{ deleted }`                   |
| `generateSocialPost`  | `{ eventId, platform, tone, ... }` | `{ generatedText, charCount }`  |
| `createEmailCampaign` | `CampaignData`                     | `{ campaignId, status }`        |
| `sendTestEmail`       | `{ campaignId, testEmail }`        | `{ sent: boolean }`             |
| `generateFlyer`       | `{ eventId, templateId, ... }`     | `{ downloadUrl }`               |

### Email Provider (via Cloud Function)
- **SendGrid** or **Nodemailer + SMTP**
- Open tracking: pixel beacon embedded in HTML
- Click tracking: redirect links through Cloud Function URL
- Webhook: SendGrid event webhook → updates `email_campaigns/{id}.stats` in real time
- Unsubscribe: handled by SendGrid; Firestore `users/{uid}.emailPreferences.marketing = false`

### OpenAI API (via Cloud Function)
- Model: `gpt-4-turbo-preview` (or configured model)
- Temperature: 0.7 (creative but coherent)
- Max tokens: 500 (sufficient for all platform limits)
- API key stored in Cloud Function environment variables (never client-side)

---

## 8. State Management

```typescript
// useOrganizerStore marketing slice
promoCodes: PromoCode[];
emailCampaigns: EmailCampaign[];
generatedPost: string | null;
isGenerating: boolean;
selectedMarketingTab: 'promos' | 'social' | 'email' | 'flyer';

fetchPromoCodes: (eventId?: string) => Promise<void>;
createPromoCode: (data: PromoCodeData) => Promise<void>;
updatePromoCode: (code: string, updates: Partial<PromoCode>) => Promise<void>;
generateSocialPost: (params: SocialGenParams) => Promise<void>;
createEmailCampaign: (data: CampaignData) => Promise<string>;
fetchEmailCampaigns: () => Promise<void>;
```

---

## 9. Interconnections

| Connected Page / Component       | How Connected                                                        |
|----------------------------------|----------------------------------------------------------------------|
| **EventAnalyticsPage**           | UTM tracking from social posts feeds into booking sources chart      |
| **AttendeeManagementPage**       | Email campaigns use attendee lists from same Firestore collection     |
| **MyEventsPage**                 | Promo codes are event-scoped; event selector populates from MyEvents  |
| **Checkout flow (public)**       | `validatePromoCode` Cloud Function called during attendee checkout    |
| **OrganizerDashboard**           | "Marketing Tools" quick action links to this page                    |
| **ManageEventPage (Marketing tab)** | Same promo code UI embedded in event-specific marketing tab       |

---

## 10. API Services Summary

| Service           | Provider     | Purpose                                    |
|-------------------|--------------|--------------------------------------------|
| Firestore         | Firebase     | Promo codes, campaigns CRUD                |
| Cloud Functions   | Firebase     | Business logic for all marketing actions   |
| OpenAI GPT-4      | OpenAI       | Social media content generation            |
| SendGrid          | SendGrid     | Email delivery, open/click tracking        |
| Firebase Storage  | Firebase     | Flyer/banner image storage                 |
| html2canvas       | npm (client) | Client-side image capture for social posts |

---

## 11. Error States & Edge Cases

| Scenario                         | Handling                                                          |
|----------------------------------|-------------------------------------------------------------------|
| Promo code already exists        | Real-time validation on code input; red border + "Code taken"    |
| OpenAI API rate limit            | Retry with exponential backoff; "Generation failed, try again"   |
| Email campaign with 0 recipients | Validation before Step 5; cannot proceed without recipients       |
| Flyer generation timeout         | Background job; email organizer with download link when ready     |
| No events to select              | "Create an event first" CTA in event selector dropdown           |
| SendGrid bounce                  | Webhook updates campaign stats; bounced addresses tracked         |
