import { Toaster } from "sonner";

export function AppToast(): JSX.Element {
  return (
    <Toaster
      position="top-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
