import { FieldError } from "@/components/chrome";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  mode,
  error,
}: {
  mode: "login" | "signup";
  error?: string | null;
}) {
  const signup = mode === "signup";
  return (
    <form
      method="post"
      action={signup ? "/api/auth/signup" : "/api/auth/login"}
      encType="application/x-www-form-urlencoded"
      className="mt-8 space-y-5"
      autoComplete={signup ? "off" : "on"}
    >
      <div>
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          name="email"
          type={signup ? "email" : "text"}
          autoComplete={signup ? "email" : "username"}
          inputMode={signup ? "email" : "text"}
          defaultValue=""
          required
        />
      </div>
      <div>
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <PasswordField
          id={`${mode}-password`}
          name="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full">
        {signup ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
