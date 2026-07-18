FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# next.config.ts is read at BUILD time for rewrites - env vars must be set here
ARG ADMIN_GATEWAY_URL=http://admin-gateway:3002
ARG ORDER_SERVICE_URL=http://order-service:3001
ARG KITCHEN_SERVICE_URL=http://kitchen-display:3003
ARG ANALYTICS_URL=http://analytics:3004
ENV ADMIN_GATEWAY_URL=$ADMIN_GATEWAY_URL
ENV ORDER_SERVICE_URL=$ORDER_SERVICE_URL
ENV KITCHEN_SERVICE_URL=$KITCHEN_SERVICE_URL
ENV ANALYTICS_URL=$ANALYTICS_URL
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
