import api from "./api";

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function googleLogin(credential) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}
