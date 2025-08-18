-- إضافة سياسة أمان جديدة للسماح للمستخدمين المسجلين بحذف الأعطال
-- هذه السياسة ضرورية لتمكين وظيفة الحذف في صفحة متابعة الأعطال.
CREATE POLICY "Authenticated users can delete tickets"
ON public.tickets
FOR DELETE
TO authenticated
USING (true);