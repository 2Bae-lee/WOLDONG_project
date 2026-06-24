const padTimePart = (value: number) => String(value).padStart(2, '0');

export const formatScheduleTimeInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) return digits;
    if (digits.length === 3) return `${digits.slice(0, 1)}:${digits.slice(1)}`;

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const normalizeScheduleTimeInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (!digits) return '00:00';

    const hourText = digits.length <= 2
        ? digits
        : digits.length === 3
            ? digits.slice(0, 1)
            : digits.slice(0, 2);
    const minuteText = digits.length <= 2
        ? '0'
        : digits.length === 3
            ? digits.slice(1)
            : digits.slice(2);

    const hour = Math.min(Math.max(Number(hourText) || 0, 0), 23);
    const minute = Math.min(Math.max(Number(minuteText) || 0, 0), 59);

    return `${padTimePart(hour)}:${padTimePart(minute)}`;
};
