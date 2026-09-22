# DSACMS Backend API

خدمة REST مستقلة لنظام مكتبة الشيخ محمد أحمد الهادي الكرار. تعمل على Vercel
وتستخدم Express وPostgreSQL، وتوفر طبقة التحكم والبيانات الوصفية. تُحفظ روابط
الملفات الخارجية مباشرة في `audio_url` و`document_url` دون تمرير الملفات عبر
الخادم.

## الهندسة المعمارية الجديدة (Link-Based Architecture)

يعتمد النظام الآن على تخزين المحتوى خارج Vercel (Storage Offloading) بدلاً من
رفع الملفات الكبيرة عبر Serverless Functions. تستقبل لوحة الإدارة رابطاً
عاماً مباشراً إلى الملف، ثم يحفظ الـ Backend الرابط والبيانات الوصفية فقط في
PostgreSQL:

- يمكن استضافة الصوت وPDF في Google Drive أو Internet Archive أو أي خدمة توفر
  رابطاً عاماً ثابتاً.
- يستخدم `audio_url` للصوت و`document_url` للكتب والملفات.
- لا يمر محتوى الملف عبر Vercel، مما يتجنب حد الطلب البالغ 4.5MB ويخفف زمن
  التنفيذ واستهلاك الذاكرة.
- يبقى Worker الأرشفة مسؤولاً عن النسخ الاختياري إلى R2/Internet Archive
  وتحديث `archive_status` عبر callback محمي، بينما يظل الرابط الأصلي متاحاً
  للعرض والتنزيل.

### وحدة الأسئلة والفتاوى (Q&A Module)

تدعم الوحدة دورة السؤال الكاملة:

1. يرسل الزائر سؤالاً اختيارياً مع اسم، ويحفظ بحالة `PENDING`.
2. يمنع حقل Honeypot الطلبات الآلية، ويحد المعدل بسؤالين لكل عنوان IP خلال
   خمس دقائق.
3. لا يعرض API العام إلا الأسئلة ذات الحالة `ANSWERED`.
4. يستطيع المستخدم ذو الدور `SHEIKH` عرض المعلّق، نشر الإجابة، رفض السؤال،
   تعديل الإجابات المنشورة، وحذف أي سؤال نهائيًا عبر `DELETE`.

تستخدم مسارات الشيخ توكن جلسة موقّعاً بـ `AUTH_SECRET` مع
`requireAuth` و`requireRole("SHEIKH")`. لا تُحفظ كلمات المرور في الواجهة أو
في المستودع، وتُخزن في قاعدة البيانات كقيم مشتقة باستخدام scrypt.

## الخدمات

| المسار | الوظيفة |
| --- | --- |
| `GET /api/status` | فحص تشغيل الخدمة |
| `GET /api/categories` | جلب التصنيفات |
| `GET /api/materials` | جلب المواد المنشورة |
| `POST /api/materials` | إنشاء مادة |
| `POST /api/auth/login` | تسجيل الدخول المركزي |
| `GET /api/questions` | عرض الأسئلة المجاب عنها فقط |
| `POST /api/questions` | إرسال سؤال عام محمي بـ Honeypot وRate Limit |
| `GET /api/questions/sheikh/pending` | أسئلة معلقة للشيخ فقط |
| `GET /api/questions/sheikh/answered` | أرشيف الإجابات للشيخ فقط |
| `PATCH /api/questions/sheikh/:id/answer` | نشر إجابة جديدة للشيخ فقط |
| `PATCH /api/questions/sheikh/:id/edit` | تعديل إجابة منشورة للشيخ فقط |
| `PATCH /api/questions/sheikh/:id/reject` | رفض سؤال معلق للشيخ فقط |
| `DELETE /api/questions/sheikh/:id` | حذف سؤال نهائيًا (مجاب أو معلّق) للشيخ فقط |
| `PATCH /api/materials/:id/status` | تغيير حالة المادة |
| `DELETE /api/materials/:id` | حذف المادة من PostgreSQL |
| `POST /api/internal/archive-status` | callback داخلي من Worker |
## 🛠️ الصيانة والأتمتة (Automation)

- **Supabase Keep-Alive:** تم إضافة خدمة أتمتة عبر GitHub Actions (`.github/workflows/keep_alive.yml`) تعمل تلقائياً كل 3 أيام لإرسال استعلام خفيف لقاعدة بيانات Supabase لتفادي إيقاف المشروع تلقائياً (Auto-pause) في الخطة المجانية.
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

المخطط قابل لإعادة التشغيل ويضيف جدول `questions` ودور `SHEIKH` وقيود الحالة
باستخدام أوامر آمنة لإعادة التشغيل. نشر Vercel للكود لا ينفذ SQL تلقائياً،
لذلك يجب تطبيق المخطط على قاعدة الإنتاج بعد كل تغيير في قاعدة البيانات. لا
تضع قيم الأسرار في `schema.sql`.

## متغيرات البيئة

| المتغير | الوظيفة |
| --- | --- |
| `FRONTEND_ORIGIN` | origins المسموح لها بطلب API، مفصولة بفواصل |
| `DATABASE_URL` | اتصال PostgreSQL |
| `AUTH_SECRET` | سر توقيع توكنات الجلسات (مطلوب في الإنتاج) |
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

## سجل الأخطاء والحلول (Troubleshooting & Fixes)

### تجاوز حجم الطلبات في Vercel

**المشكلة:** كان رفع الصوت وPDF يمر عبر دالة Vercel، فتفشل الطلبات الكبيرة
عند تجاوز حد Serverless Function البالغ 4.5MB أو عند طول زمن التنفيذ.

**الحل:** أُلغي الرفع المباشر من الـ API، وأصبح النظام Link-Based. يحفظ
الخادم روابط Google Drive أو Internet Archive العامة فقط، مع إبقاء الأرشفة
اختيارية عبر Worker منفصل.

### خطأ Supabase: `relation "users" does not exist`

**المشكلة:** كانت بعض عمليات إنشاء الجداول التابعة أو قيود Foreign Key تُنفذ
قبل وجود جدول `users`، أو كان الاتصال يشير إلى قاعدة لا تحتوي على المخطط
المطلوب.

**الحل:** رُتّب المخطط بحيث تُنشأ الجداول الأساسية أولاً، وبالأخص `users`،
ثم يُنشأ `questions` الذي يعتمد على `users(id)`. يجب تنفيذ
`database/schema.sql` على قاعدة الإنتاج نفسها، لأن نشر Vercel لا ينفذ SQL
تلقائياً. تحقق من `DATABASE_URL` ومن وجود الجداول قبل إعادة النشر.

### تفعيل حماية RLS في Supabase

**المشكلة:** عند تفعيل Row Level Security أصبحت استعلامات العميل المباشر
مرفوضة إذا لم توجد سياسات مناسبة، وكان الاعتماد على واجهة العميل يؤدي إلى
تسريب منطق الصلاحيات أو إلى أخطاء صلاحيات غير واضحة.

**الحل:** تُنفذ عمليات PostgreSQL من Backend فقط عبر اتصال خادمي مضبوط في
`DATABASE_URL`، ولا تُعرض بيانات اعتماد قاعدة البيانات للمتصفح. يجب إنشاء
سياسات RLS صريحة لأي وصول عبر Supabase REST/anon، واستخدام دور خادمي محدود
الصلاحيات أو مفتاح Service Role في بيئة الخادم فقط عند الحاجة؛ الاتصال
الخادمي ليس بديلاً عن السياسات ولا يبرر تعطيل RLS. اختبر القراءة العامة
والكتابة المحمية كل واحدة على حدة بعد تفعيل RLS.

### فقدان الجداول أو المواد بعد تغيير الاتصال

**المشكلة:** ظهور `relation does not exist` أو قوائم مواد فارغة بعد تعديل
متغيرات Vercel لا يعني أن Q&A حذف البيانات. غالباً يكون `DATABASE_URL`
مشيراً إلى مشروع أو قاعدة مختلفة.

**الحل:** افحص `current_database()` و`current_user` ووجود
`categories`, `materials`, `users`, و`questions` في القاعدة الفعلية. خذ
نسخة احتياطية قبل أي ترحيل، ثم أعد ربط Vercel بالقاعدة التي تحتوي البيانات
أو استورد الجداول والبيانات من نسخة احتياطية. لا تستخدم `DROP` أو `TRUNCATE`
لإصلاح المشكلة.

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
4. أنشئ حساب الشيخ بدور `SHEIKH` عبر مسار المستخدمين أو SQL آمن.
5. انشر:

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
