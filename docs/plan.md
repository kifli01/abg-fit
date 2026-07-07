# abgFit — Product Plan

## Vision

abgFit egy edzésterv PWA, amelynek célja, hogy a felhasználók összeválogathatják a saját edzésprogramjaikat egy kiterjedt, kutatott feladatkönyvtárból, majd nyomon követhetik az előrehaladásukat — akár többnapos programokon át is. Az alkalmazás mesterséges intelligenciával is rendelkezik: a felhasználó elmondja, mit szeret, mit csinál, mi fér bele az életébe, és az AI összeállít egy személyre szabott programot — majd iterálni is lehet rajta a chatben.

---

## Iterációk

### 1. Alapok — Hello World PWA

Cél: Egy működő, deployolt PWA-alap, ami megfelel a modern elvárásoknak.

- Next.js projekt inicializálás, Vercel deploy
- PWA konfiguráció: manifest, service worker, installability
- Alapvető navigáció és layout shell
- Design system és brand alapok (abgFit vizuális identitás)
- Sikerkritérium: installálható, bejelentkezés nélkül is megnyitható app, üres de helyes shell

### 2. Firebase integráció

Cél: Felhasználókezelés és adattárolás alapja.

- Firebase Auth: Google / email belépés
- Firestore adatbázis struktúra megtervezése és felállítása
- Felhasználói profil alapok
- Titkos kulcsok kizárólag Vercel environment variables-ben
- Sikerkritérium: bejelentkezés, kijelentkezés, saját adatok olvasása/írása

### 3. Workout feladatok kutatása és adatbázis feltöltése

Cél: Az app tartalmi alapja — a feladatkönyvtár.

- Izomcsoportok, mozgásminták és kategóriák meghatározása
- Kiterjedt feladatlista összeállítása (kutatás alapján)
- Minden feladathoz: név, leírás, izmok, felszerelés, nehézség, videó/kép hivatkozás
- Feladatok feltöltése Firestore-ba, admin UI vagy script alapján
- Sikerkritérium: böngészhető, szűrhető feladatkönyvtár az appban

### 4. Manuális workout program készítés

Cél: A felhasználó saját programot tud összerakni és követni.

- Program builder UI: feladatok kiválasztása és sorrendezése
- Többnapos programstruktúra (pl. 5 napos split)
- Program követés: aktív edzés nézet, haladás mentése
- Edzésnapló — hol tartunk épp a programban
- Sikerkritérium: program létrehozás, elindítás, napi haladás nyomon követése

### 5. AI integráció

Cél: AI backend bekötése, biztonságos architektúra.

- AI provider kiválasztása és integrálása (API kulcs server-side, soha nem kliensben)
- Chat alapú felület az appban
- Rendszer prompt kialakítása: abgFit kontextus, feladatkönyvtár ismerete
- Sikerkritérium: biztonságos AI chat működik az appban, tudja a feladatokat

### 6. AI funkciók

Cél: Személyre szabott programgeneráció és iteráció AI-jal.

- Program generálás chatből: felhasználó elmondja preferenciáit, AI összeállít egy programot
- Iteráció: meglévő programon módosítás chatben (pl. "cseréld le a guggolást")
- AI javaslatok mentése és alkalmazása a program builderre
- Hosszabb távú: AI ismeri a felhasználó előzményeit, edzéslogját
- Sikerkritérium: teljes körű AI-alapú program létrehozás és szerkesztés

---

## Elvek

- **Iteratív fejlesztés**: minden lépés önmagában is értékes és deployálható állapot
- **PWA-first**: offline képesség, installálhatóság elsőrendű prioritás
- **Biztonság**: titkok soha nem kerülnek a repóba, minden érzékeny adat Vercel env vars-ban
- **Egyszerűség**: a részletek kidolgozása az adott lépés feladata, a terv csapásirányt ad
- **Minőség**: frontend és UX minőség minden lépésben szempont
