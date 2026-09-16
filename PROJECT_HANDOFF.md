# DSACMS Project Handoff

هذا الملف هو وثيقة تسليم شاملة لنظام DSACMS حتى يستطيع مطور أو نموذج آخر
فهم المشروع ومتابعة العمل دون الاعتماد على سجل المحادثة.

> **تنبيه أمني:** لا توجد كلمات مرور أو مفاتيح API أو قيم `DATABASE_URL` حقيقية
> في هذا الملف. يجب أخذ القيم من Vercel/Supabase أو مدير الأسرار فقط.

## 1. روابط المشروع

### GitHub

- [مستودع Backend](https://github.com/amarnasir632-bit/DSACMS-Backend)
- [مستودع Frontend](https://github.com/amarnasir632-bit/DSACMS-Frontend)
- [تاريخ Backend](https://github.com/amarnasir632-bit/DSACMS-Backend/commits/main)
- [تاريخ Frontend](https://github.com/amarnasir632-bit/DSACMS-Frontend/commits/main)

### النشر

- [واجهة الموقع](https://dsacms-frontend.vercel.app)
- [صفحة الأسئلة والفتاوى](https://dsacms-frontend.vercel.app/pages/questions.html)
- [Backend API](https://dsacms-backend.vercel.app)
- [فحص حالة Backend](https://dsacms-backend.vercel.app/api/status)
- [صفحة إعدادات متغيرات Vercel](https://vercel.com/ammar-e232/dsacms-backend/settings/environment-variables)

### قاعدة البيانات

- [مشروع Supabase](https://supabase.com/dashboard/project/qhjlptuomqoxlmgixhdg)
- [SQL Editor](https://supabase.com/dashboard/project/qhjlptuomqoxlmgixhdg/sql)
- [إعدادات قاعدة البيانات](https://supabase.com/dashboard/project/qhjlptuomqoxlmgixhdg/database/settings)

## 2. حالة المستودعات عند كتابة الوثيقة

### Backend

- المستودع: `DSACMS-Backend`
- الفرع الرئيسي: `main`
- آخر توثيق منشور: `27fbfb2 docs: document new backend architecture and fixes`
- commit وحدة Q&A: `701fd5c feat: add protected Sheikh Q&A API`
- ملف التشغيل الرئيسي: [`api/index.js`](./api/index.js)
- ملف المخطط: [`database/schema.sql`](./database/schema.sql)

### Frontend

- المستودع: `DSACMS-Frontend`
- الفرع الرئيسي: `main`
- آخر commit معروف في جلسة التطوير: `41be462 feat: add public questions and Sheikh workflow`
- الملف المركزي: [`assets/js/main.js`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/assets/js/main.js)
- لوحة الإدارة: [`pages/dashboard.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/dashboard.html)
- الأسئلة العامة: [`pages/questions.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/questions.html)

يجب التأكد دائماً أن Vercel ينشر الفرع والcommit المتوقعين من كل مستودع؛
اختلاف commit بين Frontend وBackend قد يجعل الواجهة تستدعي API غير موجود أو
تعرض نسخة قديمة من JavaScript بسبب التخزين المؤقت.

## 3. وظيفة النظام

DSACMS منصة عربية لمكتبة الشيخ محمد أحمد الهادي الكرار، وتدعم:

- المواد الصوتية.
- المقالات العربية.
- الكتب وملفات PDF.
- البحث والتصنيف.
- لوحة إدارة للمحتوى والمستخدمين.
- روابط وسائط مباشرة بدلاً من رفع الملفات عبر Vercel.
- أدوات قراءة مناسبة لكبار السن.
- مشاركة المادة ونسخ محتواها.
- وحدة الأسئلة والفتاوى.
- صلاحيات المستخدمين ودور الشيخ `SHEIKH`.

## 4. البنية المعمارية

```text
المتصفح
  |
  | HTTPS / JSON / Authorization: Bearer <token>
  v
Frontend على Vercel
  |
  | /api/*
  v
Backend Express على Vercel
  |
  +--> PostgreSQL / Supabase
  |
  +--> روابط Google Drive أو Internet Archive
  |
  +--> Worker اختياري للأرشفة إلى R2 أو Internet Archive
```

### Backend

Backend هو REST API مستقل مبني باستخدام:

- Node.js 20 أو أحدث.
- Express 5.
- PostgreSQL عبر حزمة `pg`.
- Vercel Serverless deployment.
- CORS مضبوط على `FRONTEND_ORIGIN`.
- جلسات موقعة HMAC باستخدام `AUTH_SECRET`.

نقطة الدخول:

- [`api/index.js`](./api/index.js): إنشاء Express، CORS، JSON parser،
  تسجيل المسارات، ومعالج الأخطاء.

الاتصال بقاعدة البيانات:

- [`config/database.js`](./config/database.js): إنشاء Pool PostgreSQL
  وتطبيع اتصال Supabase/SSL.

### Frontend

الواجهة HTML/CSS/JavaScript بدون إطار إلزامي:

- [`assets/js/main.js`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/assets/js/main.js):
  API client، المصادقة، لوحة الإدارة، عرض المواد والأسئلة، أدوات القراءة
  والمشاركة.
- [`assets/css/style.css`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/assets/css/style.css):
  RTL، التصميم المتجاوب، التحكم في الخط والمسافات، وبطاقات الهاتف.
- [`pages/content-detail.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/content-detail.html):
  قراءة المقال وتشغيل الصوت وعرض PDF.
- [`pages/dashboard.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/dashboard.html):
  إدارة المواد والتصنيفات والمستخدمين ووحدة الشيخ.
- [`pages/questions.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/questions.html):
  إرسال الأسئلة وعرض الإجابات المنشورة.

## 5. Link-Based Architecture وتخفيف الحمل

### سبب التصميم

رفع الصوت أو PDF من المتصفح إلى Vercel ثم إلى خدمة تخزين خارجية يستهلك
ذاكرة ووقت Serverless Function، وقد يفشل عند تجاوز حد الطلب التقريبي
4.5MB في Vercel.

### التصميم الحالي

1. يرفع مدير المحتوى الملف إلى Google Drive أو Internet Archive خارج النظام.
2. يأخذ رابطاً عاماً مباشراً.
3. يرسل الرابط إلى `POST /api/materials`.
4. يتحقق Backend من أن الرابط يستخدم `http` أو `https`.
5. تحفظ قاعدة البيانات الرابط فقط:
   - `audio_url` للصوت.
   - `document_url` للكتاب/PDF.
6. يستعمل المتصفح الرابط للعرض أو المشغل أو التنزيل.

لا يضع المشروع ملفات كبيرة أو مفاتيح التخزين داخل GitHub أو `localStorage`.

### الأرشفة الاختيارية

يوجد مسار callback داخلي:

```text
POST /api/internal/archive-status
```

يحميه `INTERNAL_CALLBACK_TOKEN` ويحدث:

- `archive_status`
- `archive_url`
- `archive_last_error`
- `archive_updated_at`

حالات الأرشفة:

```text
UPLOADING
UPLOADED_TO_R2
ARCHIVE_QUEUED
ARCHIVING
ARCHIVED
ARCHIVE_FAILED
```

## 6. مخطط قاعدة البيانات

المرجع الأساسي هو [`database/schema.sql`](./database/schema.sql).

### `categories`

```text
id BIGSERIAL PRIMARY KEY
name VARCHAR(150) UNIQUE NOT NULL
description TEXT
created_at TIMESTAMPTZ
```

### `materials`

```text
id BIGSERIAL PRIMARY KEY
title VARCHAR(255) NOT NULL
description TEXT
author VARCHAR(255)
category_id BIGINT -> categories(id)
audio_url TEXT
document_url TEXT
content_type VARCHAR(20): audio | article | book
body JSONB
keywords JSONB
duration_seconds INTEGER
status VARCHAR(20): published | draft | archived
storage_key TEXT
archive_status VARCHAR(30)
archive_url TEXT
archive_attempts INTEGER
archive_last_error TEXT
archive_updated_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### `users`

```text
id BIGSERIAL PRIMARY KEY
username VARCHAR(100) UNIQUE NOT NULL
password_hash TEXT NOT NULL
role VARCHAR(30)
created_at TIMESTAMPTZ
```

الأدوار:

```text
admin
manager
viewer
SHEIKH
```

### `questions`

```text
id BIGSERIAL PRIMARY KEY
asker_name VARCHAR(255)
question_text TEXT NOT NULL
answer_text TEXT
status VARCHAR(20): PENDING | ANSWERED | REJECTED
sheikh_id BIGINT -> users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

الفهرس الأساسي:

```text
questions_status_created_at_idx(status, created_at DESC)
```

### ملاحظة مهمة عن migrations

`CREATE TABLE IF NOT EXISTS` لا يضيف الأعمدة الناقصة إلى جدول موجود مسبقاً.
عند ترقية قاعدة قديمة يجب التأكد من وجود كل أعمدة `materials`، وليس أعمدة
الأرشفة فقط. لا تستخدم `DROP TABLE` أو `TRUNCATE` أثناء الاستعادة.

## 7. API الكامل

جميع المسارات تبدأ بـ:

```text
https://dsacms-backend.vercel.app/api
```

### الحالة

```http
GET /status
```

يعيد حالة الخدمة والبيئة والوقت.

### التصنيفات

```http
GET    /categories
POST   /categories
DELETE /categories/:id
```

### المواد

```http
GET   /materials
POST  /materials
PUT   /materials/:id
PATCH /materials/:id/status
DELETE /materials/:id
```

حقول الإنشاء والتحديث الرئيسية:

```json
{
  "title": "عنوان المادة",
  "description": "الوصف",
  "author": "المؤلف",
  "categoryId": 1,
  "audioUrl": "https://example.com/audio.mp3",
  "documentUrl": null,
  "contentType": "audio",
  "body": [],
  "keywords": ["كلمة"],
  "durationSeconds": 0,
  "status": "published"
}
```

### التنزيل

```http
GET /download?url=https://example.com/file.pdf
```

يتحقق Backend من رابط HTTP/HTTPS عام، يجلب الملف، ويعيده بعناوين تنزيل.
لا يسمح بروابط تحتوي على username أو password.

### المصادقة والمستخدمون

```http
POST   /auth/login
GET    /auth/users
POST   /auth/users
DELETE /auth/users/:id
```

استجابة تسجيل الدخول تحتوي على:

```json
{
  "user": {
    "id": "1",
    "username": "sheikh",
    "role": "SHEIKH"
  },
  "token": "<session-token>"
}
```

### الأسئلة العامة

```http
GET  /questions
POST /questions
```

`GET /questions` يعرض `ANSWERED` فقط.

`POST /questions` يقبل:

```json
{
  "asker_name": "فاعل خير",
  "question_text": "نص السؤال",
  "website_url": ""
}
```

قواعد الحماية:

- `website_url` غير الفارغ يرفض الطلب كرسالة Spam.
- الحد الحالي سؤالان لكل IP خلال خمس دقائق.
- السؤال الجديد يحفظ `PENDING`.

### مسارات الشيخ

كل المسارات التالية تحتاج:

```http
Authorization: Bearer <token>
```

ويجب أن يكون `role` داخل التوكن مساوياً لـ `SHEIKH`.

```http
GET   /questions/sheikh/pending
GET   /questions/sheikh/answered
PATCH /questions/sheikh/:id/answer
PATCH /questions/sheikh/:id/edit
PATCH /questions/sheikh/:id/reject
```

النتائج المتوقعة:

- بدون توكن: `401`.
- بتوكن صحيح لدور آخر: `403`.
- الشيخ يستطيع الإجابة أو التعديل أو الرفض.

## 8. المصادقة والصلاحيات

الملف:

- [`middleware/auth.js`](./middleware/auth.js)

آلية التوكن الحالية HMAC-SHA256 مبسطة:

1. يصنع Backend Header وPayload.
2. يضع `sub`, `username`, `role`, و`exp`.
3. يوقع `header.payload` بواسطة `AUTH_SECRET`.
4. يتحقق Middleware من التوقيع والانتهاء.

مدة التوكن الحالية 12 ساعة.

`requireAuth` يتحقق من Header:

```text
Authorization: Bearer <token>
```

`requireRole("SHEIKH")` يمنع أي دور آخر.

### تحذير متعلق بمسارات المستخدمين

مسارات `/auth/users` تحتاج مراجعة إضافية قبل الإنتاج للتأكد من حمايتها
بدور مدير مناسب؛ حماية مسارات Q&A الخاصة بالشيخ مطبقة بالفعل.

## 9. متغيرات البيئة

لا تحفظ القيم الحقيقية في README أو GitHub.

| المتغير | الاستخدام |
|---|---|
| `NODE_ENV` | `production` في النشر |
| `PORT` | منفذ التشغيل المحلي |
| `FRONTEND_ORIGIN` | أصل الواجهة المسموح به عبر CORS |
| `DATABASE_URL` | اتصال PostgreSQL/Supabase |
| `AUTH_SECRET` | توقيع جلسات JWT/HMAC |
| `IA_ACCESS_KEY` | مفتاح Internet Archive |
| `IA_SECRET_KEY` | السر السري لـ Internet Archive |
| `IA_BUCKET` | معرف عنصر الأرشيف |
| `IA_ENDPOINT` | نقطة Internet Archive S3 |
| `R2_ACCOUNT_ID` | حساب Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | مفتاح R2 |
| `R2_SECRET_ACCESS_KEY` | سر R2 |
| `R2_BUCKET` | bucket الأرشفة |
| `ARCHIVE_WORKER_URL` | عنوان Worker الأرشفة |
| `INTERNAL_CALLBACK_TOKEN` | حماية callback الداخلي |

القالب المحلي:

- [`.env.example`](./.env.example)

## 10. تشغيل Backend محلياً

```bash
cd backend
npm install
cp .env.example .env
# عدّل .env بقيم محلية حقيقية خارج Git
npm run check
npm run dev
```

تطبيق المخطط:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

فحوص syntax:

```bash
npm run check
node --check controllers/auth.js
node --check controllers/content.js
node --check controllers/questions.js
node --check middleware/auth.js
node --check routes/questions.js
```

## 11. تشغيل Frontend محلياً

```bash
cd DSACMS-Frontend
python3 -m http.server 5500
```

افتح:

```text
http://localhost:5500
```

عند تشغيل Backend محلياً يجب أن تشير `fetchApi` إلى:

```text
http://localhost:3000/api
```

وعند الإنتاج:

```text
https://dsacms-backend.vercel.app/api
```

## 12. واجهة المستخدم والميزات

### القراءة

- تكبير وتصغير الخط.
- التحكم في تباعد السطور.
- إعدادات مناسبة لكبار السن.
- حفظ التفضيلات لكل مادة.
- التفاف النص العربي داخل الإطار.
- تقسيم الأسطر إلى فقرات.

### المحتوى

- تمييز audio/article/book.
- مشغل صوت للصوتيات.
- PDF للكتب.
- نص المقالات داخل قارئ منسق.
- نسخ المحتوى بضغطة واحدة.
- مشاركة WhatsApp والنص والرابط.
- إنشاء صورة مشاركة للمادة.
- أزرار انتقال أعلى وأسفل الصفحة.

### لوحة الإدارة

- إدارة المواد.
- إدارة التصنيفات.
- تغيير حالة المادة.
- حذف المادة من PostgreSQL.
- إدارة المستخدمين.
- تبويب الأسئلة والفتاوى للشيخ.

## 13. المشاكل التي ظهرت وحلولها

### مشكلة حد Vercel

تم حلها بإلغاء تمرير الملفات الكبيرة عبر Vercel وحفظ الروابط المباشرة فقط.

### `relation "users" does not exist`

يحدث عند تنفيذ جدول تابع قبل `users` أو عند الاتصال بقاعدة مختلفة. يجب إنشاء
`users` قبل `questions`، وتطبيق المخطط على قاعدة الإنتاج الصحيحة.

### RLS في Supabase

الاتصال الخادمي لا يجعل RLS غير مهم. يجب:

1. إبقاء RLS مفعلاً عند الحاجة.
2. عدم كشف Service Role أو `DATABASE_URL` للمتصفح.
3. إنشاء سياسات واضحة للوصول عبر REST/anon.
4. تنفيذ عمليات التطبيق الحساسة من Backend.

### اختفاء المواد والفئات

لا يوجد في commit Q&A أمر `DROP`, `TRUNCATE`, أو `DELETE` للجداول القديمة.
الاحتمال الأقوى هو تغيير `DATABASE_URL` إلى قاعدة أخرى أو قاعدة ناقصة.

فحوص التشخيص:

```sql
SELECT current_database(), current_user, current_schema();

SELECT to_regclass('public.categories');
SELECT to_regclass('public.materials');
SELECT to_regclass('public.users');
SELECT to_regclass('public.questions');

SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM materials;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM questions;
```

### فرق schema القديم والجديد

إذا كان `materials` موجوداً من نسخة قديمة، فإن `CREATE TABLE IF NOT EXISTS`
لا يضيف تلقائياً كل الأعمدة الجديدة. يجب تنفيذ `ALTER TABLE ... ADD COLUMN IF
NOT EXISTS` لكل عمود مطلوب، بعد أخذ نسخة احتياطية وفحص البيانات.

## 14. استعادة قاعدة البيانات بدون فقد بيانات

الترتيب الآمن:

1. لا تشغل `DROP TABLE` أو `TRUNCATE`.
2. خذ نسخة احتياطية:

   ```bash
   pg_dump "$DATABASE_URL_CURRENT" --format=custom \
     --file=dsacms-current-backup.dump
   ```

3. افحص قاعدة الإنتاج والجداول وعدد السجلات.
4. ابحث عن `DATABASE_URL` القديمة أو Backup Supabase.
5. اختبر القاعدة القديمة قبل تغيير Vercel.
6. صدّر الجداول القديمة فقط إذا كانت هي الصحيحة:

   ```bash
   pg_dump "$DATABASE_URL_OLD" --format=custom --no-owner \
     --no-privileges --table=public.categories \
     --table=public.materials --table=public.users \
     --file=dsacms-content.dump
   ```

7. استورد بعد مراجعة الهدف:

   ```bash
   pg_restore --no-owner --no-privileges \
     --dbname="$DATABASE_URL_CURRENT" dsacms-content.dump
   ```

8. تأكد من وجود `questions` وعدم استبدالها ببيانات قديمة.
9. حدّث `DATABASE_URL` في Vercel فقط بعد التأكد.
10. أعد النشر واختبر API.

`schema.sql` يعيد البنية، لكنه لا يعيد سجلات المواد المفقودة. الاستعادة
تحتاج قاعدة قديمة أو Backup أو dump.

## 15. اختبار النشر

```bash
curl -i https://dsacms-backend.vercel.app/api/status
curl -i https://dsacms-backend.vercel.app/api/categories
curl -i https://dsacms-backend.vercel.app/api/materials
curl -i https://dsacms-backend.vercel.app/api/questions
```

اختبار Honeypot:

```bash
curl -i -X POST https://dsacms-backend.vercel.app/api/questions \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"سؤال اختبار","website_url":"bot"}'
```

المتوقع: `400`.

اختبار حماية الشيخ بدون توكن:

```bash
curl -i https://dsacms-backend.vercel.app/api/questions/sheikh/pending
```

المتوقع: `401`.

## 16. إرشادات للمطور أو النموذج التالي

قبل تعديل الكود:

1. اقرأ هذا الملف كاملاً.
2. اقرأ `README.md` و[`database/schema.sql`](./database/schema.sql).
3. افحص `git status` ولا تحذف تغييرات المستخدم.
4. افحص commit الحالي في المستودعين.
5. لا تستخدم أسراراً من المحادثة أو تضعها في الملفات.
6. لا تغير `DATABASE_URL` أو قاعدة الإنتاج دون Backup.
7. عند تغيير schema، أضف Migration غير تدميرية.
8. افصل إصلاح Backend عن Frontend في commits واضحة.
9. شغّل `npm run check` و`git diff --check`.
10. اختبر API العام والمصادق عليه بعد كل تغيير.

## 17. قائمة التحقق قبل الإنتاج

- [ ] `DATABASE_URL` تشير إلى قاعدة تحتوي الجداول والبيانات الصحيحة.
- [ ] تم أخذ Backup حديث.
- [ ] `AUTH_SECRET` قوي وموجود في Vercel فقط.
- [ ] كلمة مرور قاعدة البيانات لم تُرفع إلى GitHub.
- [ ] `FRONTEND_ORIGIN` مضبوط على الواجهة الصحيحة.
- [ ] جدول `users` موجود وحساب المدير يعمل.
- [ ] حساب الشيخ موجود بدور `SHEIKH`.
- [ ] جدول `questions` موجود وفهرسه موجود.
- [ ] `/api/materials` يرجع المواد.
- [ ] `/api/categories` يرجع التصنيفات.
- [ ] `/api/questions` يعرض `ANSWERED` فقط.
- [ ] مسارات الشيخ تعيد `401` بدون توكن و`403` للأدوار الأخرى.
- [ ] Worker وcallback محميان إذا كانت الأرشفة مفعلة.
- [ ] تم تدوير كلمات المرور التي تم تداولها أثناء التشخيص.

## 18. ملفات مرجعية مهمة

### Backend

- [`README.md`](./README.md)
- [`api/index.js`](./api/index.js)
- [`controllers/auth.js`](./controllers/auth.js)
- [`controllers/content.js`](./controllers/content.js)
- [`controllers/questions.js`](./controllers/questions.js)
- [`middleware/auth.js`](./middleware/auth.js)
- [`routes/auth.js`](./routes/auth.js)
- [`routes/content.js`](./routes/content.js)
- [`routes/questions.js`](./routes/questions.js)
- [`database/schema.sql`](./database/schema.sql)
- [`package.json`](./package.json)

### Frontend

- [`main.js`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/assets/js/main.js)
- [`style.css`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/assets/css/style.css)
- [`questions.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/questions.html)
- [`dashboard.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/dashboard.html)
- [`content-detail.html`](https://github.com/amarnasir632-bit/DSACMS-Frontend/blob/main/pages/content-detail.html)

---

آخر تحديث لهذه الوثيقة: 2026-09-16
