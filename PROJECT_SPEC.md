# Likha — Project Overview & Feature Spec

## Project Overview

**Likha** ("to create/creation" in Filipino) is a mobile-first platform that combines a **creator portfolio** with a **maker marketplace**, built specifically for Filipino creatives.

**Tagline:** *Made by Filipinos. Create. Showcase. Get discovered.*

**Core idea:** Every creator has one profile that serves two purposes at once:
1. A **portfolio** — showcase projects, process, and skill (Behance/Dribbble-style), for discovery and credibility.
2. A **shop** — sell digital and physical products directly from that same profile (Etsy/Creative Market-style), turning showcased work into revenue.

A portfolio project and a shop listing are not separate systems — a project can be linked to (or converted into) a sellable product, so browsing inspiration and browsing to buy are two views of the same content.

**Target users:**
- **Creators**: illustrators, designers, photographers, UI/UX designers, writers, 3D artists, crafters — Filipino creatives who want to build a public body of work and optionally monetize it.
- **Buyers/Clients**: individuals, small businesses, schools, and LGUs browsing for inspiration, products, or people to hire/commission.

**Platform:** Mobile-first (iOS/Android), built with React Native + Expo, backed by Supabase (auth, database, storage).

**Monetization:**
- Take-rate/commission on marketplace sales (digital + physical).
- Featured/boosted listing fees.
- Optional commission-request fees for bespoke/custom work.

**Cultural positioning:** Filipino-first branding throughout — regional creator tags (Manila, Cebu, Davao, etc.), Filipino design motif categories, and seasonal local campaigns (Buwan ng Wika, Pasko, Sinulog) as first-class discovery features, differentiating from global platforms like Etsy, Behance, or Creative Market.

---

## Core Features

### 1. Creator Profiles
- Public profile: name, bio, location/region, avatar/cover image, social links.
- Two profile modes (toggleable):
  - **Portfolio only** — showcase work, no selling (students, hobbyists, people building a following).
  - **Open for work** — adds shop listings, commission requests, rates, response time, "hire me" CTA.
- Follower/following system.
- Verification badges (tiered — e.g., student, verified ID, top seller, fast responder).

### 2. Portfolio / Showcase Projects
- Multi-media project pages supporting: images, video embeds, writing/text, 3D embeds (e.g. Sketchfab), file attachments.
- Craft-specific layout options (e.g., UI/UX case study format: problem → process → solution; photography format with EXIF/gear info).
- Category + medium tagging (discipline: illustrator/photographer/etc.; style/medium: watercolor, editorial, 3D, etc.).
- "Shop the look" — tag specific elements/products within a project that link to a purchasable listing.
- Lightweight "process/WIP" post type, separate from full projects, for frequent updates.

### 3. Marketplace / Shop
- **Digital products** (instant download): digital art, templates, illustrations, stickers, fonts, UI kits, presets. Includes licensing terms (personal/commercial use) and automated file delivery after purchase.
- **Physical/made-to-order products**: prints, crafts, photography prints. Includes variants (size/material), shipping details, and local courier integration (e.g., Lalamove, J&T).
- **Commission requests**: buyers can request custom/bespoke work; supports package tiers (e.g., Basic/Standard/Premium) or milestone-based escrow (deposit → draft approval → final delivery → release).
- Shopping cart & checkout, order history, digital file re-download.

### 4. Discovery
- **Inspiration feed** — browse mode, no prices, sorted by category/region/trending, for portfolio browsing.
- **Shop feed** — browsable/filterable by price, category, physical vs. digital, turnaround time.
- Search with filters: discipline, medium, region, price range, availability.
- Curated/editorial collections (e.g., "This week in Cebu illustration," seasonal spotlights).
- Filipino design motif categories (e.g., Barong-inspired, Jeepney art) as a discovery dimension.

### 5. Transactions & Trust (DO NOT DO THIS YET)
- Payments via GCash, Maya, and card (through a PH-compatible payment gateway, e.g. PayMongo).
- Escrow for milestone-based commissions.
- Reviews tied to completed orders, displayed on both the order and the public project/listing.
- Dispute/report flow for orders and commissions.

### 6. Social & Growth
- Appreciations/likes + comments on projects.
- Save/collect projects and products into boards/collections.
- Referral incentive system.

- Push notifications (new follower, order update, commission message, featured spotlight).

### 7. Creator Tools
- Analytics dashboard: profile views, project views → inquiries/sales conversion, top-performing listings.
- Messaging/inbox between creators and buyers (for commission negotiation, order questions).
- Order/listing management (inventory for physical goods, digital file versioning).

---

## Tech Stack
- **Frontend:** React Native + Expo (mobile-first, iOS + Android)
- **Backend:** Supabase (Postgres database, Auth, Storage for media/files, Realtime for messaging/notifications)
- **Payments:** PayMongo or similar PH-compatible gateway (GCash/Maya support)
- **Auth:** Email + Facebook/Google OAuth via Supabase Auth

---

## Suggested Build Order (for Claude Code)
1. Auth + basic creator profile (portfolio-only mode)
2. Project/showcase upload + multi-media project pages
3. Discovery feed (inspiration mode) + search/filter
4. Shop listings (digital products first — simpler than physical fulfillment)
5. Cart + checkout + payment integration
6. Commission requests
7. Reviews, messaging, notifications
8. Analytics dashboard + referral system

## Branding
# Likha — Brand Guidelines

## 01. Brand Overview

**Likha** is a Filipino-first platform where creatives can **create, showcase, and sell** their work.

The brand celebrates Filipino creativity while presenting it through a modern, expressive, and premium digital experience.

**Tagline:**
*Made by Filipinos. Create. Showcase. Get discovered.*

### Brand Personality

Likha should feel:

* **Creative** — expressive and inspiring
* **Warm** — welcoming and human
* **Optimistic** — energetic and opportunity-driven
* **Modern** — clean and contemporary
* **Filipino** — culturally rooted, but never cliché

---

## 02. Color Palette

### Primary — Likha Yellow

**`#F4C542`**

The signature color of Likha. Represents creativity, ideas, optimism, and the spark behind creation.

Use for:

* Primary CTAs
* Create actions
* Highlights
* Active states
* Featured content
* Badges and key accents

### Ink

**`#20201C`**

The primary dark color used for text, navigation, strong contrast, and editorial sections.

### Canvas

**`#FFF9EA`**

A warm off-white inspired by paper and creative canvases. Use as the primary app background instead of pure white.

### Supporting Colors

**Golden — `#E5A91A`**
For pressed states, secondary highlights, and emphasis.

**Terracotta — `#D96B45`**
For secondary accents, notifications, and expressive moments.

**Warm Brown — `#6B4F2A`**
For subtle supporting text and craft-inspired elements.

**Soft Gray — `#E8E4DA`**
For borders, dividers, and muted UI elements.

### Recommended Balance

**60%** Canvas / neutrals
**25%** Ink / dark tones
**10%** Likha Yellow
**5%** supporting accents

Yellow should feel **special and intentional**, rather than covering the entire interface.

---

## 03. Visual Direction

### Modern Filipino Craft

Likha combines a **contemporary digital aesthetic** with subtle references to Filipino creativity and craftsmanship.

Visual inspiration can come from:

* Banig and woven patterns
* Paper and handmade textures
* Hand-drawn strokes
* Filipino editorial design
* Local materials and craftsmanship
* Contemporary Philippine art

These elements should remain **subtle and modern**.

Avoid excessive use of obvious Philippine symbols, flags, or stereotypical tropical imagery.

---

## 04. Typography

### Headings

**Instrument Serif**

Used for major headlines, campaign titles, and editorial moments.

### UI & Body

**Plus Jakarta Sans**

Used for navigation, buttons, descriptions, prices, labels, and general interface content.

The combination creates a balance between **creative/editorial** and **modern/product-focused**.

---

## 05. UI Principles

### Yellow = Action

Use Likha Yellow for things users should notice or interact with:

**Create · Buy · Add to Cart · Featured · Follow · Hire**

### Cream = Canvas

Use the warm cream background to create a sense of a **creative workspace or physical canvas**.

### Dark = Structure

Use Ink for strong typography, navigation, headers, and high-contrast sections.

### Photography & Art First

Creator work should always be the visual focus. UI elements should support the content rather than compete with it.

---

## 06. Filipino Identity

Likha should feel **Filipino through its culture, community, and content**, rather than relying solely on visual stereotypes.

Use regional and cultural elements through:

* Manila, Cebu, Davao, and regional creator discovery
* Filipino design and craft categories
* Local creative campaigns
* Buwan ng Wika, Pasko, Sinulog, and other seasonal collections
* Subtle Filipino-inspired patterns and illustrations

**The goal: Filipino, but contemporary.**

---

## 07. Brand Essence

> **Likha is the spark that turns Filipino creativity into something people can discover, appreciate, and own.**

**Create. Showcase. Get discovered.**
