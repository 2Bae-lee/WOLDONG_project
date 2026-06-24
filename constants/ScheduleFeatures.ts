export const SCHEDULE_FEATURE_WAIT = '일정_환경_대기시간있음';
export const SCHEDULE_FEATURE_CROWD = '일정_환경_사람많음';

export type ScheduleFeature = {
    value: string;
    label: string;
};

export type ScheduleFeatureGroup = {
    title: string;
    items: ScheduleFeature[];
};

export type ScheduleFeatureTemplate = {
    title: string;
    description: string;
    values: string[];
};

export const scheduleTypeFeatureMap: Record<string, string[]> = {
    병원: [
        '일정_장소_병원방문',
        '일정_활동_진료있음',
        SCHEDULE_FEATURE_WAIT,
        '일정_변수_낯선사람만남',
        '일정_변수_규칙을지켜야함',
    ],
    치료: [
        '일정_활동_상담또는설명듣기',
        '일정_환경_신체접촉가능성있음',
        '일정_변수_규칙을지켜야함',
    ],
    학교: [
        '일정_장소_학교방문',
        '일정_활동_상담또는설명듣기',
        '일정_변수_규칙을지켜야함',
    ],
    외출: [
        '일정_장소_새로운장소',
        '일정_장소_야외활동',
        SCHEDULE_FEATURE_CROWD,
    ],
};

export const transportFeatureMap: Record<string, string[]> = {
    도보: ['일정_이동_도보이동'],
    버스: ['일정_이동_버스이용'],
    지하철: ['일정_이동_지하철이용'],
    택시: ['일정_이동_차량이동'],
    자가용: ['일정_이동_차량이동'],
};

export const scheduleFeatureTemplates: ScheduleFeatureTemplate[] = [
    {
        title: '병원 진료',
        description: '진료, 대기, 낯선 사람',
        values: [
            '일정_장소_병원방문',
            '일정_활동_진료있음',
            SCHEDULE_FEATURE_WAIT,
            '일정_변수_낯선사람만남',
            '일정_변수_규칙을지켜야함',
        ],
    },
    {
        title: '예방접종',
        description: '주사, 신체 접촉, 대기',
        values: [
            '일정_장소_병원방문',
            '일정_활동_진료있음',
            '일정_활동_주사또는치료있음',
            SCHEDULE_FEATURE_WAIT,
            '일정_환경_신체접촉가능성있음',
            '일정_변수_낯선사람만남',
        ],
    },
    {
        title: '마트 방문',
        description: '혼잡, 소리, 구매',
        values: [
            '일정_장소_마트방문',
            '일정_활동_구매또는계산있음',
            SCHEDULE_FEATURE_CROWD,
            '일정_환경_큰소리있음',
            '일정_환경_냄새강함',
            '일정_변수_규칙을지켜야함',
        ],
    },
    {
        title: '학교 상담',
        description: '상담, 설명, 규칙',
        values: [
            '일정_장소_학교방문',
            '일정_활동_상담또는설명듣기',
            '일정_변수_낯선사람만남',
            '일정_변수_규칙을지켜야함',
        ],
    },
];

export const scheduleFeatureGroups: ScheduleFeatureGroup[] = [
    {
        title: '이동',
        items: [
            { value: '일정_이동_긴이동시간', label: '이동 시간이 김' },
            { value: '일정_이동_환승있음', label: '환승 있음' },
        ],
    },
    {
        title: '장소',
        items: [
            { value: '일정_장소_마트방문', label: '마트' },
            { value: '일정_장소_공공기관방문', label: '공공기관' },
            { value: '일정_장소_새로운장소', label: '새로운 장소' },
            { value: '일정_장소_야외활동', label: '야외활동' },
        ],
    },
    {
        title: '활동',
        items: [
            { value: '일정_활동_검사있음', label: '검사' },
            { value: '일정_활동_주사또는치료있음', label: '주사/치료' },
            { value: '일정_활동_식사있음', label: '식사' },
            { value: '일정_활동_구매또는계산있음', label: '구매/계산' },
            { value: '일정_활동_상담또는설명듣기', label: '상담/설명' },
        ],
    },
    {
        title: '환경',
        items: [
            { value: SCHEDULE_FEATURE_WAIT, label: '대기 시간' },
            { value: SCHEDULE_FEATURE_CROWD, label: '사람 많음' },
            { value: '일정_환경_큰소리있음', label: '큰 소리' },
            { value: '일정_환경_밝은빛있음', label: '밝은 빛' },
            { value: '일정_환경_냄새강함', label: '냄새 강함' },
            { value: '일정_환경_신체접촉가능성있음', label: '신체 접촉' },
        ],
    },
    {
        title: '변수',
        items: [
            { value: '일정_변수_일정변경가능성', label: '일정 변경' },
            { value: '일정_변수_시간압박있음', label: '시간 압박' },
            { value: '일정_변수_낯선사람만남', label: '낯선 사람' },
            { value: '일정_변수_보호자와분리상황있음', label: '분리 상황' },
            { value: '일정_변수_규칙을지켜야함', label: '규칙 수행' },
            { value: '일정_변수_완료후보상있음', label: '완료 후 보상' },
        ],
    },
];

export const scheduleFeatureLabelMap = scheduleFeatureGroups
    .flatMap((group) => group.items)
    .reduce<Record<string, string>>((labels, feature) => {
        labels[feature.value] = feature.label;
        return labels;
    }, {
        일정_이동_도보이동: '도보 이동',
        일정_이동_버스이용: '버스 이용',
        일정_이동_지하철이용: '지하철 이용',
        일정_이동_차량이동: '차량 이동',
        일정_장소_병원방문: '병원',
        일정_장소_학교방문: '학교',
    });

export const getUniqueScheduleFeatures = (...featureLists: string[][]) => (
    Array.from(new Set(featureLists.flat()))
);

export const getScheduleFeatureLabels = (values: string[]) => (
    values.map((value) => scheduleFeatureLabelMap[value] ?? value)
);
