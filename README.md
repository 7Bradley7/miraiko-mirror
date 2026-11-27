<div align="center">

# 次 Miraiko

**Ton prochain anime, choisi à partir de ce que tu as vraiment aimé.**

Site de recommandation d'animés et de mangas : il analyse ta liste, te propose le titre à commencer ce soir et t'explique pourquoi.

</div>

---

## Le projet

Les sites de suivi (MyAnimeList, AniList…) sont pensés pour _lister_ ce qu'on a vu, et les plateformes de streaming poussent leur propre catalogue. Miraiko sert à _décider_ quoi regarder ou lire ensuite :

- **Des recos expliquées pour ton profil** : « parce que tu as fini _X_ », « même studio que _Y_ », « les fans qui ont tes goûts l'ont terminé ».
- **Animés et mangas dans le même fil**, avec le lien entre les deux : « l'anime s'arrête à l'épisode 12, reprends le manga au chapitre 47 ».
- **Import de ta liste** AniList ou MyAnimeList, ou trois titres aimés pour démarrer.
- **Un compte AniList relié** : Miraiko est un client AniList, ta liste reste sur AniList.

Le site est en anglais. La documentation du projet est en français.

## Stack prévue

| Rôle                    | Choix                                            |
| ----------------------- | ------------------------------------------------ |
| Front + API             | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Base de données         | PostgreSQL (Neon, Francfort) + Prisma 7          |
| Hébergement             | Vercel (Francfort)                               |
| Données animés / mangas | AniList, en client (décision ADR-1)              |

Les détails et les alternatives étudiées sont dans le document « Choix techniques » du Notion du projet.

## Direction artistique

- **Néon Shibuya × Ambilight** : fond nuit, accents rouge `#ff3b3b` et ambre `#ffb000` ; la page prend la couleur du titre regardé.
- **Cartes « booster »** au survol : la carte se soulève, s'approche et suit la souris en 3D, avec un reflet lumineux (sans le reflet arc-en-ciel de la maquette, retiré le 22/11).
- **Miraiko** (未来子, « l'enfant du futur ») : la mascotte qui guide l'utilisateur.

Maquettes : fichier Figma « Miraiko — Maquette finale ».

## Organisation

- Gestion de projet : Notion (sprints, tâches, registre des décisions).
- Conventions Git et définition de « terminé » : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Lancer le projet

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Commande               | Rôle                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Serveur de développement                                       |
| `npm run build`        | Build de production                                            |
| `npm run start`        | Lance le build de production                                   |
| `npm run lint`         | ESLint (règles Next.js + TypeScript)                           |
| `npm run typecheck`    | Génère les types des routes, puis vérifie les types TypeScript |
| `npm run format`       | Formate tout le code avec Prettier                             |
| `npm run format:check` | Vérifie le formatage sans rien modifier                        |
| `npm test`             | Lance les tests une fois (Vitest)                              |
| `npm run test:watch`   | Relance les tests à chaque modification                        |
| `npm run db:migrate`   | Crée et applique une migration (dev)                           |
| `npm run db:deploy`    | Applique les migrations existantes                             |
| `npm run db:seed`      | Insère les données de test                                     |
| `npm run db:studio`    | Ouvre Prisma Studio                                            |

Les polices (Big Shoulders Display, Zen Kaku Gothic New, JetBrains Mono, Dela Gothic One) sont auto-hébergées via Fontsource : aucune requête vers Google Fonts.

## Variables d'environnement et secrets

```bash
cp .env.example .env.local   # puis remplis les valeurs
```

- [`.env.example`](.env.example) liste toutes les variables, sans aucune vraie valeur. Il est à jour à chaque ajout de variable.
- `.env.local` (et tout autre fichier `.env*`) est ignoré par Git : les secrets ne vont jamais dans le dépôt.
- En production et en preview, les valeurs se règlent dans **Vercel** (Project Settings → Environment Variables).
- Seules les variables préfixées par `NEXT_PUBLIC_` sont envoyées au navigateur : une clé secrète ne porte jamais ce préfixe.
- La CI lance **Gitleaks** sur tout l'historique Git à chaque PR. Une clé détectée bloque la fusion.

Si une clé a été commitée par erreur : la révoquer et en générer une nouvelle chez le fournisseur **d'abord**, puis la retirer du code. La supprimer de l'historique ne suffit pas, elle doit être considérée comme compromise.

## Base de données

- **PostgreSQL chez Neon** (projet `miraiko`, région Francfort), via **Prisma 7** et l'adaptateur `@prisma/adapter-pg`.
- Schéma : [`prisma/schema.prisma`](prisma/schema.prisma). Migrations : `prisma/migrations/`. Le client Prisma est généré dans `src/generated/` à chaque `npm install` (ignoré par Git).
- Dans le code serveur, on utilise le client partagé : `import { db } from "@/lib/db"`.
- Deux URL de connexion (console Neon → _Connect_) :
  - `DATABASE_URL` : connexion « pooled » (hôte avec `-pooler`), utilisée par le site ;
  - `DATABASE_URL_UNPOOLED` : connexion directe, utilisée par Prisma pour les migrations et le seed.

Modifier le schéma :

1. Modifier `prisma/schema.prisma`.
2. `npm run db:migrate -- --name nom-de-la-migration` (sur une branche Neon de dev, jamais sur la production).
3. Commiter le schéma et le dossier de migration dans la même PR.

En CI, le job **Database** applique les migrations sur un PostgreSQL jetable, vérifie qu'elles correspondent au schéma et lance le seed.

Sur Vercel, le build lance `prisma migrate deploy` avant `next build` (script `vercel-build`) :

- **preview** : les migrations de la PR sont appliquées sur la branche Neon de cette preview, jamais sur la production ;
- **production** : les migrations sont appliquées sur la branche `production` juste avant la mise en ligne du nouveau code, donc le schéma et le code arrivent toujours ensemble.

On ne lance jamais de migration à la main sur la production.

## Authentification

- **Better Auth** (e-mail + mot de passe), configuré dans [`src/lib/auth.ts`](src/lib/auth.ts), avec ses tables dans la base Neon via Prisma (`users`, `sessions`, `accounts`, `verifications`, `rate_limits`).
- **Mots de passe** : hachés en **argon2id** (paramètres OWASP, voir [`src/lib/password.ts`](src/lib/password.ts)), 10 caractères minimum ; jamais stockés en clair. Les anciens hachages scrypt restent acceptés et sont remplacés au prochain changement de mot de passe.
- **Sessions** : stockées en base (30 jours, renouvelées chaque jour), cookie `HttpOnly` et `Secure` en production ; la déconnexion supprime la session.
- **Vérification de l'e-mail** obligatoire avant la première connexion : le lien est envoyé par **Resend** (`RESEND_API_KEY`). En développement sans clé, le lien s'affiche dans les logs du serveur.
- **Mot de passe oublié** : `/forgot-password` envoie un lien à usage unique, valable 1 heure. La réponse est la même que l'e-mail ait un compte ou non, pour qu'on ne puisse pas tester des adresses. Après la réinitialisation, toutes les sessions sont fermées et un e-mail prévient l'utilisateur.
- **Changement de mot de passe** depuis `/account` : il demande le mot de passe actuel et déconnecte les autres appareils.
- **Limite de tentatives** : 5 connexions, 3 inscriptions et 3 demandes de réinitialisation par minute et par IP, compteurs en base pour tenir sur toutes les instances Vercel.
- Pages : `/sign-in` (connexion et inscription), `/forgot-password`, `/reset-password` et `/account` (compte, changement de mot de passe, déconnexion).
- Côté serveur, l'utilisateur connecté se lit avec `getCurrentUser()` ([`src/lib/session.ts`](src/lib/session.ts)), toujours dans un `<Suspense>`.
- Comptes de test créés par `npm run db:seed` : `aiko@example.com` et `kenji@example.com` (mot de passe dans [`prisma/seed.ts`](prisma/seed.ts)).

## Connexion AniList (MRK-32)

- Miraiko est un **client AniList** (décision ADR-1) : chaque compte Miraiko (e-mail + mot de passe) doit être **relié à un compte AniList**. La liste de l'utilisateur reste sur AniList.
- **Onboarding obligatoire** : après la connexion, `/onboarding` demande de relier AniList. Les pages du site doivent appeler `requireAniListUser()` ([`src/lib/session.ts`](src/lib/session.ts)), qui renvoie vers l'onboarding tant qu'AniList n'est pas relié. La page `/account` reste accessible et permet de relier ou de délier AniList.
- AniList ne sert qu'à **relier** un compte, jamais à en créer un : AniList ne donne pas l'adresse e-mail. Le mot de passe AniList n'est tapé que sur le site d'AniList.
- Le **jeton AniList** est chiffré en base (`account.encryptOAuthTokens`), avec `AUTH_SECRET`.
- Fournisseur OAuth : [`src/lib/anilist/oauth.ts`](src/lib/anilist/oauth.ts) (le compte AniList est lu par [`viewer.ts`](src/lib/anilist/viewer.ts)), branché dans [`src/lib/auth.ts`](src/lib/auth.ts) avec le plugin `genericOAuth` de Better Auth. Adresse de retour : `/api/auth/callback/anilist`.
- **Clients AniList** ([anilist.co/settings/developer](https://anilist.co/settings/developer)) : « Miraiko » pour la production (`https://miraiko.vercel.app/api/auth/callback/anilist`) et « Miraiko (dev) » pour le local (`http://localhost:3000/api/auth/callback/anilist`).
- **Previews** : AniList n'accepte qu'une adresse de retour par client. Avec le plugin `oAuthProxy`, une preview passe par la production pour relier AniList. Il faut la même valeur `OAUTH_PROXY_SECRET` en Production et en Preview, et `ANILIST_CLIENT_ID` / `ANILIST_CLIENT_SECRET` du client « Miraiko » dans les deux.

## Client AniList (MRK-19)

- **Une seule couche d'accès aux données** : tout ce qui vient d'AniList passe par [`src/lib/anilist/`](src/lib/anilist/). Seul [`client.ts`](src/lib/anilist/client.ts) appelle l'API GraphQL d'AniList. ESLint refuse un appel à `graphql.anilist.co` ou un import de `client.ts` / `media.ts` ailleurs dans le code.
- **Catalogue** (recherche et fiches) : les pages utilisent [`catalog.ts`](src/lib/anilist/catalog.ts) (`searchCatalog`, `getCatalogMedia`), qui renvoie les formes de Miraiko (`MediaSummary`, `MediaDetails`, dans [`media.ts`](src/lib/anilist/media.ts)) et jamais le schéma d'AniList. Les titres pour adultes ne sont jamais renvoyés.
- **Cache temporaire uniquement** (règles d'AniList) : `'use cache: remote'`, partagé entre les serveurs. Une entrée est rafraîchie après 1 h et supprimée après 1 jour sans visite. Rien n'est copié dans la base de Miraiko. Le jeton de l'utilisateur n'entre jamais dans le cache du catalogue.
- **Limite de requêtes d'AniList** : 90 requêtes par minute (30 tant que l'API est « dégradée »), et un dépassement bloque une minute. Sur une erreur 429 : si AniList demande d'attendre 3 secondes ou moins, le client attend et réessaie une fois ; sinon il lève `AniListRateLimitError` avec le temps d'attente, pour que la page affiche un message clair, et le serveur n'appelle plus AniList jusqu'à la fin du blocage (AniList refuse aussi les requêtes envoyées pendant ce temps). Les erreurs sont dans [`errors.ts`](src/lib/anilist/errors.ts) et ne sont jamais mises en cache.
- Les requêtes sur le compte ou la liste de l'utilisateur (avec son jeton) passeront aussi par `anilistRequest`, sans cache partagé (MRK-22).

## Page Explorer (MRK-20)

- `/browse` ([`src/app/[locale]/browse/`](src/app/[locale]/browse/)) : recherche dans le catalogue d'AniList, filtres par type (animés, mangas) et par genre. Sans recherche, la page montre les titres tendance.
- Réservée aux comptes reliés à AniList (`requireAniListUser()`, décision ADR-1) et non indexée.
- La recherche et les filtres sont dans l'adresse (`/browse?q=frieren&type=anime&genre=fantasy`) : une recherche se partage et se recharge. Les résultats suivent la frappe (après 350 ms), et le formulaire marche aussi sans JavaScript.
- **Défilement infini** : la page suivante se charge toute seule à l'approche de la fin de la liste (action serveur `loadMoreResults`, mêmes règles d'accès), avec un bouton « Voir plus » pour le clavier et pour réessayer après une erreur.
- **Recherche AniList** : les résultats sont triés par popularité. AniList cherche des mots entiers avec une petite tolérance aux fautes : « fr » ne trouve pas « Frieren ». Une recherche « contient » demanderait une copie du catalogue, interdite par ADR-1.
- **Ambilight** : en haut de l'écran, la bannière AniList du titre survolé ou sélectionné au clavier, fixe pendant que les cartes défilent ; elle se fond plus bas dans la jaquette très floutée, fixe derrière toute la page. Les titres sans bannière n'ont que les couleurs floutées. Fondu enchaîné une fois l'image chargée. Au chargement, c'est le premier résultat.
- **Barre collante** : le menu du site reste en haut de l'écran ; la recherche et les filtres restent juste en dessous quand on fait défiler les cartes, transparents, avec de l'espace au-dessus pour laisser voir la bannière. Une « fenêtre » remontre la bannière par-dessus les cartes jusque sous la barre : les cartes disparaissent sous la barre au lieu de se voir à travers. Un nouveau filtre ramène au début des résultats.
- Les jaquettes viennent directement d'AniList (`unoptimized`, aucune copie chez Vercel ni chez nous).
- Si AniList est saturé ou en panne, la page l'explique avec le temps d'attente au lieu d'une page d'erreur.
- Les cartes mènent vers `/anime/<id>` ou `/manga/<id>`, la page Fiche (MRK-21).

## Langues (i18n)

- Le site existe en **anglais** et en **français**, avec **next-intl**. Chaque adresse commence par la langue : `/en/browse`, `/fr/browse`. Une adresse sans langue (`/browse`) redirige vers la langue gardée en cookie, sinon celle du navigateur, sinon l'anglais (`src/proxy.ts`).
- **Aucun texte en dur** dans les composants : tous les textes sont dans [`messages/en.json`](messages/en.json) et [`messages/fr.json`](messages/fr.json), rangés par écran (`signIn`, `account`, `nav`…).
  - Serveur : `const t = await getTranslations("account")` ; composant sans `async` ou client : `const t = useTranslations("account")`.
  - Variables : `"greeting": "Hi, {name}"` → `t("greeting", { name })`. Mise en forme : `"<strong>{email}</strong>"` → `t.rich(…, { strong: … })`.
  - L'anglais sert de référence : une clé absente ou mal écrite est une erreur TypeScript. Un test vérifie que le français a les mêmes clés, les mêmes `{variables}` et les mêmes balises.
- **Liens et redirections** : utiliser `Link`, `redirect`, `useRouter` et `usePathname` de [`src/i18n/navigation.ts`](src/i18n/navigation.ts), pas ceux de Next.js : ils gardent la langue de la page.
- **E-mails** : écrits dans la langue de la page d'où vient l'utilisateur ([`src/lib/email-locale.ts`](src/lib/email-locale.ts)).
- Choix de la langue : boutons « English / Français » dans le footer (`LocaleSwitcher`).
- Ajouter une langue : l'ajouter dans [`src/i18n/routing.ts`](src/i18n/routing.ts), créer `messages/<langue>.json` avec toutes les clés, et ajouter son nom dans `localeSwitcher`.

## Design system

- Composants React dans [`src/components/ui/`](src/components/ui/), construits d'après le Figma « Miraiko — Maquette finale » : `Button` et `ButtonLink`, `Pill`, `Logo`, `HoloCard`, `Nav`, `Footer`, `Mascot` et `Bubble`.
- Page de démonstration : `/en/design-system` ou `/fr/design-system` (non indexée par les moteurs de recherche).
- Couleurs et polices : [`src/app/globals.css`](src/app/globals.css). Utiliser les classes Tailwind des tokens (`bg-night`, `text-muted`, `font-display`…), jamais de couleur en dur.
- Icônes : [lucide-react](https://lucide.dev/icons/) (`import { Search } from "lucide-react"`), toujours avec `aria-hidden="true"` et un nom accessible sur le bouton ou le lien qui les contient.
- Mascotte : les 5 poses sont dans `public/mascot/`, détourées (fond transparent, découpé le 23/11 depuis l'image Figma à fond sombre) : elle s'affiche en couleurs sur n'importe quel fond.
- `public/demo-covers/` contient les jaquettes d'exemple des maquettes : elles ne servent qu'à la page de démonstration.
- Accessibilité : contour ambre visible au clavier, onglet actif annoncé (`aria-current`), animations coupées si l'utilisateur demande moins de mouvement.

## Tests

- **Vitest** + **Testing Library**, fichiers `*.test.tsx` à côté du composant testé.
- On teste ce que voit l'utilisateur (rôles, noms accessibles, liens), pas le détail du code.
- La CI lance `npm test` dans le job « Lint, types and format ».

## Déploiement

- **Vercel** (projet `miraiko`, offre Hobby) déploie automatiquement le dépôt GitHub :
  - **production** : chaque fusion sur `main` → https://miraiko.vercel.app ;
  - **preview** : chaque PR reçoit sa propre URL, publiée par Vercel en commentaire de la PR.
- Les fonctions tournent à **Francfort** (`fra1`, voir [`vercel.json`](vercel.json)), dans la même région que la base Neon.
- **Neon ↔ Vercel** : l'intégration injecte `DATABASE_URL` et `DATABASE_URL_UNPOOLED` dans Vercel. Chaque preview reçoit sa propre branche de base Neon, copiée de la production : une PR ne touche jamais aux données réelles.
- Les autres variables (`AUTH_SECRET`, `RESEND_API_KEY`) se règlent dans Vercel → _Settings_ → _Environment Variables_, jamais dans le dépôt.
- L'offre Hobby est réservée à un usage non commercial : passer à l'offre Pro avant d'activer la monétisation.

## Licence

Code propriétaire, tous droits réservés. Voir [LICENSE](LICENSE).
