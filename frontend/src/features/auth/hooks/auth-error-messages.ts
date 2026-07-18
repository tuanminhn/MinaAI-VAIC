import type { ApiError } from "@/lib/api/api-error";
import type { AuthNotice } from "@/features/auth/types/auth-notice";

export function getLoginNotice(error: ApiError): AuthNotice {
  if (error.code === "invalid_credentials") {
    return {
      title: "Dang nhap chua thanh cong",
      message: "Ten dang nhap hoac mat khau khong dung.",
      variant: "error",
    };
  }

  if (error.code === "network_error") {
    return {
      title: "Khong the ket noi may chu Mina",
      message:
        "Khong the ket noi den may chu Mina trong truong. Hay kiem tra Wi-Fi noi bo hoac thu lai.",
      variant: "error",
    };
  }

  if (error.status === 503 || error.code === "server_unavailable") {
    return {
      title: "May chu Mina chua san sang",
      message:
        "May chu Mina trong truong hien chua san sang. Hay thu lai sau it phut hoac lien he giao vien phu trach.",
      variant: "warning",
    };
  }

  return {
    title: "Khong the dang nhap",
    message: "He thong Mina tam thoi chua the xu ly yeu cau dang nhap. Hay thu lai.",
    variant: "error",
  };
}

export function getSessionRestoreNotice(error: ApiError): AuthNotice {
  if (error.code === "session_expired" || error.status === 401) {
    return {
      title: "Phien dang nhap da het han",
      message: "Vui long dang nhap lai de tiep tuc su dung Mina AI.",
      variant: "warning",
    };
  }

  if (error.code === "network_error") {
    return {
      title: "Khong the xac minh phien dang nhap",
      message:
        "Khong the ket noi den may chu Mina trong truong. Hay kiem tra Wi-Fi noi bo hoac thu lai.",
      variant: "warning",
    };
  }

  if (error.status === 503 || error.code === "server_unavailable") {
    return {
      title: "May chu Mina chua san sang",
      message:
        "May chu Mina trong truong hien chua san sang. Vui long dang nhap lai khi may chu hoat dong.",
      variant: "warning",
    };
  }

  return {
    title: "Khong the khoi phuc phien lam viec",
    message: "Mina AI can dang nhap lai de tiep tuc.",
    variant: "warning",
  };
}
