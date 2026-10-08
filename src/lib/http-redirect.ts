import { NextResponse } from "next/server";

/** Relative Location so we never send the browser to 0.0.0.0. */
export function redirectSeeOther(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}
