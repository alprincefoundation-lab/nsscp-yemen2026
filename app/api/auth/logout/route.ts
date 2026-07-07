import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        /**
         * محو الكوكيز عند تسجيل الخروج — نفس إعدادات الأمان المستخدمة
         * عند إنشاء الكوكيز لضمان إزالتها بشكل صحيح
         */
        cookieStore.set('nsscp_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الخروج' }, { status: 500 });
    }
}