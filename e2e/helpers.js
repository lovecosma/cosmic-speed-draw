export function cookieValue(cookies, name) {
  return cookies.find((cookie) => cookie.name === name)?.value;
}
