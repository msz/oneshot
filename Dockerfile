FROM node:8.8.1-alpine
COPY src /oneshot
EXPOSE 80
CMD ["node", "/oneshot/index.js"]
