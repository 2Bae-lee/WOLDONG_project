export type CompanionTodo = {
    id: number;
    text: string;
    done: boolean;
};

export type CompanionTodaySchedule = {
    id: number;
    scheduleId?: string;
    childName: string;
    title: string;
    guardian: string;
    done: boolean;
    todos: CompanionTodo[];
};

const cloneSchedules = (schedules: CompanionTodaySchedule[]) => (
    schedules.map((schedule) => ({
        ...schedule,
        todos: schedule.todos.map((todo) => ({ ...todo })),
    }))
);

let todaySchedules: CompanionTodaySchedule[] = [
    {
        id: 1,
        childName: '김월동',
        title: '병원 진료',
        guardian: '김보호자',
        done: false,
        todos: [
            { id: 11, text: '병원 접수하기', done: false },
            { id: 12, text: '진료 전 짧게 설명하기', done: true },
            { id: 13, text: '진료 후 조용한 곳에서 쉬기', done: false },
        ],
    },
    {
        id: 2,
        childName: '이하준',
        title: '귀가 준비',
        guardian: '이보호자',
        done: false,
        todos: [
            { id: 21, text: '가방 챙기기', done: false },
            { id: 22, text: '집에 간다고 미리 알려주기', done: false },
        ],
    },
];

const listeners = new Set<() => void>();

const notify = () => {
    listeners.forEach((listener) => listener());
};

export const getCompanionTodaySchedules = () => cloneSchedules(todaySchedules);

export const getCompanionTodaySchedulesForChild = (childName: string) => (
    cloneSchedules(todaySchedules.filter((schedule) => schedule.childName === childName))
);

export const subscribeCompanionTodaySchedules = (listener: () => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export const toggleCompanionTodaySchedule = (scheduleId: number) => {
    todaySchedules = todaySchedules.map((schedule) => (
        schedule.id === scheduleId ? { ...schedule, done: !schedule.done } : schedule
    ));
    notify();
};

export const toggleCompanionTodayTodo = (scheduleId: number, todoId: number) => {
    todaySchedules = todaySchedules.map((schedule) => (
        schedule.id === scheduleId
            ? {
                ...schedule,
                todos: schedule.todos.map((todo) => (
                    todo.id === todoId ? { ...todo, done: !todo.done } : todo
                )),
            }
            : schedule
    ));
    notify();
};

export const updateCompanionTodaySchedule = (
    scheduleId: number,
    title: string,
    todos: CompanionTodo[]
) => {
    todaySchedules = todaySchedules.map((schedule) => (
        schedule.id === scheduleId
            ? {
                ...schedule,
                title,
                todos: todos.map((todo) => ({ ...todo })),
            }
            : schedule
    ));
    notify();
};
