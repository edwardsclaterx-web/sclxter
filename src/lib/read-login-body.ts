import "server-only";

export async function readLoginBody(request: Request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      n?: unknown;
      terms?: unknown;
    };
    return {
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
      n: typeof body.n === "string" ? body.n : "",
      terms: body.terms === true || body.terms === "1" || body.terms === "on",
    };
  }
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const n = form.get("n");
  const terms = form.get("terms");
  return {
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
    n: typeof n === "string" ? n : "",
    terms: terms === "1" || terms === "on" || terms === "true",
  };
}

export function wantsHtml(request: Request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("application/json")) return false;
  const ct = request.headers.get("content-type") || "";
  return !ct.includes("application/json");
}
