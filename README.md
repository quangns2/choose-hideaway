# Choose Hideaway

Vietnamese website for Choose Hideaway Homestay & Restaurant, 147 Nguyễn Huệ, Ninh Bình. Phone supplied by owner: 0913 576 663.

## Features

- Responsive landing page, real property photos, room exploration, photo gallery, Google Maps directions and phone links.
- Separate room and table request forms. Server-side validation, Vietnam date/time handling, D1 persistence and reference number after a successful insert.
- Requests remain pending. This website does not confirm availability, collect payment, synchronize Booking.com inventory or send email/SMS notifications.
- Booking.com link for platform pricing and reservations. Direct prices, restaurant hours and exact room capacity require owner confirmation.
- Data is not exposed by a public listing API. Owner can inspect requests through Sites database tools.

## Source facts and imagery

Room types and facilities: https://www.booking.com/hotel/vn/choose-hideaway-homestay.vi.html

Property images `booking-*.jpg` are from Booking CDN URLs on the property's listing mirrored at https://sahihomestay.com/accommodation/k-v/choose-hideaway-homestay/313703 . Specific category-to-photo assignments have not been confirmed by owner; detail dialogs describe these as property space images.

Pool, restaurant and entrance photographs: Choose Hideaway listing at https://www.tripadvisor.com/Restaurant_Review-g303945-d27057287-Reviews-Choose_Hideaway-Ninh_Binh_Ninh_Binh_Province.html . Retrieved 2026-10-07.

## Development

Use the Sites plugin helpers for install, build, source synchronization and deployment. This project uses Vinext and Cloudflare D1 binding `DB`. The generated migration is in `drizzle/`. Apply it to the local D1 preview only; Sites applies hosted migrations when deploying.

New Sites are private until the owner requests public access. Database contents are separate from source history and deployment archives.
