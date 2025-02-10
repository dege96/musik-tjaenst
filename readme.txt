//installs
npm install                         // Installerar alla projektets beroenden från package.json
npm install react-feather           // Installerar ikonbiblioteket react-feather

//development
npm run dev                         // Startar backend-servern i utvecklingsläge med automatisk omstart
npm run dev:client                  // Startar React-appen i utvecklingsläge på port 3007

//database setup & migrations
npm run setup-db                    // Skapar initial databasstruktur och admin-användare
npm run update-db                   // Uppdaterar databasschemat och skapar mallspellistor
npm run migrate                     // Kör databasmigrationer i produktionsmiljö

//songs management
npm run list-s3                     // Listar alla låtar som finns lagrade i AWS S3
npm run update-db create-schema     // Skapar databasschemat
npm run import-songs                // Importerar låtar från S3 till databasen med metadata
npm run update-db create-templates  // Skapar fördefinierade spellistmallar

//testing
npm test                            // Skapar testdatabas och kör alla tester
npm run test:watch                  // Kör tester i watch-läge (kör om när filer ändras)
npm run test:coverage               // Kör tester och genererar kodtäckningsrapport

//build
npm run build                       // Bygger både backend (TypeScript) och frontend
npm run build:client                // Bygger endast frontend-delen (React-appen)

//production
npm start                           // Startar servern i produktionsläge

Funktionalitet för administratör:
- Streama låtar: Låtar streamas från CloudFront, vilket ger snabbare leverans.
- Redigera låtar och spellistor: Administratörer kan hantera låtar och spellistor, inklusive att lägga till, uppdatera och ta bort låtar.
- Autentisering: JWT används för att autentisera användare och hantera åtkomst till olika delar av tjänsten.

Funktionalitet för användare:
- Streama låtar
- Redigera egna spellistor
- Filtrera låtar efter genre och energinivå