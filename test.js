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

test('la page cadre l\'adresse /exec du deploiement', () => {
  assert.ok(/AKfyc[-\w]+/.test(SOURCE), 'adresse du deploiement introuvable');
  assert.ok(SOURCE.indexOf('/exec') !== -1, 'doit cadrer /exec, jamais /dev');
});

test('la page se declare en francais et s\'adapte au telephone', () => {
  assert.ok(/<html lang="fr">/.test(SOURCE));
  assert.ok(/<meta charset="utf-8">/i.test(SOURCE), 'charset requis, sinon accents casses');
  assert.ok(/name="viewport"/.test(SOURCE), 'viewport requis pour le telephone');
  assert.ok(/100dvh/.test(SOURCE), 'hauteur dvh pour les navigateurs mobiles');
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
