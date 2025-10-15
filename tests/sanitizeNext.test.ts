import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_AFTER_LOGIN, sanitizeNext } from "../src/shared/constants/route";

describe("sanitizeNext", () => {
  it("giữ nguyên đường dẫn nội bộ hợp lệ", () => {
    assert.equal(sanitizeNext("/dashboard"), "/dashboard");
    assert.equal(sanitizeNext("/employees/create"), "/employees/create");
  });

  it("fallback về mặc định nếu đường dẫn không nằm trong whitelist", () => {
    assert.equal(sanitizeNext("https://evil.com"), DEFAULT_AFTER_LOGIN);
    assert.equal(sanitizeNext("//evil.com"), DEFAULT_AFTER_LOGIN);
    assert.equal(sanitizeNext(""), DEFAULT_AFTER_LOGIN);
    assert.equal(sanitizeNext(null), DEFAULT_AFTER_LOGIN);
  });
});
