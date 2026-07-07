"use client";

interface Person {
    id: string;
    firstName: string;
    lastName: string;
    role: 'suspect' | 'victim' | 'witness' | 'officer' | 'other';
    identificationNumber?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

interface CasePersonsProps {
    persons?: Person[];
    isLoading?: boolean;
}

const PERSON_ROLE_LABELS: Record<string, string> = {
    suspect: 'مشتبه به',
    victim: 'ضحية',
    witness: 'شاهد',
    officer: 'ضابط',
    other: 'آخر',
};

const PERSON_ROLE_COLORS: Record<string, string> = {
    suspect: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    victim: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    witness: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    officer: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    other: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

export function CasePersons({ persons = [], isLoading }: CasePersonsProps) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الأشخاص</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    const grouped = persons.reduce((acc, person) => {
        if (!acc[person.role]) acc[person.role] = [];
        acc[person.role].push(person);
        return acc;
    }, {} as Record<string, Person[]>);

    const roleOrder = ['suspect', 'victim', 'witness', 'officer', 'other'];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">الأشخاص</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{persons.length} شخص</span>
            </div>

            {persons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">لا يوجد أشخاص مسجلين</p>
            ) : (
                <div className="space-y-4">
                    {roleOrder.map((role) => {
                        const items = grouped[role];
                        if (!items || items.length === 0) return null;
                        return (
                            <div key={role}>
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    {PERSON_ROLE_LABELS[role]} ({items.length})
                                </h4>
                                <div className="space-y-2">
                                    {items.map((person) => (
                                        <div
                                            key={person.id}
                                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium">
                                                {person.firstName[0]}{person.lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {person.firstName} {person.lastName}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${PERSON_ROLE_COLORS[person.role]}`}>
                                                        {PERSON_ROLE_LABELS[person.role]}
                                                    </span>
                                                </div>
                                                {person.identificationNumber && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        رقم الهوية: {person.identificationNumber}
                                                    </p>
                                                )}
                                                {person.phone && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        هاتف: {person.phone}
                                                    </p>
                                                )}
                                                {person.notes && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                                        {person.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}