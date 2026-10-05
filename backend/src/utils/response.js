// Response helpers — รูปแบบเดียวกับที่ออกแบบไว้ใน docs/flowcharts.html ข้อ 4.3

function success(res, { status = 200, message = "สำเร็จ", data } = {}) {
  const body = { status: "success", message };
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

function created(res, data, message = "สร้างข้อมูลสำเร็จ") {
  return success(res, { status: 201, message, data });
}

function noContent(res) {
  return res.status(204).send();
}

function fail(res, { status = 400, code, message = "เกิดข้อผิดพลาด", errors } = {}) {
  const body = { status: "error", code: code ?? status, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { success, created, noContent, fail };
