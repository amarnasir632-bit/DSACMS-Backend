# DSACMS Backend API

خدمة REST مستقلة لنظام مكتبة الشيخ محمد أحمد الهادي الكرار. تعمل على Vercel
وتستخدم Express وPostgreSQL، وتوفر طبقة التحكم والبيانات الوصفية. تُحفظ روابط
الملفات الخارجية مباشرة في `audio_url` و`document_url` دون تمرير الملفات عبر
الخادم.

## الخدمات

| المسار | الوظيفة |
| --- | --- |
| `GET /api/status` | فحص تشغيل الخدمة |
| `GET /api/categories` | جلب التصنيفات |
| `GET /api/materials` | جلب المواد المنشورة |
| `POST /api/materials` | إنشاء مادة |
| `POST /api/auth/login` | تسجيل الدخول المركزي |
| `PATCH /api/materials/:id/status` | تغيير حالة المادة |
| `DELETE /api/materials/:id` | حذف المادة من PostgreSQL |
| `POST /api/internal/archive-status` | callback داخلي من Worker |

## المتطلبات

- Node.js 20 أو أحدث.
- PostgreSQL (يفضل اتصالًا متوافقًا مع Serverless).
- حساب Vercel.

## الإعداد

```bash
npm install
cp .env.example .env
npm run check
npm run dev
```

طبّق المخطط على قاعدة البيانات:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

المخطط قابل لإعادة التشغيل ويضيف أعمدة دورة حياة الأرشفة باستخدام
`ADD COLUMN IF NOT EXISTS`. لا تضع قيم الأسرار في `schema.sql`.

## متغيرات البيئة

| المتغير | الوظيفة |
| --- | --- |
| `FRONTEND_ORIGIN` | origins المسموح لها بطلب API، مفصولة بفواصل |
| `DATABASE_URL` | اتصال PostgreSQL |
| `IA_ACCESS_KEY` / `IA_SECRET_KEY` | مفاتيح Internet Archive |
| `IA_BUCKET` | معرف عنصر Internet Archive |
| `IA_ENDPOINT` | افتراضيًا `https://s3.us.archive.org` |
| `R2_ACCOUNT_ID` | معرف حساب Cloudflare |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | مفاتيح R2 |
| `R2_BUCKET` | اسم bucket |
| `ARCHIVE_WORKER_URL` | رابط Worker المنتج للرسائل |
| `INTERNAL_CALLBACK_TOKEN` | حماية callback الداخلي |

استخدم [`.env.example`](./.env.example) كقالب فقط. لا تنسخ مفاتيح حقيقية إلى
الملف أو المستودع.

## حفظ روابط الملفات

يرسل نموذج لوحة الإدارة رابطًا عامًا مباشرًا يبدأ بـ `http://` أو `https://`.
للمادة الصوتية يكون الرابط في `audio_url`، وللكتاب يكون رابط PDF في
`document_url`. يمكن استخدام Internet Archive أو Google Drive أو أي خدمة
تخزين توفر رابطًا عامًا قابلًا للوصول من المتصفح. لا يرفع API ملفات ولا يخزن
مفاتيح التخزين.

حالات الأرشفة هي:

```text
UPLOADING -> UPLOADED_TO_R2 -> ARCHIVE_QUEUED -> ARCHIVING -> ARCHIVED
                                                   \-> ARCHIVE_FAILED
```

ملفات Worker موجودة في
[workers/archive-worker](./workers/archive-worker). إعداد Queue وR2 والأسرار
موضح في [OPERATIONS.md](../docs/OPERATIONS.md).

## نشر Vercel

1. اربط هذا المجلد كمشروع Vercel مستقل.
2. أضف متغيرات البيئة في إعدادات Vercel.
3. طبّق `database/schema.sql` على PostgreSQL.
4. انشر:

```bash
npx vercel --prod
```

اختبر النشر:

```bash
curl https://YOUR_PROJECT.vercel.app/api/status
curl https://YOUR_PROJECT.vercel.app/api/categories
curl https://YOUR_PROJECT.vercel.app/api/materials
```

## اختبارات وتشخيص سريع

```bash
npm run check
node --check controllers/content.js
node --check utils/r2.js
node --check workers/archive-worker/src/index.js
```

إذا فشل الاتصال:

1. افحص `/api/status`.
2. راجع `DATABASE_URL` وSSL وقيود اتصال Supabase.
3. افحص CORS و`FRONTEND_ORIGIN`.
4. راجع سجل Vercel بدل الاعتماد على رسالة المتصفح العامة.
5. تحقق من أن الـ Frontend يستخدم `https://dsacms-backend.vercel.app/api`
   وليس `localhost`.

سجل الأسباب والحلول بالتفصيل في
[docs/OPERATIONS.md](../docs/OPERATIONS.md).
