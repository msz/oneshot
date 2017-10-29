FROM node:8.8.1-alpine
COPY src /
EXPOSE 8080
CMD ["node", "index.js"]
