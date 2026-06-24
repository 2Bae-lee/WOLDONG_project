const timezonePattern = /(?:Z|[+-]\d{2}:?\d{2})$/;

const parseBackendTime = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return NaN;

    if (timezonePattern.test(normalized)) {
        return new Date(normalized).getTime();
    }

    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(normalized)) {
        return new Date(`${normalized.replace(' ', 'T')}Z`).getTime();
    }

    return new Date(normalized).getTime();
};

export const formatRelativeTime = (value: string) => {
    const created = parseBackendTime(value);
    if (Number.isNaN(created)) return '방금 전';

    const diffMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
};
