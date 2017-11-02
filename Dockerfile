FROM node:8.8.1-alpine
COPY src /oneshot
EXPOSE 8080
CMD ["node", "/oneshot/index.js"]
