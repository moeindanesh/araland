import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

let fetchSpy: ReturnType<typeof spyOn> | undefined;
afterEach(() => { fetchSpy?.mockRestore(); fetchSpy = undefined; });
function verifiedDomain() {
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(Object.assign(
    async () => Response.json({ slug: "studio" }),
    { preconnect: globalThis.fetch.preconnect },
  ));
}

describe("verified domain page routing", () => {
  test("rewrites a detail page and replaces caller-supplied route context", async () => {
    verifiedDomain();
    const response = await proxy(new NextRequest("https://pages.example.test/design?from=menu", {
      headers: { "x-araland-site-slug": "another-site", "x-araland-public-origin": "https://wrong.test" },
    }));
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://pages.example.test/s/studio/design?from=menu");
    expect(response.headers.get("x-middleware-request-x-araland-site-slug")).toBe("studio");
    expect(response.headers.get("x-middleware-request-x-araland-public-origin")).toBe("https://pages.example.test");
  });

  test("accepts only the mapped site's canonical page path", async () => {
    verifiedDomain();
    expect((await proxy(new NextRequest("https://pages.example.test/s/studio/design"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(new NextRequest("https://pages.example.test/s/other/design"))).status).toBe(404);
    expect((await proxy(new NextRequest("https://pages.example.test/portal/other"))).status).toBe(404);
  });

  test("clears customer context on application hosts", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/s/studio/design", {
      headers: { "x-araland-site-slug": "studio", "x-araland-public-origin": "https://wrong.test" },
    }));
    expect(response.headers.has("x-middleware-request-x-araland-site-slug")).toBe(false);
    expect(response.headers.get("x-middleware-request-x-araland-public-origin")).toBe("http://localhost:3000");
  });

  test("uses the original host when Next normalizes its internal URL", async () => {
    verifiedDomain();
    const response = await proxy(new NextRequest("http://0.0.0.0:3000/design", {
      headers: { host: "pages.example.test", "x-forwarded-proto": "https" },
    }));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("/public/domain/pages.example.test"), expect.anything());
    expect(response.headers.get("x-middleware-request-x-araland-site-slug")).toBe("studio");
    expect(response.headers.get("x-middleware-request-x-araland-public-origin")).toBe("https://pages.example.test");
  });

  test("preserves blog and portal rewrites", async () => {
    verifiedDomain();
    expect((await proxy(new NextRequest("https://pages.example.test/blog/post"))).headers.get("x-middleware-rewrite")).toBe("https://pages.example.test/s/studio/blog/post");
    expect((await proxy(new NextRequest("https://pages.example.test/portal"))).headers.get("x-middleware-rewrite")).toBe("https://pages.example.test/portal/studio");
  });

  test("serves robots with verified context and maps only the owning site's sitemap", async () => {
    verifiedDomain();
    expect((await proxy(new NextRequest("https://pages.example.test/sitemap.xml"))).headers.get("x-middleware-rewrite")).toBe("https://pages.example.test/s/studio/sitemap.xml");
    const robots = await proxy(new NextRequest("https://pages.example.test/robots.txt"));
    expect(robots.headers.get("x-middleware-request-x-araland-site-slug")).toBe("studio");
    expect((await proxy(new NextRequest("https://pages.example.test/s/other/sitemap.xml"))).status).toBe(404);
  });

  test("refuses unverified hosts before routing a page", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 404 }));
    const response = await proxy(new NextRequest("https://pages.example.test/design"));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
