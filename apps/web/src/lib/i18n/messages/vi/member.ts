import type { auth as en_auth, events as en_events, me as en_me } from "../en/member";

export const auth: typeof en_auth = {
  signIn: "Đăng nhập",
  signingIn: "Đang đăng nhập…",
  createAccount: "Tạo tài khoản",
  creatingAccount: "Đang tạo tài khoản…",
  name: "Họ tên",
  email: "Email",
  password: "Mật khẩu",
  passwordHint: "Ít nhất 8 ký tự",
  newToClub: "Mới tham gia câu lạc bộ?",
  createAnAccount: "Tạo tài khoản",
  alreadyMember: "Đã có tài khoản?",
};

export const events: typeof en_events = {
  title: "Buổi chơi",
  upcoming: "Các buổi chơi sắp tới",
  greeting: "Chào {name}, chọn một buổi để đăng ký nhé.",
  empty: "Chưa có buổi chơi nào mở đăng ký. Bạn quay lại sau nhé.",
  spotsLeft: "Còn {left}/{max} chỗ",
  full: "Đã đủ người · {count} người đang chờ",
  playersAndCourts: "{confirmed}/{max} người · {courts} sân",
  closesAt: "Hạn đăng ký: {date}",
  registrationClosed: "Đã hết hạn đăng ký.",
  waitlistPosition: "Bạn đang ở vị trí số {position} trong danh sách chờ.",
  cancelling: "Đang hủy…",
  joining: "Đang đăng ký…",
  joinWaitlist: "Vào danh sách chờ",
  register: "Đăng ký",
  matches: "Các trận đấu",
  players: "Người chơi ({count})",
  noPlayers: "Chưa có ai đăng ký.",
  waitlist: "Danh sách chờ ({count})",
};

export const me: typeof en_me = {
  title: "Hồ sơ của tôi",
  skillLevel: "Trình độ (do quản trị viên đặt)",
  role: "Vai trò",
  matchHistory: "Lịch sử trận đấu",
  name: "Họ tên",
  phone: "Số điện thoại",
  phoneHint: "Không bắt buộc, chỉ quản trị viên xem được",
  changePassword: "Đổi mật khẩu",
  currentPassword: "Mật khẩu hiện tại",
  newPassword: "Mật khẩu mới",
  passwordHint: "Ít nhất 8 ký tự",
  repeatPassword: "Nhập lại mật khẩu mới",
  matchCount: "{count} trận",
  historyEmpty: "Các trận của bạn sẽ hiện ở đây sau buổi chơi đầu tiên.",
  with: "Cùng",
};
