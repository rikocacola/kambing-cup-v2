export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const loginService = async (body: {
  email: string;
  password: string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}auth/login`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Login failed" };
    }

    const { data } = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, error: "An error occurred during login" };
  }
};
