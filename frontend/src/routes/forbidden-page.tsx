import { RoutePage } from "@/routes/route-page";

export default function ForbiddenPage(): JSX.Element {
  return (
    <RoutePage
      title="Khong co quyen truy cap"
      description="Tai khoan hien tai khong duoc phep vao khu vuc nay."
      backLink="/login"
    />
  );
}
