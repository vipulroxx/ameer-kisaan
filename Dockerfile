# syntax=docker/dockerfile:1.7
# Frontend: build the React app, serve it with an unprivileged nginx that also
# reverse-proxies /api to the backend, so browser and API share one origin.
FROM node:22-alpine AS build
WORKDIR /web
COPY package.json package-lock.json ./
# --legacy-peer-deps: existing peer conflict from the unused @tensorflow/tfjs-react-native
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY public ./public
COPY src ./src
# No inline runtime script, so the Content-Security-Policy can forbid inline JS.
ENV INLINE_RUNTIME_CHUNK=false GENERATE_SOURCEMAP=false
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
USER root
# Pick up OS security fixes released after the base image was published.
RUN apk upgrade --no-cache
# conf.d is generated at start-up from the template (BACKEND_UPSTREAM is filled in).
RUN mkdir -p /etc/nginx/templates /etc/nginx/snippets && rm -f /etc/nginx/conf.d/default.conf && chown -R 101:0 /etc/nginx/conf.d && chmod 0775 /etc/nginx/conf.d
COPY --chmod=0644 deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=0644 deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /web/build /usr/share/nginx/html
USER 101
ENV BACKEND_UPSTREAM=http://backend:8000
# Writable scratch paths for a read-only root filesystem (ECS copies these permissions).
VOLUME ["/tmp", "/etc/nginx/conf.d"]
EXPOSE 8080
