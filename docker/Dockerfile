FROM node
MAINTAINER mpech

# we keep it super basic
WORKDIR /usr/src/githubpoller
ADD app.js app.js
ADD package.json package.json
RUN npm install
RUN echo 192.168.1.150 reg.citylity.com|tee -a /etc/hosts
ENTRYPOINT ["nodejs","app.js"]