# Conventions de travail

## Langues

- **En anglais** : le site, le code, les commits, les titres et descriptions des issues et des pull requests, les templates GitHub et les noms des jobs de CI.
- **En français** : la documentation du projet (README, CONTRIBUTING, Notion) et les échanges entre personnes sur GitHub (commentaires, revues).

## Branches

- `main` est protégée : tout passe par une pull request.
- Une branche par tâche Notion, avec son identifiant :
  - `feat/MRK-12-search-page` : nouvelle fonctionnalité
  - `fix/MRK-20-cache` : correction de bug
  - `docs/...` : documentation
  - `chore/...` : configuration, dépendances, outillage

## Commits

Format [Conventional Commits](https://www.conventionalcommits.org/), en anglais :

```
feat: add the Search page
fix: correct the match score
docs: complete the README
chore: update dependencies
refactor: simplify the AniList client
test: add taste profile tests
```

## Pull requests

- Une PR = une tâche Notion, liée dans la description, et l'issue GitHub fermée avec `Closes #N`.
- Chaque PR porte les mêmes labels (catégorie + priorité) et le même milestone (sprint) que son issue, et est assignée à son auteur.
- La CI (« Lint, types and format », « Build », « Database », « Secret scan ») doit être verte avant de fusionner.
- Fusion en « squash » pour garder un historique propre sur `main` ; la branche est supprimée automatiquement après la fusion.

## Dépendances

- **Dependabot** ouvre chaque lundi des PR de mise à jour (npm et GitHub Actions), regroupées : Next.js, Prisma, React, dépendances de dev, dépendances de prod. Les mises à jour de sécurité arrivent dès qu'une alerte apparaît.
- Ces PR portent le label `dependencies` et passent par la même CI que les autres. Les montées de version majeure arrivent seules : lire les notes de version avant de fusionner.
- La CI audite les dépendances : elle échoue sur une vulnérabilité « high » ou « critical » dans les dépendances de production (avec `audit-ci`, réglé dans `audit-ci.jsonc`), et sur une « critical » dans les outils de dev (`npm audit`).
- Une exception dans `audit-ci.jsonc` doit rester rare, viser un chemin précis (jamais toute une faille) et expliquer pourquoi elle est sans risque. La retirer dès qu'un correctif existe.
- Quand un correctif existe mais qu'un paquet bloque encore l'ancienne version d'une de ses dépendances, on force la version corrigée avec `overrides` dans `package.json` plutôt qu'une exception. Exemple : `effect` (faille GHSA-7589-6fvf-x4pw), que `@prisma/config` 7.10.1 bloque en 3.20.0. Retirer l'override dès que le paquet parent embarque la version corrigée.

## Issues, labels et milestones

- Chaque tâche Notion a son issue, titrée `[MRK-N] …` avec le lien vers la page Notion.
- Un milestone par sprint (`Sprint 0 — Cadrage & conception`, `Sprint 1 — Socle technique`…).
- Labels de catégorie : `frontend`, `backend`, `data`, `devops`, `design`, `tests`, `security`, `legal`, `business`, `organization`, `documentation`, `accessibility`.
- Labels de priorité : `priority: critical` (P0), `priority: high` (P1), `priority: medium` (P2), `priority: low` (P3).

## Définition de « terminé »

- [ ] Critères de validation de la tâche remplis
- [ ] Code relu et lint OK
- [ ] Tests ajoutés ou mis à jour
- [ ] Responsive et accessibilité vérifiés
- [ ] Documentation mise à jour si besoin
- [ ] Livrable relié dans la page de la tâche Notion (lien de la PR)
- [ ] Tâche passée en « Terminé » dans Notion
