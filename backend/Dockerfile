
FROM node:20-alpine

# Set working directory
WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .

EXPOSE 5000

# Start the application
CMD ["npm", "start"]