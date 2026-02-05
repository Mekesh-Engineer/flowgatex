# FlowGateX - Complete UI/UX Page Specifications
## Enterprise-Grade Application Design Guide for Google Stitch

---

## 📋 Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Public Pages](#public-pages)
3. [Authentication Pages](#authentication-pages)
4. [User Dashboard Pages](#user-dashboard-pages)
5. [Organizer Dashboard Pages](#organizer-dashboard-pages)
6. [Admin Dashboard Pages](#admin-dashboard-pages)
7. [Shared Components](#shared-components)
8. [Mobile Responsive Considerations](#mobile-responsive-considerations)

---

## Design System Overview

### Color Palette
- **Primary**: Indigo (#6366F1) - CTAs, links, active states
- **Secondary**: Purple (#9333EA) - Accents, highlights
- **Success**: Green (#10B981) - Confirmations, success states
- **Warning**: Amber (#F59E0B) - Warnings, pending states
- **Error**: Red (#EF4444) - Errors, destructive actions
- **Neutral Gray**: (#F9FAFB, #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF, #6B7280, #4B5563, #374151, #1F2937, #111827)

### Typography
- **Headings**: Inter (Bold) - 32px, 24px, 20px, 18px, 16px
- **Body**: Inter (Regular) - 16px, 14px
- **Small Text**: Inter (Regular) - 12px
- **Monospace**: JetBrains Mono - Code snippets, QR codes

### Spacing System
- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px

### Border Radius
- **Small**: 4px (buttons, inputs)
- **Medium**: 8px (cards, modals)
- **Large**: 12px (hero sections)
- **Full**: 9999px (pills, badges)

### Elevation (Box Shadows)
- **Level 1**: 0 1px 3px rgba(0,0,0,0.1)
- **Level 2**: 0 4px 6px rgba(0,0,0,0.1)
- **Level 3**: 0 10px 15px rgba(0,0,0,0.1)
- **Level 4**: 0 20px 25px rgba(0,0,0,0.1)

---

## Public Pages

### 1. Landing Page (`/`)

**Purpose**: First impression, value proposition, conversion

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Navigation Bar (Sticky)                         │
├─────────────────────────────────────────────────┤
│                                                 │
│           Hero Section (Full viewport)          │
│   H1: "Seamless Event Management Platform"     │
│   Subtitle + CTA Buttons                        │
│   Hero Image/Animation                          │
│                                                 │
├─────────────────────────────────────────────────┤
│         Featured Events Carousel                │
├─────────────────────────────────────────────────┤
│              Features Grid (3 cols)             │
├─────────────────────────────────────────────────┤
│           How It Works (Timeline)               │
├─────────────────────────────────────────────────┤
│           Event Categories (Icons)              │
├─────────────────────────────────────────────────┤
│         Statistics Banner (4 metrics)           │
├─────────────────────────────────────────────────┤
│             Testimonials Carousel               │
├─────────────────────────────────────────────────┤
│              CTA Section (Centered)             │
├─────────────────────────────────────────────────┤
│                   Footer                        │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Navigation Bar** (Sticky, White bg, Shadow on scroll)
   - Logo (Left, 40px height)
   - Navigation Links: Events, Categories, How It Works, Pricing
   - Search Icon (Global search trigger)
   - Login Button (Ghost/Outline)
   - Sign Up Button (Primary, Indigo)
   - User Avatar (If logged in)

2. **Hero Section** (Height: 90vh, Gradient bg: Indigo to Purple)
   - Main Headline (H1, 48px, Bold, White)
   - Subtitle (18px, Gray-100)
   - Primary CTA: "Explore Events" (Large button, White bg, Indigo text)
   - Secondary CTA: "Create Event" (Outline button, White)
   - Hero Illustration/Animation (Right side, 60% width)
   - Floating Stats Cards (3D cards with live counters)

3. **Featured Events Carousel** (Padding: 80px vertical)
   - Section Title (H2, 32px, Centered)
   - Carousel Controls (Prev/Next arrows, Dots indicator)
   - Event Cards (4 visible, Auto-scroll every 5s)
     - Event Image (16:9 ratio, 320px width)
     - Category Badge (Top-left overlay)
     - Event Title (H3, 20px, Bold)
     - Date & Time (Icon + Text)
     - Location (Icon + Text)
     - Price (Bold, Indigo color)
     - "Book Now" CTA (Hover effect)

4. **Features Grid** (3 columns on desktop, 1 on mobile)
   Each Feature Card:
   - Icon (64px, Colored circle bg)
   - Feature Title (H3, 24px)
   - Description (14px, Gray-600)
   - "Learn More" Link (Indigo, underline on hover)
   
   Features to highlight:
   - Secure Payment Processing
   - Real-time IoT Integration
   - Advanced Analytics Dashboard
   - Mobile QR Ticketing
   - Multi-tier Pricing
   - 24/7 AI Support

5. **How It Works Timeline** (Horizontal on desktop)
   - 4 Steps with connecting lines
   - Step Number (Circle, Indigo bg, White text)
   - Step Title (18px, Bold)
   - Step Description (14px)
   - Step Icon/Illustration

6. **Event Categories** (Icon grid, 6 columns)
   - Category Icon (48px)
   - Category Name (14px, Centered)
   - Event Count (12px, Gray-500)
   - Hover: Scale up, Shadow

7. **Statistics Banner** (Full-width, Indigo bg, White text)
   - 4 Metrics in row:
     - Total Events
     - Happy Attendees
     - Event Organizers
     - Cities Covered
   - Animated counters (CountUp effect)

8. **Testimonials Carousel**
   - 3-column grid on desktop
   - Testimonial Card:
     - 5-star rating
     - Quote text (Italic, 16px)
     - User Avatar (48px, rounded)
     - User Name (14px, Bold)
     - User Role (12px, Gray-500)

9. **Final CTA Section** (Centered, Gradient bg)
   - Headline (H2, 36px)
   - Subheadline (18px)
   - CTA Button (Large, White bg)

10. **Footer** (Dark bg, White text)
    - 4 columns:
      - About (Logo, Description)
      - Quick Links
      - Categories
      - Contact Info
    - Bottom bar: Copyright, Social links, Legal links

**Interactions**:
- Smooth scroll on nav click
- Parallax effect on hero
- Carousel auto-play with manual override
- Lazy loading for images
- Hover animations on cards
- Sticky CTA button on mobile (bottom)

---

### 2. Events Browse Page (`/events`)

**Purpose**: Discover and filter events

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Navigation Bar (Same as landing)                │
├─────────────────────────────────────────────────┤
│                                                 │
│   Search Header (Full-width, Gradient bg)      │
│   Search Bar + Quick Filters                    │
│                                                 │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   Sidebar    │      Events Grid                 │
│   Filters    │      (2-3 columns)               │
│   (256px)    │                                  │
│              │                                  │
│              │                                  │
├──────────────┴──────────────────────────────────┤
│           Pagination / Load More                │
├─────────────────────────────────────────────────┤
│                  Footer                         │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Search Header** (Fixed height: 200px)
   - Search Input (Large, Icon prefix, Autocomplete)
   - Quick Filters (Chips):
     - "This Weekend"
     - "Free Events"
     - "Near Me"
     - "Popular"
   - Active Filters Display (Dismissible chips)
   - Results Count (e.g., "234 events found")

2. **Sidebar Filters** (Sticky, Collapsible on mobile)
   - **Date Range Filter**
     - Date Picker (Calendar UI)
     - Presets: Today, Tomorrow, This Week, This Month
   
   - **Category Filter**
     - Checkbox list
     - Search within categories
     - Expand/Collapse sections
   
   - **Location Filter**
     - Current Location button (Geolocation)
     - City/Area dropdown
     - Radius slider (5km to 100km)
   
   - **Price Range Filter**
     - Min/Max inputs
     - Dual-handle slider
     - "Free Events" checkbox
   
   - **Event Type**
     - Online/Offline/Hybrid radio buttons
   
   - **Sorting Options**
     - Dropdown: Relevance, Date (Nearest), Price (Low-High), Popular
   
   - Clear All Filters button (Bottom)

3. **Events Grid** (Responsive: 3 cols → 2 cols → 1 col)
   - **Event Card** (Hover: Lift + Shadow)
     - Image Container (16:9 ratio, Overlay on hover)
       - Favorite Icon (Top-right, Heart)
       - Category Badge (Top-left)
       - "Quick View" button (On hover, centered)
     - Content Section (Padding: 16px)
       - Event Title (H4, 18px, Bold, 2 lines max)
       - Organizer Name (12px, Gray-600)
       - Date & Time (Icon + Text, 14px)
       - Location (Icon + Text, 14px, Truncate)
       - Attendee Count (Icon + Text, Small)
       - Price Section
         - Original Price (Strikethrough if discounted)
         - Current Price (Bold, Indigo)
         - Discount Badge (If applicable)
       - CTA Button (Full-width, "Book Now")
       - Share Icon (Top-right of card)

4. **Loading States**
   - Skeleton cards while fetching
   - Shimmer effect

5. **Empty State**
   - Illustration
   - "No events found" message
   - Suggested actions

6. **Pagination** (Centered)
   - Previous/Next buttons
   - Page numbers (Current highlighted)
   - "Load More" option (Infinite scroll alternative)

**Interactions**:
- Filter changes trigger immediate results update
- URL updates with filter parameters
- Smooth scroll to top on page change
- Quick View modal (Event preview without navigation)
- Add to Favorites (Requires login, Optimistic UI)

---

### 3. Event Details Page (`/events/:id`)

**Purpose**: Complete event information, booking conversion

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Navigation Bar                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│         Event Hero Image (Full-width)           │
│         Breadcrumb (Overlay, bottom-left)       │
│                                                 │
├────────────────────────┬────────────────────────┤
│                        │                        │
│   Main Content         │   Booking Sidebar      │
│   (70% width)          │   (30%, Sticky)        │
│                        │                        │
│   - Event Info         │   - Ticket Selection   │
│   - Description        │   - Price Summary      │
│   - Venue Details      │   - Book Button        │
│   - Schedule           │   - Share/Favorite     │
│   - Organizer          │                        │
│   - Reviews            │                        │
│                        │                        │
├────────────────────────┴────────────────────────┤
│           Similar Events Carousel               │
├─────────────────────────────────────────────────┤
│                  Footer                         │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Event Hero Section** (Height: 400px)
   - Cover Image (Blur bg, Overlay gradient)
   - Category Badge (Top-left)
   - Status Badge (Top-right: "Filling Fast", "Few Seats Left")
   - Share Button Group (Social icons)
   - Image Gallery Indicator (If multiple images, "View Gallery")

2. **Event Header** (Below hero)
   - Event Title (H1, 36px, Bold)
   - Organizer Info (Avatar, Name, Verified badge)
   - Event Stats Row:
     - Attendees count
     - Rating (Stars + count)
     - Views count
   - Favorite Button (Heart icon, fill on saved)

3. **Main Content Area**
   
   **a) Quick Info Cards** (3-column grid)
   - Date & Time Card
   - Location Card
   - Category Card
   
   **b) Event Description Section**
   - "About This Event" (H2)
   - Rich text content (Preserve formatting)
   - "Read More" expansion (If long)
   - Tags (Chips at bottom)
   
   **c) Event Highlights** (Icon list)
   - Key features (WiFi, Parking, Food, etc.)
   
   **d) Venue Information**
   - Venue Name (H3)
   - Full Address
   - Google Maps Embed (Interactive)
   - "Get Directions" button
   - Nearby landmarks
   
   **e) Event Schedule/Agenda** (If multi-day)
   - Tabbed by day
   - Timeline view
   - Speaker/Session cards
   
   **f) Organizer Profile Card**
   - Avatar (Large, 80px)
   - Name & Bio
   - Events Hosted count
   - "View Profile" link
   - "Contact Organizer" button
   
   **g) Reviews & Ratings** (If past event)
   - Overall rating (Large display)
   - Rating distribution (Bar chart)
   - Review cards (Paginated)
     - User avatar
     - Rating stars
     - Review text
     - Date
     - Helpful votes

4. **Booking Sidebar** (Sticky, White card, Shadow)
   
   **a) Ticket Selection**
   - Section Title: "Select Tickets"
   - Ticket Tier Cards (Stack):
     - Tier Name (e.g., "General", "VIP")
     - Price (Large, Bold)
     - Description (Small text)
     - Features list (Checkmarks)
     - Quantity Selector (- [count] +)
     - Availability indicator ("23 left")
   
   **b) Promo Code**
   - Input field ("Have a promo code?")
   - Apply button
   - Applied discount display (Green banner)
   
   **c) Price Breakdown**
   - Tickets subtotal
   - Discount (if applied)
   - Platform fee
   - Taxes
   - Total (Large, Bold)
   
   **d) Primary CTA**
   - "Book Now" button (Full-width, Large, Indigo)
   - Disabled if no tickets selected
   - Shows ticket count when selected
   
   **e) Secondary Actions**
   - Add to Calendar (Dropdown: Google, Outlook, iCal)
   - Share Event (Dropdown: Copy link, Social)
   - Save to Favorites (Heart icon)
   
   **f) Trust Signals**
   - Secure Payment badge
   - Money-back guarantee
   - Instant confirmation

5. **Image Gallery Modal** (Triggered from hero)
   - Full-screen overlay
   - Image carousel
   - Thumbnails strip (Bottom)
   - Close button (Top-right)

6. **Similar Events Section**
   - "You Might Also Like" (H2)
   - Horizontal scroll carousel
   - Event cards (Same as browse page)

**Interactions**:
- Sticky booking sidebar (Scrolls with viewport)
- Smooth section anchors (Tabs for long content)
- Quantity selector updates total in real-time
- "Share" opens native share or custom modal
- Map is interactive (Pan, Zoom)
- Image gallery with keyboard navigation

**Mobile Adaptations**:
- Sidebar becomes bottom sheet (Fixed)
- "Book Now" sticky button at bottom
- Map thumbnail (Tap to expand)
- Tabbed sections (Description, Venue, Reviews)

---

### 4. Search Results Page (`/search`)

**Purpose**: Global search across all events

**Layout**: Similar to Events Browse Page

**Key Differences**:
- Search query prominently displayed
- Suggested searches (Below search bar)
- "Did you mean?" suggestions
- Search history (Logged-in users)
- Advanced search toggle (More filters)

---

### 5. Category Page (`/category/:slug`)

**Purpose**: Browse events by category

**Layout**: Events Browse Page with:
- Category hero banner (Custom image, Description)
- Category-specific filters
- Popular events in category (Top section)

---

## Authentication Pages

### 6. Login Page (`/login`)

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│          Minimal Navigation (Logo only)         │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│   Illustration       │   Login Form             │
│   (Left 50%)         │   (Right 50%)            │
│                      │                          │
│   - Brand Message    │   - Welcome Text         │
│   - Benefits         │   - Email Input          │
│   - Testimonial      │   - Password Input       │
│                      │   - Remember Me          │
│                      │   - Forgot Password      │
│                      │   - Login Button         │
│                      │   - Divider              │
│                      │   - OAuth Buttons        │
│                      │   - Sign Up Link         │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

**Key Components**:

1. **Left Panel** (Gradient bg: Indigo to Purple)
   - Brand Logo (Top, 48px)
   - Headline (H1, White)
   - Subheadline
   - Feature highlights (Icon + Text, 3-4 items)
   - Background pattern/illustration

2. **Right Panel** (White bg, Centered form)
   - Welcome Text (H2, "Welcome back")
   - Subtext ("Sign in to your account")
   
   **Login Form**:
   - Email Input
     - Label: "Email address"
     - Placeholder: "you@example.com"
     - Icon: Envelope
     - Validation: Email format
     - Error message below input
   
   - Password Input
     - Label: "Password"
     - Type: Password (Toggle visibility icon)
     - Placeholder: "••••••••"
     - Icon: Lock
     - Error message below
   
   - Remember Me (Checkbox + Label)
   
   - Forgot Password (Link, Right-aligned, Small)
   
   - Login Button
     - Full-width
     - Large size
     - Primary color
     - Loading spinner on submit
     - Text: "Sign in"
   
   - Divider ("Or continue with")
   
   - OAuth Buttons (Stack):
     - Google (White bg, Border, Google logo)
     - Phone Number (Indigo outline)
   
   - Sign Up Prompt
     - Text: "Don't have an account?"
     - Link: "Sign up" (Bold, Indigo)

**Form Validation**:
- Real-time validation (On blur)
- Error states (Red border, Error icon, Error text)
- Success states (Green checkmark)
- Disabled submit until valid

**Error Handling**:
- Invalid credentials alert (Top of form, Red banner)
- Network error toast
- "Too many attempts" message

**Interactions**:
- Auto-focus email input on load
- Tab navigation between fields
- Enter key submits form
- OAuth redirects with loading state
- Success redirects to previous page or dashboard

---

### 7. Sign Up Page (`/register`)

**Layout**: Same as Login Page

**Key Components**:

1. **Registration Form** (Multi-step or single form)
   
   **Step 1: Account Type Selection** (If using role selection)
   - Card Grid (2 options):
     - "Attendee" Card (Icon, Description, Select button)
     - "Event Organizer" Card
   
   **Step 2: Personal Information**
   - Full Name (Text input)
   - Email (Email input, Verify availability)
   - Password (Password strength indicator)
   - Confirm Password (Match validation)
   - Phone Number (Optional, Country code selector)
   
   **Step 3: Additional Details** (For organizers)
   - Organization Name
   - Organization Type (Dropdown)
   - Website (URL input)
   
   **Terms & Conditions**
   - Checkbox: "I agree to Terms & Privacy Policy"
   - Links to documents (Open in modal or new tab)
   
   **Create Account Button**
   - Primary, Full-width, Large
   - Text: "Create Account"
   - Loading state
   
   **OAuth Options** (Same as login)
   
   **Login Prompt**
   - "Already have an account? Sign in"

**Progressive Disclosure**:
- Password requirements tooltip
- Field hints (Helper text below inputs)
- Progress indicator (If multi-step)

**Email Verification Flow**:
- Success message after registration
- "Verify your email" prompt
- Resend verification email option

---

### 8. Forgot Password Page (`/forgot-password`)

**Layout**: Centered form (Similar auth layout)

**Components**:
- Instruction text ("Enter your email to reset password")
- Email input
- Submit button ("Send Reset Link")
- Back to Login link
- Success message (After submission)
- Illustration (Lock/Key icon)

---

### 9. Reset Password Page (`/reset-password`)

**Layout**: Centered form

**Components**:
- New Password input (With strength meter)
- Confirm Password input
- Password requirements checklist
- Reset button
- Success redirect to login

---

## User Dashboard Pages

**Base Layout**: All dashboard pages share this structure
```
┌─────────────────────────────────────────────────┐
│         Dashboard Navigation (Top bar)          │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   Sidebar    │   Main Content Area              │
│   (240px)    │                                  │
│              │   - Page Header                  │
│   - Menu     │   - Content Sections             │
│   - Profile  │   - Data Tables                  │
│              │   - Charts/Widgets               │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

**Sidebar Components**:
- User Profile Card (Avatar, Name, Email, Role badge)
- Navigation Menu (Icon + Label):
  - Dashboard
  - My Bookings
  - Favorites
  - Wallet
  - Settings
  - Support
  - Logout
- Active state highlighting
- Collapse/Expand toggle

**Top Bar**:
- Logo (Left)
- Global search (Center, Expandable)
- Notifications bell (Badge count)
- Messages icon
- User avatar (Dropdown)

---

### 10. User Dashboard Home (`/dashboard`)

**Purpose**: Overview of user activity

**Key Components**:

1. **Welcome Banner** (Full-width, Gradient card)
   - Greeting (H1, "Welcome back, [Name]!")
   - Quick stats (Upcoming events, Total bookings)
   - Primary CTA ("Explore Events")

2. **Stats Cards Row** (4 cards)
   - Card 1: Total Bookings (Icon, Number, Growth %)
   - Card 2: Upcoming Events (Icon, Number)
   - Card 3: Total Spent (Icon, Currency)
   - Card 4: Favorite Events (Icon, Number)

3. **Upcoming Events Section**
   - Section Header (H2, "Your Upcoming Events")
   - Event Cards (Horizontal layout):
     - Event Image (Thumbnail, 120px)
     - Event Details (Name, Date, Venue)
     - Ticket Count
     - "View Ticket" button
     - "Get Directions" button
   - "View All" link

4. **Recent Bookings Table**
   - Columns: Event, Date, Tickets, Amount, Status, Actions
   - Status badges (Confirmed, Pending, Cancelled)
   - Action buttons (View, Download)
   - Pagination

5. **Recommended Events** (Based on history)
   - Carousel of event cards
   - "Because you liked..." heading

6. **Quick Actions Widget**
   - "Find Events" button
   - "My Tickets" button
   - "Wallet" button

---

### 11. My Bookings Page (`/dashboard/bookings`)

**Purpose**: Manage all bookings

**Key Components**:

1. **Page Header**
   - Title (H1, "My Bookings")
   - Filters (Tabs):
     - All
     - Upcoming
     - Past
     - Cancelled
   - Search bookings input

2. **Bookings List** (Card layout or Table)
   
   **Booking Card**:
   - Event Image (Left, 150px)
   - Booking Details:
     - Event Name (H3, Bold, Link)
     - Booking ID (Small, Gray)
     - Date & Time
     - Venue
     - Ticket Quantity
     - Total Amount Paid
   - Status Badge (Right-top)
   - QR Code Button ("View Ticket")
   - Action Menu (3 dots):
     - View Details
     - Download Invoice
     - Request Refund (If eligible)
     - Cancel Booking
     - Add to Calendar

3. **Booking Details Modal** (Triggered from card)
   - Booking Summary
   - Attendee Information
   - Payment Details
   - QR Codes (For each ticket)
   - Event Information
   - Organizer Contact
   - Terms & Conditions

4. **QR Ticket View** (Full-screen modal)
   - Large QR Code (Scannable)
   - Ticket Number
   - Event Details
   - Attendee Name
   - Barcode (Below QR)
   - "Download PDF" button
   - "Add to Wallet" button (Apple/Google)

5. **Empty States**
   - "No upcoming bookings" illustration
   - "Explore events" CTA

---

### 12. Favorites Page (`/dashboard/favorites`)

**Purpose**: Saved/watchlisted events

**Layout**:
- Grid of event cards (Same as browse page)
- "Remove from favorites" action (Heart icon filled)
- Filter/Sort options
- Empty state with CTA

---

### 13. Wallet Page (`/dashboard/wallet`)

**Purpose**: Payment methods, transaction history

**Key Components**:

1. **Wallet Balance Card**
   - Balance amount (Large, Bold)
   - Add money button
   - Transaction history link

2. **Payment Methods Section**
   - Saved Cards (Card component):
     - Card brand logo
     - Masked number (**** **** **** 1234)
     - Expiry date
     - Default badge
     - Edit/Delete icons
   - "Add Payment Method" button (Opens modal)

3. **Add Payment Method Modal**
   - Card number input (Auto-format)
   - Expiry date (MM/YY)
   - CVV input
   - Name on card
   - "Save for future" checkbox
   - Add button

4. **Transaction History**
   - Table view:
     - Date
     - Description (Event name)
     - Type (Debit/Credit)
     - Amount
     - Status
   - Export to CSV button
   - Date range filter

---

### 14. Profile Settings Page (`/dashboard/settings`)

**Purpose**: User account management

**Tabbed Layout**:

**Tab 1: Personal Information**
- Profile Picture Upload (Circular, 128px)
- Full Name (Editable)
- Email (Display only, Verified badge)
- Phone Number (Editable, Verify button)
- Date of Birth (Date picker)
- Gender (Dropdown)
- Bio (Textarea)
- Save Changes button

**Tab 2: Preferences**
- Language (Dropdown)
- Timezone (Dropdown)
- Currency (Dropdown)
- Email Notifications (Toggle switches):
  - Event reminders
  - Promotional emails
  - Booking confirmations
  - Newsletter
- Push Notifications (Toggle switches)
- SMS Notifications (Toggle switches)

**Tab 3: Security**
- Change Password Section:
  - Current password input
  - New password input
  - Confirm password input
  - Update button
- Two-Factor Authentication:
  - Enable/Disable toggle
  - Setup wizard (If enabling)
- Active Sessions:
  - List of devices
  - "Sign out from other devices" button
- Delete Account (Danger zone, Red section)

**Tab 4: Privacy**
- Profile Visibility (Public/Private toggle)
- Show email to organizers (Toggle)
- Data Download (GDPR compliance):
  - "Download my data" button
- Connected Apps (OAuth connections):
  - List with Revoke buttons

---

### 15. Support Page (`/dashboard/support`)

**Purpose**: Help and customer support

**Layout**:

1. **Search Help Articles** (Top, Prominent)
   - Search input
   - Popular topics (Chips)

2. **Help Categories Grid** (Icon cards)
   - Getting Started
   - Booking & Tickets
   - Payments & Refunds
   - Account Settings
   - Technical Issues

3. **FAQ Accordion**
   - Collapsible sections
   - Search within FAQs

4. **Contact Support Section**
   - Live Chat button (If available, Green badge)
   - Email Support (Form):
     - Subject dropdown
     - Message textarea
     - Attachment upload
     - Submit button
   - Phone Support (Number, Hours)

5. **Ticket History** (If user has contacted before)
   - List of support tickets
   - Status badges
   - View conversation link

---

## Organizer Dashboard Pages

**Additional Sidebar Menu Items**:
- My Events
- Create Event
- Attendees
- Analytics
- Payouts
- IoT Devices
- Marketing

---

### 16. Organizer Dashboard Home (`/organizer/dashboard`)

**Purpose**: Event management overview

**Key Components**:

1. **Summary Stats** (4-card row)
   - Total Events (With breakdown: Live, Draft, Past)
   - Total Revenue (Growth %, Chart sparkline)
   - Total Attendees (Across all events)
   - Conversion Rate (Percentage)

2. **Quick Actions Bar**
   - Create Event button (Primary, Large)
   - View Attendees button
   - Check Payouts button

3. **Recent Events Table**
   - Columns: Event Name, Date, Tickets Sold/Total, Revenue, Status, Actions
   - Status: Live, Ended, Draft, Cancelled
   - Actions: Edit, View, Analytics, Duplicate
   - Sorting by column headers
   - Pagination

4. **Revenue Chart** (Line/Area chart)
   - X-axis: Time (Daily, Weekly, Monthly toggle)
   - Y-axis: Revenue
   - Compare periods (Overlay)
   - Export data button

5. **Top Performing Events** (Card list)
   - Event name
   - Revenue
   - Attendance rate
   - Rating

6. **Upcoming Events Calendar**
   - Calendar view (Month/Week/Day toggle)
   - Event markers on dates
   - Click to view details

7. **Recent Activity Feed**
   - New booking notifications
   - Payment received
   - Event published
   - Refund requested
   - Timestamp for each

---

### 17. Create Event Page (`/organizer/events/create`)

**Purpose**: Multi-step event creation

**Layout**: Stepped form with progress indicator

**Steps**:

**Step 1: Basic Information**
- Event Title (Text input, Character count)
- Tagline/Subtitle (Short description)
- Category (Dropdown, Multi-select)
- Event Type (Radio: In-person, Virtual, Hybrid)
- Language (Multi-select)
- Age Restriction (Dropdown: All ages, 18+, 21+)

**Step 2: Date & Time**
- Event Format (Radio: Single session, Multiple sessions)
- Start Date & Time (Date-time picker)
- End Date & Time (Date-time picker)
- Timezone (Auto-detect, Editable)
- Registration Deadline (Date-time picker)
- Recurring Event Toggle:
  - If yes: Frequency selector (Daily, Weekly, Monthly)
  - End date or occurrence count

**Step 3: Venue/Location**
- Location Type (Radio):
  - Physical Venue:
    - Venue Name (Text input)
    - Address (Google Places autocomplete)
    - Map (Draggable marker)
    - Venue Capacity (Number input)
    - Parking Available (Checkbox)
  - Online Event:
    - Platform (Dropdown: Zoom, Meet, Teams, Custom)
    - Meeting Link (Text input, Hidden until purchase)
  - To Be Announced:
    - Placeholder text

**Step 4: Tickets & Pricing**
- Ticket Tiers Section (Add/Remove tiers):
  
  Each Tier Card:
  - Tier Name (e.g., "Early Bird", "VIP")
  - Price (Currency input)
  - Quantity Available (Number input)
  - Sales Start Date (Date-time picker)
  - Sales End Date (Date-time picker)
  - Description (What's included)
  - Benefits List (Add/Remove items)
  - Min/Max tickets per order
  - Visibility Toggle (Public/Hidden)

- Discount Codes Section:
  - Add Promo Code button (Opens modal):
    - Code name
    - Discount type (Percentage/Fixed)
    - Discount value
    - Usage limit
    - Valid from/to dates
    - Applicable tiers

**Step 5: Event Details**
- Description (Rich text editor):
  - Formatting toolbar (Bold, Italic, Lists, Links)
  - Image insertion
  - Video embed (YouTube, Vimeo)
  - Preview mode

- Event Highlights (Bullet points):
  - Key features
  - What attendees will learn/experience

- Schedule/Agenda (If multi-session):
  - Add session button
  - Session cards:
    - Session name
    - Time slot
    - Speaker/Host
    - Description

**Step 6: Media**
- Cover Image Upload:
  - Drag-drop zone
  - Recommended size display (1920x1080)
  - Crop/Edit tool
  - Preview in card

- Image Gallery (Multiple upload):
  - Grid view
  - Drag to reorder
  - Set as cover option
  - Delete button

- Video Trailer (Optional):
  - Upload or YouTube URL
  - Thumbnail preview

**Step 7: Organizer Information**
- Organizer Name (Auto-filled from profile)
- Organization Logo (Upload)
- About Organizer (Textarea)
- Contact Email (For attendees)
- Social Links:
  - Website
  - Facebook
  - Twitter
  - Instagram
  - LinkedIn

**Step 8: Additional Settings**
- Refund Policy (Dropdown: Full, Partial, None)
- Terms & Conditions (Checkbox, Upload PDF or Link)
- Event Tags (Multi-select or free input)
- Private Event Toggle:
  - If yes: Invite-only, Code required
- Featured Event (Premium option)

**Step 9: Review & Publish**
- Event Preview (As attendees will see)
- Checklist:
  - All required fields completed
  - Images uploaded
  - Pricing configured
  - Terms accepted
- Publish Options:
  - Save as Draft button
  - Schedule Publication (Date-time picker)
  - Publish Now button (Primary, Large)

**Form Features**:
- Auto-save (Draft saved every 30s)
- Progress indicator (Step 3 of 9)
- Previous/Next navigation
- Field validation (Real-time)
- "Save & Exit" option (Returns later)
- Warning on exit without saving

---

### 18. My Events Page (`/organizer/events`)

**Purpose**: Manage all created events

**Layout**:

1. **Filters & Views**
   - Tabs: All, Published, Draft, Ended, Cancelled
   - Search events input
   - Sort dropdown (Recent, Alphabetical, By date)
   - View toggle (Grid/List)

2. **Event Cards** (Grid view)
   - Event Image
   - Event Name (H3)
   - Date & Time
   - Tickets Sold/Total (Progress bar)
   - Revenue (Bold)
   - Status Badge
   - Action Menu (3 dots):
     - Edit Event
     - View as Attendee
     - Manage Attendees
     - View Analytics
     - Duplicate Event
     - Export Data
     - Cancel/Archive Event

3. **Bulk Actions** (Multi-select)
   - Select multiple checkboxes
   - Actions bar appears:
     - Bulk Export
     - Bulk Cancel
     - Bulk Email Attendees

4. **Event Details Modal** (Quick view)
   - Event summary
   - Key metrics
   - Quick actions

---

### 19. Event Analytics Page (`/organizer/events/:id/analytics`)

**Purpose**: Detailed event performance metrics

**Layout**:

1. **Page Header**
   - Event Name (With thumbnail)
   - Date Range Selector (Preset + Custom)
   - Export Report button (PDF/CSV)

2. **Overview Cards** (4 metrics)
   - Total Tickets Sold (Number, Trend)
   - Total Revenue (Currency, Chart)
   - Conversion Rate (Percentage)
   - Average Ticket Price (Currency)

3. **Sales Over Time Chart**
   - Line chart (Daily ticket sales)
   - Toggle: Revenue vs Tickets
   - Annotations (Price changes, Promo activations)

4. **Ticket Tier Breakdown**
   - Pie chart or Stacked bar
   - Table below:
     - Tier name
     - Sold/Total
     - Revenue
     - % of total

5. **Traffic Sources**
   - Pie chart: Direct, Social, Search, Referral
   - Table with details

6. **Geographic Distribution**
   - Map with heatmap overlay
   - Top cities list

7. **Attendee Demographics** (If collected)
   - Age distribution (Bar chart)
   - Gender split (Pie chart)

8. **Sales Funnel**
   - Visualization: Views → Clicks → Checkouts → Purchases
   - Conversion at each stage

9. **Revenue Breakdown**
   - Chart: Gross revenue, Fees, Net revenue
   - Payment method distribution

10. **Engagement Metrics**
    - Social shares count
    - Favorites count
    - Page views over time

---

### 20. Attendee Management Page (`/organizer/events/:id/attendees`)

**Purpose**: Manage event attendees

**Layout**:

1. **Summary Bar**
   - Total Attendees (Number)
   - Checked-in (Number, %)
   - Pending (Number)
   - Export Attendees button (CSV/Excel)

2. **Filters**
   - Search by name/email
   - Filter by:
     - Ticket tier
     - Check-in status
     - Payment status
     - Registration date

3. **Attendees Table**
   - Columns:
     - Name (Avatar + Name)
     - Email
     - Phone
     - Ticket Tier
     - Quantity
     - Amount Paid
     - Booking Date
     - Check-in Status
     - Actions
   - Sortable columns
   - Pagination
   - Row actions:
     - View Details
     - Resend Ticket
     - Mark as Checked-in
     - Cancel Booking
     - Send Message

4. **Attendee Details Modal**
   - Personal info
   - Booking details
   - Payment info
   - Ticket QR code
   - Check-in history
   - Notes section (Organizer only)
   - Message attendee button

5. **Bulk Actions**
   - Select attendees (Checkboxes)
   - Send bulk email
   - Export selected
   - Check-in multiple

6. **Check-in Widget** (Collapsible sidebar)
   - QR Scanner (Camera access)
   - Manual entry (Ticket ID)
   - Recent check-ins list

---

### 21. Payouts Page (`/organizer/payouts`)

**Purpose**: Track earnings and payments

**Layout**:

1. **Balance Cards** (2 cards)
   - Available Balance (Large number, Withdraw button)
   - Pending Balance (With release date)

2. **Payout History Table**
   - Columns: Date, Amount, Method, Status, Invoice
   - Status badges: Paid, Processing, Failed
   - Pagination

3. **Add Payout Method Modal**
   - Bank Account:
     - Account holder name
     - Account number
     - IFSC/Routing number
     - Bank name
   - UPI ID (For India)
   - PayPal Email
   - Save button

4. **Transaction Breakdown**
   - Event-wise revenue table
   - Platform fees display
   - Net earnings

5. **Request Payout**
   - Amount input (Max: Available balance)
   - Method selector (From saved methods)
   - Request button
   - Min. payout amount notice

---

### 22. IoT Devices Page (`/organizer/devices`)

**Purpose**: Manage smart devices for events

**Layout**:

1. **Page Header**
   - Add Device button
   - Filter by: Status, Type, Event

2. **Device Cards Grid**
   
   **Device Card**:
   - Device Icon (Based on type)
   - Device Name (Editable)
   - Device Type (Badge: Gate, Camera, Sensor)
   - Status Indicator (Online: Green, Offline: Red)
   - Assigned Event (If any)
   - Location (Venue, Zone)
   - Last Sync Time
   - Battery Level (If applicable)
   - Action Menu:
     - Configure
     - View Logs
     - Test Device
     - Unlink
     - Delete

3. **Add Device Modal**
   - Device ID/Serial input
   - Device Type dropdown
   - Device Name input
   - Assign to Event dropdown
   - Location details
   - Pair button

4. **Device Details Modal**
   - Device info
   - Status history chart
   - Activity log table:
     - Timestamp
     - Action (Scan, Error, Config change)
     - Details
   - Configuration section:
     - Settings based on device type
     - Save button

5. **Live Monitoring Dashboard**
   - Real-time device status
   - Scan count (Today)
   - Error alerts
   - Map view (Devices on venue map)

---

### 23. Marketing Tools Page (`/organizer/marketing`)

**Purpose**: Promote events

**Layout**:

1. **Email Campaigns Section**
   - Create Campaign button
   - Campaign list table:
     - Name
     - Target audience
     - Sent date
     - Open rate
     - Click rate
     - Actions (View, Duplicate, Archive)

2. **Create Email Campaign Modal**
   - Campaign name
   - Subject line
   - Email template (Rich text editor)
   - Target audience:
     - All subscribers
     - Past attendees
     - Specific event attendees
     - Custom segment
   - Schedule or Send now
   - Preview email button
   - Send test email

3. **Social Media Section**
   - Generate social posts (AI-assisted)
   - Platform selector (Facebook, Twitter, Instagram)
   - Post preview
   - Share directly (If connected)
   - Download image assets

4. **Promo Materials**
   - Generate event flyer (Customizable templates)
   - Download posters (Various sizes)
   - Social media graphics
   - Email signatures

5. **Discount Codes**
   - Active codes table
   - Create new code button
   - Code performance metrics

6. **Referral Program** (If enabled)
   - Referral link generator
   - Rewards settings
   - Referral tracking table

---

## Admin Dashboard Pages

**Additional Sidebar Items**:
- Platform Analytics
- User Management
- Organizer Approvals
- Event Moderation
- System Settings
- Reports

---

### 24. Admin Dashboard Home (`/admin/dashboard`)

**Purpose**: Platform-wide overview

**Layout**:

1. **Platform Stats** (6 cards, 2 rows)
   - Total Users (Growth %)
   - Total Organizers
   - Total Events (Published)
   - Total Revenue (Platform fees)
   - Active Subscriptions (If SaaS model)
   - System Health (Uptime %)

2. **Activity Feed** (Real-time)
   - New user registrations
   - Event publications
   - Large transactions
   - Support tickets
   - System alerts

3. **Platform Revenue Chart**
   - Multi-line: Gross revenue, Net revenue, Platform fees
   - Date range selector

4. **Top Events Leaderboard**
   - Table: Event, Organizer, Revenue, Attendees
   - "Featured" toggle

5. **Geographic Heatmap**
   - User/Event distribution by region

6. **System Health Monitors**
   - Server status
   - Database performance
   - API response times
   - Error rates

---

### 25. User Management Page (`/admin/users`)

**Purpose**: Manage all platform users

**Layout**:

1. **Filters**
   - Search by name/email
   - Role filter (User, Organizer, Admin)
   - Status filter (Active, Suspended, Deleted)
   - Registration date range

2. **Users Table**
   - Columns:
     - User (Avatar, Name, Email)
     - Role
     - Registration Date
     - Last Active
     - Total Bookings
     - Total Spent
     - Status
     - Actions
   - Actions:
     - View Profile
     - Edit User
     - Suspend/Activate
     - Send Message
     - View Activity Log
     - Delete User

3. **User Details Modal**
   - Personal info
   - Account stats
   - Booking history
   - Payment history
   - Activity timeline
   - Admin notes section
   - Role change dropdown
   - Action buttons (Suspend, Delete)

4. **Bulk Actions**
   - Select users
   - Send bulk email
   - Export data
   - Bulk role change

---

### 26. Organizer Approvals Page (`/admin/organizers`)

**Purpose**: Review and approve organizer applications

**Layout**:

1. **Pending Approvals Queue**
   - Application cards:
     - Organizer name
     - Organization details
     - Submission date
     - Documents submitted (View links)
     - Quick Review button

2. **Review Modal**
   - Application details
   - Uploaded documents (KYC, Tax, Licenses)
   - Verification checklist
   - Admin notes (Internal)
   - Action buttons:
     - Approve (Green)
     - Reject (Red, Requires reason)
     - Request More Info (Orange)

3. **Approved Organizers Table**
   - Similar to User Management
   - Performance metrics

---

### 27. Event Moderation Page (`/admin/events`)

**Purpose**: Review and moderate published events

**Layout**:

1. **Flagged Events Queue**
   - Events reported by users
   - Auto-flagged events (Spam detection)
   - Review priority (High, Medium, Low)

2. **Event Review Card**
   - Event details
   - Reason for flagging
   - Reporter info (If user-reported)
   - Preview event page link
   - Actions:
     - Approve
     - Remove Event
     - Suspend Organizer
     - Request Changes

3. **All Events Table**
   - Search and filters
   - Category distribution
   - Featured events management

---

### 28. Platform Settings Page (`/admin/settings`)

**Purpose**: Configure platform-wide settings

**Tabbed Layout**:

**Tab 1: General Settings**
- Platform Name
- Logo Upload
- Favicon Upload
- Contact Email
- Support Email
- Default Timezone
- Default Currency

**Tab 2: Payment Settings**
- Payment Gateway Toggle (Razorpay, Cashfree)
- API Keys (Masked, Update option)
- Platform Fee Percentage
- Tax Settings (GST, VAT)
- Payout Schedule (T+N days)

**Tab 3: Email Settings**
- SMTP Configuration
- Email Templates Editor:
  - Booking confirmation
  - Ticket delivery
  - Password reset
  - Event reminders
  - Marketing emails
- Test Email button

**Tab 4: Feature Flags**
- Toggle features on/off:
  - User Registration
  - Event Creation (Open/Approval required)
  - IoT Integration
  - AI Chatbot
  - Social Login
  - Analytics
  - Referral Program

**Tab 5: SEO & Meta**
- Default meta title
- Default meta description
- Social share image
- Google Analytics ID
- Facebook Pixel ID

**Tab 6: Security**
- Two-Factor Authentication (Enforce for admins)
- Session Timeout
- Password Policy:
  - Min length
  - Complexity requirements
- Rate Limiting Settings
- CORS Allowed Origins

---

### 29. Reports Page (`/admin/reports`)

**Purpose**: Generate custom reports

**Layout**:

1. **Report Generator**
   - Report Type dropdown:
     - Revenue Report
     - User Growth Report
     - Event Performance Report
     - Transaction Report
     - Refunds Report
   - Date Range Selector
   - Filters (Category, Organizer, etc.)
   - Generate button

2. **Saved Reports**
   - List of previously generated reports
   - Download links (PDF, CSV, Excel)
   - Scheduled reports section

3. **Live Dashboards**
   - Embedded Tableau/Power BI dashboards (If integrated)

---

## Shared Components

### Header/Navigation Component
- **Props**: isLoggedIn, userRole, userName, avatar
- **Variations**: Public, Authenticated, Dashboard
- **States**: Default, Scrolled, Mobile menu open

### Footer Component
- **Sections**: About, Links, Categories, Contact, Social
- **Bottom**: Copyright, Legal links, Language selector

### Event Card Component
- **Variants**: Grid (Vertical), List (Horizontal), Featured (Large)
- **Props**: event object, showQuickView, showFavorite, cardSize
- **Interactions**: Hover (Lift, Show CTA), Click (Navigate), Favorite toggle

### Button Component
- **Variants**: Primary, Secondary, Outline, Ghost, Danger
- **Sizes**: Small, Medium, Large
- **States**: Default, Hover, Active, Disabled, Loading
- **Props**: onClick, variant, size, loading, disabled, icon, fullWidth

### Input Component
- **Types**: Text, Email, Password, Number, Tel, URL, Search
- **Props**: label, placeholder, error, helperText, icon, required
- **States**: Default, Focus, Error, Disabled, Success

### Modal Component
- **Sizes**: Small (400px), Medium (600px), Large (800px), Full
- **Props**: isOpen, onClose, title, children, footer
- **Variations**: Centered, Side drawer, Full-screen

### Toast/Notification Component
- **Types**: Success, Error, Warning, Info
- **Props**: message, type, duration, action
- **Position**: Top-right, Top-center, Bottom-right

### Data Table Component
- **Features**: Sorting, Filtering, Pagination, Selection, Export
- **Props**: columns, data, onSort, onFilter, onRowClick
- **States**: Loading (Skeleton), Empty, Error

### Chart Components
- **Types**: Line, Bar, Pie, Donut, Area, Heatmap
- **Props**: data, colors, legend, responsive
- **Interactions**: Hover (Tooltip), Click (Drill-down)

### Breadcrumb Component
- **Props**: items (array of {label, href})
- **Rendering**: Home > Category > Event Name

### Pagination Component
- **Props**: currentPage, totalPages, onPageChange
- **Variants**: Numbers, Prev/Next only, Load More

### Badge Component
- **Variants**: Pill, Dot, Counter
- **Colors**: Success, Warning, Error, Info, Neutral
- **Props**: text, variant, color

### Avatar Component
- **Sizes**: XS (24px), S (32px), M (40px), L (64px), XL (128px)
- **Types**: Image, Initials, Icon
- **Props**: src, name, size, shape (circle/square)

### Stepper Component
- **Props**: steps (array), currentStep, orientation (horizontal/vertical)
- **States**: Completed, Current, Upcoming

### Skeleton Loader Component
- **Variants**: Text, Circle, Rectangle, Card
- **Props**: width, height, count, animated

### Dropdown Menu Component
- **Trigger**: Button, Icon, Avatar
- **Props**: items (array), onSelect, placement
- **States**: Open, Closed

### Tabs Component
- **Variants**: Line (Underline), Pill, Card
- **Props**: tabs (array), activeTab, onChange

### Accordion Component
- **Props**: items (array), allowMultiple, defaultOpen
- **States**: Expanded, Collapsed

### File Upload Component
- **Variants**: Drag-drop, Click to upload, Avatar upload
- **Props**: accept, maxSize, multiple, preview
- **States**: Idle, Dragging, Uploading, Complete, Error

### Search Bar Component
- **Features**: Autocomplete, Recent searches, Suggestions
- **Props**: placeholder, onSearch, suggestions
- **States**: Empty, Typing, Results

### Rating Component
- **Props**: value, readonly, onChange, size
- **Variants**: Stars, Hearts, Thumbs

### Progress Bar Component
- **Variants**: Linear, Circular
- **Props**: value, max, showLabel, color
- **States**: Determinate, Indeterminate

---

## Mobile Responsive Considerations

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-Specific Components

1. **Bottom Navigation** (Replaces sidebar on mobile)
   - 5 icons: Home, Search, Bookings, Favorites, Profile
   - Active state highlighting

2. **Hamburger Menu** (Top-left)
   - Slide-in side drawer
   - Full navigation menu

3. **Floating Action Button** (FAB)
   - Position: Bottom-right
   - Primary CTA (Create Event, Book Now)

4. **Swipeable Carousels**
   - Touch-friendly
   - Snap to items

5. **Pull-to-Refresh**
   - Implement on list/feed pages

6. **Sticky Bottom CTA**
   - On event details: "Book Now" button
   - On checkout: "Pay Now" button

### Mobile Optimizations

- **Touch Targets**: Min 44x44px (Apple) / 48x48px (Material)
- **Font Sizes**: Min 16px (Prevents zoom on iOS)
- **Inputs**: Full-width on mobile
- **Tables**: Convert to cards or horizontal scroll
- **Modals**: Full-screen on mobile
- **Images**: Lazy loading, Responsive srcset
- **Navigation**: Simplified menu, Prioritize actions

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: Min 4.5:1 ratio
   - Large text: Min 3:1 ratio
   - Interactive elements: Min 3:1 ratio

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Focus indicators visible
   - Logical tab order
   - Skip to main content link

3. **Screen Reader Support**
   - ARIA labels on icons
   - Alt text on images
   - Semantic HTML (nav, main, article, aside)
   - Form labels associated with inputs

4. **Motion**
   - Respect prefers-reduced-motion
   - Provide pause/stop for auto-play content

5. **Forms**
   - Clear error messages
   - Error prevention
   - Confirmation for destructive actions

---

## Design Tokens (Variables)

```css
/* Colors */
--color-primary: #6366F1;
--color-secondary: #9333EA;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;

/* Typography */
--font-family-base: 'Inter', sans-serif;
--font-family-mono: 'JetBrains Mono', monospace;

--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 32px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);

/* Z-index */
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## Animation Guidelines

### Timing Functions
- **Standard**: cubic-bezier(0.4, 0.0, 0.2, 1) - Most UI elements
- **Decelerate**: cubic-bezier(0.0, 0.0, 0.2, 1) - Entering elements
- **Accelerate**: cubic-bezier(0.4, 0.0, 1, 1) - Exiting elements
- **Sharp**: cubic-bezier(0.4, 0.0, 0.6, 1) - Temporary elements

### Durations
- **Fast**: 100ms - Simple state changes
- **Normal**: 200ms - Standard transitions
- **Slow**: 300ms - Complex animations
- **Slower**: 500ms - Major layout changes

### Common Animations

**Fade In/Out**:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide In**:
```css
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

**Scale Up**:
```css
@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

**Skeleton Pulse**:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Print Styles

### Printable Pages
- Invoices
- Tickets
- Receipts
- Reports

### Print CSS Rules
```css
@media print {
  /* Hide navigation, footer */
  header, footer, .no-print { display: none; }
  
  /* Optimize for print */
  body { font-size: 12pt; }
  h1 { font-size: 24pt; }
  
  /* Page breaks */
  .page-break { page-break-before: always; }
  
  /* Remove colors for economical printing */
  * { color: black !important; }
}
```

---

## Dark Mode Support (Future Enhancement)

### Color Palette Adjustments
- Background: Dark gray (#1F2937)
- Surface: Lighter gray (#374151)
- Text: White/Light gray
- Primary: Lighter shade of indigo
- Borders: Subtle gray (#4B5563)

### Implementation
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1F2937;
    --color-text: #F9FAFB;
    /* ... */
  }
}
```

---

## Internationalization (i18n) Considerations

### Text Direction Support
- LTR (Default): English, Spanish, French
- RTL: Arabic, Hebrew
- Ensure layout mirrors correctly for RTL

### Date/Time Formats
- Use locale-aware formatting (Intl.DateTimeFormat)
- Timezone display

### Currency Display
- Dynamic currency symbols
- Proper formatting (1,234.56 vs 1.234,56)

### Number Formatting
- Thousands separators
- Decimal separators

---

## Performance Metrics Targets

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Additional Metrics
- **TTI** (Time to Interactive): < 3.5s
- **Speed Index**: < 3.0s
- **Total Blocking Time**: < 300ms

### Optimization Strategies
- Code splitting
- Lazy loading
- Image optimization (WebP, Lazy load)
- CDN for static assets
- Service Worker caching
- Database query optimization
- Bundle size reduction (< 200KB initial)

---

## Browser Support

### Supported Browsers
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 12+
- Chrome Mobile: Android 5+

### Graceful Degradation
- Progressive Enhancement approach
- Polyfills for older browsers (If necessary)
- Feature detection (Modernizr or native)

---

## Conclusion

This comprehensive UI/UX specification document covers all 29 pages/tabs of the FlowGateX platform, along with shared components, design system, and implementation guidelines. Use this as a blueprint for creating high-fidelity designs in Google Stitch or any other design tool.

**Key Takeaways**:
1. Consistent design system across all pages
2. User-centric layouts with clear information hierarchy
3. Responsive design from mobile-first approach
4. Accessibility as a core principle
5. Performance optimization built-in
6. Scalable component architecture

**Next Steps for Design**:
1. Create a design system library in Stitch (Colors, Typography, Components)
2. Start with high-priority pages (Landing, Events Browse, Event Details, Dashboard)
3. Design atomic components first (Buttons, Inputs, Cards)
4. Build up to page templates
5. Create interactive prototypes for user testing
6. Handoff to development with design specifications

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026  
**Created for**: FlowGateX Enterprise Event Management Platform
