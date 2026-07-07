"use client";
/**
 * Cases Module Layout
 * Provides the structure for the Case Management UI within the NSSCP dashboard.
 */
export default function CasesLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {children}
        </div>
    );
}