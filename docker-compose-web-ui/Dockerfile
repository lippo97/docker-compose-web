FROM node:alpine
WORKDIR /usr/src/app
COPY . /usr/src/app
ARG REACT_APP_BACKEND_SERVER
ENV REACT_APP_BACKEND_SERVER ${REACT_APP_BACKEND_SERVER}
RUN npm install && npm run build

FROM flashspys/nginx-static
RUN apk update && apk upgrade
COPY --from=0 /usr/src/app/build /static
