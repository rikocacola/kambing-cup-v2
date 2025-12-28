import { redirect } from "react-router";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function authenticatedFetch({
  path,
  options = {},
  token,
}: {
  path: string;
  options?: RequestInit;
  token: string;
}) {
  const headers = new Headers();

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    redirect("/login");
  }

  const url = `${BASE_URL}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
