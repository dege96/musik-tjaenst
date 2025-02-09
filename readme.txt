//installs
npm install
npm install react-feather


//lista och analysera alla MP3-filer i din S3-bucket genom att köra:
npm run list-s3

//importerar låtar från din lokala katalog genom att köra & uppdaterar databasen genom att köra:
npm run update-db
npm run import-songs


Funktionalitet för administratör:
- Streama låtar: Låtar streamas från CloudFront, vilket ger snabbare leverans.
- Redigera låtar och spellistor: Administratörer kan hantera låtar och spellistor, inklusive att lägga till, uppdatera och ta bort låtar.
- Autentisering: JWT används för att autentisera användare och hantera åtkomst till olika delar av tjänsten.

Funktionalitet för användare:
- Streama låtar
- Redigera egna spellistor
- Filtrera låtar efter genre och energinivå