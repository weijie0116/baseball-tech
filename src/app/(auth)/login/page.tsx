import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-stretch">
      <div className="hidden flex-1 flex-col justify-center gap-10 bg-primary p-14 text-primary-foreground md:flex">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-full border-2 border-primary-foreground" />
          <span className="font-heading text-lg font-bold">投手成長歷程</span>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-heading text-4xl leading-tight font-bold text-balance">
            每一球都留下紀錄,進步才看得見。
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/85">
            身高體重成長曲線、每次上課的訓練菜單與球速轉速、投球機制的前後比對,教練與學員看的是同一份紀錄。
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
