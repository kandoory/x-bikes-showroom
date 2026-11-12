// =====================================================================
//  X Bikes Showroom — ملف الإعدادات
//  كل المقاسات بالمتر. المحور X = عرض المبنى (يسار/يمين)،
//  Z = العمق (+Z = الواجهة والمدخل، -Z = الجدار الخلفي)، Y = الارتفاع.
//  الصفر (0,0,0) = نص المبنى على مستوى أرضية الجراوند.
//
//  ⚠️ TBD = رقم مؤقت لين يوصل الفلور بلان. لا تعتبره مقاس حقيقي.
// =====================================================================

export const CONFIG = {
  title: 'X Bikes Showroom',

  // ---------- الهوية (TBD: من الـ CI الرسمي) ----------
  brand: {
    red: '#CC0000',        // TBD — أحمر هوندا الرسمي من الـ CI
    dark: '#1A1A1A',
    light: '#F4F4F4',
    font: '"Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif', // TBD — خط الـ CI
  },

  // ---------- المبنى (كله TBD لين الفلور بلان) ----------
  building: {
    width: 40,             // TBD
    depth: 30,             // TBD
    slab: 0.3,             // سماكة البلاطة
    wall: 0.3,
    ground: { height: 9 },             // TBD — الجراوند دبل هايت
    lowerGround: { height: 5 },        // TBD
    mezzanine: { level: 4.5, depth: 8 }, // TBD — ارتفاع الميزانين، وعمقه من الجدار الخلفي
    entrance: { width: 4, doorHeight: 3.2 }, // TBD — المدخل الرئيسي في نص الواجهة
    stairs: {
      riser: 0.17,
      // درج الجراوند ← اللور جراوند (يمين). zTop = بداية الدرج من فوق، run = طوله
      toLower: { x: 15.5, width: 3, zTop: -1, run: 8.7 },      // TBD
      // درج الجراوند ← الميزانين (يسار). ينتهي عند حافة الميزانين
      toMezzanine: { x: -15.5, width: 3, run: 7.8 },          // TBD
    },
  },

  // ---------- الباب الزجاجي الأوتوماتيك ----------
  door: {
    triggerDistance: 4.5,  // يفتح إذا قربت أقل من هالمسافة
    speed: 2.5,
  },

  // ---------- المواد والألوان ----------
  materials: {
    groundFloor: '#D9D9DC',  // أرضية بورسلان فاتحة لامعة
    lowerFloor: '#BFC1C4',
    mezzFloor: '#C9B79C',    // خشب
    wall: '#EDEDED',
    exteriorWall: '#3A3D42',
    ceiling: '#F7F7F7',
    glass: '#BFD8E6',
    mullion: '#2B2D31',
    stair: '#9EA2A8',
  },

  environment: {
    sky: '#CFE3F2',
    pavement: '#B7B2A8',
    asphalt: '#3C3E42',
  },

  // ---------- الزونات في اللور جراوند ----------
  zones: [
    { key: 'bikes',  name: 'Honda Bikes',          nameAr: 'دراجات هوندا',       x0: -20,    x1: -6.67, color: '#B8C4D6' },
    { key: 'marine', name: 'Honda Marine',         nameAr: 'هوندا مارين',        x0: -6.67,  x1: 6.67,  color: '#A9CBD9' },
    { key: 'power',  name: 'Honda Power Products', nameAr: 'هوندا باور برودكتس', x0: 6.67,   x1: 20,    color: '#D4CBB4' },
  ],

  // ---------- المنتجات (أشكال مبدئية لين توصل الموديلات) ----------
  // أضف model: 'assets/models/xxx.glb' لأي منتج حتى ينحط الموديل الحقيقي مكان الشكل المبدئي.
  products: {
    turntableSpin: 0.12,   // سرعة لف منصّات السيارات (0 = واقفة)
    cars: [
      { label: 'Car 1', color: '#B00000', x: -8,  z: 6,  rot: 0.5 },
      { label: 'Car 2', color: '#F2F2F2', x: 8,   z: 6,  rot: -0.5 },
      { label: 'Car 3', color: '#1E2A3A', x: -7,  z: -2, rot: 0.9 },
      { label: 'Car 4', color: '#6E7377', x: 6,   z: -2, rot: -0.9 },
      { label: 'Car 5', color: '#111111', x: 0,   z: 2,  rot: 0.3 },
    ],
    bikes: [
      { label: 'Bike', x: -17, z: -11, rot: 0.6 }, { label: 'Bike', x: -13, z: -11, rot: 0.6 },
      { label: 'Bike', x: -9.5, z: -11, rot: 0.6 },
      { label: 'Bike', x: -17, z: -5, rot: 0.6 },  { label: 'Bike', x: -13, z: -5, rot: 0.6 },
      { label: 'Bike', x: -9.5, z: -5, rot: 0.6 },
      { label: 'Bike', x: -15, z: 2, rot: -0.4 },  { label: 'Bike', x: -11, z: 2, rot: -0.4 },
    ],
    marine: [
      { label: 'Outboard', x: -4, z: -11 }, { label: 'Outboard', x: -1.3, z: -11 },
      { label: 'Outboard', x: 1.3, z: -11 }, { label: 'Outboard', x: 4, z: -11 },
      { label: 'Outboard', x: -3, z: -4 },  { label: 'Outboard', x: 0, z: -4 }, { label: 'Outboard', x: 3, z: -4 },
    ],
    power: [
      { label: 'Generator', kind: 'generator', x: 9,  z: -11 }, { label: 'Generator', kind: 'generator', x: 11.5, z: -11 },
      { label: 'Generator', kind: 'generator', x: 14, z: -11 }, { label: 'Pump',      kind: 'pump',      x: 17,   z: -11 },
      { label: 'Mower',     kind: 'mower',     x: 9,  z: -5 },  { label: 'Mower',     kind: 'mower',     x: 11.5, z: -5 },
      { label: 'Tiller',    kind: 'tiller',    x: 9,  z: 1 },   { label: 'Pump',      kind: 'pump',      x: 11.5, z: 1 },
    ],
  },

  // ---------- اللافتات ----------
  signage: {
    // حط اللوقو الرسمي في assets/ci/ واكتب المسار هني. لين ذاك الوقت تطلع لافتة مؤقتة.
    logoImage: null,           // مثال: 'assets/ci/honda-logo.png'
    facadeTitle: 'X BIKES SHOWROOM',
  },

  // ---------- اللاعب والتحكم ----------
  player: {
    eyeHeight: 1.65,
    radius: 0.35,
    walkSpeed: 3.2,
    runMultiplier: 1.9,
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.005,
    fov: 70,
  },

  // ---------- قائمة الطوابق (نقاط البداية) ----------
  floors: [
    { key: 'outside',   label: 'برّا',          en: 'Outside',      spawn: { x: 0,  y: 0,    z: 30,  yaw: 0 } },
    { key: 'ground',    label: 'الجراوند',      en: 'Ground',       spawn: { x: 0,  y: 0,    z: 12.5, yaw: 0 } },
    { key: 'lower',     label: 'اللور جراوند',  en: 'Lower Ground', spawn: { x: 0,  y: -5,  z: 8,   yaw: 0 } },
    { key: 'mezzanine', label: 'الميزانين',     en: 'Mezzanine',    spawn: { x: 0,  y: 4.5, z: -9,  yaw: Math.PI } },
  ],
  startFloor: 'outside',

  // ---------- أزرار الإظهار والإخفاء ----------
  toggles: [
    { key: 'walls',     label: 'الجدران',   on: true },
    { key: 'glass',     label: 'الزجاج',    on: true },
    { key: 'roof',      label: 'السقف',     on: true },
    { key: 'furniture', label: 'الأثاث',    on: true },
    { key: 'products',  label: 'المنتجات',  on: true },
    { key: 'signage',   label: 'اللوحات',   on: true },
    { key: 'exterior',  label: 'الخارج',    on: true },
  ],

  // ---------- الرندر ----------
  render: {
    maxPixelRatio: 2,
    mobileMaxPixelRatio: 1.5,
    shadows: true,
    mobileShadows: false,
    exposure: 0.85,
  },
};
