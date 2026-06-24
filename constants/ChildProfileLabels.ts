const childProfileLabelMap: Record<string, string> = {
    one_by_one: '한 번에 하나씩 설명',
    visual_support: '그림/사진 활용',
    short_sentence: '짧고 쉬운 문장',
    need_repetition: '반복 설명',
    choice_question: '선택지 질문',
    show_first: '먼저 보여주고 설명',

    sentence_answer: '문장으로 대답',
    word_answer: '단어로 대답',
    gesture_answer: '고개/손짓으로 대답',
    picture_card: '그림/사진 카드 필요',
    yes_no_answer: '네/아니오로 대답',
    hard_to_express: '불편함 표현 어려움',

    car_danger: '차도/차량 위험 인지 어려움',
    crosswalk_danger: '신호등/횡단보도 어려움',
    stranger_danger: '낯선 사람을 따라갈 수 있음',
    apartfromcompanion_danger: '동행인과 떨어지면 위험',
    suddenrun_danger: '갑자기 뛰어갈 수 있음',
    touch_danger: '위험한 물건을 만질 수 있음',

    hold_hands: '손을 꼭 잡고 이동해주세요',
    explain_before_crossing: '횡단보도 앞에서는 멈춰서 설명해주세요',
    stay_close: '사람 많은 곳에서는 가까이 있어주세요',
    call_name_and_stop: '갑자기 뛰면 이름을 부르고 천천히 멈춰주세요',
    quiet_break: '불안해하면 조용한 곳에서 쉬게 해주세요',
    remove_dangerous_items: '위험한 물건은 먼저 치워주세요',

    loud_noise: '큰 소리',
    crowded_place: '사람 많은 곳',
    light: '밝은 빛',
    bad_smell: '냄새',
    body_contact: '신체 접촉',
    movement: '갑작스러운 움직임',
    wait: '대기',

    take_transport: '이동 수단 타기',
    waiting: '기다리기',
    stop_activity: '하던 활동 멈추기',
    move_place: '장소 이동하기',
    go_home: '집에 돌아가기',
    go_toilet: '화장실 가기',
    unexpected_change: '예정과 다른 일이 생기기',

    right_before: '바로 직전',
    five_minutes: '5분 전',
    ten_minutes: '10분 전',
    thirty_minutes: '30분 전',
    one_hour: '1시간 전',
    three_hours: '3시간 전',
    day_before: '전 날',

    intellectual: '지적장애',
    autism: '자폐스펙트럼장애',
};

export const normalizeChildProfileLabel = (value: string) => (
    childProfileLabelMap[value] ?? value
);

export const normalizeChildProfileLabels = (values: string[]) => (
    values.map(normalizeChildProfileLabel)
);
