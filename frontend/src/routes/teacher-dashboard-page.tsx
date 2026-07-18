import { RoutePage } from "@/routes/route-page";

export default function TeacherDashboardPage(): JSX.Element {
  return (
    <RoutePage
      title="Tong quan giao vien"
      description="Khung tong quan giao vien da san sang. FE-008 se xay dashboard that."
      backLink="/teacher/classes/demo-class"
    />
  );
}
