-- 1. إنشاء حاوية التخزين للمرفقات
-- هذه الحاوية ستُستخدم لتخزين الصور والفيديوهات الخاصة ببلاغات الصيانة.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING; -- لتجنب حدوث خطأ إذا كانت الحاوية موجودة بالفعل

-- 2. إعداد سياسات الأمان للحاوية

-- السياسة الأولى: السماح للجميع بقراءة الملفات (عرضها)
-- هذا يسمح لأي شخص لديه الرابط المباشر للملف بمشاهدته.
DROP POLICY IF EXISTS "Allow public read access to attachments" ON storage.objects;
CREATE POLICY "Allow public read access to attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ticket-attachments' );

-- السياسة الثانية: السماح للمستخدمين المسجلين برفع الملفات
-- هذا يضمن أن الموظفين والمهندسين فقط هم من يمكنهم إضافة ملفات جديدة.
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ticket-attachments' );

-- السياسة الثالثة: السماح للمستخدمين المسجلين بتحديث الملفات
DROP POLICY IF EXISTS "Allow authenticated users to update attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to update attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'ticket-attachments' );

-- السياسة الرابعة: السماح للمستخدمين المسجلين بحذف الملفات
DROP POLICY IF EXISTS "Allow authenticated users to delete attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'ticket-attachments' );