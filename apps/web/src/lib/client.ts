"use client";
import { apiRequest } from "@araland/shared";
export const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export const getToken = () =>
  typeof window === "undefined"
    ? undefined
    : localStorage.getItem("araland-token") || undefined;
export const request = <T>(path: string, options: RequestInit = {}) =>
  withNetworkMessage(apiRequest<T>(path, options, getToken(), baseUrl));
async function withNetworkMessage<T>(pending: Promise<T>): Promise<T> {
  try {
    return await pending;
  } catch (error) {
    if (error instanceof TypeError)
      throw new Error(
        "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
      );
    throw error;
  }
}
export const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export const fa = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);
export const date = (value: string) =>
  new Date(value).toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
export const safeUrl = (url?: string) =>
  url && /^(https?:\/\/|tel:|mailto:|#|\/[^/])/.test(url) ? url : "#contact";

export const portalTokenKey = (slug: string) => `araland-portal-${slug}`;
export const getPortalToken = (slug: string) =>
  typeof window === "undefined"
    ? undefined
    : localStorage.getItem(portalTokenKey(slug)) || undefined;
export const portalRequest = <T>(
  slug: string,
  path: string,
  options: RequestInit = {},
) =>
  withNetworkMessage(
    apiRequest<T>(path, options, getPortalToken(slug), baseUrl),
  );
