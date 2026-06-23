import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_PORT = 8003;
const API_TIMEOUT_MS = 15000;

const getHostFromUri = (uri?: string | null) => {
    if (!uri) return '';

    const withoutProtocol = uri.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '');
    const hostWithPort = withoutProtocol.split('/')[0]?.split('?')[0] ?? '';

    return hostWithPort.split(':')[0] ?? '';
};

const getApiBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
    }

    if (Platform.OS === 'web') {
        return `http://127.0.0.1:${API_PORT}`;
    }

    const manifest2HostUri = (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
    const expoGoDebuggerHost = (Constants.expoGoConfig as any)?.debuggerHost;
    const host = [
        Constants.expoConfig?.hostUri,
        manifest2HostUri,
        expoGoDebuggerHost,
        Constants.experienceUrl,
        Constants.linkingUri,
    ]
        .map(getHostFromUri)
        .find(Boolean);

    if (!host) {
        return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://127.0.0.1:${API_PORT}`;
    }
    if (host === 'localhost' || host === '127.0.0.1') {
        return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://127.0.0.1:${API_PORT}`;
    }

    return `http://${host}:${API_PORT}`;
};

export const API_BASE_URL = getApiBaseUrl();
const AUTH_TOKEN_KEY = 'woldong.authToken';
const AUTH_USER_KEY = 'woldong.authUser';

type ApiSuccess<T> = {
    success: true;
    message: string;
    data?: T;
};

type ApiFailure = {
    success: false;
    message: string;
    detail?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const getApiErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== 'object') return fallback;

    if ('message' in body && body.message) return String(body.message);
    if ('detail' in body && body.detail) return String(body.detail);

    return fallback;
};

const getHttpStatusMessage = (status: number) => {
    if (status === 502 || status === 503 || status === 504) {
        return `터널 또는 백엔드 연결이 불안정해요. 잠시 후 다시 시도해주세요. (${status})`;
    }

    return `서버 요청에 실패했어요. (${status})`;
};

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: 'parent' | 'companion' | string;
};

type AuthData = {
    token: string;
    user: AuthUser;
};

type CheckEmailResponse = {
    available: boolean;
};

export type CharacterTone = 'kind' | 'strict';
export type CharacterSpeed = 'slow' | 'normal' | 'fast';
export type CharacterVoice = 'female' | 'male';

export type CharacterImages = {
    idle: string;
    blink?: string;
    mouth_open?: string;
    mouth_wide?: string;
    smile?: string;
};

export type ChildProfilePayload = {
    name: string;
    gender: '남자아이' | '여자아이';
    birth_date: string;
    guardian_relation: '주양육자' | '부모' | '조부모';
    disability_type: '지적장애' | '자폐스펙트럼장애';
    explanation_styles?: string[];
    communication_styles?: string[];
    caution_situations?: string[];
    required_actions?: string;
    difficult_environments?: string[];
    difficult_places?: string[];
    transition_difficulties?: string[];
    notice_time?: string;
    calming_methods?: string[];
    avoid_behaviors?: string;
    character_name?: string;
    character_tone?: CharacterTone;
    character_speed?: CharacterSpeed;
    character_voice?: CharacterVoice;
    character_image_url?: CharacterImages;
};

export type ChildProfileUpdatePayload = Partial<ChildProfilePayload>;

export type ChildProfileCreateResponse = {
    child_id: string;
    name: string;
    created_at: string;
};

export type ParentHomeChild = {
    child_id: string;
    name: string;
    gender: string;
    birth_date: string;
    disability_type: string;
    character_name?: string;
    character_tone?: CharacterTone | null;
    character_speed?: CharacterSpeed | null;
    character_voice?: CharacterVoice | null;
    character_image_url?: CharacterImages | null;
};

export type ChildProfileDetail = ChildProfilePayload & {
    child_id: string;
    created_at: string;
    updated_at: string;
};

export type TodayScheduleSummary = {
    schedule_id: string;
    title: string;
    date: string;
    start_time: string;
    destination?: string;
    place_type?: string;
    transport_type?: string;
    status: 'upcoming' | 'ongoing' | 'done' | string;
    child_id: string;
    child_name?: string | null;
    companion_id?: string | null;
    companion_name?: string | null;
    checklist?: ScheduleChecklistItem[];
    schedule_features?: string[];
};

export type SchedulePayload = {
    child_id: string;
    companion_id?: string;
    title: string;
    date: string;
    start_time: string;
    place_type: string;
    transport_type: string;
    activities?: string[];
    wait_possible?: boolean;
    crowd_possible?: boolean;
    schedule_features?: string[];
    preparations?: string[];
    checklist?: string[];
};

export type ScheduleCreateResponse = {
    schedule_id: string;
    title: string;
    created_at: string;
};

export type ScheduleChecklistItem = {
    item_id: string;
    content: string;
    is_checked: boolean;
};

export type ScheduleJournal = {
    reaction?: string;
    difficulties?: string;
    memo?: string;
    recorded_at?: string;
};

export type ScheduleJournalPayload = {
    reaction: string;
    difficulties: string;
    memo?: string;
};

export type ScheduleDetail = {
    schedule_id: string;
    title: string;
    date: string;
    start_time: string;
    destination?: string;
    transport?: string;
    place_type: string;
    transport_type: string;
    activities: string[];
    wait_possible: boolean;
    crowd_possible: boolean;
    schedule_features?: string[];
    status: 'upcoming' | 'ongoing' | 'done' | string;
    child_id: string;
    companion_id?: string | null;
    preparations: string[];
    checklist: ScheduleChecklistItem[];
    child_traits?: {
        caution_situations?: string[];
        required_actions?: string;
        calming_methods?: string[];
        avoid_behaviors?: string;
        difficult_environments?: string[];
        notice_time?: string;
    };
    journal?: ScheduleJournal | null;
    created_at: string;
    updated_at: string;
};

export type ScheduleWarningsResponse = {
    warnings: string[];
};

export type ScheduleUpdatePayload = Partial<SchedulePayload> & {
    status?: 'upcoming' | 'ongoing' | 'done' | string;
};

export type SocialStoryTone = CharacterTone;
export type SocialStorySpeed = CharacterSpeed;
export type SocialStoryVoice = CharacterVoice;

export type SocialStoryRequest = {
    script: string;
    tone?: SocialStoryTone;
    speed?: SocialStorySpeed;
    voice?: SocialStoryVoice;
    checked_items?: string[];
    threshold?: number;
};

export type SocialStoryResponse = {
    original_script: string;
    converted_script: string;
    audio_url?: string;
    character_images?: CharacterImages;
    story_category?: string;
    story_difficulty?: string;
    predicted_warnings?: string[];
};

export type ParentHomeResponse = {
    guardian: AuthUser;
    children: ParentHomeChild[];
    today_schedules: TodayScheduleSummary[];
};

export type CompanionProfile = AuthUser & {
    phone?: string;
    relation?: string | null;
    job?: string | null;
    intro?: string | null;
    profile_image_url?: string | null;
    created_at?: string;
};

export type CompanionProfileUpdatePayload = {
    name?: string;
    phone?: string;
    relation?: string;
    job?: string;
    intro?: string;
    profile_image_url?: string;
};

export type CompanionChild = {
    child_id: string;
    name: string;
    gender: string;
    birth_date: string;
    disability_type: string;
    character_image_url?: CharacterImages | null;
    character_name?: string | null;
    character_tone?: CharacterTone | null;
    character_speed?: CharacterSpeed | null;
    character_voice?: CharacterVoice | null;
};

export type ParentNotification = {
    notification_id: string;
    type: 'companion_request' | 'request_approved' | 'request_rejected' | 'emergency' | string;
    message: string;
    sender_name: string;
    child_id: string;
    is_read: boolean;
    created_at: string;
};

export type ChildNotification = Omit<ParentNotification, 'child_id'>;

export type InviteRequest = {
    request_id: string;
    companion_id?: string;
    companion_name: string;
    companion_phone?: string | null;
    companion_intro?: string | null;
    companion_relation?: string | null;
    companion_job?: string | null;
    companion_profile_image_url?: string | null;
    child_id: string;
    relation?: string | null;
    permissions?: string[];
    created_at: string;
};

export type InviteCodeResponse = {
    code: string;
    expires_at: string;
};

export type InviteVerifyResponse = {
    child_id: string;
    child_name: string;
    guardian_name: string;
    status: 'pending' | string;
};

export type LinkedCompanion = {
    request_id: string;
    companion_id: string;
    companion_name: string;
    relation?: string | null;
    permissions?: string[];
    created_at: string;
};

const blobToDataUri = (blob: Blob) => (
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }

            reject(new Error('생성된 캐릭터 이미지를 불러올 수 없어요.'));
        };
        reader.onerror = () => reject(new Error('생성된 캐릭터 이미지를 불러올 수 없어요.'));
        reader.readAsDataURL(blob);
    })
);

let authToken: string | null = null;
let authUser: AuthUser | null = null;

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const writeStorage = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(key, value);
        return;
    }

    await SecureStore.setItemAsync(key, value);
};

const readStorage = async (key: string) => {
    if (Platform.OS === 'web') {
        return globalThis.localStorage?.getItem(key) ?? null;
    }

    return SecureStore.getItemAsync(key);
};

const deleteStorage = async (key: string) => {
    if (Platform.OS === 'web') {
        globalThis.localStorage?.removeItem(key);
        return;
    }

    await SecureStore.deleteItemAsync(key);
};

const setAuthMemory = (token: string, user?: AuthUser | null) => {
    authToken = token;
    authUser = user ?? authUser;
};

export const setAuthSession = async (token: string, user: AuthUser) => {
    setAuthMemory(token, user);
    await writeStorage(AUTH_TOKEN_KEY, token);
    await writeStorage(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = async () => {
    authToken = null;
    authUser = null;
    await deleteStorage(AUTH_TOKEN_KEY);
    await deleteStorage(AUTH_USER_KEY);
};

export const getAuthToken = () => authToken;

export const getAuthUser = () => authUser;

export const restoreAuthToken = async () => {
    const token = await readStorage(AUTH_TOKEN_KEY);
    if (!token) return null;

    authToken = token;

    const storedUser = await readStorage(AUTH_USER_KEY);
    if (storedUser) {
        try {
            authUser = JSON.parse(storedUser) as AuthUser;
        } catch {
            authUser = null;
        }
    }

    return token;
};

const fetchApi = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'true',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...options.headers,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiError(`서버 응답이 지연되고 있어요. 터널이 살아있는지 확인해주세요. (${url})`, 0);
        }

        throw new ApiError(`서버에 연결하지 못했어요. (${url})`, 0);
    } finally {
        clearTimeout(timeoutId);
    }
};

export const apiRequest = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<ApiSuccess<T>> => {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetchApi(url, options);

    const responseText = await response.text();
    let body: ApiResponse<T> | null = null;

    try {
        body = responseText ? JSON.parse(responseText) as ApiResponse<T> : null;
    } catch {
        if (!response.ok) {
            throw new ApiError(getHttpStatusMessage(response.status), response.status);
        }

        throw new ApiError('서버 응답을 확인할 수 없어요.', response.status);
    }

    if (!response.ok || !body?.success) {
        throw new ApiError(getApiErrorMessage(body, '서버 요청에 실패했어요.'), response.status);
    }

    return body;
};

const apiRawJsonRequest = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetchApi(url, options);

    const responseText = await response.text();
    let body: (ApiResponse<T> | T) | null = null;

    try {
        body = responseText ? JSON.parse(responseText) as ApiResponse<T> | T : null;
    } catch {
        if (!response.ok) {
            throw new ApiError(getHttpStatusMessage(response.status), response.status);
        }

        throw new ApiError('서버 응답을 확인할 수 없어요.', response.status);
    }

    if (!response.ok) {
        throw new ApiError(getApiErrorMessage(body, '서버 요청에 실패했어요.'), response.status);
    }

    if (body && typeof body === 'object' && 'success' in body) {
        if (!body.success) {
            throw new ApiError(getApiErrorMessage(body, '서버 요청에 실패했어요.'), response.status);
        }

        return body.data as T;
    }

    if (!body) {
        throw new ApiError('서버 응답을 확인할 수 없어요.', response.status);
    }

    return body as T;
};

export const toApiAssetUrl = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;

    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const sendSignupCode = (email: string) => (
    apiRequest<null>('/api/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
    })
);

export const checkEmailAvailable = (email: string) => (
    apiRequest<CheckEmailResponse>('/api/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
    })
);

export const verifySignupCode = (email: string, code: string) => (
    apiRequest<null>('/api/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    })
);

export const getMe = async () => {
    const response = await apiRequest<AuthUser>('/api/auth/me');
    if (response.data && authToken) {
        setAuthMemory(authToken, response.data);
        await writeStorage(AUTH_USER_KEY, JSON.stringify(response.data));
    }

    return response;
};

export const checkStoredSession = async () => {
    const token = await restoreAuthToken();
    if (!token) return null;

    try {
        const response = await getMe();
        return response.data ?? null;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            await clearAuthSession();
            return null;
        }

        return authUser;
    }
};

export const signupParent = async (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
}) => {
    const response = await apiRequest<AuthData>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
            ...body,
            role: 'parent',
        }),
    });

    if (response.data?.token && response.data.user) {
        await setAuthSession(response.data.token, response.data.user);
    }

    return response;
};

export const signupCompanion = async (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
}) => {
    const response = await apiRequest<AuthData>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
            ...body,
            role: 'companion',
        }),
    });

    if (response.data?.token && response.data.user) {
        await setAuthSession(response.data.token, response.data.user);
    }

    return response;
};

export const login = async (body: {
    email: string;
    password: string;
}) => {
    const response = await apiRequest<AuthData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (response.data?.token && response.data.user) {
        await setAuthSession(response.data.token, response.data.user);
    }

    return response;
};

export const logout = async () => {
    try {
        await apiRequest<null>('/api/auth/logout', {
            method: 'POST',
        });
    } finally {
        await clearAuthSession();
    }
};

export const deleteMe = async () => {
    try {
        await apiRequest<null>('/api/auth/me', {
            method: 'DELETE',
        });
    } finally {
        await clearAuthSession();
    }
};

export const createChildProfile = (body: ChildProfilePayload) => (
    apiRequest<ChildProfileCreateResponse>('/api/children', {
        method: 'POST',
        body: JSON.stringify(body),
    })
);

export const getChildProfile = (childId: string) => (
    apiRequest<ChildProfileDetail>(`/api/children/${encodeURIComponent(childId)}`)
);

export const updateChildProfile = (childId: string, body: ChildProfileUpdatePayload) => (
    apiRequest<null>(`/api/children/${encodeURIComponent(childId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    })
);

export const saveChildCharacterImages = (childId: string, images: CharacterImages) => (
    apiRequest<null>(`/api/children/${encodeURIComponent(childId)}/character`, {
        method: 'PATCH',
        body: JSON.stringify(images),
    })
);

export const getParentHome = () => (
    apiRequest<ParentHomeResponse>('/api/home')
);

export const getTodaySchedules = () => (
    apiRequest<TodayScheduleSummary[]>('/api/schedules/today')
);

export const getCompanionProfile = () => (
    apiRequest<CompanionProfile>('/api/companion/me')
);

export const updateCompanionProfile = (body: CompanionProfileUpdatePayload) => (
    apiRequest<CompanionProfile>('/api/companion/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
    })
);

export const getCompanionChildren = () => (
    apiRequest<CompanionChild[]>('/api/companion/children')
);

export const getSchedules = () => (
    apiRequest<TodayScheduleSummary[]>('/api/schedules')
);

export const createSchedule = (body: SchedulePayload) => (
    apiRequest<ScheduleCreateResponse>('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(body),
    })
);

export const getSchedule = (scheduleId: string) => (
    apiRequest<ScheduleDetail>(`/api/schedules/${encodeURIComponent(scheduleId)}`)
);

export const getScheduleWarnings = (scheduleId: string) => (
    apiRequest<ScheduleWarningsResponse>(`/api/schedules/${encodeURIComponent(scheduleId)}/warnings`)
);

export const updateScheduleChecklist = (scheduleId: string, itemId: string, isChecked: boolean) => (
    apiRequest<null>(`/api/schedules/${encodeURIComponent(scheduleId)}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify({
            item_id: itemId,
            is_checked: isChecked,
        }),
    })
);

export const createScheduleJournal = (scheduleId: string, body: ScheduleJournalPayload) => (
    apiRequest<null>(`/api/schedules/${encodeURIComponent(scheduleId)}/journal`, {
        method: 'POST',
        body: JSON.stringify(body),
    })
);

export const updateSchedule = (scheduleId: string, body: ScheduleUpdatePayload) => (
    apiRequest<null>(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    })
);

export const deleteSchedule = (scheduleId: string) => (
    apiRequest<null>(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
        method: 'DELETE',
    })
);

export const getNotifications = () => (
    apiRequest<ParentNotification[]>('/api/notifications')
);

export const getChildNotifications = (childId: string) => (
    apiRequest<ChildNotification[]>(`/api/notifications/child/${encodeURIComponent(childId)}`)
);

export const markNotificationRead = (notificationId: string) => (
    apiRequest<null>(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
    })
);

export const getInviteRequests = () => (
    apiRequest<InviteRequest[]>('/api/invite/requests')
);

export const approveInviteRequest = (
    requestId: string,
    approve: boolean,
    options: {
        relation?: string;
        permissions?: string[];
    } = {}
) => (
    apiRequest<null>('/api/invite/approve', {
        method: 'POST',
        body: JSON.stringify({
            request_id: requestId,
            approve,
            relation: options.relation,
            permissions: options.permissions ?? [],
        }),
    })
);

export const generateInviteCode = (childId: string) => (
    apiRequest<InviteCodeResponse>(`/api/invite/generate?child_id=${encodeURIComponent(childId)}`, {
        method: 'POST',
    })
);

export const verifyInviteCode = (code: string) => (
    apiRequest<InviteVerifyResponse>('/api/invite/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })
);

export const getLinkedCompanions = (childId: string) => (
    apiRequest<LinkedCompanion[]>(`/api/invite/companions/${encodeURIComponent(childId)}`)
);

export const deleteLinkedCompanion = (childId: string, companionId: string) => (
    apiRequest<null>(
        `/api/invite/companions/${encodeURIComponent(childId)}/${encodeURIComponent(companionId)}`,
        { method: 'DELETE' }
    )
);

export const generateSocialStoryTts = (body: SocialStoryRequest) => (
    apiRawJsonRequest<SocialStoryResponse>('/api/ai/social-story/tts', {
        method: 'POST',
        body: JSON.stringify(body),
    })
);

export const generateScheduleSocialStory = (
    scheduleId: string,
    options: Pick<SocialStoryRequest, 'script' | 'tone' | 'speed' | 'voice'>
) => {
    const params = new URLSearchParams();
    params.set('script', options.script);
    if (options.tone) params.set('tone', options.tone);
    if (options.speed) params.set('speed', options.speed);
    if (options.voice) params.set('voice', options.voice);

    return apiRawJsonRequest<SocialStoryResponse>(
        `/api/ai/social-story/${encodeURIComponent(scheduleId)}?${params.toString()}`
    );
};

export const generateCharacterFrames = (traits: string) => (
    apiRequest<CharacterImages>('/api/ai/generate-character-frames', {
        method: 'POST',
        body: JSON.stringify({ traits }),
    })
);
