"use client";

interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    uploadedAt: string;
    uploadedBy: string;
}

interface CaseAttachmentsProps {
    caseId: string;
    attachments?: Attachment[];
    isLoading?: boolean;
}

const ATTACHMENT_ICONS: Record<string, string> = {
    image: '🖼',
    pdf: '📄',
    word: '📝',
    excel: '📊',
    video: '🎥',
    audio: '🎵',
    other: '📎',
};

function getAttachmentType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CaseAttachments({ caseId, attachments = [], isLoading }: CaseAttachmentsProps) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">المرفقات</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    // Group attachments by type
    const grouped = attachments.reduce((acc, attachment) => {
        const type = getAttachmentType(attachment.type);
        if (!acc[type]) acc[type] = [];
        acc[type].push(attachment);
        return acc;
    }, {} as Record<string, Attachment[]>);

    const order = ['image', 'pdf', 'word', 'excel', 'video', 'audio', 'other'];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    المرفقات
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {attachments.length} ملف
                </span>
            </div>

            {attachments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    لا توجد مرفقات
                </p>
            ) : (
                <div className="space-y-4">
                    {order.map((type) => {
                        const items = grouped[type];
                        if (!items || items.length === 0) return null;
                        return (
                            <div key={type}>
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
                                    {ATTACHMENT_ICONS[type]} {type === 'image' ? 'صور' :
                                        type === 'pdf' ? 'مستندات PDF' :
                                            type === 'word' ? 'مستندات Word' :
                                                type === 'excel' ? 'جداول Excel' :
                                                    type === 'video' ? 'فيديو' :
                                                        type === 'audio' ? 'صوتيات' : 'أخرى'}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {items.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                        >
                                            <span className="text-lg">
                                                {ATTACHMENT_ICONS[type] || '📎'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-white truncate">
                                                    {attachment.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(attachment.size)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload placeholder - integrates with existing upload API */}
            <button className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
                + إضافة مرفق
            </button>
        </div>
    );
}