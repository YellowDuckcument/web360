# Sử dụng Node.js image từ Docker Hub
FROM node:16

# Cài đặt libcrypto (có thể giúp khắc phục lỗi crypto trong môi trường Alpine)
RUN apt-get update && apt-get install -y libssl-dev

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở port mà ứng dụng sẽ sử dụng (thường là 3000 cho React)
EXPOSE 3003

# Chạy lệnh npm run dev để bắt đầu phát triển ứng dụng
CMD ["npm", "run", "dev"]
