import { NewSessionForm } from "./NewSessionForm";

export default async function NewSessionPage({
  params,
}: PageProps<"/coach/students/[studentId]/sessions/new">) {
  const { studentId } = await params;

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-xl font-semibold">新增訓練紀錄</h1>
      <NewSessionForm studentId={studentId} />
    </div>
  );
}
