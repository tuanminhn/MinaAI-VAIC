import { RoutePage } from "@/routes/route-page";

export default function NotFoundPage(): JSX.Element {
  return (
    <RoutePage
      title="Khong tim thay trang"
      description="Trang ban dang tim khong ton tai hoac da duoc di chuyen."
      backLink="/login"
    />
  );
}
