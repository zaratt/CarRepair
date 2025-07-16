FROM node:23-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN ls -la /app/dist
RUN ls -la /app/dist/assets || echo "Assets not found"

FROM nginx:1.27.4-alpine-slim
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN ls -la /usr/share/nginx/html
RUN ls -la /usr/share/nginx/html/assets || echo "Assets not found in nginx"
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]