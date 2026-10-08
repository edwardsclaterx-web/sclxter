import "server-only";

export async function readLoginBody(request: Request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    return {
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
    };
  }
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  return {
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  };
}

export function wantsHtml(request: Request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("application/json")) return false;
  const ct = request.headers.get("content-type") || "";
  return !ct.includes("application/json");
}
