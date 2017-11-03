FROM node:8.8.1-alpine

RUN apk add --update curl && \
    rm -rf /var/cache/apk/*

COPY src /oneshot
EXPOSE 80
CMD ["node", "/oneshot/index.js"]
