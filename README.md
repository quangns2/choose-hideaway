# Choose Hideaway — React frontend + Next.js backend

Website homestay và nhà hàng tại 147 Nguyễn Huệ, Ninh Bình. Hotline: 0913 576 663.

## Cấu trúc

```text
frontend/              React + Vite, giao diện, CSS và ảnh
  src/App.tsx          Giao diện và biểu mẫu đặt chỗ
  vite.config.ts       Proxy /api tới backend khi phát triển
backend/               Next.js App Router chạy trên Node.js
  app/api/reservations/route.ts   API tạo yêu cầu đặt phòng/đặt bàn
  app/api/health/route.ts         Kiểm tra API và kết nối database
  db/                  Kết nối Turso/SQLite, migration và nhập dữ liệu cũ
  data/                Database khi chạy, không commit
shared/                Schema kiểm tra dữ liệu dùng chung cho hai phía
scripts/               Chạy cả hai ứng dụng, build và production
tests/                 Kiểm thử dữ liệu, database và request
```

Frontend dùng React.js, backend dùng Next.js chính thức. Mã nguồn TypeScript. Vinext và mã tích hợp Cloudflare Worker đã được gỡ khỏi ứng dụng đang chạy.

Website và trang quản trị hỗ trợ tiếng Anh/tiếng Việt. Tiếng Anh là mặc định khi chưa chọn ngôn ngữ; nút **EN / VI** đổi ngay giao diện và lưu lựa chọn trong trình duyệt. Biểu mẫu giữ thông tin đang nhập khi chuyển ngôn ngữ. Loại phòng và trạng thái lưu trong database giữ nguyên giá trị dùng bởi API.

Biểu mẫu đặt phòng dùng thẻ lựa chọn có ảnh giới thiệu, mô tả và tiện nghi thay cho danh sách tên phòng. Khách có thể so sánh, chọn, thu gọn và đổi loại phòng mà không mất thông tin đang nhập. Thông tin các thẻ nằm ở `frontend/src/RoomPicker.tsx`; ảnh hiện giới thiệu không gian homestay, cần chủ cơ sở xác nhận ảnh tương ứng từng loại phòng trước khi hiển thị như ảnh phòng cụ thể.

## Chạy phát triển

Cần Node.js >= 22.16 và npm. Với bộ Node đã có trong workspace Windows:

```powershell
cd D:\Code\choose-hideaway
$env:Path = 'D:\Code\.tools\node-v22.16.0-win-x64;' + $env:Path
npm.cmd install
npm.cmd run dev
```

Chỉ cần một terminal; `dev` chạy cả frontend và backend, tự áp dụng migration. Nhấn Ctrl+C để dừng cả hai.

- Website: http://127.0.0.1:5173
- Quản trị: http://127.0.0.1:5173/admin
- API sức khỏe: http://127.0.0.1:3001/api/health
- API đặt chỗ: `POST /api/reservations`

Nếu Node đã cài vào PATH, dùng `npm` hoặc `npm.cmd` bình thường. Đã cài dependencies thì bỏ qua lệnh install.

Có thể chạy riêng bằng `npm run dev:frontend` và `npm run dev:backend` trong hai terminal.

## Build và chạy production

```powershell
npm.cmd run build
npm.cmd start
```

Mở http://127.0.0.1:3001 . Lệnh build tạo frontend trong `frontend/dist`, sao chép các file tĩnh vào `backend/public`, rồi build backend Next.js. Khi production, Next.js phục vụ cả giao diện React đã build và API trên cùng origin.

Đặt `PORT` để đổi cổng production và `HOST=0.0.0.0` khi triển khai lên server. Các cổng phát triển mặc định là 5173 và 3001.

## Dữ liệu và cấu hình

Khi không cấu hình Turso, database mặc định là `backend/data/reservations.sqlite`. Sao lưu database khi dừng ứng dụng hoặc dùng SQLite backup API để bảo toàn WAL.

- Sao chép `backend/.env.example` thành `backend/.env.local` để chỉnh `DATABASE_PATH` và `FRONTEND_ORIGINS`.
- Nếu dùng reverse proxy HTTPS, đặt `FRONTEND_ORIGINS=https://ten-mien-cua-ban` để backend nhận đúng origin công khai.
- Sao chép `frontend/.env.example` thành `frontend/.env.local` để chỉnh `API_TARGET` hoặc `VITE_API_URL` khi frontend và backend chạy trên các origin khác nhau.
- `npm run db:migrate`: áp dụng migration idempotent.
- `npm run db:check`: kiểm tra kết nối và các bảng cần thiết, không tạo hay sửa đơn đặt chỗ.
- `npm run db:import-legacy`: nhập các yêu cầu từ database D1 local cũ trong `.wrangler/state`; giữ nguyên mã, không nhân đôi và không sửa database nguồn.
- Database D1 trên bản website đã xuất bản trước đây là dữ liệu riêng; lệnh nhập local không chuyển dữ liệu từ hosting.

Yêu cầu mới có trạng thái `pending` (chờ xác nhận); chưa thu tiền, gửi email/SMS hay đồng bộ tồn phòng Booking.com. Danh sách thông tin khách hàng chỉ truy cập được khi đăng nhập quản trị.

## Kết nối Turso

Backend đã hỗ trợ `@libsql/client` cho cả đặt phòng, đặt bàn và quản trị. Trong `backend/.env.local`, điền URL và Auth Token của database:

```dotenv
TURSO_DATABASE_URL=libsql://reservations-turso-nguyenquang.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=token-cua-database
FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Tạo token có quyền đọc và ghi trong trang quản lý database Turso, hoặc qua CLI trong WSL:

```sh
turso db tokens create reservations-turso
```

Token chỉ đặt ở backend hoặc Environment Variables của hosting; không dùng tên bắt đầu bằng `VITE_`/`NEXT_PUBLIC_`, không commit `.env.local`. Tham khảo [Turso TypeScript SDK](https://docs.turso.tech/sdk/ts/reference) và [tạo database token](https://docs.turso.tech/cli/db/tokens/create).

Sau khi điền token, chạy tại thư mục gốc dự án:

```powershell
npm.cmd run db:migrate
npm.cmd run db:check
npm.cmd run dev
```

Dừng terminal chạy dev cũ trước khi chạy lại để nạp biến môi trường và tránh trùng cổng. `db:migrate` áp dụng các migration còn thiếu trên Turso; nếu đã nhập snapshot có đủ migration thì không tạo lại bảng. `db:check` phải trả về `status: "ok"` và `database: "turso"`. API `/api/health` cũng hiển thị database đang sử dụng.

Khi có `TURSO_DATABASE_URL`, toàn bộ đơn và tài khoản quản trị được đọc/ghi trực tiếp trên Turso; `DATABASE_PATH` không được dùng. Thiếu token hoặc lỗi kết nối sẽ báo lỗi, không tự chuyển sang SQLite. Nếu snapshot chứa tài khoản admin, đăng nhập bằng tài khoản đã có. Muốn dùng SQLite local, để trống cả hai biến Turso.

## Quản trị đặt phòng và đặt bàn

1. Chạy `npm.cmd run dev` và mở http://127.0.0.1:5173/admin.
2. Lần đầu, tạo tài khoản bằng email của bạn và mật khẩu tối thiểu 10 ký tự. Tài khoản được lưu trong database đang cấu hình; các lần sau dùng tài khoản này để đăng nhập.
3. Chọn **Đặt phòng** hoặc **Đặt bàn**, lọc trạng thái hoặc tìm tên/số điện thoại/mã yêu cầu. **Xem chi tiết** hiển thị email và lời nhắn của khách.
4. Kiểm tra chỗ trống, gọi khách thống nhất giá rồi bấm **Xác nhận**, sau đó duyệt lại thông tin trong hộp thoại và bấm **Xác nhận đặt chỗ**. Yêu cầu chuyển sang **Đã xác nhận**.
5. Có thể **Hủy** yêu cầu; yêu cầu đã hủy có thể **Đưa về chờ**. Mỗi thay đổi được lưu cùng tài khoản và thời điểm trong `reservation_events`.

Phiên đăng nhập tồn tại 8 giờ, dùng cookie HttpOnly và mật khẩu được băm bằng scrypt. Đăng xuất thu hồi phiên trên server. Không có mật khẩu quản trị mặc định. Xác nhận trong admin chỉ cập nhật hệ thống; bạn vẫn cần thông báo cho khách qua điện thoại.

Trong production, trang quản trị là `/admin` trên cùng địa chỉ website. Dùng HTTPS và đặt `ADMIN_SETUP_TOKEN` trong `backend/.env.local` bằng một chuỗi bí mật ngẫu nhiên để mở thiết lập lần đầu. Nhập chuỗi này ở **Có mã thiết lập cho bản triển khai?** trên form tạo tài khoản. Sau khi tạo tài khoản, bỏ biến này và khởi động lại server. Chế độ development chỉ cho phép thiết lập không cần mã trên địa chỉ localhost/127.0.0.1. Frontend quản trị và API cần cùng origin hoặc thông qua proxy như cấu hình mặc định.

Trang admin mới có trên bản React/Next.js local; đường dẫn Sites đã xuất bản trước đây chưa được cập nhật.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:admin
```

## Triển khai

Với Turso, có thể triển khai frontend React và backend Next.js cùng một project Vercel. Đẩy mã nguồn lên repository, rồi import project với cấu hình:

`backend/vercel.json` đã cố định framework và các lệnh install/build bên dưới. Repository GitHub cần chứa `frontend/`, `backend/`, `shared/`, `scripts/` và các file package ở thư mục gốc. Không đẩy `.env.local` hoặc database SQLite; các file này đã được `.gitignore` loại trừ.

- Framework: **Next.js**; Root Directory: **backend**.
- Bật **Include source files outside of the Root Directory in the Build Step** để dùng `frontend`, `shared` và `scripts`.
- Install Command: `cd .. && npm ci`.
- Build Command: `cd .. && npm run build`.
- Output Directory: mặc định của Next.js; Node.js: 22.x hoặc mới hơn.
- Environment Variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `FRONTEND_ORIGINS=https://ten-mien-cua-ban`. Nếu chưa có admin, thêm `ADMIN_SETUP_TOKEN` ngẫu nhiên để thiết lập lần đầu, rồi bỏ sau khi tạo tài khoản.

Đặt biến cho môi trường Production. Nếu chưa biết tên miền trước lần deploy đầu tiên, có thể thêm `FRONTEND_ORIGINS` sau khi Vercel cấp địa chỉ, rồi Redeploy. Thay đổi biến môi trường chỉ áp dụng cho deployment mới. Nếu tài khoản admin đã tồn tại trên Turso, dùng lại tài khoản đó ở `/admin` và không cần mã thiết lập mới.

Tài liệu: [chia sẻ mã ngoài Root Directory](https://vercel.com/docs/monorepos/monorepo-faq), [biến môi trường Vercel](https://vercel.com/docs/environment-variables). Website kinh doanh cần gói cho phép sử dụng thương mại; [Hobby chỉ dành cho cá nhân và phi thương mại](https://vercel.com/docs/plans/hobby).

Áp dụng migration và kiểm tra Turso bằng các lệnh trên trước khi deploy. Lệnh build không tự thay đổi database. Sau khi deploy, kiểm tra `/api/health` có `database: "turso"`, thử gửi yêu cầu và kiểm tra trong `/admin`. Backend từ chối SQLite local trên Vercel để tránh lưu đơn vào filesystem tạm thời.

Nếu chạy trên VPS bằng SQLite, cần ổ đĩa bền vững cho `DATABASE_PATH`.

Đường dẫn Sites được xuất bản trước đây vẫn là phiên bản Vinext. File `.openai/hosting.json` được giữ để tham chiếu project cũ; kiến trúc mới không dùng Worker build/publish của Sites. Lần chuyển đổi này hoàn thành ở mã nguồn và chạy local, chưa thay phiên bản online.

## Nguồn nội dung và ảnh

- Loại phòng, tiện nghi: https://www.booking.com/hotel/vn/choose-hideaway-homestay.vi.html
- Ảnh `booking-*.jpg`: CDN Booking trên listing được mirror tại https://sahihomestay.com/accommodation/k-v/choose-hideaway-homestay/313703 . Vị trí ảnh theo từng loại phòng chưa được chủ cơ sở xác nhận; hộp chi tiết ghi rõ ảnh giới thiệu không gian.
- Ảnh hồ bơi, nhà hàng và cổng: listing Choose Hideaway tại https://www.tripadvisor.com/Restaurant_Review-g303945-d27057287-Reviews-Choose_Hideaway-Ninh_Binh_Ninh_Binh_Province.html . Lấy ngày 07/10/2026.

Tài liệu kỹ thuật: [React](https://react.dev/learn), [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Vite proxy](https://vite.dev/config/server-options.html#server-proxy), [Node SQLite](https://nodejs.org/download/release/v22.16.0/docs/api/sqlite.html).
