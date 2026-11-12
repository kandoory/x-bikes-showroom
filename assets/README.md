# Assets — الملفات اللي يستخدمها الرندر

| الفولدر | شنو فيه |
|---|---|
| `models/` | موديلات المنتجات بصيغة `.glb` مضغوطة (Draco أو Meshopt). كل موديل نربطه في `src/config.js` بحقل `model:` |
| `ci/` | اللوقو الرسمي (PNG شفاف) والخطوط. من `references/04 - CI/` فقط، ممنوع نرسم اللوقو بأنفسنا |

## ربط موديل منتج
في `src/config.js`، أضف لأي منتج:
```js
{ type: 'bike', label: 'CB500X', x: -16, z: -8, model: 'assets/models/cb500x.glb' }
```
الرندر يكبّر الموديل أو يصغّره على مقاس المكان، ويحطه على الأرض في نفس المكان.

## ربط اللوقو
حط الملف `assets/ci/honda-logo.png` وغيّر في `src/config.js`:
```js
signage: { logoImage: 'assets/ci/honda-logo.png', ... }
```
