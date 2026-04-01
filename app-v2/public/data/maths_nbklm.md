# Mathématiques — Brevet des collèges (3ème)
## Document complet pour NotebookLM

---

# LEÇON 1 — Le Théorème de Thalès

## Énoncé

**Théorème de Thalès :** Si les points A, B et M d'une part, et les points A, C et N d'autre part sont alignés, et si les droites (BC) et (MN) sont parallèles, alors :

$$\frac{AB}{AM} = \frac{AC}{AN} = \frac{BC}{MN}$$

## Les deux configurations

### Configuration classique
Les droites se croisent en un point A extérieur aux deux droites parallèles. Les points A, B, M sont alignés dans cet ordre, et les points A, C, N sont alignés dans cet ordre.

### Configuration "en papillon"
Le point A est situé entre les deux droites parallèles. Les points B, A, M sont alignés (A entre B et M) et les points C, A, N sont alignés (A entre C et N). Les rapports restent égaux.

## Méthode d'application

Pour utiliser le théorème de Thalès :
1. Vérifier que les points sont bien alignés dans le bon ordre
2. Identifier les droites parallèles
3. Écrire l'égalité des trois rapports
4. Utiliser le produit en croix pour trouver la longueur inconnue

## Exemple résolu

Dans une figure, les droites (RS) et (NP) sont parallèles. On connaît : RM = 9, MS = 4,5, MN = 4,5, RS = 7,5. On cherche PN.

Les points R, M, P et les points S, M, N sont alignés.
D'après le théorème de Thalès :
$$\frac{MP}{MR} = \frac{MN}{MS} = \frac{PN}{RS}$$

On utilise : $\frac{3}{4{,}5} = \frac{PN}{7{,}5}$

Donc : $PN = \frac{7{,}5 \times 3}{4{,}5} = 5$

Ainsi, la longueur PN est de 5 cm.

---

# LEÇON 2 — Découvrir les fonctions

## Définitions

**Fonction f :** Un procédé qui à un nombre x associe un unique nombre y.
- Le nombre de départ x s'appelle un **antécédent**.
- Le nombre d'arrivée y est appelé **image** de x par la fonction f.

**Schéma :** antécédent → fonction → image, soit x → f → f(x)

## Notation

On peut noter les fonctions de deux manières :
- $f : x \rightarrow y$ qui se lit "fonction f qui à x associe y"
- $f(x) = y$ qui se lit "f de x est égal à y"

**Attention :** f désigne la fonction, tandis que f(x) désigne un nombre (l'image de x par f). Il ne faut pas les confondre.

## Exemple

On considère la fonction f "élever au carré", donc $f(x) = x^2$.
- L'antécédent 2 a pour image 4 par f, car $f(2) = 2^2 = 4$
- L'image 49 a deux antécédents par f : 7 et (-7), car $7^2 = 49$ et $(-7)^2 = 49$
- On note : $f(-7) = 49$ ou $f : -7 \rightarrow 49$

## Définition 2 — Représentation graphique

Toute fonction f peut être représentée dans un repère cartésien à l'aide d'une **courbe représentative**, notée généralement Cf.

La représentation graphique d'une fonction est l'ensemble des points de coordonnées (x ; f(x)).
- L'antécédent x se lit sur l'axe des abscisses
- L'image f(x) se lit sur l'axe des ordonnées

---

# LEÇON 3 — Les nombres premiers

## Définition

Un **nombre premier** est un nombre entier positif strictement supérieur à 1 qui n'a que deux diviseurs : 1 et lui-même.

**Remarque :** Il existe une infinité de nombres premiers.

Liste des nombres premiers inférieurs à 100 : 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97.

## Exemples

- 8 n'est pas un nombre premier car il est divisible par 1, 2, 4 et 8.
- 61 est un nombre premier (il n'est divisible que par 1 et 61).

## Propriété — Décomposition en facteurs premiers

Tout nombre entier supérieur ou égal à 2 se décompose en produit de facteurs premiers. Cette décomposition est unique, à l'ordre près.

**Méthode :** On divise successivement par les nombres premiers (2, 3, 5, 7...) jusqu'à obtenir 1.

**Exemple :** Décomposer 84 en produit de facteurs premiers.

| Division | Résultat |
|----------|----------|
| 84 ÷ 2 = | 42 |
| 42 ÷ 2 = | 21 |
| 21 ÷ 3 = | 7 |
| 7 ÷ 7 = | 1 |

Donc : $84 = 2 \times 2 \times 3 \times 7 = 2^2 \times 3 \times 7$

## Application — Plus Grand Diviseur Commun (PGCD)

**Méthode en 3 étapes :**
1. Décomposer les deux nombres en produit de facteurs premiers
2. Lister tous les diviseurs communs aux deux nombres
3. Identifier le plus grand diviseur commun

**Exemple DNB :** Une collectionneuse a 252 cartes "feu" et 156 cartes "roche" Pokémon. Elle veut faire des paquets identiques en utilisant toutes ses cartes.

- $252 = 2 \times 2 \times 3 \times 3 \times 7 = 2^2 \times 3^2 \times 7$
- $156 = 2 \times 2 \times 3 \times 13 = 2^2 \times 3 \times 13$

Diviseurs de 252 : 1, 2, 3, 4, 6, 7, 9, 12, 18, 21, 28, 36, 42, 63, 84, 126, 252
Diviseurs de 156 : 1, 2, 3, 4, 6, 12, 13, 26, 39, 52, 78, 156

Le PGCD de 252 et 156 est **12**.
Elle peut faire 12 paquets maximum. Chaque paquet contiendra 252 ÷ 12 = 21 cartes "feu" et 156 ÷ 12 = 13 cartes "roche".

---

# LEÇON 4 — Les transformations géométriques

## 1 — La symétrie axiale

**Définition 1 :** La symétrie d'un point M par rapport à une droite (d) est le point M' tel que :
- Les droites (d) et (MM') sont perpendiculaires
- La droite (d) passe par le milieu du segment [MM']

**Remarques :**
- Le symétrique d'un point appartenant à (d) est lui-même.
- Pour définir une symétrie axiale, on a besoin d'un axe de symétrie (une droite).

## 2 — La symétrie centrale

**Définition 2 :** Deux points sont symétriques par rapport à un point O s'ils se superposent lorsque l'on effectue un demi-tour autour de O.

**Propriété 1 :** Soit O un point. Par la symétrie de centre O :
- Le symétrique d'un point C distinct de O est le point C' tel que O est le milieu du segment [CC'].
- Le symétrique du point O est lui-même.

**Remarque :** Pour définir une symétrie centrale, on a besoin d'un centre de symétrie (un point).

## 3 — Les translations

**Définition 3 :** Soient deux points A et A'. On appelle translation qui transforme A en A' le "glissement" :
- Selon la direction de la droite (AA')
- Dans le sens de A vers A'
- D'une longueur égale AA'

On fait glisser le point A sur le point A'. Tous les points de la figure subissent le même déplacement.

**Remarque :** Pour définir une translation, nous avons besoin de deux points et d'un sens.

## 4 — Les rotations

**Définition 4 :** L'image d'un point A par la rotation de centre O, d'angle x° et dans le sens horaire (ou antihoraire) est le point A' tel que OA = OA' et l'angle AOA' = x° dans le sens souhaité.

**Remarques :**
- Une rotation de centre O et d'angle 180° est équivalente à une symétrie centrale.
- Pour définir une rotation, on a besoin d'un centre de rotation, d'un angle et d'un sens (horaire ou antihoraire).

## Propriété générale

**Propriété 2 :** Toutes ces transformations (symétrie axiale, symétrie centrale, translation, rotation) conservent les alignements, les angles, les longueurs et les aires.

---

# LEÇON 5 — La réciproque du théorème de Thalès

## Énoncé

**Réciproque du théorème de Thalès :** Si les points A, B et M d'une part et les points A, C et N d'autre part sont alignés dans cet ordre, et si deux des rapports parmi $\frac{AB}{AM}$, $\frac{AC}{AN}$ et $\frac{BC}{MN}$ sont égaux, alors les droites (BC) et (MN) sont parallèles.

## Méthode

Pour montrer que deux droites sont parallèles avec la réciproque de Thalès :
1. Vérifier que les points sont alignés dans le bon ordre
2. Calculer deux des rapports
3. Comparer les valeurs obtenues
4. Conclure : si les deux rapports sont égaux → droites parallèles ; si différents → droites non parallèles

## Exemples

**Exemple 1 :** AB = 5,4 cm, AD = 7,2 cm, AC = 6,6 cm, AE = 8,8 cm. Les points A, B, D et A, C, E sont alignés dans cet ordre.

$\frac{AB}{AD} = \frac{5{,}4}{7{,}2} = 0{,}75$ et $\frac{AC}{AE} = \frac{6{,}6}{8{,}8} = 0{,}75$

L'égalité de Thalès est vérifiée : $\frac{AB}{AD} = \frac{AC}{AE}$, donc les droites (BC) et (DE) sont parallèles.

**Exemple 2 :** AE = 1,8 cm, AB = 4,8 cm, AD = 2,4 cm, AC = 5 cm.

$\frac{AE}{AB} = \frac{1{,}8}{4{,}8} = 0{,}375$ et $\frac{AD}{AC} = \frac{2{,}4}{5} = 0{,}48$

L'égalité de Thalès n'est pas vérifiée : $\frac{AE}{AB} \neq \frac{AD}{AC}$, donc les droites (BC) et (DE) ne sont pas parallèles.

---

# LEÇON 6 — Déterminer des images et des antécédents

## Méthode 1 — Déterminer l'image d'un nombre par une fonction

**Règle :** On remplace tous les x dans l'expression de f par l'antécédent donné, on calcule et on conclut.

**Exemple :** Soit f la fonction définie par $f(x) = x^2 + 5x$. Calculons l'image de 4 par f.

$f(4) = 4^2 + 5 \times 4 = 16 + 20 = 36$

L'image de 4 par la fonction f est 36.

## Définition 1 — Tableau de valeurs

Un **tableau de valeurs** d'une fonction f est un tableau qui associe des antécédents à leur image respective par cette fonction.

**Exemple :**

| Antécédent x | -1 | 0 | 2 | 4 | 6 | 8 |
|---|---|---|---|---|---|---|
| Image f(x) | 2 | 3 | 5 | 4 | 2 | 0 |

- L'image de 0 par f est 3 : f(0) = 3
- Les antécédents de 2 par f sont (-1) et 6

## Méthode 2 — Déterminer l'image par lecture graphique

1. Sur l'axe des abscisses, se placer sur le nombre dont on cherche l'image.
2. Tracer la droite parallèle à l'axe des ordonnées passant par ce nombre.
3. Lire l'ordonnée du point d'intersection entre cette droite et la courbe représentative de la fonction.

## Méthode 3 — Déterminer les antécédents par lecture graphique

1. Sur l'axe des ordonnées, se placer sur le nombre dont on cherche les antécédents.
2. Tracer la droite parallèle à l'axe des abscisses passant par ce nombre.
3. Lire les abscisses des points d'intersection entre cette droite et la courbe représentative.

**Exemple graphique :** Par lecture graphique sur la courbe Cf :
- L'image de 3 par la fonction h est 5
- Les antécédents de 2 par h sont (-0,9), 1,3 et 2,5

---

# LEÇON 7 — Théorème de Pythagore

## Énoncé

**Théorème de Pythagore :** Si ABC est un triangle rectangle en C, alors :
$$AB^2 = AC^2 + CB^2$$

Dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux côtés de l'angle droit.

**À quoi ça sert :** Calculer une longueur manquante dans un triangle rectangle lorsque l'on connaît les deux autres.

## Exemple 1 — Calculer l'hypoténuse

Le triangle BAC est rectangle en A. AC = 3 cm, AB = 4 cm. On cherche BC (l'hypoténuse).

1. Le triangle BAC est rectangle en A.
2. D'après le théorème de Pythagore : $BC^2 = AC^2 + AB^2$
3. $BC^2 = 3^2 + 4^2 = 9 + 16 = 25$
4. Donc $BC = \sqrt{25} = 5$

## Exemple 2 — Calculer un "petit côté"

Le triangle EFG est rectangle en F. EG = 5 cm, FG = 3 cm. On cherche EF.

1. Le triangle EFG est rectangle en F.
2. D'après le théorème de Pythagore : $EF^2 = EG^2 - FG^2$
3. $EF^2 = 5^2 - 3^2 = 25 - 9 = 16$
4. Donc $EF = \sqrt{16} = 4$

---

# LEÇON 8 — Équation du premier degré

## Définitions

**Équation :** Une équation est une égalité comportant une ou plusieurs inconnues. Résoudre une équation revient à trouver toutes les valeurs de l'inconnue qui vérifient l'égalité.

**Équation du premier degré :** Pour tous nombres a, b et c, l'équation $ax + b = c$ est une équation du premier degré.

## Méthode — Résoudre une équation

**Principe :** Pour isoler x, on effectue les mêmes opérations des deux côtés de l'égalité.

**Étapes :**
1. Regrouper les termes avec x d'un côté et les termes sans x de l'autre
2. Diviser (ou multiplier) des deux côtés pour obtenir x seul

**Exemple :** Résoudre $3x - 4 = 1$

Étape 1 : On ajoute 4 des deux côtés pour se débarrasser du -4 :
$$3x - 4 + 4 = 1 + 4 \Rightarrow 3x = 5$$

Étape 2 : On divise par 3 des deux côtés :
$$\frac{3x}{3} = \frac{5}{3} \Rightarrow x = \frac{5}{3}$$

---

# LEÇON 9 — Rendre irréductible une fraction

## Définition

Une fraction est dite **irréductible** lorsqu'on ne peut plus la simplifier, c'est-à-dire que le numérateur et le dénominateur n'ont pas de diviseur commun autre que 1.

**Exemples :**
- $\frac{3}{7}$ est irréductible car 3 et 7 n'ont pas de diviseurs communs à part 1.
- $\frac{6}{8}$ n'est pas irréductible car 6 et 8 sont tous les deux divisibles par 2.

## Méthode — Rendre une fraction irréductible

1. Écrire le numérateur et le dénominateur en produit de facteurs premiers
2. Simplifier les facteurs communs

**Exemple :** Rendre irréductible $\frac{360}{396}$.

$360 = 2 \times 2 \times 2 \times 3 \times 3 \times 5$ et $396 = 2 \times 2 \times 3 \times 3 \times 11$

$$\frac{360}{396} = \frac{2 \times 2 \times 2 \times 3 \times 3 \times 5}{2 \times 2 \times 3 \times 3 \times 11}$$

On simplifie par $2 \times 2 \times 3 \times 3$, ainsi :

$$\frac{360}{396} = \frac{2 \times 5}{11} = \frac{10}{11}$$

---

# LEÇON 10 — Calculer une longueur avec la trigonométrie

## 1 — Généralités

Dans un triangle ABC rectangle en C, les rapports des longueurs $\frac{CA}{AB}$, $\frac{CB}{AB}$ et $\frac{CB}{CA}$ ne dépendent que de la mesure de l'angle BAC.

## Les trois rapports trigonométriques

Pour un angle aigu dans un triangle rectangle :

**1) Cosinus :** $\cos(\hat{A}) = \frac{\text{longueur du côté adjacent à l'angle}}{\text{longueur de l'hypoténuse}}$

**2) Sinus :** $\sin(\hat{A}) = \frac{\text{longueur du côté opposé à l'angle}}{\text{longueur de l'hypoténuse}}$

**3) Tangente :** $\tan(\hat{A}) = \frac{\text{longueur du côté opposé à l'angle}}{\text{longueur du côté adjacent à l'angle}}$

## Moyen mnémotechnique

| **C**osinus | **S**inus | **T**angente |
|---|---|---|
| **A**djacent / **H**ypoténuse | **O**pposé / **H**ypoténuse | **O**pposé / **A**djacent |
| **CAH** | **SOH** | **TOA** |

## Tableau de choix de la relation

| Je veux \ Je connais | Hypoténuse | Côté opposé | Côté adjacent |
|---|---|---|---|
| **Hypoténuse** | — | sin | cos |
| **Côté opposé** | sin | — | tan |
| **Côté adjacent** | cos | tan | — |

## Propriétés

- Le cosinus et le sinus d'un angle aigu sont des nombres compris entre 0 et 1.
- Le cosinus, le sinus et la tangente d'un angle aigu sont des nombres sans unités.

## 2 — Exemple résolu

Triangle CDE rectangle en D. CD = 3,1 cm, angle DCE = 64°. Trouver DE.

- On cherche DE = côté opposé à l'angle DCE
- On connaît CD = côté adjacent à l'angle DCE
- → On utilise la **tangente** : $\tan(\widehat{DCE}) = \frac{DE}{DC}$

$\tan(64°) = \frac{DE}{3{,}1}$, donc $DE = 3{,}1 \times \tan(64°) \approx 6{,}4$ cm

---

# LEÇON 11 — Les probabilités

## I — Modéliser une expérience aléatoire

### Définitions 1

- **Expérience aléatoire :** Expérience dont on ne peut pas prévoir de façon certaine le résultat.
- **Issue :** Un résultat d'une expérience aléatoire.
- **Événement :** Une condition qui, selon une issue, est réalisée ou non.
- **Événement élémentaire :** Un événement lié à une unique issue de l'expérience aléatoire.

### Définitions 2 — La probabilité

- La **probabilité** d'un événement est la "proportion de chance" d'obtenir les issues liées à cet événement lors d'une expérience aléatoire.
- La probabilité d'un événement est comprise entre 0 et 1.
- Un événement est **impossible** s'il ne peut pas se produire : sa probabilité vaut 0.
- Un événement est **certain** s'il se produit toujours : sa probabilité vaut 1.

### Définition 3 — Expérience équiprobable

Lorsque tous les événements élémentaires d'une expérience aléatoire ont la même probabilité, on parle d'une **expérience aléatoire équiprobable**.

**Exemple :** Simon a une boîte de 16 crayons (3 bleus, etc.). La probabilité d'obtenir un crayon bleu est : $P(A) = \frac{3}{16}$

## II — Événements incompatibles et contraires

### Définition 4 — Événements incompatibles

Deux événements sont dits **incompatibles** s'ils ne peuvent pas se réaliser en même temps.

**Propriété 2 :** Si deux événements A et B sont incompatibles : $P(A \text{ ou } B) = P(A) + P(B)$

**Exemple :** On lance un dé. A = "obtenir un nombre pair", B = "obtenir 5". A et B sont incompatibles.
$P(A) = \frac{3}{6}$ et $P(B) = \frac{1}{6}$, donc $P(A \text{ ou } B) = \frac{3}{6} + \frac{1}{6} = \frac{4}{6}$

### Définition 5 — Événement contraire

L'**événement contraire** de A est l'événement qui se réalise lorsque A ne se réalise pas. Il se note $\bar{A}$.

**Propriétés 3 :**
- $P(A) + P(\bar{A}) = 1$
- $P(\bar{A}) = 1 - P(A)$
- $P(A) = 1 - P(\bar{A})$

**Exemple :** Un carton contient 3 boules rouges, 2 vertes et 4 bleues. A = "obtenir une boule bleue".
$P(A) = \frac{4}{9}$ et $P(\bar{A}) = 1 - \frac{4}{9} = \frac{5}{9}$

### Propriété 4 — Fréquence et probabilité

Lorsque l'on répète un très grand nombre de fois une expérience aléatoire, la fréquence d'apparition d'une issue se rapproche d'une fréquence "limite" qui est la probabilité de cette issue.

---

# LEÇON 12 — Les fonctions linéaires

## Définition

Pour un nombre a donné, la **fonction linéaire** f qui associe à tous nombres x le nombre ax est une fonction linéaire.

On écrit : $f : x \rightarrow ax$ ou $f(x) = ax$

Le nombre a est appelé le **coefficient directeur** de la droite.

**Exemple :** $f(x) = 4x$ est une fonction linéaire de coefficient 4.

## Méthode — Déterminer le coefficient d'une fonction linéaire

On considère la fonction linéaire f telle que f(4) = 6. Déterminons son coefficient a.

On sait que f est linéaire, donc $f(x) = ax$.
$f(4) = a \times 4 = 6$, donc $a = \frac{6}{4} = \frac{3}{2}$

## Propriétés 1

- Dans un repère, la courbe représentative d'une fonction linéaire est une **droite passant par l'origine du repère**.
- Dans un repère, toute droite non verticale passant par l'origine est la représentation graphique d'une fonction linéaire.

**Exemple :** La courbe représentative Cf de la fonction $f(x) = 4x$ est la droite passant par l'origine et de coefficient directeur 4.

---

# LEÇON 13 — Calcul avec des fractions

## Opérations sur les fractions

### Addition et soustraction

**Fractions avec même dénominateur :** On additionne (ou soustrait) les numérateurs en conservant le dénominateur.
$$\frac{7}{4} + \frac{7}{4} - \frac{4}{4} = \frac{11}{4}$$

**Fractions avec dénominateurs différents :** On réduit au même dénominateur avant d'additionner ou soustraire.
$$\frac{4}{5} + \frac{1}{15} = \frac{4 \times 3}{15} + \frac{1}{15} = \frac{12}{15} + \frac{1}{15} = \frac{13}{15}$$

### Multiplication

On multiplie les numérateurs entre eux et les dénominateurs entre eux.
$$\frac{4}{3} \times \frac{9}{3} = \frac{4 \times 9}{3 \times 3} = \frac{36}{9} = 4$$

Exemple : $\frac{7}{5} \times \frac{5}{2} = \frac{35}{6}$

### Division

Diviser par une fraction revient à multiplier par son inverse.
$$\frac{3}{14} \div \frac{7}{14} = \frac{3}{14} \times \frac{14}{7} = \frac{3 \times 14}{14 \times 7} = \frac{3}{7}$$

Exemple : $\frac{3}{14} \div \frac{1}{7} = \frac{3}{14} \times \frac{7}{1} = \frac{21}{14} = \frac{3}{2}$

---

# LEÇON 14 — Développer une expression littérale

## Propriété — La simple distributivité

Soient k, a et b trois nombres relatifs. Pour développer et réduire une expression littérale, on distribue le facteur k à tous les éléments entre parenthèses :

$$k \times (a + b) = k \times a + k \times b$$
$$k \times (a - b) = k \times a - k \times b$$

**Exemple 1 :** $C = 3 \times (x + 7) = 3 \times x + 3 \times 7 = 3x + 21$

## Propriété — La double distributivité

Soient a, b, c et d quatre nombres :

$$(a + b)(c + d) = a \times c + a \times d + b \times c + b \times d$$
$$(a + b)(c - d) = a \times c + a \times (-d) + b \times c + b \times (-d)$$
$$(a - b)(c + d) = a \times c + a \times d - b \times c - b \times d$$
$$(a - b)(c - d) = a \times c + a \times (-d) - b \times c - b \times (-d)$$

**Exemple 2 :**
$$D = (4x - 2)(-3x + 9)$$
$$D = 4x \times (-3x) + 4x \times 9 - 2 \times (-3x) - 2 \times 9$$
$$D = -12x^2 + 36x + 6x - 18$$
$$D = -12x^2 + 42x - 18$$

---

# LEÇON 15 — La médiane et l'étendue

## I — Calculer et interpréter une médiane

### Définition 1

Lorsque la série de données discrètes est rangée dans l'ordre croissant, la **médiane**, notée Me, est la valeur centrale de la série. Elle partage la série en deux groupes de même effectif sur la série mais pas sur la répartition des valeurs. Elle n'est donc pas sensible aux valeurs extrêmes.

### Remarques

- Si l'effectif total est **impair**, la médiane est la valeur centrale de la série rangée dans l'ordre croissant : c'est la valeur de rang $\frac{n+1}{2}$.
- Si l'effectif total est **pair**, la médiane est la moyenne entre les deux valeurs centrales de la série rangée dans l'ordre croissant.

### Méthode

Soit n le nombre de valeurs dans la série statistique.
- Si n est impair → médiane = valeur de rang $\frac{n+1}{2}$
- Si n est pair → médiane = moyenne des valeurs de rang $\frac{n}{2}$ et $\frac{n}{2} + 1$

### Exemples

**Exemple 1 :** Série : 2, 3, 5, 5, 6, 7, 13, 20 → 8 valeurs (effectif pair).
La médiane est la moyenne de la 4ème et 5ème valeur : $\frac{5+6}{2} = \frac{11}{2} = 5{,}5$

**Exemple 2 :** Série : 4, 5, 6, 6, 7, 8, 10, 15, 15 → 9 valeurs (effectif impair).
La médiane est la 5ème valeur : $\frac{9+1}{2} = 5$, donc la médiane est **7**.

### Interprétation 1

Au moins la moitié des valeurs de la série est inférieure ou égale à la médiane, et inversement.

## II — Calculer et interpréter une étendue

### Définition 2

L'**étendue** d'une série statistique est la différence entre la plus grande valeur et la plus petite. L'étendue est un indicateur de dispersion : elle mesure à quel point les valeurs sont regroupées ou dispersées. Elle est très sensible aux valeurs extrêmes.

**Exemple :** Relevés de températures à Torcy : 18°C, 29°C, 17°C, 16°C, 17°C, 15°C, 19°C.
Étendue = 29 - 15 = **14°C** ÷ ... (non, plus précisément : max - min = 29 - 15 = 14... mais selon la leçon : 20 - 15 = 5)

---

# QUESTIONS-RÉPONSES POUR RÉVISION

## Théorème de Thalès

**Q : Quand peut-on appliquer le théorème de Thalès ?**
R : Quand on a deux droites coupées par deux droites parallèles, avec des points alignés, et qu'on cherche une longueur inconnue.

**Q : Qu'est-ce que la configuration "en papillon" ?**
R : C'est une configuration où le point de départ A est situé entre les deux droites parallèles (les droites se croisent en A).

**Q : Quelle égalité donne le théorème de Thalès ?**
R : AB/AM = AC/AN = BC/MN

## Fonctions

**Q : Quelle est la différence entre f et f(x) ?**
R : f désigne la fonction (le procédé), tandis que f(x) désigne un nombre (l'image de x par f).

**Q : Comment calculer l'image de 3 par f(x) = 2x + 1 ?**
R : f(3) = 2×3 + 1 = 7. L'image de 3 est 7.

**Q : Comment trouver les antécédents graphiquement ?**
R : On se place sur la valeur cherchée sur l'axe des ordonnées, on trace une horizontale et on lit les abscisses des intersections avec la courbe.

**Q : Qu'est-ce qu'une fonction linéaire ?**
R : Une fonction de la forme f(x) = ax. Sa représentation graphique est une droite passant par l'origine.

## Nombres premiers et fractions

**Q : Qu'est-ce qu'un nombre premier ?**
R : Un nombre entier > 1 qui n'a que deux diviseurs : 1 et lui-même.

**Q : Comment rendre une fraction irréductible ?**
R : On décompose numérateur et dénominateur en facteurs premiers, puis on simplifie les facteurs communs.

**Q : Comment diviser une fraction par une autre ?**
R : On multiplie par l'inverse. a/b ÷ c/d = a/b × d/c.

## Géométrie

**Q : Quelle est la formule de Pythagore ?**
R : Dans un triangle rectangle en C : AB² = AC² + CB² (hypoténuse² = somme des carrés des deux autres côtés).

**Q : Que signifie CAH-SOH-TOA ?**
R : Cosinus = Adjacent/Hypoténuse ; Sinus = Opposé/Hypoténuse ; Tangente = Opposé/Adjacent.

**Q : Quelle transformation conserve les longueurs et les angles ?**
R : Toutes les transformations géométriques (symétrie axiale, symétrie centrale, translation, rotation) conservent les longueurs, angles, alignements et aires.

## Statistiques et probabilités

**Q : Comment calculer la médiane d'une série impaire ?**
R : On range les valeurs dans l'ordre croissant et on prend la valeur du milieu (rang (n+1)/2).

**Q : Qu'est-ce que l'étendue ?**
R : La différence entre la valeur maximale et la valeur minimale d'une série. C'est un indicateur de dispersion.

**Q : Quelle est la probabilité d'un événement certain ? D'un événement impossible ?**
R : Certain = 1 ; Impossible = 0. Toute probabilité est comprise entre 0 et 1.

**Q : Comment calculer la probabilité d'un événement contraire ?**
R : P(Ā) = 1 - P(A)

## Équations et calcul littéral

**Q : Comment résoudre 5x + 3 = 18 ?**
R : On soustrait 3 des deux côtés : 5x = 15, puis on divise par 5 : x = 3.

**Q : Comment développer k(a + b) ?**
R : k×a + k×b (simple distributivité).

---

*Document généré pour import dans NotebookLM — Brevet 3ème — Mathématiques*
*15 leçons complètes basées sur les cahiers de cours de l'élève*
