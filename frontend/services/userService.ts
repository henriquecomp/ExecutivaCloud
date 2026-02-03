import { api } from "./api";
import { Organization, OrganizationCreate, OrganizationUpdate } from "../types";

export const userService = {
  getAll: async () => {
    const response = await api.get("/users/").then((res) => res.data);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/users/", data).then((res) => res.data);
    return response.data;
  },
};
