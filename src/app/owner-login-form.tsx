import { FieldError } from "@/components/chrome";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwnerLoginForm({ error }: { error?: string | null }) {
  return (
    <form
      method="post"
      action="/api/auth/login"
      encType="application/x-www-form-urlencoded"
      className="mt-8 space-y-5"
      autoComplete="on"
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue="sclxter@outlook.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
