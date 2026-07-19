import { AlertTriangle, CheckCircle2, Info, Layers3, Palette, Type, TriangleAlert } from "lucide-react";
import { StudentLearningCard } from "@/components/common/student-learning-card";
import { TeacherDataSurface } from "@/components/common/teacher-data-surface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, InputDescription, InputMessage } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const primitivePalette = [
  { label: "Teal 600", token: "--teal-600" },
  { label: "Teal 100", token: "--teal-100" },
  { label: "Amber 500", token: "--amber-500" },
  { label: "Slate 25", token: "--slate-25" },
  { label: "Slate 900", token: "--slate-900" },
  { label: "Green 700", token: "--green-700" },
  { label: "Red 700", token: "--red-700" },
  { label: "Blue 700", token: "--blue-700" },
];

const semanticPalette = [
  { label: "Background", token: "--background" },
  { label: "Surface", token: "--surface" },
  { label: "Surface tinted", token: "--surface-tinted" },
  { label: "Primary", token: "--primary" },
  { label: "Primary subtle", token: "--primary-subtle" },
  { label: "Accent", token: "--accent" },
  { label: "Success", token: "--success" },
  { label: "Warning", token: "--warning" },
  { label: "Error", token: "--error" },
  { label: "Info", token: "--info" },
];

function ColorSwatch({ label, token }: { label: string; token: string }): JSX.Element {
  return (
    <div className="space-y-2">
      <div
        aria-hidden="true"
        className="h-16 rounded-[var(--radius-base)] border border-[var(--border)]"
        style={{ backgroundColor: `var(${token})` }}
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-[var(--text-secondary)]">{token}</p>
      </div>
    </div>
  );
}

export default function DevDesignSystemPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-[var(--text-4xl)] font-bold">Mina AI Design System</h1>
        <p className="max-w-3xl text-[var(--text-lg)] text-[var(--text-secondary)]">
          Trang này chỉ dùng trong development để kiểm tra token, typography, spacing, state và component variants của Mina AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette aria-hidden="true" className="size-5 text-[var(--primary)]" />
              <CardTitle>Primitive palette</CardTitle>
            </div>
            <CardDescription>Scale cơ bản dùng để tạo semantic tokens.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {primitivePalette.map((item) => (
              <ColorSwatch key={item.token} label={item.label} token={item.token} />
            ))}
          </CardContent>
        </Card>

        <Card variant="tinted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers3 aria-hidden="true" className="size-5 text-[var(--primary)]" />
              <CardTitle>Semantic palette</CardTitle>
            </div>
            <CardDescription>Token dùng trực tiếp cho UI, không gọi hex trong component.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {semanticPalette.map((item) => (
              <ColorSwatch key={item.token} label={item.label} token={item.token} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type aria-hidden="true" className="size-5 text-[var(--primary)]" />
            <CardTitle>Typography</CardTitle>
          </div>
          <CardDescription>Be Vietnam Pro với fallback Noto Sans, light mode, hỗ trợ tiếng Việt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Text sm 14px: học sinh, giáo viên, bằng chứng, kỹ năng, can thiệp.</p>
          <p className="text-base">Text base 16px: nội dung chính mặc định của Mina AI.</p>
          <p className="text-lg font-medium">Text lg 18px: phần nhấn nhẹ, giới thiệu ngắn, lead copy.</p>
          <p className="text-xl font-semibold">Text xl 20px: heading phụ trong module học tập.</p>
          <p className="text-2xl font-semibold">Text 2xl 24px: section heading.</p>
          <p className="text-3xl font-bold">Text 3xl 30/32px: page heading.</p>
          <p className="text-4xl font-bold">Text 4xl 40px: development preview headline.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Primary teal, secondary trắng viền teal, accent không phải nút mặc định.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button isLoading loadingLabel="Đang xử lý">
              Loading
            </Button>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Input height 44px, placeholder rõ, invalid có semantics và message.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preview-default">Mặc định</Label>
              <Input id="preview-default" placeholder="Nhập nội dung thử nghiệm" />
              <InputDescription>Dùng cho form học tập và thao tác giáo viên.</InputDescription>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-invalid">Trạng thái lỗi</Label>
              <Input
                id="preview-invalid"
                aria-describedby="preview-invalid-message"
                invalid
                placeholder="Ví dụ lỗi nhập liệu"
              />
              <InputMessage id="preview-invalid-message">Thông tin này chưa hợp lệ.</InputMessage>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="skill">Skill</Badge>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="info">
              <div className="flex gap-3">
                <Info aria-hidden="true" className="mt-0.5 size-4" />
                <div>
                  <AlertTitle>Thông tin</AlertTitle>
                  <AlertDescription>Thông báo trung tính cho người dùng.</AlertDescription>
                </div>
              </div>
            </Alert>
            <Alert variant="success">
              <div className="flex gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4" />
                <div>
                  <AlertTitle>Thành công</AlertTitle>
                  <AlertDescription>Trạng thái tích cực nhưng không dựa vào màu đơn lẻ.</AlertDescription>
                </div>
              </div>
            </Alert>
            <Alert variant="warning">
              <div className="flex gap-3">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4" />
                <div>
                  <AlertTitle>Cảnh báo</AlertTitle>
                  <AlertDescription>Cần lưu ý hoặc kiểm tra thêm thông tin.</AlertDescription>
                </div>
              </div>
            </Alert>
            <Alert variant="error">
              <div className="flex gap-3">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4" />
                <div>
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>Thao tác chưa thành công và cần thử lại.</AlertDescription>
                </div>
              </div>
            </Alert>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle>Skeleton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Separator />
            <p className="text-sm text-[var(--text-secondary)]">Reduced motion sẽ tắt pulse animation.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StudentLearningCard
          title="Student learning card"
          description="Card ưu tiên một nhiệm vụ, CTA rõ và khoảng thở rộng hơn."
          actionLabel="Tiếp tục"
        />
        <TeacherDataSurface
          title="Teacher data surface"
          rows={[
            { label: "Divider clarity", value: "Border rõ hơn" },
            { label: "Density", value: "Compact hơn student" },
            { label: "Action readiness", value: "Dễ scan và hành động" },
          ]}
        />
      </div>
    </div>
  );
}
