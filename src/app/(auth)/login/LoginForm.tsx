"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少 6 個字元"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasDeactivated = searchParams.get("deactivated") === "1";
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setServerError("帳號或密碼錯誤,請再試一次。");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">登入</h1>
        <p className="pt-1.5 text-sm text-muted-foreground">帳號由管理者建立,忘記密碼可寄送重設信。</p>
      </div>

      {wasDeactivated && (
        <p className="text-sm text-destructive">這個帳號已被停用,請聯絡管理者。</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">密碼</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              忘記密碼?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "登入中..." : "登入"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        登入後系統會依你的角色(管理者 / 教練 / 學員)帶到對應首頁。
      </p>
    </div>
  );
}
