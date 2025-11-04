// axios.ts
import axios, { AxiosError } from "axios";
import type {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./token";

/**
 * 단일 axios 인스턴스
 * - 모든 API 호출부에서 이 인스턴스를 import 해서 사용하세요.
 * - baseURL이 필요하면 아래 주석 해제 후 환경에 맞게 설정.
 */
const api = axios.create({
  withCredentials: true,
  // baseURL: import.meta.env.VITE_API_BASE_URL ?? "/",
});

/** 재발급 중인지 여부 (동시 401 시 stampede 방지) */
let isRefreshing = false;
/** 재발급 완료를 기다리는 대기열 */
let waitQueue: Array<(token: string | null) => void> = [];

/** 대기중인 요청들에게 재발급 결과 브로드캐스트 */
function broadcast(token: string | null) {
  waitQueue.forEach((resolve) => resolve(token));
  waitQueue = [];
}

/** /api/token 호출용 "깨끗한" axios (인터셉터 미적용) */
const API_BASE = import.meta.env.DEV ? "http://localhost:8080" : "";
const plain = axios.create({ withCredentials: true });

/** 액세스 토큰 재발급 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await plain.post(
      `${API_BASE}/api/token`,
      {},
      { validateStatus: (s) => s >= 200 && s < 300 }
    );
    const newToken = res.data?.accessToken as string | undefined;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    clearAccessToken();
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

/** 요청 인터셉터: Authorization 자동 첨부 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // /api/token 호출에는 Authorization 붙이지 않음(루프/충돌 방지)
  const isTokenEndpoint = config.url?.includes("/api/token");
  if (!isTokenEndpoint) {
    const t = getAccessToken();
    if (t) {
      // headers는 타입이 union이라 얕은 복사 후 캐스팅이 안전함
      const headers: AxiosRequestHeaders =
        (config.headers as AxiosRequestHeaders) ?? {};
      headers.Authorization = `Bearer ${t}`;
      config.headers = headers;
    }
  }
  return config;
});

/** 응답 인터셉터: 401 처리(단일 비행 + 재시도 1회) */
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { __retry?: boolean })
      | undefined;
    const status = error.response?.status ?? 0;

    // 재시도 불가한 상황들
    if (!original || status !== 401 || original.__retry) {
      throw error;
    }

    // /api/token 자체가 401이면 더 시도하지 않음
    if (original.url?.includes("/api/token")) {
      clearAccessToken();
      throw error;
    }

    // ===== 여기서부터 401 단일 비행 =====
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        broadcast(newToken); // 대기중 요청 모두 깨우기
      } finally {
        isRefreshing = false;
      }
    } else {
      // 누군가 재발급 중이면 대기
      const token = await new Promise<string | null>((resolve) =>
        waitQueue.push(resolve)
      );
      if (token == null) {
        // 재발급 실패로 브로드캐스트됨
        clearAccessToken();
        throw error;
      }
    }

    // 여기 도달 = 재발급 시도 완료. 새 토큰으로 원 요청 1회 재시도.
    const token = getAccessToken();
    original.__retry = true;

    const headers: AxiosRequestHeaders =
      (original.headers as AxiosRequestHeaders) ?? {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete (headers as any).Authorization;
    }
    original.headers = headers;

    return api.request(original as AxiosRequestConfig);
  }
);

export default api;
