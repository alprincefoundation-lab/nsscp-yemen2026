import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'NSSCP | مركز القيادة والسيطرة',
    description: 'Central Security Command Center - NSSCP Sovereign Operations Portal',
};

export default function CommandCenterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
