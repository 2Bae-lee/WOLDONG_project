import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE_URL = 'http://127.0.0.1:8000';
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
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

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

const MOCK_PARENT_LOGIN = {
    email: 'woldong',
    password: 'wd1!',
    token: 'mock-parent-token',
    user: {
        id: 'mock-parent',
        name: '월동 보호자',
        email: 'woldong',
        role: 'parent',
    } satisfies AuthUser,
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
};

export type ChildProfileCreateResponse = {
    child_id: string;
    name: string;
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

export const apiRequest = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<ApiSuccess<T>> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...options.headers,
        },
    });

    const responseText = await response.text();
    let body: ApiResponse<T> | null = null;

    try {
        body = responseText ? JSON.parse(responseText) as ApiResponse<T> : null;
    } catch {
        throw new ApiError('서버 응답을 확인할 수 없어요.', response.status);
    }

    if (!response.ok || !body?.success) {
        throw new ApiError(body?.message ?? '서버 요청에 실패했어요.', response.status);
    }

    return body;
};

export const sendSignupCode = (email: string) => (
    apiRequest<null>('/api/auth/send-code', {
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
        }

        return null;
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

export const login = async (body: {
    email: string;
    password: string;
}) => {
    const isMockParent =
        body.email === MOCK_PARENT_LOGIN.email &&
        body.password === MOCK_PARENT_LOGIN.password;

    if (!isMockParent) {
        throw new ApiError('아이디 또는 비밀번호가 일치하지 않아요.', 401);
    }

    const responseData: AuthData = {
        token: MOCK_PARENT_LOGIN.token,
        user: MOCK_PARENT_LOGIN.user,
    };
    const response: ApiSuccess<AuthData> = {
        success: true,
        message: '목 데이터로 로그인했어요.',
        data: responseData,
    };

    await setAuthSession(responseData.token, responseData.user);
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

export const createChildProfile = (body: ChildProfilePayload) => (
    apiRequest<ChildProfileCreateResponse>('/api/children', {
        method: 'POST',
        body: JSON.stringify(body),
    })
);

export const generateCharacterImage = async (traits: string) => {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-character`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'image/png',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ traits }),
    });

    if (!response.ok) {
        const responseText = await response.text();
        let message = '캐릭터 생성에 실패했어요.';

        try {
            const body = responseText ? JSON.parse(responseText) as ApiFailure : null;
            message = body?.message ?? message;
        } catch {
            message = responseText || message;
        }

        throw new ApiError(message, response.status);
    }

    return blobToDataUri(await response.blob());
};
