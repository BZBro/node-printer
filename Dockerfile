FROM node:20
COPY ./ /opt/wisqo/node-printer
WORKDIR /opt/wisqo/node-printer
RUN rm -rf .git
RUN cd -
EXPOSE 8800

ENTRYPOINT node src/index.js