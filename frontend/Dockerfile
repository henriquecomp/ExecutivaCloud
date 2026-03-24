# Frontend Vite/React + nginx — repositório: https://github.com/henriquecomp/executivacloud
# Build: docker build -f frontend/Dockerfile -t executivacloud-web ./frontend
#
# VITE_API_URL = URL da API como o navegador a acessa (não use hostname interno do Docker).

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8098/
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
