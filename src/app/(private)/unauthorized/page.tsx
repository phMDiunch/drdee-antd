import { Result, Button } from "antd";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, trang này đang trong quá trình xây dựng."
        extra={
          <Link href="/">
            <Button type="primary">Về trang chủ</Button>
          </Link>
        }
      />
    </div>
  );
}
