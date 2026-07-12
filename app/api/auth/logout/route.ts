import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeSession } from '@/lib/auth/session-manager';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('nsscp_session')?.value;

        if (sessionToken) {
            await revokeSession(sessionToken);
        }

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
