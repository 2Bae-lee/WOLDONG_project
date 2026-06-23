const timezoneSuffixPattern = /([zZ]|[+-]\d{2}:?\d{2})$/;

export const parseServerDate = (value?: string | null) => {
    if (!value) return null;

    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    const normalizedValue = timezoneSuffixPattern.test(trimmedValue)
        ? trimmedValue
        : `${trimmedValue.replace(' ', 'T')}Z`;
    const timestamp = new Date(normalizedValue).getTime();

    return Number.isNaN(timestamp) ? null : timestamp;
};

export const formatRelativeTime = (value?: string | null) => {
    const created = parseServerDate(value);
    if (created === null) return '방금 전';

    const diffMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
};
