import { api } from "./api";

export const userService = {
  getAll: async () => {
    const response = await api.get("/users/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/users/", data);
    return response.data;
  },
};
