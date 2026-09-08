import type { Site } from "@araland/shared";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Alert } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  token?: string | null,
  data?: unknown,
  method = "GET",
): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    path.includes("/ai/") ? 180_000 : 30_000,
  );
  try {
    const isForm = data instanceof FormData;
    response = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      method,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data === undefined
        ? {}
        : { body: isForm ? data : JSON.stringify(data) }),
    });
  } catch {
    throw new ApiError(
      "ارتباط با سرور برقرار نشد. اتصال اینترنت و نشانی سرور را بررسی کنید.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      result.error || "درخواست انجام نشد. دوباره تلاش کنید.",
      response.status,
    );
  return result as T;
}

export type ManagerContext = {
  token: string;
  site: Site;
  updateSite: (site: Site) => void;
};
export const Manager = createContext<ManagerContext | null>(null);
export function useManager() {
  const value = useContext(Manager);
  if (!value) throw new Error("Manager provider missing");
  return value;
}

export function useResource<T>(path: string) {
  const { token } = useManager();
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await request<T>(path, token);
      if (generation.current === current) setData(result);
    } catch (e) {
      if (generation.current === current) setError(message(e));
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [path, token]);
  useEffect(() => {
    setData(undefined);
    void reload();
    return () => {
      generation.current += 1;
    };
  }, [reload]);
  return { data, error, loading, reload };
}

export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "مشکلی پیش آمد. دوباره تلاش کنید.";
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const run = async (operation: () => Promise<void>, success?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await operation();
      if (success) Alert.alert("انجام شد", success);
    } catch (error) {
      Alert.alert("درخواست انجام نشد", message(error));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  return { busy, run };
}

export function confirm(
  title: string,
  description: string,
  action: () => void,
  destructive = false,
) {
  Alert.alert(title, description, [
    { text: "انصراف", style: "cancel" },
    {
      text: "ادامه",
      style: destructive ? "destructive" : "default",
      onPress: action,
    },
  ]);
}

export function date(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
}
export function number(value: number) {
  return value.toLocaleString("fa-IR");
}
export function publicMedia(url?: string) {
  if (url?.startsWith("/images/templates/")) return `${WEB_URL.replace(/\/$/, "")}${url}`;
  return url?.startsWith("/")
    ? `${API_URL.replace(/\/api\/?$/, "")}${url}`
    : url;
}
