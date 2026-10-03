import type { common as enCommon, nav as enNav, status as enStatus } from "../en/common";

export const common: typeof enCommon = {
  appName: "CLB Cầu lông",
  appDescription: "Lịch chơi hằng tuần, sân trống và chia cặp đánh đôi cân bằng cho CLB.",
  save: "Lưu",
  saving: "Đang lưu…",
  cancel: "Hủy",
  delete: "Xóa",
  edit: "Sửa",
  back: "Quay lại",
  show: "Xem",
  optional: "không bắt buộc",
  language: "Ngôn ngữ",
  somethingWentWrong: "Đã có lỗi xảy ra",
  tryAgain: "Thử lại",
  errorHint: "Không tải được trang. Hãy thử lại, nếu vẫn lỗi hãy báo quản trị viên.",
};

export const nav: typeof enNav = {
  events: "Buổi chơi",
  courts: "Sân",
  me: "Tôi",
  overview: "Tổng quan",
  members: "Thành viên",
  venues: "Địa điểm",
  memberView: "Giao diện thành viên",
  admin: "Quản trị",
  signOut: "Đăng xuất",
};

export const status: typeof enStatus = {
  draft: "Nháp",
  open: "Đang mở",
  closed: "Đã đóng đăng ký",
  inProgress: "Đang chơi",
  completed: "Đã xong",
  cancelled: "Đã hủy",
  youreIn: "Bạn đã có tên",
  waitlisted: "Danh sách chờ",
  confirmed: "Đã xác nhận",
  court: "Sân {number}",
  round: "Lượt {number}",
  roundDraft: "Nháp",
  roundPublished: "Đang đánh",
  roundDone: "Đã xong",
  yourMatch: "Trận của bạn",
  vs: "vs",
  member: "Thành viên",
  admin: "Quản trị",
};
