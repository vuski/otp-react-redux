# 1. 베이스 이미지 설정 (Node.js LTS 버전)
FROM node:21

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 패키지 파일 복사
COPY package.json yarn.lock ./

# 4. 종속성 설치
RUN yarn install

# 5. 애플리케이션 소스 코드 복사
COPY . .

# 6. OpenSSL 레거시 프로바이더 설정
ENV NODE_OPTIONS=--openssl-legacy-provider

# 6. 애플리케이션 빌드
RUN yarn build

# 7. 애플리케이션 포트 설정
EXPOSE 9966

# 8. 애플리케이션 시작
CMD ["yarn", "start"]
