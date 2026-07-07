"use client";

interface Vehicle {
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    ownerName: string;
    ownerPhone?: string;
    type: string;
}

interface CaseVehiclesProps {
    vehicles?: Vehicle[];
    isLoading?: boolean;
}

export function CaseVehicles({ vehicles = [], isLoading }: CaseVehiclesProps) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">المركبات</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">المركبات</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{vehicles.length} مركبة</span>
            </div>

            {vehicles.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">لا توجد مركبات مسجلة</p>
            ) : (
                <div className="space-y-3">
                    {vehicles.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                            {/* Vehicle Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {vehicle.plateNumber}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        {vehicle.type}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {vehicle.make} {vehicle.model} - {vehicle.year} - {vehicle.color}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    المالك: {vehicle.ownerName}
                                    {vehicle.ownerPhone && ` | هاتف: ${vehicle.ownerPhone}`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}