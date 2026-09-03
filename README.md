# Tableau de bord Mensurations — page d'accueil

Page publique qui affiche le tableau de bord de suivi des mensurations.

Elle ne contient aucune donnée : elle se contente d'afficher, dans un cadre,
l'application Google Apps Script qui lit la feuille dont l'identifiant est
passé en paramètre.

    https://rouaud-to.github.io/mensurations/?id=IDENTIFIANT_DE_LA_FEUILLE

L'identifiant se trouve dans l'adresse de la feuille Google Sheets, entre
`/d/` et `/edit`. La page accepte aussi qu'on lui colle l'adresse complète.
Sans identifiant, elle propose un champ de saisie.

## Pourquoi cette page existe

1. Le bandeau « This application was created by a Google Apps Script user »
   est ajouté par Google autour de la page servie en `/exec`. Affichée dans un
   cadre depuis un autre site, l'application arrive sans ce bandeau.

2. La vérification Google — qui lève l'avertissement du premier lancement et
   le plafond de 100 utilisateurs des applications non vérifiées — exige une
   page d'accueil publique et une politique de confidentialité sur un domaine.
   Cette page en est le point de départ.

## Accès

Chaque visiteur voit uniquement les feuilles auxquelles Google lui donne
accès : l'application s'exécute avec ses propres droits. Un identifiant seul
ne donne accès à rien.

## Tests

    node test.js

Le code du tableau de bord lui-même est dans un dépôt séparé et privé.
