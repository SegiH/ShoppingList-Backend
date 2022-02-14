FROM node:14

COPY shoppinglistbackend.js /
COPY package.json /

RUN npm install

EXPOSE 8080

CMD [ "node" , "/shoppinglistbackend.js" ]
