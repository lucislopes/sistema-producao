FROM node:20-alpine AS build
WORKDIR /site
COPY . .
RUN node build.mjs
FROM nginx:alpine
COPY --from=build /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
