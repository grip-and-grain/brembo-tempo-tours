# Brembo Tempo Tours

Motorcycle tour booking site for Brembo Tempo Tours in Ostergotland, Sweden. Built with Astro 6, Tailwind CSS 4, and Netlify SSR.

## Architecture

```
Google Sheets (CMS)          Google Drive (images)
       |                            |
       v                            v
  SSR via Netlify Functions    CDN URLs (lh3.googleusercontent.com)
       |                            |
       +----------------------------+
       |
  Astro Hybrid (static + SSR)
       |
  Netlify CDN (1hr cache)
```

**Static pages** (about, contact, thank-you) are prerendered at build time.
**Data pages** (home, routes, calendar, gallery) are server-rendered per request via Netlify Functions, fetching fresh data from Google Sheets. CDN caches responses for 1 hour.

This means Google Sheets data changes (routes, dates, prices, videos) appear on the site within 1 hour without any deploy.

## Tech Stack

- **Framework**: Astro 6 with Netlify SSR adapter
- **Styling**: Tailwind CSS 4
- **CMS**: Google Sheets (3 tabs: Rutter, Datum, Videor)
- **Images**: Google Drive folders served via CDN
- **Hosting**: Netlify (Functions + CDN)
- **Forms**: Netlify Forms
- **i18n**: Swedish (default) + English, manual translation objects

## Project Structure

```
src/
  components/
    MapEmbed.astro        # Embedded map
    RouteCard.astro       # Route listing card with price/discount
    SignupForm.astro      # Netlify form with honeypot
    TourDateCard.astro    # Booking date card with spot counter
    VideoCard.astro       # YouTube embed (nocookie)
  i18n/
    index.ts              # useTranslations(lang) helper
    sv.ts                 # Swedish translations
    en.ts                 # English translations
  layouts/
    BaseLayout.astro      # Header, footer, scroll animations
  lib/
    drive-gallery.ts      # Google Drive API -> CDN image URLs
    sheets.ts             # Google Sheets CSV -> Route/Video data
  pages/
    index.astro           # Home (SV)
    calendar.astro        # Calendar (SV)
    gallery.astro         # Gallery (SV)
    about.astro           # About (SV, static)
    contact.astro         # Contact form (SV, static)
    thank-you.astro       # Confirmation (SV, static)
    routes/
      index.astro         # Routes listing (SV)
      [slug].astro        # Route detail (SV)
    en/                   # English mirrors of all pages
```

## Google Sheets Schema

### Rutter (Routes)

| Column | Type | Description |
|--------|------|-------------|
| published | TRUE/FALSE | Controls visibility |
| slug | string | URL slug |
| title / titleEn | string | Bilingual title |
| description / descriptionEn | string | Bilingual description (use `\|\|` for paragraph breaks) |
| distance | number | Route distance in km |
| duration / durationEn | string | e.g. "halvdag" / "half day" |
| difficulty / difficultyEn | string | latt/medel/kravande / easy/moderate/demanding |
| price | number | Price in SEK |
| discount | percentage | e.g. "50%" (empty = no discount) |
| discountText / discountTextEn | string | e.g. "Introerbjudande" (empty = no text) |
| region | string | Defaults to Ostergotland |
| mapThumbnail | Google Drive URL | Map image link |
| highlights | semicolon-separated | e.g. "Nybble; Borrum; Ulrika" |

### Datum (Tour Dates)

| Column | Type | Description |
|--------|------|-------------|
| routeSlug | string | References route slug |
| date | YYYY-MM-DD | Tour date |
| spots | number | Total spots (default 8) |
| spotsLeft | number | Remaining spots |

### Videor (Videos)

| Column | Type | Description |
|--------|------|-------------|
| published | TRUE/FALSE | Must be explicitly TRUE |
| isPlaylist | TRUE/FALSE | Playlist vs single video |
| url | string | YouTube URL |
| title | string | Override title (falls back to oEmbed) |

## Environment Variables

```
GOOGLE_SHEET_ID=              # Google Sheets document ID
GOOGLE_API_KEY=               # Google API key (Drive API)
GOOGLE_DRIVE_GALLERY_FOLDER_ID=  # Drive folder for gallery images
GOOGLE_DRIVE_HERO_FOLDER_ID=     # Drive folder for hero slideshow
```

Set these in Netlify's environment variables for production. Use `.env` locally (gitignored).

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at localhost:4321 |
| `npm run build` | Production build to ./dist/ |
| `npm run preview` | Preview production build locally |

Requires Node >= 22.12.0.

## Caching

All SSR pages set `Cache-Control: public, s-maxage=3600, stale-while-revalidate=7200`. Netlify CDN caches responses for 1 hour, serves stale for 2 hours while revalidating.

Netlify free tier usage at 1hr TTL with ~28 SSR paths: ~20k function invocations/month (16% of 125k limit).

## Security

- CSP restricts scripts, styles, images, and frames to known origins
- HSTS enabled with 2-year max-age and preload
- All env vars are server-side only (no `PUBLIC_` prefix)
- Drive/YouTube IDs validated against `[a-zA-Z0-9_-]+` before URL construction
- Contact form URL params validated (slug format, ISO date format)
- YouTube embeds use `youtube-nocookie.com`
- Honeypot field on signup form
