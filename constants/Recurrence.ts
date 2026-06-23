export type RepeatOption = 'none' | 'weekdays' | 'weekends' | 'weekly' | 'custom';

export type RepeatDate = {
    year: number;
    month: number;
    day: number;
};

export const repeatOptions: { value: RepeatOption; label: string; description: string }[] = [
    { value: 'none', label: '반복 안 함', description: '선택한 날짜에만 추가돼요.' },
    { value: 'weekdays', label: '평일', description: '선택한 달의 평일에 반복돼요.' },
    { value: 'weekends', label: '주말', description: '선택한 달의 주말에 반복돼요.' },
    { value: 'weekly', label: '매주', description: '선택한 달에서 같은 요일마다 반복돼요.' },
    { value: 'custom', label: '기타', description: '캘린더에서 원하는 날짜를 직접 골라요.' },
];

export const getDateKey = (date: RepeatDate) => `${date.year}-${date.month}-${date.day}`;

export const sortRepeatDates = (dates: RepeatDate[]) => (
    [...dates].sort((a, b) => (
        new Date(a.year, a.month - 1, a.day).getTime() -
        new Date(b.year, b.month - 1, b.day).getTime()
    ))
);

export const toggleRepeatDate = (dates: RepeatDate[], nextDate: RepeatDate) => {
    const nextKey = getDateKey(nextDate);

    if (dates.some((date) => getDateKey(date) === nextKey)) {
        return dates.filter((date) => getDateKey(date) !== nextKey);
    }

    return sortRepeatDates([...dates, nextDate]);
};

const uniqueDates = (dates: RepeatDate[]) => {
    const map = new Map<string, RepeatDate>();

    dates.forEach((date) => {
        map.set(getDateKey(date), date);
    });

    return sortRepeatDates([...map.values()]);
};

export const getRepeatDates = (
    option: RepeatOption,
    baseDate: RepeatDate,
    customDates: RepeatDate[] = []
) => {
    if (option === 'custom') {
        return uniqueDates(customDates);
    }

    if (option === 'none') {
        return [baseDate];
    }

    const baseWeekday = new Date(baseDate.year, baseDate.month - 1, baseDate.day).getDay();
    const daysInMonth = new Date(baseDate.year, baseDate.month, 0).getDate();

    const dates = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const weekday = new Date(baseDate.year, baseDate.month - 1, day).getDay();

        return {
            date: { year: baseDate.year, month: baseDate.month, day },
            weekday,
        };
    })
        .filter(({ weekday }) => {
            if (option === 'weekdays') return weekday >= 1 && weekday <= 5;
            if (option === 'weekends') return weekday === 0 || weekday === 6;

            return weekday === baseWeekday;
        })
        .map(({ date }) => date);

    return uniqueDates(dates.length > 0 ? dates : [baseDate]);
};

export const parseRepeatDates = (value?: string) => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) return [];

        return parsed.filter((item): item is RepeatDate => (
            typeof item?.year === 'number' &&
            typeof item?.month === 'number' &&
            typeof item?.day === 'number'
        ));
    } catch {
        return [];
    }
};

export const formatRepeatSummary = (option: RepeatOption, dates: RepeatDate[]) => {
    if (option === 'none') return '반복 없이 한 번만 추가돼요.';
    if (option === 'custom') return `${dates.length}개의 날짜를 직접 선택했어요.`;

    return `${dates.length}개의 일정으로 캘린더에 추가돼요.`;
};
