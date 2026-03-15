import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  // Validate: only allow digits, +, -, spaces, parens
  if (!phone || !/^[\d\s\-+()]+$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  // Sanitize: keep only digits and leading +
  const sanitized = phone.replace(/[^\d+]/g, '');

  // Return a minimal HTML page that redirects to tel:
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Qo'ng'iroq</title>
</head>
<body>
<script>window.location.href="tel:${sanitized}";</script>
<noscript><meta http-equiv="refresh" content="0;url=tel:${sanitized}"></noscript>
<p style="text-align:center;margin-top:40vh;font-family:sans-serif">
  <a href="tel:${sanitized}">${sanitized}</a>
</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
