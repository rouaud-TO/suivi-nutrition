/**
 * Tests de la page d'accueil. Aucune dependance : node test.js
 *
 * La seule logique de la page est de reconnaitre l'identifiant d'une feuille
 * dans ce qu'on lui colle. Une barre oblique en trop a deja produit une erreur
 * « Illegal spreadsheet id or key » : c'est ce que ces tests verrouillent.
 *
 * La fonction est extraite du fichier reellement publie, jamais recopiee.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extraireIdPublie() {
  const corps = /function extraireId[\s\S]*?\n  }/.exec(SOURCE);
  assert.ok(corps, 'extraireId introuvable dans index.html');
  return new Function(corps[0] + '; return extraireId;')();
}

const ID = '18GTpGDkhcl6JlVw51Bv2IMSH839pB5iqMELRBblmZVk';
const cas = [];
function test(nom, fn) { cas.push({ nom, fn }); }

test('reconnait l\'identifiant sous toutes ses formes collees', () => {
  const extraireId = extraireIdPublie();
  [
    ID,
    '/' + ID,
    '  ' + ID + '  ',
    'https://docs.google.com/spreadsheets/d/' + ID,
    'https://docs.google.com/spreadsheets/d/' + ID + '/edit',
    'https://docs.google.com/spreadsheets/d/' + ID + '/edit?gid=721051019#gid=721051019'
  ].forEach((entree) => {
    assert.strictEqual(extraireId(entree), ID, 'entree : ' + JSON.stringify(entree));
  });
});

test('ne fabrique pas d\'identifiant a partir de rien', () => {
  const extraireId = extraireIdPublie();
  ['', '   ', 'bonjour', null, undefined].forEach((entree) => {
    assert.strictEqual(extraireId(entree), '', 'entree : ' + JSON.stringify(entree));
  });
});

// construireSrc est extraite du fichier publie et executee avec un faux
// window : c'est elle qui a laisse tomber ?vue=suivi et renvoye tout le monde
// sur le tableau de bord par defaut.
function construireSrcPublie(search) {
  const corps = /function construireSrc[\s\S]*?\n  }/.exec(SOURCE);
  assert.ok(corps, 'construireSrc introuvable dans index.html');
  const fabrique = new Function(
    'window', 'APPLICATION', 'URLSearchParams', corps[0] + '; return construireSrc;'
  );
  return fabrique({ location: { search: search } }, 'https://app/exec', URLSearchParams);
}

test('transmet tous les parametres a l\'application, pas seulement l\'identifiant', () => {
  const avecVue = construireSrcPublie('?id=ABC&vue=suivi')('ABC');
  assert.ok(avecVue.indexOf('vue=suivi') !== -1, avecVue);
  assert.ok(avecVue.indexOf('id=ABC') !== -1, avecVue);

  const sansVue = construireSrcPublie('?id=ABC')('ABC');
  assert.ok(sansVue.indexOf('id=ABC') !== -1, sansVue);
  assert.ok(sansVue.indexOf('vue=') === -1, 'aucune vue imposee par defaut : ' + sansVue);
});

test('l\'identifiant nettoye remplace celui de l\'adresse', () => {
  // L'adresse peut porter un identifiant colle avec une barre oblique ; c'est
  // la version nettoyee qui doit partir vers l'application.
  const src = construireSrcPublie('?id=%2FABC&vue=suivi')('ABC');
  assert.ok(src.indexOf('id=ABC') !== -1, src);
  assert.ok(src.indexOf('%2F') === -1, 'la barre oblique ne doit pas subsister : ' + src);
});

test('part directement sur l\'application, sans cadre ni attente', () => {
  // Le cadre echouait la ou les cookies tiers sont bloques (401 de Google), et
  // le detecter imposait une attente a chaque ouverture. On redirige.
  assert.ok(/location\.replace/.test(SOURCE),
            'la redirection doit remplacer l\'adresse, pas empiler un historique');
  assert.ok(SOURCE.indexOf('<iframe') === -1, 'plus aucun cadre dans la page');
  assert.ok(!/setTimeout/.test(SOURCE), 'aucune attente avant d\'afficher');
});

test('la page cadre l\'adresse /exec du deploiement', () => {
  assert.ok(/AKfyc[-\w]+/.test(SOURCE), 'adresse du deploiement introuvable');
  assert.ok(SOURCE.indexOf('/exec') !== -1, 'doit cadrer /exec, jamais /dev');
});

test('la page se declare en francais et s\'adapte au telephone', () => {
  assert.ok(/<html lang="fr">/.test(SOURCE));
  assert.ok(/<meta charset="utf-8">/i.test(SOURCE), 'charset requis, sinon accents casses');
  assert.ok(/name="viewport"/.test(SOURCE), 'viewport requis pour le telephone');
});

test('la page ne contient aucune donnee personnelle', () => {
  // Ce depot est public : rien de la feuille ne doit s'y trouver. On cherche
  // des marqueurs precis, pas des fragments : « kg » se trouve dans
  // « background », et un test qui crie a tort ne sert a rien.
  ['POIDS', 'POITRINE', 'NOMBRIL', 'FESSES', 'CUISSE', 'ROUAUD'].forEach((mot) => {
    assert.ok(
      SOURCE.toUpperCase().indexOf(mot) === -1,
      'marqueur de donnee personnelle dans une page publique : ' + mot
    );
  });
});

let ok = 0;
const echecs = [];
cas.forEach((c) => {
  try { c.fn(); ok++; console.log('  ok   ' + c.nom); }
  catch (err) { echecs.push([c.nom, err]); console.log('  ECHEC ' + c.nom); }
});
console.log('\n' + ok + ' reussis, ' + echecs.length + ' echecs');
if (echecs.length) {
  echecs.forEach(([nom, err]) => console.log('\n--- ' + nom + '\n' + err.message));
  process.exit(1);
}
