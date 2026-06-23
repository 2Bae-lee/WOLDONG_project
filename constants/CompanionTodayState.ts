export type CompanionTodo = {
    id: number;
    itemId?: string;
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

let todaySchedules: CompanionTodaySchedule[] = [];

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
